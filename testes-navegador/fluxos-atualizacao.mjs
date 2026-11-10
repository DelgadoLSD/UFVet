import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

import { fileURLToPath } from "node:url";
// A resposta do veterinário chega à tela do tutor sem recarregar, e o botão
// de cadastrar animal fica à vista no topo de "Meus animais".
// Uso: node ambiente-e2e.mjs rodar node fluxos-atualizacao.mjs  (ver o README)

const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const RESETAR = decodeURIComponent(new URL("./resetar-acessos.mjs", import.meta.url).pathname.replace(/^\//, ""));
const FOTOS = "capturas/atualizacao";
mkdirSync(FOTOS, { recursive: true });

function voltarAosExemplos() {
  execSync(`node "${RESETAR}"`, { cwd: BACKEND, stdio: "ignore" });
  execSync("npm run db:exemplos", { cwd: BACKEND, stdio: "ignore" });
}
voltarAosExemplos();

const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK  " : "FALHA"}  ${texto}`);
};

async function entrar(email, largura = 1380, altura = 900) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: altura }, locale: "pt-BR", reducedMotion: "reduce" });
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  await p.goto(`${BASE}/login`);
  await p.getByPlaceholder("seu@email.com").fill(email);
  await p.getByPlaceholder("Sua senha").fill("ufvet-exemplo");
  await p.locator('button[type="submit"]').click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  return p;
}
const faixa = (p) => p.locator('section[aria-label="Acesso aos contatos"]');
const painel = (p) => p.locator("section", { has: p.getByRole("heading", { name: "Acesso aos contatos" }) });
// Simula a pessoa voltando para a aba do site.
const voltarParaAba = (p) => p.evaluate(() => window.dispatchEvent(new Event("focus")));

try {
  // 1. A Beatriz pede e fica esperando na busca; o Victor libera noutra janela
  const beatriz = await entrar("beatriz@example.com");
  await beatriz.goto(`${BASE}/buscar`);
  await faixa(beatriz).getByRole("button", { name: "Pedir liberação" }).click();
  await beatriz.locator("#codigo-vet").fill("V7H4M2");
  await beatriz.getByRole("dialog").getByText("CRMV 78120-MG").waitFor();
  await beatriz.locator("#caso-pedido").fill("Luna precisa de transfusão hoje");
  await beatriz.getByRole("button", { name: "Enviar pedido" }).click();
  await faixa(beatriz).getByText("Pedido enviado para Dr. Victor").waitFor();

  const victor = await entrar("victor@example.com");
  await victor.goto(`${BASE}/meu-perfil`);
  await painel(victor).locator("li", { hasText: "Beatriz dos Reis" }).getByRole("button", { name: /Liberar 3 dias/ }).click();
  await victor.getByText("Acesso liberado para Beatriz").waitFor();

  const inicio = Date.now();
  await faixa(beatriz).getByText("Contatos liberados").waitFor({ timeout: 25000 });
  const segundos = Math.round((Date.now() - inicio) / 1000);
  conferir(segundos <= 20, `sem recarregar, a busca da Beatriz passa a "Contatos liberados" (${segundos} s depois)`);
  conferir(await beatriz.getByText("Dr. Victor liberou seu acesso aos contatos").isVisible(), "e o aviso embaixo diz quem liberou");
  await beatriz.screenshot({ path: `${FOTOS}/1-liberado-sem-recarregar.png` });

  // 2. O Victor encerra; a Beatriz volta para a aba e vê na hora
  await painel(victor).locator("li", { hasText: "Beatriz dos Reis" }).getByRole("button", { name: "Encerrar" }).click();
  await victor.getByText("Acesso de Beatriz encerrado").waitFor();
  await voltarParaAba(beatriz);
  await faixa(beatriz).getByText("Você ainda não vê os contatos").waitFor({ timeout: 5000 });
  conferir(await beatriz.getByText("Seu acesso aos contatos terminou").isVisible(), "voltando para a aba, a Beatriz vê na hora que o acesso terminou");

  // 3. Um pedido novo chega ao painel do Victor sem ele recarregar
  await faixa(beatriz).getByRole("button", { name: "Pedir liberação" }).click();
  await beatriz.locator("#codigo-vet").fill("V7H4M2");
  await beatriz.getByRole("dialog").getByText("CRMV 78120-MG").waitFor();
  await beatriz.locator("#caso-pedido").fill("Luna, segunda transfusão");
  await beatriz.getByRole("button", { name: "Enviar pedido" }).click();
  await faixa(beatriz).getByText("Pedido enviado para Dr. Victor").waitFor();
  await voltarParaAba(victor);
  await painel(victor).getByText("Luna, segunda transfusão").waitFor({ timeout: 5000 });
  conferir(true, "o pedido novo aparece no painel do Victor ao voltar para a aba");

  // 4. O Victor recusa; a Beatriz fica sabendo
  await painel(victor).locator("li", { hasText: "Beatriz dos Reis" }).getByRole("button", { name: "Recusar" }).click();
  await victor.getByText("Pedido de Beatriz recusado").waitFor();
  await voltarParaAba(beatriz);
  await beatriz.getByText("Dr. Victor recusou seu pedido").waitFor({ timeout: 5000 });
  conferir(await faixa(beatriz).getByText("Você ainda não vê os contatos").isVisible(), "a recusa chega à Beatriz, que pode pedir de novo");
  await beatriz.screenshot({ path: `${FOTOS}/2-recusado.png` });
  conferir(beatriz.erros.length === 0 && victor.erros.length === 0, "sem erros no console");
  await beatriz.context().close();
  await victor.context().close();

  // 5. O botão de cadastrar à vista, com muitos animais (Pedro, 4)
  for (const [largura, altura, onde] of [[1380, 900, "computador"], [390, 844, "celular"]]) {
    const pedro = await entrar("pedro@example.com", largura, altura);
    await pedro.goto(`${BASE}/meu-perfil`);
    await pedro.getByRole("tablist").waitFor();
    // O cartão de cadastrar é a primeira aba do carrossel (a seta só anda
    // até ele; tocar no cartão abre o cadastro).
    const botao = pedro.getByRole("tab", { name: "Cadastrar animal", exact: true });
    await botao.scrollIntoViewIfNeeded();
    const dentro = await botao.evaluate((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
    conferir((await botao.count()) === 1 && dentro, `no ${onde}, com 4 animais, o cartão "Cadastrar animal" fica inteiro à vista`);
    await pedro.screenshot({ path: `${FOTOS}/3-cadastrar-${onde}.png` });
    await botao.click();
    await pedro.getByRole("dialog").getByRole("button", { name: "Cadastrar animal" }).waitFor();
    conferir(true, `no ${onde}, o botão abre o cadastro`);
    await pedro.context().close();
  }
} finally {
  await nav.close();
  voltarAosExemplos();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
