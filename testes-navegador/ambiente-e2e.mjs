// Uma cópia isolada do UFVet para os roteiros de navegador: banco próprio
// (ufvet_e2e), pastas de fotos e exames temporárias, a API na porta 3100 e o
// site (Vite) na 5180, com o /api apontando para ela. O banco, as fotos e os
// servidores do desenvolvimento (5173 e 3000) não são tocados.
//
// Uso:
//   node ambiente-e2e.mjs preparar          recria o banco com os exemplos
//   node ambiente-e2e.mjs api               sobe a API (fica rodando)
//   node ambiente-e2e.mjs site              sobe o site (fica rodando)
//   node ambiente-e2e.mjs limpar            apaga o banco e as pastas
//   node ambiente-e2e.mjs rodar <cmd...>    roda um comando com o ambiente
//                                           isolado (BASE, DATABASE_URL...)
//
// A senha do banco nunca é mostrada: a URL de conexão sai do .env do
// back-end e só troca o nome do banco.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "");
const BACKEND = `${RAIZ}/backend`;
const FRONTEND = `${RAIZ}/frontend`;
const NOME_DO_BANCO = "ufvet_e2e";
const PORTA_API = 3100;
const PORTA_SITE = 5180;

const deBackend = (modulo) =>
  import(pathToFileURL(path.join(BACKEND, "node_modules", modulo)).href);
const dotenv = (await deBackend("dotenv/dist/index.cjs")).default;
const pg = (await deBackend("pg/lib/index.js")).default;

const doDesenvolvimento = dotenv.parse(readFileSync(`${BACKEND}/.env`));
const url = new URL(doDesenvolvimento.DATABASE_URL);
url.pathname = `/${NOME_DO_BANCO}`;
// Trava: nunca o banco do desenvolvimento nem o dos testes automáticos.
if (
  url.toString() === doDesenvolvimento.DATABASE_URL ||
  url.toString() === doDesenvolvimento.TEST_DATABASE_URL
) {
  throw new Error("Recusado: o banco isolado coincide com outro banco.");
}

const temporaria = (nome) => path.join(os.tmpdir(), nome);
export const AMBIENTE = {
  ...process.env,
  NODE_ENV: "development",
  DATABASE_URL: url.toString(),
  PASTA_ARQUIVOS: temporaria("ufvet-e2e-arquivos"),
  PASTA_EXAMES: temporaria("ufvet-e2e-exames"),
  // Os e-mails viram arquivos nesta pasta (o carteiro sem o script), e os
  // links apontam para o site de teste. EMAIL_SCRIPT_URL vazio: mesmo que o
  // .env tenha o script de verdade, nada sai daqui.
  PASTA_EMAILS: temporaria("ufvet-e2e-emails"),
  ENDERECO_DO_SITE: `http://localhost:${PORTA_SITE}`,
  EMAIL_SCRIPT_URL: "",
  EMAIL_SCRIPT_SEGREDO: "",
  PORTA: String(PORTA_API),
  BASE: `http://localhost:${PORTA_SITE}`,
};

const comando = process.argv[2];

if (comando === "preparar") {
  const administracao = new URL(url);
  administracao.pathname = "/postgres";
  const cliente = new pg.Client({ connectionString: administracao.toString() });
  await cliente.connect();
  await cliente.query(`drop database if exists "${NOME_DO_BANCO}" with (force)`);
  await cliente.query(`create database "${NOME_DO_BANCO}"`);
  await cliente.end();
  for (const pasta of [AMBIENTE.PASTA_ARQUIVOS, AMBIENTE.PASTA_EXAMES, AMBIENTE.PASTA_EMAILS]) {
    rmSync(pasta, { recursive: true, force: true });
    mkdirSync(pasta, { recursive: true });
  }
  const noBackend = (args) =>
    execFileSync(process.execPath, args, {
      cwd: BACKEND,
      env: AMBIENTE,
      stdio: ["ignore", "pipe", "pipe"],
    });
  noBackend([`${BACKEND}/node_modules/prisma/build/index.js`, "migrate", "deploy"]);
  noBackend(["prisma/seed.js"]);
  const saida = noBackend(["prisma/exemplos.js"]).toString();
  console.log(`banco ${NOME_DO_BANCO} pronto; exemplos: ${saida.split("\n").filter((l) => l.startsWith("Criad")).length} contas/animais criados`);
} else if (comando === "limpar") {
  // Apaga o banco isolado e as pastas temporárias ("preparar" recria).
  const administracao = new URL(url);
  administracao.pathname = "/postgres";
  const cliente = new pg.Client({ connectionString: administracao.toString() });
  await cliente.connect();
  await cliente.query(`drop database if exists "${NOME_DO_BANCO}" with (force)`);
  await cliente.end();
  for (const pasta of [AMBIENTE.PASTA_ARQUIVOS, AMBIENTE.PASTA_EXAMES, AMBIENTE.PASTA_EMAILS, temporaria("ufvet-e2e-vite-cache")]) {
    rmSync(pasta, { recursive: true, force: true });
  }
  rmSync(temporaria("ufvet-e2e-vite.config.mjs"), { force: true });
  console.log(`banco ${NOME_DO_BANCO} e pastas temporárias apagados`);
} else if (comando === "api") {
  spawn(process.execPath, ["src/servidor.js"], {
    cwd: BACKEND,
    env: AMBIENTE,
    stdio: "inherit",
  });
} else if (comando === "producao") {
  // A API como no Render: modo de produção, entregando o site montado
  // (frontend/dist) no mesmo endereço, na porta 10123.
  spawn(process.execPath, ["src/servidor.js"], {
    cwd: BACKEND,
    env: { ...AMBIENTE, NODE_ENV: "production", PORTA: "10123" },
    stdio: "inherit",
  });
} else if (comando === "site") {
  // A configuração do Vite do projeto, com a porta e o /api trocados, e um
  // cache próprio, para não disputar o do servidor de desenvolvimento.
  const plugin = pathToFileURL(
    `${FRONTEND}/node_modules/@vitejs/plugin-react/dist/index.js`,
  ).href;
  const config = temporaria("ufvet-e2e-vite.config.mjs");
  writeFileSync(
    config,
    `import react from ${JSON.stringify(plugin)};
export default {
  root: ${JSON.stringify(FRONTEND)},
  cacheDir: ${JSON.stringify(temporaria("ufvet-e2e-vite-cache").replaceAll("\\", "/"))},
  plugins: [react()],
  server: {
    port: ${PORTA_SITE},
    strictPort: true,
    proxy: { "/api": "http://localhost:${PORTA_API}" },
  },
};
`,
  );
  spawn(
    process.execPath,
    [`${FRONTEND}/node_modules/vite/bin/vite.js`, "--config", config],
    { cwd: FRONTEND, env: AMBIENTE, stdio: "inherit" },
  );
} else if (comando === "rodar") {
  const [programa, ...args] = process.argv.slice(3);
  const filho = spawn(programa === "node" ? process.execPath : programa, args, {
    env: AMBIENTE,
    stdio: "inherit",
    shell: programa !== "node",
  });
  filho.on("exit", (codigo) => process.exit(codigo ?? 1));
} else {
  console.log("Uso: node ambiente-e2e.mjs preparar | api | site | rodar <cmd>");
}
