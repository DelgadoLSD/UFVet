import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

// Roda uma vez, antes de todos os testes: garante que o banco de testes existe
// e tem as mesmas tabelas do banco real, aplicando as mesmas migrações.

const CLI_DO_PRISMA = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);

export default async function prepararBancoDeTestes() {
  dotenv.config({ quiet: true });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL não está definida no .env.");
  }

  // Trava de segurança: os testes apagam tudo do banco em que rodam. Só um
  // banco com nome terminado em _test é aceito, para nunca ser o de verdade.
  const nome = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!/^[a-z0-9_]+_test$/.test(nome) || url === process.env.DATABASE_URL) {
    throw new Error(
      `Recusado: os testes só rodam num banco próprio terminado em _test, e "${nome}" não é um.`,
    );
  }

  const administracao = new URL(url);
  administracao.pathname = "/postgres";
  const cliente = new pg.Client({ connectionString: administracao.toString() });
  await cliente.connect();
  try {
    const { rowCount } = await cliente.query(
      "select 1 from pg_database where datname = $1",
      [nome],
    );
    if (!rowCount) await cliente.query(`create database "${nome}"`);
  } finally {
    await cliente.end();
  }

  execFileSync(process.execPath, [CLI_DO_PRISMA, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
