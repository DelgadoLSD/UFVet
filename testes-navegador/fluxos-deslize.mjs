// O deslize do dedo entre as seções, no celular (DeslizeEntreSecoes), com
// toques simulados num navegador de verdade: troca de seção nos dois
// sentidos, a pílula seguindo o dedo, as pontas, e tudo o que fica de fora
// (rolagem, bordas, carrosséis, janelas, páginas internas, formulário
// preenchido, computador). Só lê: nada é gravado.
// Uso: node ambiente-e2e.mjs rodar node fluxos-deslize.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:5173";
const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"}  ${texto}`);
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrir({ email = null, largura = 390, movimento = "no-preference" } = {}) {
  const ctx = await nav.newContext({
    viewport: { width: largura, height: 844 },
    isMobile: largura < 640,
    hasTouch: true,
    locale: "pt-BR",
    reducedMotion: movimento,
  });
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  p.cdp = await ctx.newCDPSession(p);
  if (email) {
    await p.goto(`${BASE}/login`);
    await p.locator("#email").fill(email);
    await p.locator("#senha").fill("ufvet-exemplo");
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  }
  return p;
}

async function ir(p, caminho) {
  await p.goto(`${BASE}${caminho}`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
}

// Um ponto da página onde o deslize pode começar: dentro do <main>, longe
// das bordas, fora de campos, carrosséis e do que rola para o lado.
const pontoLivre = (p, xs = [320, 70]) =>
  p.evaluate((xs) => {
    const x = xs[0];
    for (let y = 140; y < innerHeight - 40; y += 20) {
      const livres = xs.map((xi) => document.elementFromPoint(xi, y));
      if (livres.some((el) => !el || el.closest('input, textarea, select, [data-sem-deslize]'))) continue;
      const el = document.elementFromPoint(x, y);
      if (!el || !el.closest("main")) continue;
      if (el.closest('input, textarea, select, a, button, [data-sem-deslize]')) continue;
      let rola = false;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a).overflowX;
        if (a.scrollWidth > a.clientWidth + 1 && (o === "auto" || o === "scroll")) rola = true;
      }
      if (!rola) return { x, y };
    }
    return null;
  }, xs);

// O dedo: encosta, anda em `passos` e solta (a menos que `soltar` seja false).
async function deslizar(p, de, ate, { passos = 10, intervalo = 16, soltar = true } = {}) {
  const toque = (type, x, y) =>
    p.cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await toque("touchStart", de.x, de.y);
  for (let i = 1; i <= passos; i++) {
    await toque("touchMove", de.x + ((ate.x - de.x) * i) / passos, de.y + ((ate.y - de.y) * i) / passos);
    await esperar(intervalo);
  }
  if (soltar) await toque("touchEnd");
}
const soltar = (p) => p.cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

// Onde está a pílula grande do topo, e as caixas das três seções.
const topo = (p) =>
  p.evaluate(() => {
    const barra = document.querySelector('header nav[aria-label="Seções do site"]');
    const pilula = barra.querySelector("[data-pilula]").getBoundingClientRect();
    const secoes = [...barra.querySelectorAll(":scope > [data-secao]")].map((s) => s.getBoundingClientRect());
    return {
      pilula: { x: pilula.left, largura: pilula.width },
      secoes: secoes.map((s) => ({ x: s.left, largura: s.width })),
      sob: secoes.findIndex((s) => Math.abs(s.left - pilula.left) < 2 && Math.abs(s.width - pilula.width) < 2),
      deslizando: barra.querySelector("[data-pilula]").getAnimations().length,
    };
  });
const caminho = (p) => new URL(p.url()).pathname;
const ficou = async (p, esperado, texto) => {
  await p.waitForTimeout(700);
  conferir(caminho(p) === esperado, `${texto} (ficou em ${caminho(p)})`);
};

