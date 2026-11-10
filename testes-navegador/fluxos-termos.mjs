// A página de termos de uso e privacidade (/termos): os caminhos até ela
// (rodapé e cadastro), o índice, o pulo para um item, o contato certo, a
// letra de leitura, a largura no celular e a acessibilidade (axe-core).
// Uso: node ambiente-e2e.mjs rodar node fluxos-termos.mjs
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
const ITENS = ["o-que-e", "quem-usa", "quem-ve", "compromissos", "doador", "receptor", "veterinarios", "limites", "privacidade", "contato"];

async function abrir(largura) {
  const ctx = await nav.newContext({
    viewport: { width: largura, height: largura < 640 ? 844 : 900 },
    isMobile: largura < 640,
    hasTouch: largura < 640,
    locale: "pt-BR",
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  return p;
}
// Onde o topo de um item está na tela, e a altura do cabeçalho: o título do
// item tem de ficar abaixo dela, para o cabeçalho (que volta ao rolar para
// cima) não o cobrir.
const topoDo = (p, id) =>
  p.evaluate((id) => ({
    topo: Math.round(document.getElementById(id).getBoundingClientRect().top),
    cabecalho: document.querySelector("header").offsetHeight,
  }), id);
const abaixoDoCabecalho = ({ topo, cabecalho }) => topo >= cabecalho - 1 && topo <= cabecalho + 80;

try {
  for (const largura of [1380, 390, 360]) {
    const p = await abrir(largura);
    await p.goto(`${BASE}/termos`);
    await p.evaluate(() => document.fonts.ready);
    const medidas = await p.evaluate((ITENS) => ({
      titulo: document.querySelector("h1")?.textContent,
      itens: ITENS.filter((id) => document.getElementById(id)).length,
      indice: document.querySelectorAll('nav[aria-label="Itens dos termos"] a[href^="#"]').length,
      largura: document.documentElement.scrollWidth,
      // Letra de leitura: todo parágrafo e item de lista do texto com 16 px ou mais.
      pequenos: [...document.querySelectorAll("main p, main li")]
        .filter((el) => el.getClientRects().length && el.textContent.trim().length > 25)
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => el.textContent.trim().slice(0, 40)),
      inventado: document.body.innerText.includes("ufvet.org.br"),
      tempoDeLeitura: /Leitura de|minutos de leitura/i.test(document.querySelector("main").innerText),
      contatoComoTexto:
        document.getElementById("contato").innerText.includes("lucas.delgado@ufv.br") &&
        document.querySelectorAll('#contato a[href^="mailto:"]').length === 0,
      tituloDoItem3: document.getElementById("quem-ve-titulo")?.innerText.replace(/\s+/g, " ").trim(),
      gmail: document.getElementById("privacidade").innerText.includes("saem de uma conta do Gmail"),
      versao: document.querySelector("main").innerText.match(/\(versão (\d+)\)/)?.[1],
      // O CPF só aparece para dizer que não é pedido.
      cpf: [...document.querySelector("main").innerText.matchAll(/[^.]*CPF[^.]*\./g)].map((m) => m[0].trim()),
      degraus: [...document.querySelectorAll("#quem-ve li.rounded-3xl")].map((li) => li.querySelector("p")?.innerText.trim()),
      contato: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute("href")),
    }), ITENS);
    const q = `${largura}px`;
    conferir(medidas.titulo === "Termos de uso e privacidade", `${q}: a página abre com o título`);
    conferir(medidas.itens === 10 && medidas.indice === 10, `${q}: os 10 itens estão lá, e o índice tem os 10 (${medidas.itens}, ${medidas.indice})`);
    conferir(medidas.pequenos.length === 0, `${q}: todo o texto de leitura tem 16 px ou mais (${medidas.pequenos.slice(0, 3).join(" | ")})`);
    conferir(medidas.largura <= largura, `${q}: nada passa da largura da tela (${medidas.largura}px)`);
    conferir(!medidas.tempoDeLeitura, `${q}: sem o tempo de leitura no topo`);
    conferir(medidas.contatoComoTexto, `${q}: no item 10, o e-mail é texto, sem botão`);
    conferir(/Quem vê os seus dados$/.test(medidas.tituloDoItem3 ?? ""), `${q}: o item 3 se chama "Quem vê os seus dados" (${medidas.tituloDoItem3})`);
    conferir(medidas.versao === "6", `${q}: o topo mostra a versão 6 (${medidas.versao})`);
    conferir(medidas.gmail, `${q}: a privacidade diz que os e-mails saem pelo Gmail`);
    conferir(
      medidas.cpf.length === 1 && medidas.cpf[0].startsWith("O UFVet não pede CPF"),
      `${q}: o CPF só aparece para dizer que não é pedido (${medidas.cpf.join(" | ")})`,
    );
    conferir(
      medidas.degraus.join(" > ") === "Qualquer pessoa > Veterinários cadastrados > Tutores com liberação > Ninguém, nem o UFVet",
      `${q}: a escada "Quem vê" tem 4 degraus, sem "Só você" (${medidas.degraus.join(" > ")})`,
    );
    conferir(
      !medidas.inventado && medidas.contato.length > 0 && medidas.contato.every((h) => h === "mailto:lucas.delgado@ufv.br"),
      `${q}: o contato é lucas.delgado@ufv.br em todos os links, e o e-mail inventado sumiu`,
    );

    // O índice leva ao item, logo abaixo do cabeçalho, e o marca.
    await p.locator('nav[aria-label="Itens dos termos"]').getByRole("link", { name: /Privacidade e seus dados/ }).click();
    await p.waitForTimeout(400);
    const topo = await topoDo(p, "privacidade");
    conferir(abaixoDoCabecalho(topo), `${q}: o índice leva à privacidade, logo abaixo do cabeçalho (a ${topo.topo}px do topo; cabeçalho de ${topo.cabecalho}px)`);
    if (largura >= 1024) {
      const marcado = await p.locator('nav[aria-label="Itens dos termos"] a[aria-current="location"]').textContent();
      conferir(/Privacidade/.test(marcado), `${q}: e o índice, parado ao lado, marca o item na tela (${marcado.trim()})`);
    }

    // Acessibilidade: contraste, toque, títulos em ordem, links com nome, listas e imagens.
    await p.goto(`${BASE}/termos`);
    await p.evaluate(() => document.fonts.ready);
    await p.addScriptTag({ path: AXE });
    const problemas = await p.evaluate(async () => {
      const r = await window.axe.run(
        { include: [["main"]], exclude: [['a[aria-label="UFVet, página inicial"]']] },
        { runOnly: { type: "rule", values: ["color-contrast", "target-size", "heading-order", "link-name", "list", "listitem", "image-alt", "region", "landmark-unique"] } },
      );
      return r.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")}`));
    });
    conferir(problemas.length === 0, `${q}: o verificador de acessibilidade não acusa nada (${problemas.slice(0, 4).join("; ")})`);
    conferir(p.erros.length === 0, `${q}: sem erros na página (${p.erros.join("; ")})`);
    await p.context().close();
  }

  // ─── Os caminhos até os termos ─────────────────────────────────────────────
  {
    const p = await abrir(390);
    // Rodapé: termos de uso e política de privacidade.
    await p.goto(`${BASE}/`);
    await p.locator("footer").getByRole("link", { name: "Termos de uso" }).click();
    const foiAosTermos = await p.waitForURL((u) => u.pathname === "/termos", { timeout: 5000 }).then(() => true, () => false);
    conferir(foiAosTermos, "rodapé: Termos de uso abre a página de termos");
    await p.goto(`${BASE}/`);
    await p.locator("footer").getByRole("link", { name: "Política de privacidade" }).click();
    await p.waitForURL((u) => u.pathname === "/termos" && u.hash === "#privacidade", { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(500);
    const topo = await topoDo(p, "privacidade");
    conferir(abaixoDoCabecalho(topo), `rodapé: Política de privacidade abre direto no item 9 (a ${topo.topo}px do topo; cabeçalho de ${topo.cabecalho}px)`);
    conferir(
      (await p.locator("footer").getByRole("link", { name: "lucas.delgado@ufv.br" }).getAttribute("href")) === "mailto:lucas.delgado@ufv.br",
      "rodapé: o contato é o e-mail de verdade",
    );

    // Cadastro: os links da última etapa abrem os termos numa janela por
    // cima do cadastro (em tela cheia, uma aba nova parecia ter trocado a
    // página), e o formulário fica como estava.
    await p.goto(`${BASE}/cadastrar`);
    await p.getByRole("button", { name: /Sou tutor/ }).click();
    await p.locator("#nome-completo").fill("Teste dos Termos");
    await p.locator("#telefone").fill("(31) 99999-4321");
    await p.getByRole("button", { name: "Continuar" }).click();
    await p.locator("#cidade").click();
    await p.waitForSelector('[role="option"]');
    await p.locator("#cidade").fill("vicosa");
    await p.keyboard.press("Enter");
    await p.locator("#bairro").fill("Centro");
    await p.keyboard.press("Enter");
    await p.getByRole("button", { name: "Continuar" }).click();
    await p.locator("#email").fill("teste.termos@example.com");
    await p.locator("#senha").fill("senha-dos-termos");
    const termos = p.locator("label").getByRole("link", { name: /Termos de uso/ });
    const privacidade = p.locator("label").getByRole("link", { name: /Política de privacidade/ });
    conferir(
      (await termos.getAttribute("href")) === "/termos" && (await termos.getAttribute("target")) === null &&
        (await privacidade.getAttribute("href")) === "/termos#privacidade" && (await privacidade.getAttribute("target")) === null &&
        (await termos.getAttribute("aria-haspopup")) === "dialog",
      "cadastro: os links dos termos e da privacidade não abrem outra aba e avisam que abrem uma janela",
    );
    const janela = p.getByRole("dialog", { name: "Termos de uso e privacidade" });
    const [aba] = await Promise.all([
      p.context().waitForEvent("page", { timeout: 1500 }).catch(() => null),
      termos.click(),
    ]);
    await janela.waitFor({ timeout: 5000 }).catch(() => {});
    conferir(
      !aba && (await janela.count()) === 1 && new URL(p.url()).pathname === "/cadastrar",
      "cadastro: Termos de uso abre a janela dos termos, sem aba nova e sem sair do cadastro",
    );
    conferir(
      (await janela.locator("section[id]").count()) === 10 &&
        (await janela.locator("a:not([href^='mailto:'])").count()) === 0,
      "cadastro: a janela tem os termos inteiros, e nenhum link dela leva para fora",
    );
    await p.addScriptTag({ path: AXE });
    const naJanela = await p.evaluate(async () => {
      const r = await window.axe.run(
        { include: [['[role="dialog"]']] },
        { runOnly: { type: "rule", values: ["color-contrast", "target-size", "link-name", "list", "listitem", "aria-dialog-name", "button-name"] } },
      );
      return r.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")}`));
    });
    conferir(naJanela.length === 0, `cadastro: o verificador de acessibilidade não acusa nada na janela (${naJanela.slice(0, 4).join("; ")})`);
    await p.getByRole("button", { name: "Voltar ao cadastro" }).click();
    await janela.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    const ficou = (await p.locator("#senha").count()) && (await p.locator("#senha").inputValue()) === "senha-dos-termos";
    conferir((await janela.count()) === 0 && !!ficou, "cadastro: Voltar ao cadastro fecha a janela, e nada do que foi digitado se perdeu");
    await privacidade.click();
    await janela.waitFor({ timeout: 5000 }).catch(() => {});
    const alturas = await p.evaluate(() => {
      const caixa = document.querySelector('[role="dialog"] .overflow-y-auto').getBoundingClientRect();
      return { caixa: Math.round(caixa.top), item: Math.round(document.getElementById("privacidade").getBoundingClientRect().top) };
    });
    conferir(
      alturas.item >= alturas.caixa && alturas.item <= alturas.caixa + 40,
      `cadastro: Política de privacidade abre a janela já no item 9 (a ${alturas.item - alturas.caixa}px do topo do texto)`,
    );
    await p.keyboard.press("Escape");
    await janela.waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
    conferir((await janela.count()) === 0 && new URL(p.url()).pathname === "/cadastrar", "cadastro: Esc fecha a janela e fica no cadastro");
    conferir(p.erros.length === 0, `sem erros na página (${p.erros.join("; ")})`);
    await p.context().close();
  }

  // ─── Os termos em outros lugares do site ───────────────────────────────────
  {
    const p = await abrir(390);
    // Entrar: a linha dos termos fica no fim do formulário, colada à de
    // "Ainda não tem conta?", com os nomes em vermelho (links), abrindo a
    // janela dos termos, sem sair da página.
    await p.goto(`${BASE}/login`);
    const linha = await p.evaluate(() => {
      const termos = [...document.querySelectorAll("main a")].find((a) => a.textContent.startsWith("Termos de uso"));
      const privacidade = [...document.querySelectorAll("main a")].find((a) => a.textContent.startsWith("Política de privacidade"));
      const conta = [...document.querySelectorAll("main p")].find((p) => p.textContent.startsWith("Ainda não tem conta?"));
      if (!termos || !privacidade || !conta) return null;
      const frase = termos.closest("p");
      return {
        hrefs: [termos.getAttribute("href"), privacidade.getAttribute("href")],
        abas: [termos.target, privacidade.target],
        cores: [getComputedStyle(termos).color, getComputedStyle(privacidade).color],
        frase: frase.textContent.replace(/\s+/g, " ").trim(),
        // Entre os textos, e não entre as caixas: um espaço interno
        // afastaria a frase sem mexer na borda da caixa.
        distancia: (() => {
          const caixaDoTexto = (el, qual) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            const linhas = [...r.getClientRects()].filter((q) => q.height > 0);
            return qual === "primeira" ? linhas[0] : linhas[linhas.length - 1];
          };
          return Math.round(caixaDoTexto(frase, "primeira").top - caixaDoTexto(conta, "ultima").bottom);
        })(),
      };
    });
    conferir(
      !!linha && linha.hrefs[0] === "/termos" && linha.hrefs[1] === "/termos#privacidade" && linha.abas.every((a) => a === ""),
      "entrar: os links Termos de uso e Política de privacidade apontam para os termos, sem abrir outra aba",
    );
    await p.getByRole("link", { name: "Política de privacidade" }).click();
    await p.getByRole("dialog", { name: "Termos de uso e privacidade" }).waitFor({ timeout: 5000 }).catch(() => {});
    conferir(
      (await p.getByRole("button", { name: "Voltar para entrar" }).count()) === 1 && new URL(p.url()).pathname === "/login",
      "entrar: a janela dos termos abre por cima da página de entrar, com a volta para ela",
    );
    await p.getByRole("button", { name: "Voltar para entrar" }).click();
    conferir(
      !!linha && linha.cores.every((c) => c === "rgb(158, 10, 36)"),
      `entrar: os dois nomes ficam em vermelho, como links (${linha?.cores.join(", ")})`,
    );
    conferir(
      !!linha && linha.distancia >= 0 && linha.distancia <= 24 && linha.frase.startsWith("Ao entrar, você concorda com os Termos de uso"),
      `entrar: a frase dos termos fica logo abaixo de "Ainda não tem conta?" (${linha?.distancia}px)`,
    );
    // Cadastro: os termos ficam só na caixa de aceite, sem link solto no fim.
    await p.goto(`${BASE}/cadastrar`);
    await p.getByText("Já tem uma conta?").waitFor();
    conferir(
      (await p.locator("main").getByRole("link", { name: /Termos de uso e privacidade/ }).count()) === 0,
      "cadastro: sem o link solto dos termos no fim da tela",
    );
    await p.goto(`${BASE}/login`);
    await p.locator("#email").fill("beatriz@example.com");
    await p.locator("#senha").fill("ufvet-exemplo");
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await p.waitForURL((u) => !u.pathname.startsWith("/login"));
    await p.goto(`${BASE}/conta`);
    const naConta = p.getByRole("link", { name: "Ler os termos" });
    await naConta.waitFor({ timeout: 10000 }).catch(() => {});
    conferir((await naConta.count()) === 1, "Minha conta: há um bloco com o link para os termos");
    if (await naConta.count()) {
      await naConta.click();
      await p.waitForURL((u) => u.pathname === "/termos", { timeout: 5000 }).catch(() => {});
    }
    conferir(new URL(p.url()).pathname === "/termos", "Minha conta: o link leva aos termos");
    conferir(p.erros.length === 0, `sem erros na página (${p.erros.join("; ")})`);
    await p.context().close();
  }
} finally {
  await nav.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
