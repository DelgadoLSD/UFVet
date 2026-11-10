import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

import { fileURLToPath } from "node:url";
// Várias abas do mesmo navegador, com o mesmo login: sair numa e entrar com
// outra conta muda o login de todas. Confere que as abas acompanham a conta,
// e que uma aba desatualizada não age em nome de outra pessoa.
// Uso: node ambiente-e2e.mjs rodar node fluxos-abas.mjs  (ver o README)

const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const RESETAR = decodeURIComponent(new URL("./resetar-acessos.mjs", import.meta.url).pathname.replace(/^\//, ""));
mkdirSync("capturas/abas", { recursive: true });

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

async function entrar(p, email) {
  await p.goto(`${BASE}/login`);
  await p.getByPlaceholder("seu@email.com").fill(email);
  await p.getByPlaceholder("Sua senha").fill("ufvet-exemplo");
  await p.locator('button[type="submit"]').click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
}
// Sai e entra com outra conta, numa aba já logada (o cookie é de todas).
async function trocarDeConta(p, email) {
  await p.goto(`${BASE}/buscar`);
  await p.getByRole("button", { name: "Mais opções da conta" }).click();
  await p.getByRole("menuitem", { name: "Sair" }).click();
  await p.waitForTimeout(300);
  await entrar(p, email);
}
const contaNoTopo = (p) =>
  p.locator("header").getByRole("link", { name: /Meu perfil/ }).getAttribute("aria-label").catch(() => null);
const faixa = (p) => p.locator('section[aria-label="Acesso aos contatos"]');

try {
  // 1. As abas se avisam: a outra aba passa para a conta nova sozinha
  {
    const ctx = await nav.newContext({ viewport: { width: 1380, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
    const aba1 = await ctx.newPage();
    await entrar(aba1, "beatriz@example.com");
    await aba1.goto(`${BASE}/buscar`);
    await faixa(aba1).getByText("Você ainda não vê os contatos").waitFor();
    const aba2 = await ctx.newPage();
    await trocarDeConta(aba2, "victor@example.com");

    await aba1.getByText("Esta aba passou para a conta de Victor Martins").waitFor({ timeout: 5000 });
    conferir((await contaNoTopo(aba1)) === "Meu perfil (Victor Martins)", "a aba da Beatriz passa sozinha para o Victor, com o aviso");
    conferir(await faixa(aba1).getByText("Você vê todos os contatos").isVisible(), "e a busca já mostra o que vale para o Victor");
    await aba1.screenshot({ path: "capturas/abas/1-aba-acompanhou.png" });

    // Sair numa aba tira a conta da outra também
    await aba2.getByRole("button", { name: "Mais opções da conta" }).click();
    await aba2.getByRole("menuitem", { name: "Sair" }).click();
    await aba1.getByText("Você saiu da conta em outra aba").waitFor({ timeout: 5000 });
    conferir(await faixa(aba1).getByText("Entre para ver os contatos").isVisible(), "sair numa aba deixa a outra como visitante, com o aviso");
    await ctx.close();
  }

  // 2. Sem o aviso entre abas (o canal falhou): voltar para a aba confere
  {
    const ctx = await nav.newContext({ viewport: { width: 1380, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
    await ctx.addInitScript(() => {
      delete window.BroadcastChannel;
    });
    const aba1 = await ctx.newPage();
    await entrar(aba1, "beatriz@example.com");
    await aba1.goto(`${BASE}/buscar`);
    await faixa(aba1).getByText("Você ainda não vê os contatos").waitFor();
    const aba2 = await ctx.newPage();
    await trocarDeConta(aba2, "lucas@example.com");
    await aba1.waitForTimeout(800);
    conferir((await contaNoTopo(aba1)) === "Meu perfil (Beatriz Reis)", "sem o canal, a aba da Beatriz ainda não sabe da troca (o caso que você viu)");
    await aba1.evaluate(() => window.dispatchEvent(new Event("focus")));
    await aba1.getByText("Esta aba passou para a conta de Lucas Delgado").waitFor({ timeout: 5000 });
    conferir(true, "voltando para a aba, ela confere e passa para o Lucas");
    await ctx.close();
  }

  // 3. Sem canal e sem voltar para a aba: a API recusa a ação da aba
  //    desatualizada (uma liberação não sai assinada por outro veterinário)
  {
    const ctx = await nav.newContext({ viewport: { width: 1380, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
    await ctx.addInitScript(() => {
      delete window.BroadcastChannel;
    });
    const aba1 = await ctx.newPage();
    await entrar(aba1, "victor@example.com");
    await aba1.goto(`${BASE}/meu-perfil`);
    const painel = aba1.locator("section", { has: aba1.getByRole("heading", { name: "Acesso aos contatos" }) });
    const pedidoDoLucas = painel.locator("li", { hasText: "Lucas Silva Delgado" });
    await pedidoDoLucas.waitFor();
    const aba2 = await ctx.newPage();
    await trocarDeConta(aba2, "paulo@example.com");

    await pedidoDoLucas.getByRole("button", { name: /Liberar 3 dias/ }).click();
    await aba1.getByText("Esta aba passou para a conta de Paulo Rezende").waitFor({ timeout: 5000 });
    conferir(await aba1.getByText(/a última ação não foi feita/).isVisible(), "a aba do Victor, desatualizada, tenta liberar: nada é feito, e o aviso diz por quê");
    conferir((await contaNoTopo(aba1)) === "Meu perfil (Paulo Rezende)", "e a aba passa para o Paulo");
    await aba1.screenshot({ path: "capturas/abas/2-acao-recusada.png" });
    const { liberacao } = await aba2.evaluate(() => fetch("/api/usuarios/T7X9K2/acesso").then((r) => r.json()));
    conferir(liberacao === null, "o Lucas continua sem liberação: nada saiu assinado pelo Paulo");

    // A tutora com a aba desatualizada: o pedido não sai como veterinário
    await trocarDeConta(aba2, "beatriz@example.com");
    const aba3 = await ctx.newPage();
    await aba3.goto(`${BASE}/buscar`);
    await faixa(aba3).getByRole("button", { name: "Pedir liberação" }).click();
    await aba3.locator("#codigo-vet").fill("V7H4M2");
    await aba3.getByRole("dialog").getByText("CRMV 78120-MG").waitFor();
    await aba3.locator("#caso-pedido").fill("Luna precisa de transfusão hoje");
    await trocarDeConta(aba2, "victor@example.com");
    await aba3.getByRole("button", { name: "Enviar pedido" }).click();
    // A janela era da conta anterior: desde 10/10 ela fecha sozinha quando a
    // aba passa para outra conta (hooks/useModalDaConta.js), e o aviso embaixo
    // da tela diz que a ação não foi feita. A API recusou o pedido (409).
    await aba3.getByText("Esta aba passou para a conta de Victor Martins").waitFor({ timeout: 10000 });
    conferir(
      (await aba3.getByText(/a última ação não foi feita/).isVisible()) &&
        (await aba3.getByRole("dialog").count()) === 0,
      "no pedido de liberação, nada é enviado: a janela da conta anterior fecha e o aviso diz por quê",
    );
    const { pedidos } = await aba3.evaluate(() => fetch("/api/pedidos").then((r) => r.json()));
    conferir(
      !pedidos.some((pedido) => pedido.caso === "Luna precisa de transfusão hoje"),
      "o pedido não chegou ao Victor: nada saiu em nome de outra conta",
    );
    await aba3.screenshot({ path: "capturas/abas/3-pedido-recusado.png" });
    await ctx.close();
  }
} finally {
  await nav.close();
  voltarAosExemplos();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
