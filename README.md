# metodologia-e1

Site auxiliar para pesquisa sobre uso de IA em resumos de texto, feito para a disciplina de
Metodologia Científica (UFCG, 2026.2).

O site conduz uma sessão por participante: termo de consentimento, sorteio de uma entre três
condições de escrita, leitura de um texto, escrita de um resumo com tempo marcado e um
questionário curto. As respostas ficam em um banco de acesso restrito à equipe.

## Rodando localmente

Não há etapa de build. Sirva a pasta com qualquer servidor estático:

```
npx serve .
```

e abra `http://localhost:3000/?s=TESTE&demo=1`. O modo de demonstração não precisa de banco
e não guarda nada.

## Testes

```
npm install
npm test
```

Os testes do banco rodam o `supabase/schema.sql` em um Postgres embutido (PGlite).

## Estrutura

- `index.html`, `css/`, `js/`: o site.
- `supabase/schema.sql`: tabelas, funções e permissões.
- `supabase/content.example.sql`: textos de exemplo. O conteúdo real fica fora do repositório.
- `docs/deployment.md`: como colocar no ar e exportar os dados.

## Licença

MIT. Os ícones em `icons/` são do [Lucide](https://lucide.dev), sob licença ISC.
