insert into content (key, value) values
('consent', $json${
  "title": "Termo de consentimento",
  "paragraphs": [
    "Você está sendo convidado(a) a participar de uma atividade da disciplina de Metodologia Científica da UFCG, que tem a ver com a escrita de textos acadêmicos.",
    "A ideia é que você leia um texto de uma página, escreva um resumo dele e depois responda a algumas perguntas. Tudo isso deve levar entre 20 e 30 minutos.",
    "Sua participação é voluntária e anônima, ou seja, não pedimos nome, e-mail ou matrícula, e nada do que for feito aqui interfere em notas ou avaliações. Se quiser desistir é só fechar a página, e caso isso aconteça no meio da sessão avise quem está aplicando para que a gente apague o que já tinha sido registrado.",
    "Vamos guardar o que você escrever e responder, os horários de cada etapa e algumas interações com a página (por exemplo quando ela perde o foco ou quando algum texto é colado). Esses dados ficam em um banco que só a equipe acessa, serão usados apenas nesta atividade de ensino e ficam guardados até [[PRAZO]], quando o banco será apagado. Uma versão anonimizada vai ser compartilhada com a turma e com o professor.",
    "No final da sessão explicamos melhor qual é o objetivo da atividade, e nesse momento você pode pedir que seus dados sejam apagados se preferir.",
    "Responsáveis: [[RESPONSAVEIS]]. Contato: [[CONTATO]]."
  ],
  "accept_label": "Li e aceito participar",
  "decline_label": "Não quero participar"
}$json$::jsonb),
('instructions_no_ai', $json${
  "title": "Como vai funcionar",
  "paragraphs": [
    "Nesta sessão você vai ler um texto e escrever um resumo dele com as suas próprias palavras.",
    "Pedimos que você faça isso sem usar nenhuma ferramenta de inteligência artificial e sem consultar outros materiais, então deixe esta página aberta e não troque de aba enquanto estiver escrevendo.",
    "O texto só aparece depois que você clicar em Começar, e é a partir daí que o tempo passa a contar."
  ]
}$json$::jsonb),
('instructions_ai_review', $json${
  "title": "Como vai funcionar",
  "paragraphs": [
    "Nesta sessão você vai ler um texto e escrever um resumo dele com as suas próprias palavras.",
    "O resumo deve ser escrito por você. Depois que terminar de escrever, pode pedir para a ferramenta de IA indicada pelo aplicador revisar o seu texto (clareza, gramática, tamanho) e aproveitar as sugestões que achar boas, mas sem pedir para ela escrever o resumo no seu lugar.",
    "O texto só aparece depois que você clicar em Começar, e é a partir daí que o tempo passa a contar."
  ]
}$json$::jsonb),
('instructions_ai_generate', $json${
  "title": "Como vai funcionar",
  "paragraphs": [
    "Nesta sessão você vai ler um texto e entregar um resumo dele.",
    "Para isso, use a ferramenta de IA indicada pelo aplicador: copie o texto, peça um resumo e cole aqui o que ela gerar. Se quiser, pode editar o resultado antes de entregar.",
    "O texto só aparece depois que você clicar em Começar, e é a partir daí que o tempo passa a contar."
  ]
}$json$::jsonb),
('task', $json${
  "title": "Tarefa",
  "prompt": "Faça um resumo do texto com 150 a 200 palavras em até 15 minutos."
}$json$::jsonb),
('source_text', $json${
  "title": "O farol de Ponta Seca",
  "paragraphs": [
    "Este é um texto fictício, usado apenas para demonstrar o funcionamento do site. Substitua-o pelo texto-base definido no protocolo.",
    "O farol de Ponta Seca foi erguido em 1887, depois que três navios cargueiros encalharam no mesmo banco de areia em menos de dois anos. A obra foi financiada por uma associação de comerciantes de algodão, que perdiam cargas inteiras a cada naufrágio, e não pelo governo da província, como se costuma supor. A torre, de 31 metros, foi construída com pedra calcária retirada de uma pedreira a quatro quilômetros dali e transportada em carros de boi durante a estação seca.",
    "Durante as primeiras décadas, a luz era produzida por uma lamparina a óleo de baleia, e mais tarde a querosene. O faroleiro precisava subir os 142 degraus duas vezes por noite para aparar o pavio e dar corda no mecanismo de relojoaria que girava a lente. O cargo passava de pai para filho: quatro gerações da família Arcoverde cuidaram do farol entre 1887 e 1964.",
    "A eletrificação chegou em 1952, com um gerador a diesel instalado em um galpão ao lado da torre. A mudança reduziu o trabalho noturno, mas não o eliminou, porque o gerador falhava com frequência e a lamparina antiga era mantida pronta como reserva. Só em 1964, com a ligação à rede elétrica e a instalação de um sistema automático, o posto de faroleiro foi extinto.",
    "Sem moradores, o conjunto se deteriorou rapidamente. A maresia corroeu a escada de ferro e parte do telhado da casa do faroleiro desabou em 1978. A recuperação começou apenas em 1991, por iniciativa de uma associação de pescadores da vila vizinha, que usava a torre como referência para voltar ao porto e temia que ela fosse desativada. O grupo organizou mutirões, conseguiu material doado e convenceu a prefeitura a tombar o farol como patrimônio municipal em 1994.",
    "Hoje o farol continua em operação, com lâmpadas de LED alimentadas por painéis solares, e recebe visitantes aos fins de semana. A casa do faroleiro abriga um pequeno museu com o livro de ocorrências original, em que cada noite de serviço foi registrada à mão. Os pesquisadores que estudaram esses registros destacam um dado curioso: nos 77 anos de operação manual, a luz deixou de acender em apenas onze noites, quase todas durante tempestades que impediram a subida à torre."
  ]
}$json$::jsonb),
('recall', $json${
  "prompt": "Agora, sem consultar nada, tente escrever de memória uma frase do resumo que você acabou de entregar, do jeito mais parecido possível com o que estava lá.",
  "skip_label": "Não consigo lembrar de nenhuma frase"
}$json$::jsonb),
('authorship', $json${
  "prompt": "Quanto você sente que o resumo entregue é de sua autoria?",
  "low": "nada meu",
  "high": "totalmente meu"
}$json$::jsonb),
('quiz_intro', $json${
  "prompt": "As perguntas abaixo são sobre o texto que você leu. Responda sem voltar a consultá-lo."
}$json$::jsonb),
('profile', $json${
  "intro": "Para terminar, só mais três perguntas sobre você.",
  "course_label": "Qual é o seu curso?",
  "course_options": [
    "Ciência da Computação",
    "Outro curso da UFCG",
    "Outro"
  ],
  "term_label": "Em que período você está?",
  "ai_frequency_label": "Com que frequência você usa ferramentas de IA para escrever textos?",
  "ai_frequency_low": "nunca",
  "ai_frequency_high": "sempre"
}$json$::jsonb),
('debrief', $json${
  "title": "Obrigado por participar",
  "paragraphs": [
    "O que estamos investigando nesta atividade é se usar inteligência artificial na hora de escrever muda o quanto a pessoa lembra do que escreveu e o quanto ela sente que o texto é dela.",
    "Cada participante foi sorteado para uma de três situações, que eram escrever sem IA, escrever e pedir para a IA revisar, ou pedir para a IA gerar o resumo. Depois todo mundo respondeu às mesmas perguntas, em que era preciso recordar uma frase do próprio resumo, dizer o quanto o texto parecia seu e responder a questões sobre o texto lido.",
    "Não contamos isso no começo porque saber das perguntas antes mudaria o jeito de fazer a tarefa. Por esse mesmo motivo, pedimos que você não comente os detalhes com colegas que ainda possam participar.",
    "Se depois de saber disso você preferir que seus dados não sejam usados, é só clicar no botão abaixo que eles são apagados na hora. Também dá para pedir a retirada mais tarde, mandando o código abaixo para [[CONTATO]]."
  ],
  "withdraw_label": "Retirar meus dados"
}$json$::jsonb);

