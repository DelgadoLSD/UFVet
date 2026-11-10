// O que entrou depois do teste no iPhone: o topo com a busca em pílula
// também no computador, o "?" novo (24px, que abre a explicação mesmo com a
// seção fechada), os campos de 16px (sem o zoom do iPhone), a faixa de
// acesso e o total da busca no celular, o carrossel sem o aviso de deslizar
// e o contraste dos textos pequenos. Só lê: nada é gravado.
// Uso: node ambiente-e2e.mjs rodar node fluxos-celular-2.mjs  (ver o README)
import { chromium } from "playwright-core";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BASE ?? "http://localhost:5173";
const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"}  ${texto}`);
};
const visivel = (l) => l.first().isVisible().catch(() => false);

async function entrar(email, largura) {
  const celular = largura < 640;
  const ctx = await nav.newContext({
    viewport: { width: largura, height: celular ? 844 : 900 },
    isMobile: celular,
    hasTouch: celular,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
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
  return p;
}

// Campos de digitar visíveis com letra menor que 16px (o iPhone dá zoom).
const camposPequenos = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll("input, textarea, select")]
      .filter((el) => !["checkbox", "radio", "file", "hidden"].includes(el.type) && el.getClientRects().length)
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => el.id || el.getAttribute("aria-label") || el.name || el.tagName),
  );
// Os "?" visíveis menores que 24 x 24.
const ajudasPequenas = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll(".botao-ajuda")]
      .filter((el) => el.getClientRects().length)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width < 24 || r.height < 24).length,
  );
// O que a axe-core acusa de contraste e de alvo pequeno, fora a logo (que,
// como marca, não entra na regra de contraste).
async function axe(p) {
  // A axe-core lê o texto da tela: antes de a fonte dos ícones carregar, a
  // lupa ainda é a palavra "search" e o nome do link pareceria errado.
  await p.evaluate(() => document.fonts.ready);
  await p
    .waitForFunction(() => document.fonts.check('20px "Material Symbols Outlined"'), null, { timeout: 10000 })
    .catch(() => {});
  await p.addScriptTag({ path: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(
      { exclude: [['a[aria-label="UFVet, página inicial"]'], ["footer p.text-3xl"]] },
      { runOnly: { type: "rule", values: ["color-contrast", "target-size"] } },
    );
    return r.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")}`));
  });
}

