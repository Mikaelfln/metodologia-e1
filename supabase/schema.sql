create schema if not exists internal;

create table sessions (
  code text primary key,
  label text not null default '',
  classmate boolean not null default false,
  pilot boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  withdrawal_code text not null unique,
  session_code text not null references sessions (code),
  condition text not null check (condition in ('no_ai', 'ai_review', 'ai_generate')),
  classmate boolean not null,
  pilot boolean not null,
  stage text not null default 'instructions' check (
    stage in ('instructions', 'task', 'recall', 'authorship', 'quiz', 'profile', 'debrief')
  ),
  stage_times jsonb not null default '{}',
  consented_at timestamptz not null default now(),
  task_started_at timestamptz,
  summary_submitted_at timestamptz,
  summary text,
  summary_word_count integer,
  summary_timed_out boolean,
  recall_text text,
  recall_skipped boolean,
  recall_similarity numeric(4, 2),
  recall_coded boolean,
  authorship integer check (authorship between 1 and 5),
  quiz_answers jsonb,
  profile_course text,
  profile_term integer,
  profile_ai_frequency integer check (profile_ai_frequency between 1 and 5),
  completed_at timestamptz
);

create table events (
  id bigint generated always as identity primary key,
  participant_id uuid not null references participants (id) on delete cascade,
  stage text not null,
  kind text not null check (kind in ('blur', 'focus', 'paste')),
  at timestamptz not null,
  detail jsonb not null default '{}',
  received_at timestamptz not null default now()
);

create index events_participant_idx on events (participant_id);

create table content (
  key text primary key,
  value jsonb not null
);

create table quiz_questions (
  id integer primary key,
  position integer not null,
  prompt text not null,
  options jsonb not null
);

create table quiz_answers (
  question_id integer primary key references quiz_questions (id) on delete cascade,
  correct_option integer not null
);

create table allocation_queue (
  id bigint generated always as identity primary key,
  stream text not null,
  condition text not null,
  participant_id uuid
);

insert into sessions (code, label, pilot) values
  ('coleta', 'Coleta', false),
  ('piloto', 'Piloto', true);

alter table sessions enable row level security;
alter table participants enable row level security;
alter table events enable row level security;
alter table content enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_answers enable row level security;
alter table allocation_queue enable row level security;

create view export with (security_invoker = true) as
select
  p.id,
  p.withdrawal_code,
  p.session_code,
  p.condition,
  p.classmate,
  p.pilot,
  p.stage,
  p.completed_at is not null as complete,
  p.consented_at,
  p.task_started_at,
  p.summary_submitted_at,
  extract(epoch from p.summary_submitted_at - p.task_started_at)::integer as task_seconds,
  p.summary,
  p.summary_word_count,
  p.summary_timed_out,
  p.recall_text,
  p.recall_skipped,
  p.recall_similarity,
  p.recall_coded,
  p.authorship,
  p.quiz_answers,
  case
    when p.quiz_answers is null then null
    else (
      select count(*)::integer
      from quiz_answers a
      where (p.quiz_answers ->> a.question_id::text)::integer = a.correct_option
    )
  end as quiz_score,
  p.profile_course,
  p.profile_term,
  p.profile_ai_frequency,
  p.completed_at,
  p.stage_times,
  (
    select count(*)::integer from events e
    where e.participant_id = p.id and e.stage = 'task' and e.kind = 'blur'
  ) as tab_leaves_task,
  (
    select count(*)::integer from events e
    where e.participant_id = p.id and e.stage = 'task' and e.kind = 'paste'
  ) as pastes_task,
  (
    select coalesce(sum((e.detail ->> 'length')::integer), 0)::integer from events e
    where e.participant_id = p.id and e.stage = 'task' and e.kind = 'paste'
  ) as pasted_chars_task,
  (
    select count(*)::integer from events e
    where e.participant_id = p.id
      and e.stage in ('recall', 'authorship', 'quiz')
      and e.kind = 'blur'
  ) as tab_leaves_measures
from participants p;

revoke all on sessions, participants, events, content, quiz_questions, quiz_answers,
  allocation_queue, export from public, anon, authenticated;
revoke all on schema internal from public, anon, authenticated;

create function internal.content_value(p_key text) returns jsonb
language sql stable
set search_path = public
as $$
  select value from content where key = p_key;
$$;

create function internal.active_session(p_session text) returns sessions
language plpgsql stable
set search_path = public
as $$
declare
  v_session sessions;
begin
  select * into v_session from sessions where code = p_session and active;
  if not found then
    raise exception 'invalid_session';
  end if;
  return v_session;
end;
$$;

