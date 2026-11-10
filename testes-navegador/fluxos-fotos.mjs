// Confere no navegador as fotos: dos animais (cadastrar com fotos, escolher a
// principal, remover, acrescentar, arquivo recusado) e a de perfil.
// Uso: node ambiente-e2e.mjs rodar node fluxos-fotos.mjs  (ver o README)
import { chromium } from "playwright-core";
import { confirmarEEntrarPelaApi } from "./e2e-email.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from "node:url";
const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const IMAGENS = new URL("./imagens-teste/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);
const imagem = (nome) => decodeURIComponent(IMAGENS + nome);
const FOTOS = "capturas/fotos-fotos";
mkdirSync(FOTOS, { recursive: true });

const EMAIL = "fluxo.fotos@example.com";
const SENHA = "senha-do-fluxo";

const navegador = await chromium.launch({ channel: "msedge" });
let falhas = 0;

function conferir(condicao, descricao) {
  console.log(`${condicao ? "OK     " : "FALHOU "} ${descricao}`);
  if (!condicao) falhas++;
}

async function novaPagina(largura = 1280, altura = 900) {
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  const p = await contexto.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  p.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !m.text().startsWith("Failed to load resource") &&
      p.erros.push(m.text()),
  );
  return p;
}

const visivel = (loc) =>
  loc
    .first()
    .waitFor({ timeout: 5000 })
    .then(
      () => true,
      () => false,
    );

const foto = (p, nome, inteira = false) =>
  p.screenshot({ path: `${FOTOS}/${nome}.png`, fullPage: inteira });

function noBackend(codigo) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", codigo], {
    cwd: BACKEND,
    encoding: "utf8",
  });
}

// Apaga a conta de teste pela API, como o site faria, para os arquivos das
// fotos saírem junto (apagar direto no banco deixaria os arquivos).
async function limparContaDeTeste() {
  const contexto = await navegador.newContext();
  const entrou = await contexto.request.post(`${BASE}/api/sessao`, {
    data: { email: EMAIL, senha: SENHA },
  });
  if (entrou.ok()) {
    await contexto.request.delete(`${BASE}/api/conta`, {
      data: { senhaAtual: SENHA },
    });
  }
  await contexto.close();
}

// As fotos guardadas no banco (a tabela arquivo), desde que elas saíram da
// pasta da API.
const arquivosNaPasta = () =>
  Number(
    noBackend(`
      import { banco } from "./src/banco.js";
      console.log(await banco.arquivo.count({ where: { tipo: "FOTO" } }));
      await banco.$disconnect();
    `),
  );

async function criarConta(p) {
  const resposta = await p.context().request.post(`${BASE}/api/usuarios`, {
    data: {
      papel: "TUTOR",
      nomeCompleto: "Fluxo das Fotos",
      email: EMAIL,
      telefone: "(31) 99999-1234",
      cidade: "Viçosa - MG",
      bairro: "Centro",
      senha: SENHA,
      aceiteTermos: true,
      cienciaResponsabilidade: true,
    },
  });
  if (resposta.status() !== 201) {
    throw new Error(`cadastro de teste falhou: ${await resposta.text()}`);
  }
  await confirmarEEntrarPelaApi(p.context(), BASE, EMAIL, SENHA);
}

// A imagem carregou de verdade (não ficou quebrada).
const carregou = (loc) =>
  loc.evaluate((img) => img.complete && img.naturalWidth > 0);

const escolher = (modal, grupo, opcao) =>
  modal
    .getByRole("group", { name: grupo })
    .getByRole("button", { name: opcao, exact: true })
    .click();

await limparContaDeTeste();
const arquivosAntes = arquivosNaPasta();

