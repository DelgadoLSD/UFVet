import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ quiet: true });

// Chaves só para os testes: fixas e sem valor secreto. Os testes não dependem
// das chaves reais do .env, e as reais nunca são usadas aqui.
const chaveDeTeste = (byte) => Buffer.alloc(32, byte).toString("base64");

export default defineConfig({
  test: {
    include: ["testes/**/*.test.js"],
    // Antes de qualquer teste importar src/banco.js, a conexão é trocada pela
    // do banco de testes. O banco de desenvolvimento nunca é tocado.
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      CHAVE_CIFRAGEM: chaveDeTeste(1),
      CHAVE_INDICE: chaveDeTeste(2),
    },
    // Cria o banco de testes, se faltar, e aplica as migrações.
    globalSetup: ["./testes/preparar-banco.js"],
    // Todos os arquivos usam o mesmo banco: rodar um de cada vez evita que um
    // apague os dados que o outro acabou de criar.
    fileParallelism: false,
  },
});