create function internal.participant_by_token(p_token uuid) returns participants
language plpgsql
set search_path = public
as $$
declare
  v_participant participants;
begin
  select * into v_participant from participants where token = p_token for update;
  if not found then
    raise exception 'unknown_token';
  end if;
  return v_participant;
end;
$$;

create function internal.next_condition(p_stream text, p_participant uuid) returns text
language plpgsql
set search_path = public
as $$
declare
  v_id bigint;
  v_condition text;
begin
  perform pg_advisory_xact_lock(hashtext('allocation_' || p_stream));
  select id, condition into v_id, v_condition
  from allocation_queue
  where stream = p_stream and participant_id is null
  order by id
  limit 1;
  if not found then
    insert into allocation_queue (stream, condition)
    select p_stream, c
    from unnest(array['no_ai', 'ai_review', 'ai_generate']) as c
    order by random();
    select id, condition into v_id, v_condition
    from allocation_queue
    where stream = p_stream and participant_id is null
    order by id
    limit 1;
  end if;
  update allocation_queue set participant_id = p_participant where id = v_id;
  return v_condition;
end;
$$;

create function internal.stage_payload(p_participant participants) returns jsonb
language plpgsql stable
set search_path = public
as $$
declare
  v_payload jsonb := jsonb_build_object('stage', p_participant.stage);
begin
  case p_participant.stage
    when 'instructions', 'task' then
      v_payload := v_payload || jsonb_build_object(
        'condition', p_participant.condition,
        'instructions', internal.content_value('instructions_' || p_participant.condition),
        'task', internal.content_value('task')
      );
    when 'recall' then
      v_payload := v_payload || jsonb_build_object('recall', internal.content_value('recall'));
    when 'authorship' then
      v_payload := v_payload
        || jsonb_build_object('authorship', internal.content_value('authorship'));
    when 'quiz' then
      v_payload := v_payload || jsonb_build_object(
        'quiz_intro', internal.content_value('quiz_intro'),
        'questions', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object('id', q.id, 'prompt', q.prompt, 'options', q.options)
              order by q.position
            ),
            '[]'::jsonb
          )
          from quiz_questions q
        )
      );
    when 'profile' then
      v_payload := v_payload || jsonb_build_object('profile', internal.content_value('profile'));
    when 'debrief' then
      v_payload := v_payload || jsonb_build_object(
        'debrief', internal.content_value('debrief'),
        'withdrawal_code', p_participant.withdrawal_code
      );
  end case;
  return v_payload;
end;
$$;

create function get_consent(p_session text) returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
begin
  perform internal.active_session(p_session);
  return jsonb_build_object('consent', internal.content_value('consent'));
end;
$$;

create function start_session(p_session text) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_session sessions := internal.active_session(p_session);
  v_participant participants;
  v_id uuid := gen_random_uuid();
begin
  insert into participants (id, withdrawal_code, session_code, condition, classmate, pilot)
  values (
    v_id,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_session.code,
    internal.next_condition(case when v_session.pilot then 'pilot' else 'main' end, v_id),
    v_session.classmate,
    v_session.pilot
  )
  returning * into v_participant;
  return internal.stage_payload(v_participant) || jsonb_build_object('token', v_participant.token);
end;
$$;

create function begin_task(p_token uuid) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_participant participants := internal.participant_by_token(p_token);
begin
  if v_participant.stage not in ('instructions', 'task') then
    raise exception 'wrong_stage';
  end if;
  if v_participant.task_started_at is null then
    update participants
    set task_started_at = now(), stage = 'task'
    where id = v_participant.id
    returning * into v_participant;
  end if;
  return jsonb_build_object(
    'stage', 'task',
    'source_text', internal.content_value('source_text'),
    'started_at', v_participant.task_started_at,
    'server_now', clock_timestamp(),
    'duration_seconds', 900
  );
end;
$$;

create function save_stage(p_token uuid, p_stage text, p_data jsonb) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_participant participants := internal.participant_by_token(p_token);
  v_number integer;
  v_text text;
  v_skipped boolean;
