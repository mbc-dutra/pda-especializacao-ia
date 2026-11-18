# meu-mcp-server: `meu-server` do controle-financeiro

MCP server (stdio) com **uma** tool, `resumo_financeiro_mes`. Ela lê na API local do
[controle-financeiro](https://github.com/mbc-dutra/ControleFinanceiro.app) o resumo de um mês:
saldo, saldo previsto, gastos por categoria e contas pendentes com vencimento. **Só leitura.**

- Escopo e o que a tool **não** pode fazer: [`../DECISAO-ESCOPO.md`](../DECISAO-ESCOPO.md)
- Ataques, causa raiz e mitigação (antes/depois): [`../LOG-INJECTION-TEMPLATE.md`](../LOG-INJECTION-TEMPLATE.md)

## Rodar

Pré-requisitos: Node 20+ e a API do controle-financeiro em `http://localhost:8080`.

```bash
npm install
npm run build      # checa a sintaxe dos .mjs (JS puro, sem etapa de compilação)
npm test           # 5 testes, incluindo os payloads de injection do log
node tests/entradas-ruins.mjs   # entradas fora do esperado pelo protocolo (como o Inspector)

# no diretório do controle-financeiro, escopo local (o server expõe dado financeiro pessoal):
claude mcp add --transport stdio -s local meu-server -- node "$(pwd)/espiao.mjs"
# dentro do Claude Code: /mcp → meu-server conectado, 1 tool
# pergunta de teste: "Como está novembro no meu controle financeiro? Quanto falta pagar?"
```

`espiao.mjs` (do starter) fica entre o Claude Code e o `server.mjs` e grava o protocolo em
`conversa.log`. Esse arquivo está no `.gitignore` porque contém dados financeiros reais.

## Para o dono do negócio

Dei ao assistente de IA uma ferramenta que consulta o meu aplicativo de finanças e responde
perguntas como "como está o mês?" ou "quanto ainda falta pagar?", sem eu precisar abrir a tela e
somar de cabeça. A ferramenta só **lê**: ela não consegue marcar uma conta como paga, mudar um
valor ou apagar nada, e não mostra a lista de pessoas que me devem dinheiro. Se alguém escrever
uma ordem disfarçada na descrição de uma conta, tentando enganar o assistente, a ferramenta
esconde esse texto antes de ele chegar ao assistente. Mesmo que ele fosse enganado, a ferramenta
não tem o poder técnico de alterar nada: a trava está no código, não na boa vontade do assistente.

## Qual risco mais ameaça este domínio

**Prompt injection indireta.** Num app de finanças pessoais, o dano mais provável não é vazar código.
É o assistente **dizer um número errado com confiança**: "está tudo pago", "sobra R$ 2 mil". A
pessoa decide com base nisso e deixa de pagar uma conta ou gasta o que não tem. O texto que carrega
o ataque entra pelo lugar mais banal do app: a descrição de um lançamento, que hoje aceita qualquer
coisa e que um dia vai vir de importação de extrato ou planilha. Output handling e supply chain
também importam, mas o caminho do ataque, nesse caso, é o próprio dado do usuário.
