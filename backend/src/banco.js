import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";

// Porta de entrada do banco: todo o código do back-end fala com o PostgreSQL
// por aqui, e nunca cria outro cliente. Cada cliente abre o próprio conjunto
// de conexões; um só evita esgotar as conexões do servidor.

dotenv.config({ quiet: true });

// A sessão do banco é forçada para UTC. O adaptador do Prisma para o
// PostgreSQL (@prisma/adapter-pg 7.10) supõe que o banco responde em UTC: ele
// descarta o fuso que vem junto de cada data ("09:00-03" vira "09:00" em UTC).
// Com o servidor no horário de Brasília, toda data lida voltaria 3 horas
// errada, e os prazos de liberação, validação e recuperação quebrariam.
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