begin
  if p_stage is distinct from v_participant.stage
    or p_stage not in ('task', 'recall', 'authorship', 'quiz', 'profile') then
    raise exception 'wrong_stage';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'invalid_data';
  end if;

  if p_stage = 'task' then
    v_text := p_data ->> 'summary';
    if v_text is null
      or length(v_text) > 20000
      or jsonb_typeof(p_data -> 'word_count') is distinct from 'number' then
      raise exception 'invalid_data';
    end if;
    update participants
    set summary = v_text,
      summary_word_count = (p_data ->> 'word_count')::integer,
      summary_timed_out = coalesce((p_data ->> 'timed_out')::boolean, false),
      summary_submitted_at = now(),
      stage = 'recall'
    where id = v_participant.id;

  elsif p_stage = 'recall' then
    v_skipped := coalesce((p_data ->> 'skipped')::boolean, false);
    v_text := nullif(btrim(coalesce(p_data ->> 'text', '')), '');
    if length(v_text) > 2000 or (not v_skipped and v_text is null) then
      raise exception 'invalid_data';
    end if;
    update participants
    set recall_text = case when v_skipped then null else v_text end,
      recall_skipped = v_skipped,
      recall_similarity = case
        when v_skipped then null
        else least(greatest(coalesce((p_data ->> 'similarity')::numeric, 0), 0), 1)
      end,
      stage = 'authorship'
    where id = v_participant.id;

  elsif p_stage = 'authorship' then
    if jsonb_typeof(p_data -> 'value') is distinct from 'number' then
      raise exception 'invalid_data';
    end if;
    v_number := (p_data ->> 'value')::integer;
    if v_number not between 1 and 5 then
      raise exception 'invalid_data';
    end if;
    update participants
    set authorship = v_number, stage = 'quiz'
    where id = v_participant.id;

  elsif p_stage = 'quiz' then
    if jsonb_typeof(p_data -> 'answers') is distinct from 'object'
      or exists (
        select 1
        from jsonb_each(p_data -> 'answers') as answer
        left join quiz_questions q on q.id::text = answer.key
        where case
          when q.id is null then true
          when answer.value::text !~ '^[0-9]{1,3}$' then true
          else (answer.value::text)::integer >= jsonb_array_length(q.options)
        end
      ) then
      raise exception 'invalid_data';
    end if;
    update participants
    set quiz_answers = p_data -> 'answers', stage = 'profile'
    where id = v_participant.id;

  else
    v_text := nullif(btrim(coalesce(p_data ->> 'course', '')), '');
    if v_text is null
      or length(v_text) > 100
      or jsonb_typeof(p_data -> 'term') is distinct from 'number'
      or jsonb_typeof(p_data -> 'ai_frequency') is distinct from 'number'
      or (p_data ->> 'term')::integer not between 1 and 30
      or (p_data ->> 'ai_frequency')::integer not between 1 and 5 then
      raise exception 'invalid_data';
    end if;
    update participants
    set profile_course = v_text,
      profile_term = (p_data ->> 'term')::integer,
      profile_ai_frequency = (p_data ->> 'ai_frequency')::integer,
      completed_at = now(),
      stage = 'debrief'
    where id = v_participant.id;
  end if;

  update participants
  set stage_times = stage_times || jsonb_build_object(p_stage, now())
  where id = v_participant.id
  returning * into v_participant;

  return internal.stage_payload(v_participant);
end;
$$;

create function resume(p_token uuid) returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  return internal.stage_payload(internal.participant_by_token(p_token));
end;
$$;

create function log_events(p_token uuid, p_events jsonb) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_participant participants := internal.participant_by_token(p_token);
begin
  if p_events is null
    or jsonb_typeof(p_events) <> 'array'
    or jsonb_array_length(p_events) > 500
    or exists (
      select 1 from jsonb_array_elements(p_events) as item
      where item ->> 'kind' is null
        or item ->> 'kind' not in ('blur', 'focus', 'paste')
        or item ->> 'at' is null
        or item ->> 'stage' is null
    ) then
    raise exception 'invalid_data';
  end if;
  insert into events (participant_id, stage, kind, at, detail)
  select
    v_participant.id,
    left(item ->> 'stage', 20),
    item ->> 'kind',
    (item ->> 'at')::timestamptz,
    case
      when item ->> 'kind' = 'paste'
        then jsonb_build_object('length', coalesce((item -> 'detail' ->> 'length')::integer, 0))
      else '{}'::jsonb
    end
  from jsonb_array_elements(p_events) as item;
  return '{}'::jsonb;
end;
$$;

create function withdraw(p_token uuid) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_participant participants := internal.participant_by_token(p_token);
begin
  delete from participants where id = v_participant.id;
  return '{}'::jsonb;
end;
$$;

revoke execute on all functions in schema internal from public, anon, authenticated;
revoke execute on function
  get_consent(text),
  start_session(text),
  begin_task(uuid),
  save_stage(uuid, text, jsonb),
  resume(uuid),
  log_events(uuid, jsonb),
  withdraw(uuid)
from public;
grant execute on function
  get_consent(text),
  start_session(text),
  begin_task(uuid),
  save_stage(uuid, text, jsonb),
  resume(uuid),
  log_events(uuid, jsonb),
  withdraw(uuid)
to anon, authenticated;