insert into quiz_questions (id, position, prompt, options) values
(1, 1, 'Quem financiou a construção do farol?',
  '["Uma associação de comerciantes de algodão", "O governo da província", "Uma companhia de navegação", "A prefeitura da vila"]'),
(2, 2, 'Por que o posto de faroleiro foi extinto em 1964?',
  '["O farol foi desativado", "A ligação à rede elétrica permitiu um sistema automático", "A família responsável deixou a região", "O gerador a diesel dispensou o trabalho noturno"]'),
(3, 3, 'Quem iniciou a recuperação do farol em 1991?',
  '["A prefeitura", "Pesquisadores de uma universidade", "Uma associação de pescadores", "Os descendentes dos faroleiros"]'),
(4, 4, 'O que os registros do livro de ocorrências mostram?',
  '["Que a luz falhava quase todo mês", "Que o farol ficou apagado durante a eletrificação", "Que os naufrágios continuaram frequentes", "Que a luz deixou de acender em apenas onze noites"]'),
(5, 5, 'Como o farol é alimentado atualmente?',
  '["Painéis solares e lâmpadas de LED", "Gerador a diesel", "Querosene", "Rede elétrica convencional"]');

insert into quiz_answers (question_id, correct_option) values
(1, 0), (2, 1), (3, 2), (4, 3), (5, 0);