// 1. Contas de exemplo: retrato e fotos vêm da API
{
  const p = await novaPagina();
  await p.goto(`${BASE}/login?voltar=%2Fmeu-perfil`);
  await p.locator("#email").fill("beatriz@example.com");
  await p.locator("#senha").fill("ufvet-exemplo");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/meu-perfil");
  await p.getByRole("heading", { name: "Zeus" }).waitFor();

  const retrato = p.locator("header img").first();
  conferir(
    (await retrato.getAttribute("src")).startsWith("/api/arquivos/") &&
      (await carregou(retrato)),
    "o retrato da Beatriz vem da API e carrega",
  );
  conferir(
    await visivel(p.getByText("1/3")),
    "o Zeus mostra as 3 fotos, vindas da API",
  );
  const fotoDoZeus = p.getByAltText("Zeus — foto 1");
  conferir(await carregou(fotoDoZeus), "a foto principal do Zeus carrega");
  await foto(p, "1-beatriz");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 2. Cadastrar um animal com fotos
{
  const p = await novaPagina();
  await criarConta(p);
  await p.goto(`${BASE}/meu-perfil`);
  await p.getByText("Cadastrar novo animal").click();
  const modal = p.getByRole("dialog");
  const entrada = p.locator("#animal-fotos");

  // Um GIF é recusado ainda no site.
  await entrada.setInputFiles(imagem("amarela.gif"));
  conferir(
    await visivel(modal.getByText("Envie a foto em JPG, PNG ou WebP.")),
    "GIF é recusado antes de enviar",
  );

  await entrada.setInputFiles([
    imagem("vermelha-com-gps.jpg"),
    imagem("azul.png"),
  ]);
  conferir(
    (await modal.getByAltText(/^Foto \d$/).count()) === 2 &&
      (await visivel(modal.getByText("(2/5)"))),
    "as duas fotos aparecem no formulário (2/5)",
  );
  conferir(
    (await modal.getByText("Envie a foto em JPG, PNG ou WebP.").count()) === 0,
    "escolher fotos boas apaga o aviso do GIF",
  );
  await modal.getByRole("button", { name: "Tornar a foto 2 a principal" }).click();
  const principal = await modal.getByAltText("Foto 1").getAttribute("src");

  await p.locator("#animal-nome").fill("Rex");
  await escolher(modal, "Sexo", "Macho");
  await escolher(modal, "Castrado(a)?", "Sim");
  await p.locator("#animal-nascimento").fill("2022-05-10");
  await p.locator("#animal-peso").fill("30");
  await foto(p, "2-cadastro-com-fotos");
  await modal.getByRole("button", { name: "Cadastrar animal" }).click();
  await modal.waitFor({ state: "detached" });

  conferir(
    await visivel(p.getByText("1/2")),
    "o cartão do Rex mostra as 2 fotos",
  );
  conferir(
    await carregou(p.getByAltText("Rex — foto 1")),
    "a foto principal do Rex carrega",
  );
  // A principal é a azul (a que foi escolhida como principal).
  const cor = await p.getByAltText("Rex — foto 1").evaluate((img) => {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    c.getContext("2d").drawImage(img, 0, 0, 1, 1);
    return Array.from(c.getContext("2d").getImageData(0, 0, 1, 1).data);
  });
  conferir(
    cor[2] > 150 && cor[0] < 80,
    `a principal é a que foi escolhida (cor ${cor.slice(0, 3)})`,
  );
  conferir(principal.startsWith("blob:"), "antes de salvar, a prévia era local");

  await p.reload();
  conferir(
    await visivel(p.getByText("1/2")),
    "recarregando, as 2 fotos continuam",
  );
  conferir(
    arquivosNaPasta() === arquivosAntes + 2,
    "a pasta da API ganhou exatamente 2 arquivos",
  );
  await foto(p, "3-rex-com-fotos");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 3. Editar: remover uma, acrescentar outra; arquivo disfarçado é recusado
{
  const p = await novaPagina();
  await p.goto(`${BASE}/login?voltar=%2Fmeu-perfil`);
  await p.locator("#email").fill(EMAIL);
  await p.locator("#senha").fill(SENHA);
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/meu-perfil");
  await p.getByRole("heading", { name: "Rex" }).waitFor();

  await p.getByRole("button", { name: "Editar Rex" }).click();
  const modal = p.getByRole("dialog");
  conferir(
    (await modal.getByAltText(/^Foto \d$/).count()) === 2,
    "a edição abre com as 2 fotos salvas",
  );

  // Um arquivo de texto com nome de foto passa no site, mas a API recusa.
  await p.locator("#animal-fotos").setInputFiles(imagem("disfarcada.jpg"));
  await modal.getByRole("button", { name: "Salvar alterações" }).click();
  conferir(
    await visivel(modal.getByText("Envie a foto em JPG, PNG ou WebP.")),
    "arquivo disfarçado de foto é recusado pela API, com o aviso no campo",
  );
  await foto(p, "4-disfarcada-recusada");
  conferir(
    arquivosNaPasta() === arquivosAntes + 2,
    "e nada novo fica na pasta",
  );

  await modal.getByRole("button", { name: "Remover a foto 3" }).click();
  await modal.getByRole("button", { name: "Remover a foto 2" }).click();
  await p.locator("#animal-fotos").setInputFiles(imagem("verde.jpg"));
  await modal.getByRole("button", { name: "Salvar alterações" }).click();
  await modal.waitFor({ state: "detached" });
  conferir(
    await visivel(p.getByText("1/2")),
    "depois de remover uma e acrescentar outra, continuam 2",
  );
  conferir(
    arquivosNaPasta() === arquivosAntes + 2,
    "o arquivo da foto removida sai da pasta",
  );
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 4. Foto de perfil
{
  const p = await novaPagina();
  await p.goto(`${BASE}/login?voltar=%2Fconta`);
  await p.locator("#email").fill(EMAIL);
  await p.locator("#senha").fill(SENHA);
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/conta");

  await p
    .getByLabel("Foto de perfil", { exact: true })
    .setInputFiles(imagem("vermelha-com-gps.jpg"));
  conferir(
    await visivel(p.getByText("Foto atualizada")),
    "trocar a foto de perfil confirma na hora",
  );
  conferir(
    (await p.locator("header img").first().getAttribute("src")).startsWith(
      "/api/arquivos/",
    ),
    "o topo passa a mostrar a foto",
  );
  await foto(p, "5-foto-de-perfil");

  await p.getByLabel("Foto de perfil", { exact: true }).setInputFiles(imagem("amarela.gif"));
  conferir(
    await visivel(p.getByText("Envie a foto em JPG, PNG ou WebP.")),
    "GIF na foto de perfil é recusado",
  );

  await p.getByRole("button", { name: "Remover foto de perfil" }).click();
  conferir(
    await visivel(p.getByText("Foto removida")),
    "remover a foto confirma",
  );
  conferir(
    (await p.locator("header img").count()) === 0,
    "o topo volta às iniciais",
  );
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 5. Encerrar a conta leva os arquivos junto
await limparContaDeTeste();
conferir(
  arquivosNaPasta() === arquivosAntes,
  "encerrada a conta de teste, a pasta volta ao que era",
);

await navegador.close();
console.log(
  falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram",
);
process.exitCode = falhas ? 1 : 0;
