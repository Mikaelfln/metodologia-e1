const start = "O tempo começa a contar quando você clicar em Começar. O texto aparece nesse momento.";

export const content = {
  consent: {
    title: "Termo de consentimento",
    paragraphs: [
      "Esta é uma demonstração do site. Nada do que você fizer aqui é enviado ou guardado.",
      "Na sessão real você vai ler um texto de uma página, escrever um resumo dele e, em seguida, responder a algumas perguntas. A sessão dura de 20 a 30 minutos.",
      "A participação é voluntária e anônima. Você pode desistir a qualquer momento, basta fechar a página.",
    ],
    accept_label: "Li e aceito participar",
    decline_label: "Não quero participar",
  },
  instructions_no_ai: {
    title: "Como vai funcionar",
    paragraphs: [
      "Você vai ler um texto e escrever um resumo dele com suas próprias palavras.",
      "Trabalhe sem nenhuma ferramenta de inteligência artificial e sem consultar outros materiais. Mantenha esta página aberta e não troque de aba durante a tarefa.",
      start,
    ],
  },
  instructions_ai_review: {
    title: "Como vai funcionar",
    paragraphs: [
      "Você vai ler um texto e escrever um resumo dele com suas próprias palavras.",
      "Escreva o resumo você mesmo(a). Depois, você pode pedir à ferramenta de IA indicada pelo aplicador que revise o seu texto. Não peça à IA que escreva o resumo por você.",
      start,
    ],
  },
  instructions_ai_generate: {
    title: "Como vai funcionar",
    paragraphs: [
      "Você vai ler um texto e entregar um resumo dele.",
      "Use a ferramenta de IA indicada pelo aplicador para gerar o resumo: copie o texto, peça o resumo e cole o resultado aqui. Você pode editar o texto gerado antes de entregar.",
      start,
    ],
  },
  task: {
    title: "Tarefa",
    prompt: "Leia o texto e escreva um resumo de 150 a 200 palavras. Você tem 15 minutos.",
  },
  source_text: {
    title: "O farol de Ponta Seca",
    paragraphs: [
      "O farol de Ponta Seca foi erguido em 1887, depois que três navios cargueiros encalharam no mesmo banco de areia em menos de dois anos. A obra foi financiada por uma associação de comerciantes de algodão, que perdiam cargas inteiras a cada naufrágio, e não pelo governo da província, como se costuma supor.",
      "Durante as primeiras décadas, a luz era produzida por uma lamparina a óleo, e o faroleiro precisava subir os 142 degraus duas vezes por noite para aparar o pavio. O cargo passava de pai para filho: quatro gerações da mesma família cuidaram do farol entre 1887 e 1964.",
      "A eletrificação chegou em 1952, com um gerador a diesel que falhava com frequência. Só em 1964, com a ligação à rede elétrica e um sistema automático, o posto de faroleiro foi extinto. Sem moradores, o conjunto se deteriorou, e a recuperação começou apenas em 1991, por iniciativa de uma associação de pescadores da vila vizinha.",
      "Hoje o farol continua em operação, com lâmpadas de LED alimentadas por painéis solares. O livro de ocorrências mostra que, em 77 anos de operação manual, a luz deixou de acender em apenas onze noites.",
    ],
  },
  recall: {
    prompt:
      "Sem consultar nada, escreva de memória uma frase do resumo que você acabou de entregar, o mais fiel possível ao que você entregou.",
    skip_label: "Não consigo lembrar de nenhuma frase",
  },
  authorship: {
    prompt: "Quanto você sente que o resumo entregue é de sua autoria?",
    low: "nada meu",
    high: "totalmente meu",
  },
  quiz_intro: {
    prompt: "Responda às perguntas abaixo sobre o texto que você leu, sem consultá-lo.",
  },
  profile: {
    intro: "Para terminar, três perguntas rápidas sobre você.",
    course_label: "Qual é o seu curso?",
    course_options: ["Ciência da Computação", "Outro curso da UFCG", "Outro"],
    term_label: "Em que período você está?",
    ai_frequency_label: "Com que frequência você usa ferramentas de IA para escrever textos?",
    ai_frequency_low: "nunca",
    ai_frequency_high: "sempre",
  },
  debrief: {
    title: "Obrigado por participar",
    paragraphs: [
      "Esta atividade investiga como o uso de inteligência artificial durante a escrita influencia a memória do que foi escrito e a sensação de autoria sobre o texto.",
      "Se você preferir que seus dados não sejam usados, clique no botão abaixo e eles serão apagados agora.",
    ],
    withdraw_label: "Retirar meus dados",
  },
};

export const questions = [
  {
    id: 1,
    prompt: "Quem financiou a construção do farol?",
    options: [
      "Uma associação de comerciantes de algodão",
      "O governo da província",
      "Uma companhia de navegação",
      "A prefeitura da vila",
    ],
  },
  {
    id: 2,
    prompt: "Por que o posto de faroleiro foi extinto em 1964?",
    options: [
      "O farol foi desativado",
      "A ligação à rede elétrica permitiu um sistema automático",
      "A família responsável deixou a região",
      "O gerador a diesel dispensou o trabalho noturno",
    ],
  },
  {
    id: 3,
    prompt: "Quem iniciou a recuperação do farol em 1991?",
    options: [
      "A prefeitura",
      "Pesquisadores de uma universidade",
      "Uma associação de pescadores",
      "Os descendentes dos faroleiros",
    ],
  },
  {
    id: 4,
    prompt: "O que o livro de ocorrências mostra?",
    options: [
      "Que a luz falhava quase todo mês",
      "Que o farol ficou apagado durante a eletrificação",
      "Que os naufrágios continuaram frequentes",
      "Que a luz deixou de acender em apenas onze noites",
    ],
  },
  {
    id: 5,
    prompt: "Como o farol é alimentado atualmente?",
    options: [
      "Painéis solares e lâmpadas de LED",
      "Gerador a diesel",
      "Querosene",
      "Rede elétrica convencional",
    ],
  },
];
