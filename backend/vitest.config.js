import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ quiet: true });

// Chaves só para os testes: fixas e sem valor secreto. Os testes não dependem
// das chaves reais do .env, e as reais nunca são usadas aqui.
const chaveDeTeste = (byte) => Buffer.alloc(32, byte).toString("base64");

// Porta do script do Google de mentira (ver EMAIL_SCRIPT_URL abaixo).
export const PORTA_DO_SCRIPT_DE_MENTIRA = 47811;

export default defineConfig({
  test: {
    include: ["testes/**/*.test.js"],
    // Antes de qualquer teste importar src/banco.js, a conexão é trocada pela
    // do banco de testes. O banco de desenvolvimento nunca é tocado.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      CHAVE_CIFRAGEM: chaveDeTeste(1),
      CHAVE_INDICE: chaveDeTeste(2),
      JWT_SEGREDO: chaveDeTeste(3),
      // Os links dos e-mails apontam para cá; os e-mails não saem (ficam na
      // caixa de saída do carteiro, na memória).
      ENDERECO_DO_SITE: "http://ufvet.test",
      // Um script de mentira, que só o teste do caminho da configuração liga
      // (emails.test.js): a API publicada chama o carteiro sem dizer o
      // endereço, e é este caminho que precisa estar testado. Também tira
      // daqui um script de verdade que esteja no .env.
      EMAIL_SCRIPT_URL: `http://127.0.0.1:${PORTA_DO_SCRIPT_DE_MENTIRA}/exec`,
      EMAIL_SCRIPT_SEGREDO: "senha-do-script-de-mentira",
    },
    // Cria o banco de testes, se faltar, e aplica as migrações.
    globalSetup: ["./testes/preparar-banco.js"],
    // Falha o teste em que o driver do banco avisar de consultas ao mesmo
    // tempo na mesma conexão.
    setupFiles: ["./testes/avisos-do-banco.js"],
    // Todos os arquivos usam o mesmo banco: rodar um de cada vez evita que um
    // apague os dados que o outro acabou de criar.
    fileParallelism: false,
  },
});
