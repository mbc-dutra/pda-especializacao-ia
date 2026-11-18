// meu-server: MCP server do controle-financeiro (semana 4 da PDA).
//
// Conversa por stdio. REGRA DE OURO: nunca console.log aqui (stdout é o cano do
// protocolo). Para depurar, use console.error.
//
// Escopo e limites da tool: ver ../DECISAO-ESCOPO.md

import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { resumoFinanceiroMes, MES_REGEX } from "./ferramentas.mjs";

const server = new McpServer({
  name: "meu-server",
  version: "1.0.0",
});

server.registerTool(
  "resumo_financeiro_mes",
  {
    description:
      "Lê no app controle-financeiro (API local) o resumo de um mês: entradas, saídas, saldo, " +
      "saldo previsto, gastos por categoria e contas ainda não pagas com vencimento. " +
      "Use quando a pessoa perguntar como está o mês, quanto falta pagar, o que vence ou onde está gastando. " +
      "Só leitura: não cria, edita, paga nem apaga nada.",
    inputSchema: z.strictObject({
      mes: z
        .string()
        .max(7)
        .regex(MES_REGEX, "Use o formato AAAA-MM, ex.: 2026-11")
        .describe("Mês no formato AAAA-MM. Ex.: 2026-11 para novembro de 2026."),
    }),
  },
  async ({ mes }) => {
    try {
      return { content: [{ type: "text", text: await resumoFinanceiroMes(mes) }] };
    } catch (erro) {
      return {
        isError: true,
        content: [{ type: "text", text: `Não consegui ler o controle-financeiro: ${erro.message}` }],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("meu-server no ar (stdio).");
