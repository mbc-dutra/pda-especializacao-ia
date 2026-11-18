# DECISAO-ESCOPO.md

## O server

- **Projeto e domínio (semana 2):** `controle-financeiro`, app de finanças pessoais que substitui
  a planilha do Excel (https://github.com/mbc-dutra/ControleFinanceiro.app). Hoje, para saber como
  está o mês, eu abro a tela e somo de cabeça o que ainda falta pagar. Com a tool, o Claude Code
  responde "como está novembro?" e "o que vence essa semana?" consultando o app.
- **Que dado ou sistema ele toca:** a API REST local do app (`http://localhost:8080/api`, Spring
  Boot + PostgreSQL). Só os endpoints de **leitura** de lançamentos. O banco tem **dados
  financeiros reais**.
- **Escopo em que você conecta:** `local`, só no diretório do controle-financeiro e só na minha
  máquina. O server expõe dado financeiro pessoal, então não pode ir para o `.mcp.json` de
  projeto (que é commitado) nem para o escopo `user` (que ficaria ativo em qualquer projeto).

## Tool 1: `resumo_financeiro_mes`

- **Recebe:** `mes` no formato `AAAA-MM` (ex.: `2026-11`). Mais nada.
- **Devolve (só os campos que a tarefa precisa):**
  - entradas, saídas, saldo, a receber, a pagar e saldo previsto do mês;
  - gastos por categoria (nome, total, %);
  - contas **pendentes** do mês (descrição curta, valor, vencimento, se está atrasada), até 30.
- **Precisa poder:**
  1. Fazer `GET` em 3 caminhos fixos da API local: `/lancamentos/resumo`, `/lancamentos/categorias`
     e `/lancamentos?tipo=SAIDA`, sempre com `mes`.
- **Não pode, mesmo que fosse prático:**
  1. **Escrever no app:** criar, editar, marcar como pago ou apagar lançamento. Marcar "pago"
     errado altera o saldo real; apagar não tem desfazer.
  2. **Falar com outro endereço** além de `localhost:8080`. Nada de URL vinda do pedido, para não
     virar ponte para outro site (SSRF) nem vazar dados para fora.
  3. **Devolver dado de terceiros:** a parte "Me devem" (nome de pessoas e quanto devem) fica de
     fora.
  4. **Devolver dado que facilita ação:** sem `id` de lançamento (o `id` é o que um `PATCH`/`DELETE`
     precisaria) e sem instituição/banco.
  5. **Devolver texto livre sem limite:** descrição e categoria são texto que qualquer um digita no
     app. Não podem chegar inteiros e crus ao modelo.
  6. Ler arquivo, rodar comando ou consultar "todos os meses" de uma vez.
- **Como o código garante:**
  1. Schema `zod` com `regex(/^\d{4}-(0[1-9]|1[0-2])$/)`: vazio, texto, mês 13, string gigante
     ou instrução no lugar do mês são recusados **antes** de qualquer chamada HTTP.
  2. URL base é **constante** no código (`API = "http://localhost:8080/api"`). Os caminhos vêm de
     uma allow-list fixa e o `fetch` é sempre `method: "GET"`. Não existe função de escrita no
     server.
  3. A resposta é montada campo a campo (sem repassar o JSON da API): `id`, `instituicao` e
     `/dividas` nunca são lidos.
  4. Texto livre passa por `limparTexto()`: tira caracteres de controle e `<` `>`, junta espaços e
     corta em 60 caracteres. Vai dentro de um bloco marcado como **dado de terceiro**.
  5. Limites: timeout de 5 s por chamada, resposta da API até 1 MB, no máximo 30 contas listadas.

## Texto de terceiros

- **Alguma tool devolve texto escrito por outra pessoa?** Sim: a **descrição** e a **categoria**
  dos lançamentos (a API aceita qualquer texto). Hoje quem digita sou eu, mas qualquer coisa que
  um dia alimentar o app (importação de extrato, alguém com acesso à tela, uma planilha colada)
  coloca texto de terceiro ali.
- **Se esse texto trouxesse uma ordem escondida**, o que o agente conseguiria fazer com as outras
  ferramentas da sessão? A tool em si não escreve nada. Mas o Claude Code, aberto no projeto,
  tem `Bash`: com `curl` ele conseguiria fazer `PATCH /api/lancamentos/{id}/pago` (mudar meu saldo)
  ou `DELETE` (apagar contas), ou ler arquivos do projeto. Por isso a tool não devolve `id`, e o
  log de injection testa exatamente esse caminho.