try {
  // ─── O topo: uma pílula só, com a vermelha embaixo da seção certa ────────
  // Mede a barra, as três seções, as linhas finas e a pílula (sem movimento,
  // para medir já no lugar final). No computador, as seções têm a mesma
  // largura; no celular, a busca é só a lupa e a conta fica com o resto.
  const medirTopo = (p) =>
    p.evaluate(() => {
      const barra = document.querySelector('header nav[aria-label="Seções do site"]');
      const pilula = barra.firstElementChild;
      const secoes = [...barra.querySelectorAll(":scope > [data-secao]")];
      const caixas = secoes.map((s) => s.getBoundingClientRect());
      const vaos = [caixas[1].left - caixas[0].right, caixas[2].left - caixas[1].right];
      // Uma pílula só: a barra tem fundo e é redonda; as seções ficam dentro
      // dela, sem fundo próprio.
      const estiloBarra = getComputedStyle(barra);
      const caixaBarra = barra.getBoundingClientRect();
      const umaPilula =
        estiloBarra.backgroundColor !== "rgba(0, 0, 0, 0)" &&
        parseFloat(estiloBarra.borderTopLeftRadius) >= caixaBarra.height / 2 &&
        secoes.every((s) => getComputedStyle(s).backgroundColor === "rgba(0, 0, 0, 0)") &&
        caixas.every((c) => c.left >= caixaBarra.left && c.right <= caixaBarra.right);
      const caixa = pilula.getBoundingClientRect();
      const sob =
        getComputedStyle(pilula).opacity !== "0"
          ? caixas.findIndex((c) => Math.abs(c.left - caixa.left) < 2 && Math.abs(c.width - caixa.width) < 2)
          : null;
      // As linhas finas: no meio do vão, e visíveis só longe da pílula.
      const linhas = [...barra.querySelectorAll("[data-divisao]")].map((l, i) => {
        const r = l.getBoundingClientRect();
        const meio = (caixas[i].right + caixas[i + 1].left) / 2;
        return { noMeio: Math.abs(r.left + r.width / 2 - meio) <= 1, visivel: getComputedStyle(l).opacity !== "0" };
      });
      // As partes do visitante (Entrar e Cadastre-se) e a pílula menor.
      const entrar = barra.querySelector('a[href="/login"]');
      const cadastrar = barra.querySelector('a[href="/cadastrar"]');
      let partes = null;
      if (entrar && cadastrar) {
        const menor = entrar.parentElement.querySelector(":scope > span");
        const caixaMenor = menor.getBoundingClientRect();
        const sobre = (a) => {
          const c = a.getBoundingClientRect();
          return Math.abs(c.left - caixaMenor.left) < 2 && Math.abs(c.width - caixaMenor.width) < 2;
        };
        // O espaço entre a palavra e as bordas da parte, dos dois lados.
        const folga = (a) => {
          const r = document.createRange();
          r.selectNodeContents(a);
          const palavra = r.getBoundingClientRect();
          const c = a.getBoundingClientRect();
          return [Math.round(palavra.left - c.left), Math.round(c.right - palavra.right)];
        };
        // Um toque 2px abaixo da borda de cima da seção, sobre Entrar.
        const ce = entrar.getBoundingClientRect();
        const tocado = document.elementFromPoint(ce.left + ce.width / 2, caixas[2].top + 2);
        partes = {
          larguras: [Math.round(ce.width), Math.round(cadastrar.getBoundingClientRect().width)],
          folgas: [folga(entrar), folga(cadastrar)],
          sob: getComputedStyle(menor).opacity === "0" ? null : sobre(entrar) ? "entrar" : sobre(cadastrar) ? "cadastrar" : "?",
          toqueNoAlto: entrar.contains(tocado),
        };
      }
      const busca = barra.querySelector('a[aria-label="Buscar doadores"]');
      return {
        larguras: caixas.map((c) => Math.round(c.width)),
        vaos: vaos.map((v) => Math.round(v * 10) / 10),
        umaPilula,
        sob,
        corDaPilula: getComputedStyle(pilula).backgroundColor,
        linhas,
        partes,
        nomeDaBusca: [...busca.querySelectorAll("span:not([aria-hidden])")].some((s) => s.getClientRects().length > 0),
        larguraDaBusca: Math.round(busca.getBoundingClientRect().width),
        cortados: [...barra.querySelectorAll(".truncate")].filter((s) => s.getClientRects().length && s.scrollWidth > s.clientWidth).length,
        larguraPagina: document.documentElement.scrollWidth,
      };
    });
  const iguais = (l) => Math.max(...l) - Math.min(...l) <= 1;

  for (const [largura, email] of [[1380, "beatriz@example.com"], [390, "beatriz@example.com"], [360, "beatriz@example.com"], [1380, null], [390, null], [360, null]]) {
    const p = await entrar(email, largura);
    const celular = largura < 768;
    const quem = `${largura} ${email ? "logado" : "visitante"}`;
    const paginas = email
      ? [["/", 0], ["/buscar", 1], ["/tutor/T7X9K2", 1], ["/meu-perfil", 2], ["/conta", 2]]
      : [["/", 0], ["/buscar", 1], ["/login", 2], ["/cadastrar", 2]];
    const erradas = [];
    const linhasErradas = [];
    const coresErradas = [];
    const partesErradas = [];
    let medidas;
    for (const [caminho, secao] of paginas) {
      await p.goto(`${BASE}${caminho}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(250);
      medidas = await medirTopo(p);
      if (medidas.sob !== secao) erradas.push(`${caminho} (pílula na seção ${medidas.sob})`);
      const linhasVisiveis = [secao !== 0 && secao !== 1, secao !== 1 && secao !== 2];
      if (medidas.linhas.some((l, i) => !l.noMeio || l.visivel !== linhasVisiveis[i])) linhasErradas.push(caminho);
      // Clara só em Entrar e Cadastre-se, onde a vermelha é a menor.
      const clara = caminho === "/login" || caminho === "/cadastrar";
      if ((medidas.corDaPilula === "rgb(158, 10, 36)") === clara) coresErradas.push(`${caminho} (${medidas.corDaPilula})`);
      if (medidas.partes) {
        const esperada = caminho === "/login" ? "entrar" : caminho === "/cadastrar" ? "cadastrar" : null;
        if (medidas.partes.sob !== esperada) partesErradas.push(`${caminho} (pílula menor em ${medidas.partes.sob})`);
      }
    }
    conferir(medidas.umaPilula, `${quem}: as três seções ficam dentro de uma pílula só, sem fundo próprio`);
    if (celular) {
      conferir(
        !medidas.nomeDaBusca && medidas.larguraDaBusca >= 44 && medidas.larguras[2] > medidas.larguras[0],
        `${quem}: a busca é só a lupa (${medidas.larguraDaBusca}px de toque) e a conta fica com o resto (${medidas.larguras.join(", ")}px)`,
      );
    } else {
      conferir(
        iguais(medidas.larguras) && medidas.nomeDaBusca,
        `${quem}: as três seções têm a mesma largura (${medidas.larguras.join(", ")}px), e a busca mostra o nome`,
      );
    }
    conferir(
      medidas.vaos.every((v) => v >= 3 && v <= 8),
      `${quem}: há um vão pequeno entre as seções (${medidas.vaos.join(" e ")}px)`,
    );
    conferir(linhasErradas.length === 0, `${quem}: as linhas finas ficam no meio dos vãos e somem só ao lado da pílula (${linhasErradas.join("; ")})`);
    conferir(coresErradas.length === 0, `${quem}: a pílula é vermelha, e clara só em Entrar e Cadastre-se (${coresErradas.join("; ")})`);
    if (!email) {
      const [fe, fc] = medidas.partes.folgas;
      const mesmaFolga = [fe[1], fc[0], fc[1]].every((f) => Math.abs(f - fe[0]) <= 1);
      conferir(
        celular ? mesmaFolga && fc[0] >= 10 : iguais(medidas.partes.larguras),
        celular
          ? `${quem}: Entrar e Cadastre-se têm a mesma folga dos lados, de 10px ou mais (${fe.join("|")} e ${fc.join("|")}px)`
          : `${quem}: Entrar e Cadastre-se têm metade cada (${medidas.partes.larguras.join(", ")}px)`,
      );
      conferir(partesErradas.length === 0, `${quem}: a pílula vermelha menor fica na parte da página, e some fora delas (${partesErradas.join("; ")})`);
      conferir(medidas.partes.toqueNoAlto, `${quem}: o toque em Entrar vale a altura inteira da seção, não só a da pílula menor`);
    }
    conferir(erradas.length === 0, `${quem}: em cada página, a pílula fica na seção certa (${erradas.join("; ")})`);
    conferir(medidas.cortados === 0 && medidas.larguraPagina <= largura, `${quem}: nada cortado no topo e nada passa da tela`);
    await p.context().close();
  }

  // ─── As pílulas com movimento ────────────────────────────────────────────
  // Na primeira carga, nenhuma desliza nem muda de cor: já nasce no lugar.
  // Do início para Entrar, a grande desliza e a menor só aparece; de Entrar
  // para Cadastre-se, só a menor desliza.
  {
    const comMovimento = async () => {
      const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "pt-BR", reducedMotion: "no-preference" });
      const p = await ctx.newPage();
      await p.addInitScript(() => {
        window.__transicoes = [];
        document.addEventListener(
          "transitionstart",
          (e) => {
            const alvo = e.target;
            if (alvo.tagName !== "SPAN" || alvo.hasAttribute("data-divisao") || alvo.getAttribute("aria-hidden") !== "true") return;
            const qual = alvo.parentElement?.tagName === "NAV" ? "grande" : alvo.parentElement?.querySelector(':scope > a[href="/login"]') ? "menor" : null;
            if (qual) window.__transicoes.push(`${qual}:${e.propertyName}`);
          },
          true,
        );
      });
      return p;
    };
    const transicoes = (p) => p.evaluate(() => [...new Set(window.__transicoes)]);
    const deslizou = (t, qual) => t.includes(`${qual}:transform`);
    for (const caminho of ["/buscar", "/cadastrar"]) {
      const p = await comMovimento();
      await p.goto(`${BASE}${caminho}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(700);
      const t = await transicoes(p);
      conferir(t.length === 0, `na primeira carga de ${caminho}, a pílula já nasce no lugar e na cor certa (${t.join(", ") || "nada mudou"})`);
      await p.context().close();
    }
    const p = await comMovimento();
    await p.goto(`${BASE}/`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(700);
    await p.evaluate(() => (window.__transicoes = []));
    await p.locator("header").getByRole("link", { name: "Entrar" }).click();
    await p.waitForTimeout(700);
    let t = await transicoes(p);
    conferir(
      deslizou(t, "grande") && !deslizou(t, "menor") && t.includes("menor:opacity"),
      `do início para Entrar, a pílula grande desliza e a menor só aparece (${t.join(", ")})`,
    );
    await p.evaluate(() => (window.__transicoes = []));
    await p.locator("header").getByRole("link", { name: "Cadastre-se" }).click();
    await p.waitForTimeout(700);
    t = await transicoes(p);
    conferir(deslizou(t, "menor") && !deslizou(t, "grande"), `de Entrar para Cadastre-se, só a pílula menor desliza (${t.join(", ")})`);
    await p.context().close();
  }

  // ─── Trocar de seção: a página nova no topo, o voltar no lugar, e a busca
  // já vista sem ir de novo à API ─────────────────────────────────────────
  {
    const p = await entrar("beatriz@example.com", 390);
    const pedidos = [];
    p.on("request", (r) => r.url().includes("/api/doadores?") && pedidos.push(r.url()));
    await p.goto(`${BASE}/buscar`);
    await p.getByText(/com esses filtros/).first().waitFor();
    await p.evaluate(() => window.scrollTo(0, 700));
    await p.waitForTimeout(300);
    await p.evaluate(() => window.scrollTo(0, 620));
    await p.waitForTimeout(400);
    const antesDeSair = await p.evaluate(() => scrollY);
    await p.locator("header").getByRole("link", { name: /^Meu perfil/ }).click();
    await p.waitForURL((u) => u.pathname === "/meu-perfil");
    await p.waitForTimeout(150);
    conferir((await p.evaluate(() => scrollY)) === 0, "trocando de seção, a página nova abre no topo");
    const pedidosAntes = pedidos.length;
    // A API passa a demorar 1,5 s: a busca já vista tem de aparecer antes.
    await p.route(/\/api\/doadores\?/, async (rota) => {
      await new Promise((r) => setTimeout(r, 1500));
      await rota.continue();
    });
    await p.goBack();
    await p.waitForURL((u) => u.pathname === "/buscar");
    await p.waitForTimeout(150);
    const voltou = await p.evaluate(() => scrollY);
    conferir(Math.abs(voltou - antesDeSair) <= 2, `voltando pelo navegador, a busca fica na altura em que estava (${voltou} de ${antesDeSair}px)`);
    conferir(
      (await p.getByRole("status").filter({ hasText: "Buscando doadores" }).count()) === 0 &&
        (await p.getByText(/com esses filtros/).first().isVisible()),
      "a busca já vista aparece na hora (com a API demorando 1,5 s), sem os cartões de espera",
    );
    conferir(pedidos.length > pedidosAntes, "e confere a API por trás, para trazer o que mudou");
    await p.context().close();
  }

  // ─── O topo para o leitor de tela e o teclado ───────────────────────────
  {
    const p = await entrar("beatriz@example.com", 1380);
    await p.goto(`${BASE}/tutor/T7X9K2`);
    await p.getByRole("tablist").waitFor();
    const topo = p.locator("header");
    conferir(
      (await topo.getByRole("navigation", { name: "Seções do site" }).count()) === 1 &&
        (await topo.getByRole("link", { name: "Buscar doadores" }).getAttribute("aria-current")) === "true" &&
        (await topo.getByRole("link", { name: "UFVet, página inicial" }).getAttribute("aria-current")) === null,
      "no perfil aberto pela busca, a seção da busca é a atual (aria-current)",
    );
    await p.goto(`${BASE}/buscar`);
    conferir(
      (await topo.getByRole("link", { name: "Buscar doadores" }).getAttribute("aria-current")) === "page",
      "na busca, o link da busca é a página atual",
    );
    // A ordem do Tab: a logo, a busca, o perfil e a setinha da conta.
    await p.locator("body").focus();
    const ordem = [];
    for (let i = 0; i < 4; i++) {
      await p.keyboard.press("Tab");
      ordem.push(await p.evaluate(() => document.activeElement.getAttribute("aria-label")));
    }
    conferir(
      JSON.stringify(ordem) === JSON.stringify(["UFVet, página inicial", "Buscar doadores", "Meu perfil (Beatriz Reis)", "Mais opções da conta"]),
      `o Tab passa pela logo, pela busca, pelo perfil e pela setinha (${ordem.join(" > ")})`,
    );
    await topo.getByRole("button", { name: "Mais opções da conta" }).click();
    conferir(
      (await visivel(p.getByRole("menuitem", { name: "Minha conta" }))) &&
        (await visivel(p.getByRole("menuitem", { name: "Sair" }))),
      "a setinha abre Minha conta e Sair",
    );
    await p.keyboard.press("Escape");
    await topo.getByRole("link", { name: "Meu perfil (Beatriz Reis)" }).click();
    await p.waitForURL((u) => u.pathname === "/meu-perfil");
    conferir(true, "a foto leva ao próprio perfil");
    await p.context().close();
  }

  // ─── O carrossel responde logo ao deslize ─────────────────────────────────
  // Um deslize de trackpad (o gesto de toque simulado não rola a faixa neste
  // navegador de teste): o cartão novo tem de ficar vermelho em até 200 ms
  // depois de o gesto acabar, e virar o escolhido logo em seguida.
  {
    const p = await entrar(null, 390);
    await p.goto(`${BASE}/tutor/T5W2K6`);
    const faixa = p.getByRole("tablist").locator("..");
    await faixa.waitFor();
    await p.evaluate(() => document.fonts.ready);
    await faixa.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 150));
    await p.waitForTimeout(500);
    const alvo = await p.evaluate(() => [...document.querySelectorAll("[role=tab]")][1].dataset.codigo);
    await p.evaluate((alvo) => {
      window.__marcas = { inicio: performance.now() };
      const aba = document.querySelector(`[data-codigo="${alvo}"]`);
      const passo = () => {
        const agora = performance.now() - window.__marcas.inicio;
        if (!window.__marcas.vermelho && getComputedStyle(aba).backgroundColor === "rgb(158, 10, 36)") window.__marcas.vermelho = agora;
        if (!window.__marcas.escolhido && aba.getAttribute("aria-selected") === "true") window.__marcas.escolhido = agora;
        if (!window.__marcas.vermelho || !window.__marcas.escolhido) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, alvo);
    const caixa = await faixa.boundingBox();
    const cdp = await p.context().newCDPSession(p);
    await cdp.send("Input.synthesizeScrollGesture", {
      x: Math.round(caixa.x + caixa.width / 2),
      y: Math.round(caixa.y + caixa.height / 2),
      xDistance: -170,
      yDistance: 0,
      gestureSourceType: "mouse",
      speed: 900,
    });
    const fim = await p.evaluate(() => performance.now() - window.__marcas.inicio);
    await p.waitForFunction(() => window.__marcas.vermelho && window.__marcas.escolhido, null, { timeout: 5000 }).catch(() => {});
    const m = await p.evaluate(() => window.__marcas);
    const vermelho = m.vermelho ? Math.round(m.vermelho - fim) : null;
    const escolhido = m.escolhido ? Math.round(m.escolhido - fim) : null;
    conferir(
      vermelho !== null && vermelho <= 200,
      `carrossel: o cartão novo fica vermelho ${vermelho ?? "?"} ms depois do deslize (até 200)`,
    );
    conferir(
      escolhido !== null && escolhido <= 400,
      `carrossel: e vira o escolhido ${escolhido ?? "?"} ms depois (até 400)`,
    );
    await p.context().close();
  }

  // ─── Celular: o "?" e o perfil ──────────────────────────────────────────
  {
    const p = await entrar("beatriz@example.com", 390);
    await p.goto(`${BASE}/meu-perfil`);
    await p.getByRole("tablist").waitFor();
    await p.evaluate(() => document.fonts.ready);
    const animal = p.locator("[role=tabpanel]:not([hidden])");
    const validacao = animal.getByRole("button", { name: "Validação veterinária", exact: true });
    conferir((await validacao.getAttribute("aria-expanded")) === "false", "a validação começa fechada");
    await animal.getByRole("button", { name: "Como funciona a validação?" }).click();
    conferir(
      await visivel(p.getByRole("dialog", { name: "Como funciona a validação" })),
      "com a seção fechada, o ? da validação abre a explicação",
    );
    await p.keyboard.press("Escape");
    conferir(
      (await validacao.getAttribute("aria-expanded")) === "false",
      "e a seção continua fechada",
    );
    conferir((await ajudasPequenas(p)) === 0, "todo ? visível tem pelo menos 24 x 24");
    conferir(
      (await p.getByText(/Deslize para o lado/).count()) === 0,
      "o carrossel não tem mais o aviso de deslizar",
    );
    const pontos = await p.evaluate(() =>
      [...document.querySelectorAll('button[aria-label^="Ir para foto"]')]
        .filter((b) => b.getClientRects().length)
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.width < 24 || r.height < 24).length,
    );
    conferir(pontos === 0, "as bolinhas das fotos têm 24 x 24 para o dedo");
    const problemas = await axe(p);
    conferir(problemas.length === 0, `perfil: sem problema de contraste nem de alvo pequeno (${problemas.slice(0, 3).join(" | ")})`);

    // Campos de 16px nas janelas de editar o animal
    await p.getByRole("button", { name: /^Editar / }).first().click();
    await p.getByRole("dialog").waitFor();
    const noAnimal = await camposPequenos(p);
    conferir(noAnimal.length === 0, `editar animal: todos os campos com 16px ou mais (${noAnimal.join(", ")})`);
    await p.keyboard.press("Escape");

    // A busca
    await p.goto(`${BASE}/buscar`);
    await p.getByText(/com esses filtros/).first().waitFor();
    const naBusca = await camposPequenos(p);
    conferir(naBusca.length === 0, `busca: o campo de busca tem 16px ou mais (${naBusca.join(", ")})`);
    const total = await p.locator("p[aria-live=polite]").evaluate((el) => getComputedStyle(el).textAlign);
    const ordem = await p.getByRole("combobox", { name: /^Ordenar por/ }).evaluate((b) => {
      const r = b.getBoundingClientRect();
      return Math.abs(r.left + r.width / 2 - innerWidth / 2);
    });
    conferir(total === "center" && ordem <= 4, `busca: o total e o "Ordenar por" ficam no meio (texto ${total}, botão a ${Math.round(ordem)}px do centro)`);
    const larguras = await p.getByRole("region", { name: "Acesso aos contatos" }).evaluate((s) => {
      const estilo = getComputedStyle(s);
      const interna = s.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const botao = [...s.querySelectorAll("button")].find((b) => b.innerText.includes("Pedir liberação"));
      return { interna: Math.round(interna), botao: Math.round(botao.getBoundingClientRect().width) };
    });
    conferir(
      Math.abs(larguras.botao - larguras.interna) <= 1,
      `busca: Pedir liberação ocupa a largura do bloco (${larguras.botao} de ${larguras.interna}px)`,
    );
    const naBuscaAxe = await axe(p);
    conferir(naBuscaAxe.length === 0, `busca: sem problema de contraste nem de alvo pequeno (${naBuscaAxe.slice(0, 3).join(" | ")})`);
    conferir(p.erros.length === 0, `sem erros na página (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // ─── Celular: os campos do veterinário (validação e observação) ─────────
  {
    const p = await entrar("victor@example.com", 390);
    await p.goto(`${BASE}/tutor/T3M8P1?animal=Z7R2K4`);
    await p.getByRole("tablist").waitFor();
    const animal = p.locator("[role=tabpanel]:not([hidden])");
    await animal.getByRole("button", { name: "Validação veterinária", exact: true }).click();
    await animal.getByRole("button", { name: "Renovar validação" }).click();
    await p.getByRole("dialog").waitFor();
    const naValidacao = await camposPequenos(p);
    conferir(naValidacao.length === 0, `validar: a nota tem 16px ou mais (${naValidacao.join(", ")})`);
    await p.keyboard.press("Escape");
    await animal.getByRole("button", { name: "Observações para a coleta", exact: true }).click();
    await animal.getByRole("button", { name: "Adicionar observação" }).click();
    const naObservacao = await camposPequenos(p);
    conferir(naObservacao.length === 0, `observação: o campo tem 16px ou mais (${naObservacao.join(", ")})`);
    await p.context().close();
  }

  // ─── Celular: entrar e criar conta ──────────────────────────────────────
  {
    const p = await entrar(null, 390);
    await p.goto(`${BASE}/login`);
    const noLogin = await camposPequenos(p);
    await p.goto(`${BASE}/cadastrar`);
    await p.waitForTimeout(400);
    const noCadastro = await camposPequenos(p);
    conferir(
      noLogin.length === 0 && noCadastro.length === 0,
      `entrar e criar conta: campos com 16px ou mais (${[...noLogin, ...noCadastro].join(", ")})`,
    );
    await p.context().close();
  }
} finally {
  await nav.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
