// As janelas que sobem de baixo, no celular: fecham arrastadas para baixo
// (pelo topo, ou pelo conteúdo quando ele está no começo da rolagem), voltam
// ao lugar num puxão curto, não fecham quando o dedo só rola o conteúdo, e,
// num formulário, só fecham pelo topo. Tocar fora também fecha. No
// computador, nada disso: sem barrinha, e o Esc fecha na hora.
// Os toques são de verdade (Input.dispatchTouchEvent): tocar, mover e soltar.
// Uso: node ambiente-e2e.mjs rodar node fluxos-janelas.mjs  (ver o README)
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:5173";
const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"}  ${texto}`);
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function entrar(email, largura) {
  const celular = largura < 640;
  const ctx = await nav.newContext({
    viewport: { width: largura, height: 844 },
    isMobile: celular,
    hasTouch: celular,
    deviceScaleFactor: 2,
    locale: "pt-BR",
  });
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  if (email) {
    await p.goto(`${BASE}/login`);
    await p.locator("#email").fill(email);
    await p.locator("#senha").fill("ufvet-exemplo");
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  }
  p.cdp = await ctx.newCDPSession(p);
  return p;
}

// Um arraste com o dedo: toca em (x, y), desce `distancia` px em `passos`
// movimentos ao longo de `duracao` ms e solta.
async function arrastar(p, x, y, distancia, { passos = 12, duracao = 240 } = {}) {
  const toque = (type, yAtual) =>
    p.cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y: yAtual }],
    });
  await toque("touchStart", y);
  for (let i = 1; i <= passos; i++) {
    await pausa(duracao / passos);
    await toque("touchMove", y + (distancia * i) / passos);
  }
  await toque("touchEnd", y + distancia);
}

const janela = (p) => p.getByRole("dialog");
const fechou = (p, ms = 1200) =>
  janela(p).waitFor({ state: "detached", timeout: ms }).then(() => true, () => false);
const caixaDe = (locator) => locator.boundingBox();

// Abre a explicação da validação pelo "?" da faixa do primeiro animal.
async function abrirAjudaDaValidacao(p) {
  const animal = p.locator("[role=tabpanel]:not([hidden])");
  await animal.getByRole("button", { name: "Como funciona a validação?" }).click();
  await janela(p).waitFor();
  await pausa(500); // a janela termina de subir
}

try {
  const p = await entrar("beatriz@example.com", 390);
  await p.goto(`${BASE}/meu-perfil`);
  await p.getByRole("tablist").waitFor();
  await p.evaluate(() => document.fonts.ready);

  // 1. Arrastada pelo topo, a janela fecha
  await abrirAjudaDaValidacao(p);
  conferir(
    await p.locator("[data-topo-da-janela] span.rounded-full").first().isVisible(),
    "no celular, a janela tem a barrinha de arrastar no topo",
  );
  let topo = await caixaDe(p.locator("[data-topo-da-janela]"));
  await arrastar(p, topo.x + topo.width / 2, topo.y + 20, 360);
  conferir(await fechou(p), "arrastada pelo topo para baixo, a janela fecha");

  // 2. Um puxão curto e devagar: volta ao lugar
  await abrirAjudaDaValidacao(p);
  topo = await caixaDe(p.locator("[data-topo-da-janela]"));
  const antes = (await caixaDe(janela(p))).y;
  await arrastar(p, topo.x + topo.width / 2, topo.y + 20, 60, { duracao: 600 });
  await pausa(600);
  const depois = (await caixaDe(janela(p))).y;
  conferir(
    (await janela(p).isVisible()) && Math.abs(depois - antes) < 2,
    `um puxão curto não fecha: a janela volta ao lugar (${Math.round(antes)} → ${Math.round(depois)})`,
  );

  // 3. Pelo conteúdo, no começo da rolagem, também fecha (janela sem campos)
  const corpo = janela(p).locator("div.overflow-y-auto");
  let caixa = await caixaDe(corpo);
  await arrastar(p, caixa.x + caixa.width / 2, caixa.y + 40, 380);
  conferir(await fechou(p), "arrastada pelo conteúdo (no começo da rolagem), a janela de dúvida fecha");

  // 4. Com o conteúdo rolado para baixo, o dedo rola o conteúdo: não fecha
  await abrirAjudaDaValidacao(p);
  await corpo.evaluate((el) => (el.scrollTop = 200));
  caixa = await caixaDe(corpo);
  await arrastar(p, caixa.x + caixa.width / 2, caixa.y + 40, 300);
  await pausa(500);
  conferir(await janela(p).isVisible(), "com o conteúdo rolado, puxar para baixo não fecha a janela");

  // 5. Tocar fora fecha
  await corpo.evaluate((el) => (el.scrollTop = 0));
  const caixaJanela = await caixaDe(janela(p));
  await p.touchscreen.tap(195, Math.max(20, caixaJanela.y - 40));
  conferir(await fechou(p), "tocar fora, acima da janela, fecha");

  // 6. Num formulário (editar o animal), o conteúdo não fecha; o topo sim
  await p.getByRole("button", { name: /^Editar / }).first().click();
  await janela(p).waitFor();
  await pausa(500);
  caixa = await caixaDe(janela(p).locator("div.overflow-y-auto"));
  await arrastar(p, caixa.x + caixa.width / 2, caixa.y + 30, 380);
  await pausa(500);
  conferir(await janela(p).isVisible(), "num formulário, arrastar pelo conteúdo não fecha (o que foi digitado fica)");
  topo = await caixaDe(p.locator("[data-topo-da-janela]"));
  await arrastar(p, topo.x + topo.width / 2, topo.y + 15, 380);
  conferir(await fechou(p), "num formulário, arrastar pela barrinha fecha");

  // 7. O X ainda fecha
  await abrirAjudaDaValidacao(p);
  await janela(p).getByRole("button", { name: "Fechar" }).click();
  conferir(await fechou(p), "o X fecha");
  conferir(p.erros.length === 0, `sem erros na página (${p.erros.join(" | ")})`);
  await p.context().close();

  // 8. No computador: sem barrinha, e o Esc fecha na hora
  const d = await entrar("beatriz@example.com", 1380);
  await d.goto(`${BASE}/meu-perfil`);
  await d.getByRole("tablist").waitFor();
  await abrirAjudaDaValidacao(d);
  conferir(
    !(await d.locator("[data-topo-da-janela] span.rounded-full").first().isVisible()),
    "no computador, a janela não tem a barrinha",
  );
  const inicio = Date.now();
  await d.keyboard.press("Escape");
  const fechouNaHora = await fechou(d, 300);
  conferir(fechouNaHora, `no computador, o Esc fecha na hora (${Date.now() - inicio} ms)`);
  await d.context().close();
} finally {
  await nav.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
