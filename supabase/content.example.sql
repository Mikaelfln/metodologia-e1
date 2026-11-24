insert into content (key, value) values
('consent', $json${
  "title": "Termo de consentimento",
  "paragraphs": [
    "Você está sendo convidado(a) a participar de uma atividade da disciplina de Metodologia Científica da UFCG sobre escrita de textos acadêmicos.",
    "Nesta sessão você vai ler um texto de uma página, escrever um resumo dele e, em seguida, responder a algumas perguntas. A sessão dura de 20 a 30 minutos.",
    "A participação é voluntária e anônima. Não pedimos nome, e-mail nem matrícula, e nada do que você fizer aqui afeta notas ou avaliações. Você pode desistir a qualquer momento: basta fechar a página. Se desistir no meio, avise quem está aplicando a sessão para que o que já foi registrado seja apagado.",
    "Guardamos o que você escrever e responder, os horários de cada etapa e as interações com esta página (por exemplo, quando ela perde o foco ou quando um texto é colado). Os dados ficam em um banco de acesso restrito à equipe e serão usados somente nesta atividade de ensino. Eles são mantidos até [[PRAZO]] e depois o banco é apagado. Uma versão anonimizada será compartilhada com a turma e o professor.",
    "Ao final, explicamos com mais detalhes o objetivo da atividade e você poderá pedir que seus dados sejam apagados.",
    "Responsáveis: [[RESPONSAVEIS]]. Contato: [[CONTATO]]."
  ],
  "accept_label": "Li e aceito participar",
  "decline_label": "Não quero participar"
}$json$::jsonb),
('instructions_no_ai', $json${
  "title": "Como vai funcionar",
  "paragraphs": [
    "Você vai ler um texto e escrever um resumo dele com suas próprias palavras.",
    "Nesta sessão você deve trabalhar sem nenhuma ferramenta de inteligência artificial e sem consultar outros materiais. Mantenha esta página aberta e não troque de aba durante a tarefa.",
    "O tempo começa a contar quando você clicar em Começar. O texto aparece nesse momento."
  ]
}$json$::jsonb),
('instructions_ai_review', $json${
  "title": "Como vai funcionar",
  "paragraphs": [
    "Você vai ler um texto e escrever um resumo dele com suas próprias palavras.",
    "Escreva o resumo você mesmo(a). Depois de escrever, você pode pedir à ferramenta de IA indicada pelo aplicador que revise o seu texto (clareza, gramática, concisão) e aproveitar as sugestões. Não peça à IA que escreva o resumo por você.",
    "O tempo começa a contar quando você clicar em Começar. O texto aparece nesse momento."
  ]
}$json$::jsonb),
('instructions_ai_generate', $json${
  "title": "Como vai funcionar",
  "paragraphs": [
    "Você vai ler um texto e entregar um resumo dele.",
    "Use a ferramenta de IA indicada pelo aplicador para gerar o resumo: copie o texto, peça o resumo e cole o resultado aqui. Você pode editar o texto gerado como quiser antes de entregar.",
    "O tempo começa a contar quando você clicar em Começar. O texto aparece nesse momento."
  ]
}$json$::jsonb),
('task', $json${
  "title": "Tarefa",
  "prompt": "Leia o texto e escreva um resumo de 150 a 200 palavras. Você tem 15 minutos."
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
  "prompt": "Sem consultar nada, escreva de memória uma frase do resumo que você acabou de entregar, o mais fiel possível ao que você entregou.",
  "skip_label": "Não consigo lembrar de nenhuma frase"
}$json$::jsonb),
('authorship', $json${
  "prompt": "Quanto você sente que o resumo entregue é de sua autoria?",
  "low": "nada meu",
  "high": "totalmente meu"
}$json$::jsonb),
('quiz_intro', $json${
  "prompt": "Responda às perguntas abaixo sobre o texto que você leu, sem consultá-lo."
}$json$::jsonb),
('profile', $json${
  "intro": "Para terminar, três perguntas rápidas sobre você.",
  "course_label": "Qual é o seu curso?",
  "course_options": ["Ciência da Computação", "Outro curso da UFCG", "Outro"],
  "term_label": "Em que período você está?",
  "ai_frequency_label": "Com que frequência você usa ferramentas de IA para escrever textos?",
  "ai_frequency_low": "nunca",
  "ai_frequency_high": "sempre"
}$json$::jsonb),
('debrief', $json${
  "title": "Obrigado por participar",
  "paragraphs": [
    "Esta atividade investiga como o uso de inteligência artificial durante a escrita influencia a memória do que foi escrito e a sensação de autoria sobre o texto.",
    "Cada participante foi sorteado para uma de três situações: escrever sem IA, escrever e pedir à IA que revisasse, ou pedir à IA que gerasse o resumo. Depois, todos responderam às mesmas perguntas: recordar uma frase do próprio resumo, avaliar o quanto o texto parecia seu e responder a questões sobre o texto lido.",
    "Não explicamos isso no início porque saber das perguntas com antecedência mudaria a forma de fazer a tarefa. Pedimos que você não comente os detalhes com colegas que ainda possam participar.",
    "Se, sabendo disso, você preferir que seus dados não sejam usados, clique no botão abaixo e eles serão apagados agora. Para pedir a retirada depois, envie o código abaixo para [[CONTATO]]."
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
