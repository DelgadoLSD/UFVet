import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";

// Porta de entrada do banco: todo o código do back-end fala com o PostgreSQL
// por aqui, e nunca cria outro cliente. Cada cliente abre o próprio conjunto
// de conexões; um só evita esgotar as conexões do servidor.

dotenv.config({ quiet: true });

// A sessão do banco é forçada para UTC. O adaptador do Prisma para o
// PostgreSQL (@prisma/adapter-pg 7.10) supõe que o banco trabalha em UTC: ao
// ler, descarta o fuso que vem com cada data ("09:00-03" vira "09:00" em UTC),
// e ao gravar envia a data sem fuso. Com o servidor no horário de Brasília, as
// datas enviadas pela API seriam guardadas 3 horas erradas e as lidas voltariam
// 3 horas erradas; os dois erros se anulam na volta, e o defeito passa
// despercebido até uma data da API ser comparada com uma gerada pelo banco.
// Os prazos de liberação, validação e recuperação quebrariam.
// testes/datas.test.js falha se esta opção for removida.
export function criarCliente(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL não está definida no .env.");
  }
  const adaptador = new PrismaPg({
    connectionString: url,
    options: "-c TimeZone=UTC",
  });
  return new PrismaClient({ adapter: adaptador });
}

export const banco = criarCliente();