try {
  // ─── Logado: troca de seção nos dois sentidos ──────────────────────────────
  {
    const p = await abrir({ email: "beatriz@example.com" });
    await ir(p, "/");
    let ponto = await pontoLivre(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 60, y: ponto.y });
    await p.waitForURL((u) => u.pathname === "/buscar", { timeout: 3000 }).catch(() => {});
    conferir(caminho(p) === "/buscar", "no início, deslizar para a esquerda leva à busca");
    await p.waitForTimeout(80);
    const logoDepois = await topo(p);
    conferir(logoDepois.sob === 1 && logoDepois.deslizando === 0, "a pílula já está na busca, sem deslizar de novo na página nova");

    // A pílula segue o dedo: no meio do arrasto, ela está entre a busca e a conta.
    await p.waitForTimeout(600);
    ponto = await pontoLivre(p);
    const antes = await topo(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 230, y: ponto.y }, { passos: 6, intervalo: 40, soltar: false });
    await p.waitForTimeout(60);
    const meio = await topo(p);
    const [busca, conta] = [antes.secoes[1], antes.secoes[2]];
    conferir(
      meio.pilula.x > busca.x + 2 && meio.pilula.x < conta.x - 2,
      `no meio do arrasto, a pílula está a caminho da conta (x ${Math.round(meio.pilula.x)}, entre ${Math.round(busca.x)} e ${Math.round(conta.x)})`,
    );
    const inclinada = await p.evaluate(() => document.querySelector("main").style.transform);
    conferir(/translateX\(-/.test(inclinada), `e a página se inclina para o lado do dedo (${inclinada})`);
    // Solta devagar, antes de 30% da tela: tudo volta.
    await soltar(p);
    await p.waitForTimeout(500);
    const voltou = await topo(p);
    conferir(caminho(p) === "/buscar" && voltou.sob === 1, "soltando devagar antes de 30% da tela, fica na busca e a pílula volta");
    conferir(
      (await p.evaluate(() => document.querySelector("main").style.transform)) === "",
      "e a página volta ao lugar",
    );

    // Um movimento rápido e curto troca.
    ponto = await pontoLivre(p, [260, 190]);
    await deslizar(p, { x: 260, y: ponto.y }, { x: 190, y: ponto.y }, { passos: 3, intervalo: 0 });
    await p.waitForURL((u) => u.pathname === "/meu-perfil", { timeout: 3000 }).catch(() => {});
    conferir(caminho(p) === "/meu-perfil", "um movimento rápido e curto também troca (busca → perfil)");
    await p.waitForTimeout(600);
    conferir((await p.evaluate(() => scrollY)) === 0, "a página nova abre no topo");

    // Na ponta: o perfil é a última parada.
    ponto = await pontoLivre(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 60, y: ponto.y });
    await ficou(p, "/meu-perfil", "no próprio perfil (a última parada), deslizar para a esquerda não leva a nada");

    // No carrossel dos animais, o dedo fica com o carrossel.
    const carrossel = await p.evaluate(() => {
      const r = document.querySelector("[data-sem-deslize]")?.getBoundingClientRect();
      return r && { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (carrossel && carrossel.y > 0 && carrossel.y < 844) {
      await deslizar(p, { x: 80, y: carrossel.y }, { x: 320, y: carrossel.y });
    } else {
      await p.evaluate(() => document.querySelector("[data-sem-deslize]").scrollIntoView({ block: "center" }));
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const b = document.querySelector("[data-sem-deslize]").getBoundingClientRect();
        return { y: b.top + b.height / 2 };
      });
      await deslizar(p, { x: 80, y: r.y }, { x: 320, y: r.y });
    }
    await ficou(p, "/meu-perfil", "deslizando sobre o carrossel dos animais (para a direita, onde há a busca), a seção não muda");

    // Para a direita: volta à busca.
    await p.evaluate(() => scrollTo(0, 0));
    await p.waitForTimeout(300);
    ponto = await pontoLivre(p);
    await deslizar(p, { x: 70, y: ponto.y }, { x: 330, y: ponto.y });
    await p.waitForURL((u) => u.pathname === "/buscar", { timeout: 3000 }).catch(() => {});
    conferir(caminho(p) === "/buscar", "deslizar para a direita volta à seção anterior (perfil → busca)");

    // Rolagem: um gesto mais para cima que para o lado não troca.
    await p.waitForTimeout(600);
    ponto = await pontoLivre(p, [300, 180]);
    await deslizar(p, { x: 300, y: ponto.y + 150 }, { x: 180, y: ponto.y - 50 });
    await ficou(p, "/buscar", "um gesto mais para cima que para o lado é rolagem: a seção não muda");

    // Borda: começando no canto da tela, fica para o "voltar" do iPhone.
    ponto = await pontoLivre(p);
    await deslizar(p, { x: 10, y: ponto.y }, { x: 300, y: ponto.y });
    await ficou(p, "/buscar", "começando na borda da tela, o deslize fica de fora");

    // O carrossel das afirmações, no início: o dedo troca a afirmação, não a seção.
    await ir(p, "/");
    const afirmacoes = await p.evaluate(() => {
      const el = document.querySelector("[data-sem-deslize]");
      el.scrollIntoView({ block: "center" });
      return true;
    });
    await p.waitForTimeout(400);
    const meioAfirmacoes = await p.evaluate(() => {
      const r = document.querySelector("[data-sem-deslize]").getBoundingClientRect();
      return { y: Math.round(r.top + Math.min(r.height / 2, 120)) };
    });
    const contadorAntes = await p.evaluate(() => document.querySelector("[data-sem-deslize]").parentElement.querySelector("[aria-live]")?.textContent);
    await deslizar(p, { x: 320, y: meioAfirmacoes.y }, { x: 60, y: meioAfirmacoes.y });
    await ficou(p, "/", `deslizando sobre o carrossel das afirmações, a seção não muda${afirmacoes ? "" : ""}`);
    const contadorDepois = await p.evaluate(() => document.querySelector("[data-sem-deslize]")?.parentElement.querySelector("[aria-live]")?.textContent);
    conferir(contadorAntes !== contadorDepois, `e o carrossel passa para a próxima afirmação (${contadorAntes} → ${contadorDepois})`);

    // Página interna: o perfil de outra pessoa.
    await ir(p, "/tutor/T7X9K2");
    ponto = await pontoLivre(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 60, y: ponto.y });
    await ficou(p, "/tutor/T7X9K2", "no perfil aberto pela busca (página interna), o deslize fica desligado");

    // Janela aberta: a edição de um animal.
    await ir(p, "/meu-perfil");
    await p.getByRole("button", { name: /^Editar / }).first().click();
    await p.locator('[aria-modal="true"]').waitFor();
    await deslizar(p, { x: 60, y: 120 }, { x: 320, y: 120 });
    await ficou(p, "/meu-perfil", "com uma janela aberta (deslizando para a direita, onde há a busca), o deslize fica de fora");
    conferir(p.erros.length === 0, `sem erros na página (${p.erros.join("; ")})`);
    await p.context().close();
  }

  // ─── Visitante: Entrar e Cadastre-se como paradas; formulário preenchido ───
  {
    const p = await abrir();
    await ir(p, "/buscar");
    let ponto = await pontoLivre(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 60, y: ponto.y });
    await p.waitForURL((u) => u.pathname === "/login", { timeout: 3000 }).catch(() => {});
    conferir(caminho(p) === "/login", "visitante: da busca, deslizar para a esquerda leva a Entrar");
    await p.waitForTimeout(700);
    const menor = await p.evaluate(() => {
      const m = document.querySelector("[data-pilula-menor]");
      const a = document.querySelector('header a[href="/login"]').getBoundingClientRect();
      const r = m.getBoundingClientRect();
      return { sobEntrar: Math.abs(r.left - a.left) < 2, visivel: getComputedStyle(m).opacity === "1" };
    });
    conferir(menor.sobEntrar && menor.visivel, "e a pílula vermelha menor está em Entrar");

    ponto = await pontoLivre(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 60, y: ponto.y });
    await p.waitForURL((u) => u.pathname === "/cadastrar", { timeout: 3000 }).catch(() => {});
    conferir(caminho(p) === "/cadastrar", "de Entrar, deslizar para a esquerda leva a Cadastre-se");

    // Com algo digitado no cadastro, o deslize não sai da página.
    await p.waitForTimeout(600);
    // A primeira etapa é escolher o papel; os campos vêm na segunda.
    await p.locator("main button").filter({ hasText: /tutor/i }).first().click();
    await p.locator('main input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])').first().fill("Maria");
    await p.locator("main h1, main h2").first().click().catch(() => {});
    ponto = await pontoLivre(p);
    await deslizar(p, { x: 70, y: ponto.y }, { x: 330, y: ponto.y });
    await ficou(p, "/cadastrar", "com algo digitado no cadastro, o deslize não sai da página");

    // Sem nada digitado, sai.
    await ir(p, "/cadastrar");
    ponto = await pontoLivre(p);
    await deslizar(p, { x: 70, y: ponto.y }, { x: 330, y: ponto.y });
    await p.waitForURL((u) => u.pathname === "/login", { timeout: 3000 }).catch(() => {});
    conferir(caminho(p) === "/login", "sem nada digitado, o deslize sai do cadastro (Cadastre-se → Entrar)");
    conferir(
      (await p.evaluate(() => document.documentElement.scrollWidth)) <= 390,
      "nada passa da largura da tela depois dos deslizes",
    );
    conferir(p.erros.length === 0, `sem erros na página (${p.erros.join("; ")})`);
    await p.context().close();
  }

  // ─── Menos movimento: troca sem inclinar a página ──────────────────────────
  {
    const p = await abrir({ email: "beatriz@example.com", movimento: "reduce" });
    await ir(p, "/");
    const ponto = await pontoLivre(p);
    await deslizar(p, { x: 320, y: ponto.y }, { x: 180, y: ponto.y }, { passos: 6, intervalo: 30, soltar: false });
    await p.waitForTimeout(60);
    const inclinada = await p.evaluate(() => document.querySelector("main").style.transform);
    await soltar(p);
    await p.waitForURL((u) => u.pathname === "/buscar", { timeout: 3000 }).catch(() => {});
    conferir(inclinada === "" && caminho(p) === "/buscar", `com "reduzir movimento", troca de seção sem a página se mexer ("${inclinada}")`);
    await p.context().close();
  }

  // ─── No computador, nada muda ──────────────────────────────────────────────
  {
    const p = await abrir({ email: "beatriz@example.com", largura: 1280 });
    await ir(p, "/buscar");
    await deslizar(p, { x: 900, y: 500 }, { x: 300, y: 500 });
    await ficou(p, "/buscar", "numa tela larga, o deslize fica desligado");
    await p.context().close();
  }
} finally {
  await nav.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
