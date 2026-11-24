# Como colocar o site no ar

O site é estático. Os dados ficam em um projeto do Supabase, e o navegador do participante só
consegue chamar as funções definidas em `supabase/schema.sql`: ele não lê nenhuma tabela.

## 1. Banco

1. Crie uma conta em supabase.com e um projeto novo na região **South America (São Paulo)**.
2. Abra o **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute.
3. Copie `supabase/content.example.sql` para `supabase/content.sql`. Esse arquivo está no
   `.gitignore` e não deve ir para o repositório.
4. Em `content.sql`, troque o texto de exemplo, as perguntas e o gabarito pelos definitivos,
   revise os demais textos e substitua `[[RESPONSAVEIS]]`, `[[CONTATO]]` e `[[PRAZO]]` (até quando os dados ficam
   guardados). Em
   `quiz_answers`, `correct_option` conta a partir de zero (0 é a primeira alternativa).
5. Cole `content.sql` no SQL Editor e execute.

Para trocar um texto depois, edite a linha na tabela `content` pelo **Table Editor**.

## 2. Sessões

Cada link de coleta usa um código cadastrado na tabela `sessions`:

```sql
insert into sessions (code, label) values ('LCC2-1012', 'LCC2, 10/12 às 14h');
insert into sessions (code, label, classmate) values ('SALA-1512', 'Sessão em sala', true);
insert into sessions (code, label, pilot) values ('PILOTO', 'Piloto', true);
```

- `classmate` marca os participantes daquela sessão como colegas da turma.
- `pilot` separa o sorteio do piloto do sorteio da coleta e marca os registros.
- Para encerrar um link, mude `active` para `false`.

O sorteio das condições é feito em blocos de três, na ordem de chegada, somando todas as
sessões que não são piloto.

## 3. Site

1. No painel do Supabase, em **Project Settings > API**, copie a URL do projeto e a chave
   pública (`anon` ou `publishable`). Nunca use a chave `service_role` no site.
2. Preencha `js/config.js` com os dois valores. A chave pública pode ficar no repositório.
3. Publique a pasta do projeto como site estático. Não há etapa de build.
   - Repositório público: GitHub Pages, a partir da raiz do branch principal.
   - Repositório privado: Cloudflare Pages, Netlify ou Vercel (ou GitHub Pages com o GitHub
     Education).

O link de cada sessão é o endereço do site com `?s=` e o código:

```
https://endereco-do-site/?s=LCC2-1012
```

## 4. Antes de cada sessão

- Abra o link em um computador do laboratório e confirme que o termo aparece.
- Feche as abas de sessões anteriores. Se alguém fechar a aba no meio, o link aberto de novo
  cria um participante novo, com novo sorteio: anote o ocorrido.
- Deixe o link ativo só durante a sessão (`active = false` ao terminar). Quem tem um link
  ativo consegue abrir uma sessão nova em outra aba e receber outro sorteio; registros
  incompletos com horários próximos na mesma sessão são o sinal disso na exportação.
- Se alguém desistir no meio e pedir a retirada, apague o registro incompleto daquela sessão
  e horário: `delete from participants where session_code = 'CODIGO' and stage <> 'debrief'
  and consented_at > now() - interval '1 hour';` (confira antes com um `select`).
- A tela final some se a página for recarregada. O código de participante mostrado nela é o
  que permite pedir a retirada depois.
- Para conhecer as telas sem gravar nada, use `?s=TESTE&demo=1`. Dá para fixar a condição com
  `&condition=no_ai`, `ai_review` ou `ai_generate`, e encurtar o tempo com `&seconds=30`.

## 5. Dados

- No SQL Editor, rode `select * from export;` e use **Export > CSV**. Faça isso ao fim de cada
  dia de coleta.
- `complete` indica quem chegou ao final. `pilot` e `classmate` vêm da sessão.
- `recall_similarity` é só um apoio. O julgamento final fica em `recall_coded`, preenchido por
  vocês na tabela `participants` conforme o critério do protocolo.
- Leia os resumos antes de divulgar a base: se alguém escreveu algo que o identifique, remova.
  Retire também a coluna `withdrawal_code` da versão que for compartilhada.
- Pedido de retirada depois da sessão:
  `delete from participants where withdrawal_code = 'CODIGO';`

## 6. Entre as ondas e ao final

- Projetos gratuitos do Supabase são pausados depois de cerca de uma semana sem uso. Antes da
  segunda onda, entre no painel e reative o projeto.
- Depois da entrega final, exporte a base, apague o projeto no Supabase e mantenha apenas a
  versão anonimizada.
