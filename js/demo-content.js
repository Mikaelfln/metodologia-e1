export const content = {
  consent: {
    title: "Termo de consentimento",
    paragraphs: [
      "Esta é uma versão de demonstração do site, então nada do que você fizer aqui é enviado ou salvo.",
      "Na sessão de verdade a pessoa lê um texto de uma página, escreve um resumo dele e depois responde a algumas perguntas, o que leva entre 20 e 30 minutos.",
      "A participação é voluntária e anônima, e quem quiser desistir só precisa fechar a página."
    ],
    accept_label: "Li e aceito participar",
    decline_label: "Não quero participar"
  },
  instructions_no_ai: {
    title: "Como vai funcionar",
    paragraphs: [
      "Nesta sessão você vai ler um texto e escrever um resumo dele com as suas próprias palavras.",
      "Pedimos que você faça isso sem usar nenhuma ferramenta de inteligência artificial e sem consultar outros materiais, então deixe esta página aberta e não troque de aba enquanto estiver escrevendo.",
      "O texto só aparece depois que você clicar em Começar, e é a partir daí que o tempo passa a contar."
    ]
  },
  instructions_ai_review: {
    title: "Como vai funcionar",
    paragraphs: [
      "Nesta sessão você vai ler um texto e escrever um resumo dele com as suas próprias palavras.",
      "O resumo deve ser escrito por você. Depois que terminar de escrever, pode pedir para a ferramenta de IA indicada pelo aplicador revisar o seu texto (clareza, gramática, tamanho) e aproveitar as sugestões que achar boas, mas sem pedir para ela escrever o resumo no seu lugar.",
      "O texto só aparece depois que você clicar em Começar, e é a partir daí que o tempo passa a contar."
    ]
  },
  instructions_ai_generate: {
    title: "Como vai funcionar",
    paragraphs: [
      "Nesta sessão você vai ler um texto e entregar um resumo dele.",
      "Para isso, use a ferramenta de IA indicada pelo aplicador: copie o texto, peça um resumo e cole aqui o que ela gerar. Se quiser, pode editar o resultado antes de entregar.",
      "O texto só aparece depois que você clicar em Começar, e é a partir daí que o tempo passa a contar."
    ]
  },
  task: {
    title: "Tarefa",
    prompt: "Faça um resumo do texto com 150 a 200 palavras, em até 15 minutos."
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
    prompt: "Agora, sem consultar nada, tente escrever de memória uma frase do resumo que você acabou de entregar, do jeito mais parecido possível com o que estava lá.",
    skip_label: "Não consigo lembrar de nenhuma frase"
  },
  authorship: {
    prompt: "Quanto você sente que o resumo entregue é de sua autoria?",
    low: "nada meu",
    high: "totalmente meu"
  },
  quiz_intro: {
    prompt: "As perguntas abaixo são sobre o texto que você leu. Responda sem voltar a consultá-lo."
  },
  profile: {
    intro: "Para terminar, só mais três perguntas sobre você.",
    course_label: "Qual é o seu curso?",
    course_options: [
      "Ciência da Computação",
      "Outro curso da UFCG",
      "Outro"
    ],
    term_label: "Em que período você está?",
    ai_frequency_label: "Com que frequência você usa ferramentas de IA para escrever textos?",
    ai_frequency_low: "nunca",
    ai_frequency_high: "sempre"
  },
  debrief: {
    title: "Obrigado por participar",
    paragraphs: [
      "O que estamos investigando nesta atividade é se usar inteligência artificial na hora de escrever muda o quanto a pessoa lembra do que escreveu e o quanto ela sente que o texto é dela.",
      "Se você preferir que seus dados não sejam usados, é só clicar no botão abaixo que eles são apagados na hora."
    ],
    withdraw_label: "Retirar meus dados"
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
