// Os exames no navegador, ligados à API: quem vê, quem abre, enviar imagem e
// PDF, e os erros. Fotografa as telas em ./exames. No fim, apaga o que o
// roteiro enviou (resetar-exames.mjs), deixando só os exames de exemplo.
// Uso: node ambiente-e2e.mjs rodar node fluxos-exames.mjs  (ver o README)
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from "node:url";
const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const FOTOS = "capturas/exames";
mkdirSync(FOTOS, { recursive: true });
const INICIO = new Date().toISOString();
// O dia de hoje no horário de Brasília, como o site deve mostrar o envio
// (inclusive à noite, quando em UTC já é o dia seguinte).
const HOJE = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date());

const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${texto}`);
};

async function novaPagina(largura = 1380, altura = 900) {
  const ctx = await nav.newContext({
    viewport: { width: largura, height: altura },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  return p;
}
async function entrar(p, email) {
  await p.goto(`${BASE}/login`);
  await p.getByPlaceholder("seu@email.com").fill(email);
  await p.getByPlaceholder("Sua senha").fill("ufvet-exemplo");
  await p.locator('button[type="submit"]').click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
}
// A seção de exames do animal aberto, e a linha de um documento nela.
const secao = (p) =>
  p.locator("[role=tabpanel]:not([hidden]) section", {
    hasText: "Exames e documentos",
  });
const linha = (p, nome) => secao(p).locator("li", { hasText: nome });
const fotografarSecao = async (p, nome) => {
  await secao(p).scrollIntoViewIfNeeded();
  await secao(p).screenshot({ path: `${FOTOS}/${nome}.png` });
};

let urlDoHemograma;
try {
  // 1. Visitante no perfil da Beatriz, com o Zeus aberto
  {
    const p = await novaPagina();
    await p.goto(`${BASE}/tutor/T3M8P1?animal=Z7R2K4`);
    await secao(p).waitFor();
    conferir(
      await linha(p, "Hemograma completo")
        .getByText("Enviado em 02/03/2026, 2 versões")
        .isVisible(),
      "visitante: vê que o hemograma existe, com 2 versões",
    );
    conferir(
      (await secao(p).getByRole("button", { name: /^Abrir/ }).count()) === 0,
      "visitante: sem botão Abrir",
    );
    conferir(
      await secao(p)
        .getByText("Os arquivos abrem só para o tutor e para os veterinários.")
        .isVisible(),
      "visitante: o aviso diz quem abre os arquivos",
    );
    await fotografarSecao(p, "1-visitante");
    await p.context().close();
  }

  // 2. Beatriz, dona do Zeus
  {
    const p = await novaPagina();
    await entrar(p, "beatriz@example.com");
    await p.goto(`${BASE}/meu-perfil?animal=Z7R2K4`);
    await secao(p).waitFor();
    conferir(
      !(await secao(p).getByText("Os arquivos abrem só").isVisible()),
      "dona: sem o aviso de quem abre",
    );
    await fotografarSecao(p, "2-dona");

    // Abre o hemograma: a imagem, com as duas versões
    await linha(p, "Hemograma completo")
      .getByRole("button", { name: "Abrir hemograma completo" })
      .click();
    const janela = p.getByRole("dialog");
    await janela.locator("img").waitFor();
    await p.waitForTimeout(300);
    conferir(
      await janela
        .locator("img")
        .evaluate((i) => i.complete && i.naturalWidth > 0),
      "dona: o hemograma abre como imagem na janela",
    );
    urlDoHemograma = await janela
      .getByRole("link", { name: "Abrir em nova aba" })
      .getAttribute("href");
    await p.screenshot({ path: `${FOTOS}/3-janela-hemograma.png` });
    await janela.getByRole("button", { name: /10\/10\/2025/ }).click();
    await janela.locator("img").waitFor();
    conferir(
      (await janela
        .getByRole("button", { name: /10\/10\/2025/ })
        .getAttribute("aria-pressed")) === "true",
      "dona: dá para abrir a versão antiga",
    );
    await p.keyboard.press("Escape");

    // Envia um PDF de sorologias
    await linha(p, "Sorologias")
      .locator("input[type=file]")
      .setInputFiles("imagens-teste/sorologia-teste.pdf");
    await p.getByText("Sorologias enviadas").waitFor();
    conferir(true, "dona: o aviso 'Sorologias enviadas' aparece");
    conferir(
      await linha(p, "Sorologias")
        .getByText(`Enviado em ${HOJE}`, { exact: true })
        .isVisible(),
      "dona: a linha das sorologias mostra o envio de hoje",
    );
    conferir(
      await linha(p, "Sorologias")
        .getByRole("button", { name: "Atualizar sorologias" })
        .isVisible(),
      "dona: o botão vira Atualizar",
    );
    // Abre o PDF: na janela, o cartão com "Abrir o PDF" (e um botão só)
    await linha(p, "Sorologias")
      .getByRole("button", { name: "Abrir sorologias" })
      .click();
    const abrirPdf = janela.getByRole("link", { name: "Abrir o PDF" });
    await abrirPdf.waitFor();
    conferir(
      (await janela.getByRole("link", { name: "Abrir em nova aba" }).count()) ===
        0,
      "dona: na janela do PDF, um botão só para abrir",
    );
    await p.screenshot({ path: `${FOTOS}/4-janela-pdf.png` });
    const urlDoPdf = await abrirPdf.getAttribute("href");

    // "Abrir o PDF": a aba nova abre o arquivo direto da API, com o login
    const [aba] = await Promise.all([
      p.context().waitForEvent("page"),
      abrirPdf.click(),
    ]);
    await aba.waitForTimeout(3000);
    await aba.screenshot({ path: `${FOTOS}/5-pdf-em-nova-aba.png` });
    await p.keyboard.press("Escape");
    const direto = await p.context().request.get(`${BASE}${urlDoPdf}`);
    conferir(
      direto.status() === 200 &&
        direto.headers()["content-type"] === "application/pdf",
      `dona: o PDF abre direto pela API (${direto.status()}, ${direto.headers()["content-type"]})`,
    );
    await aba.close();

    // Um arquivo que diz ser PDF, mas não é: a API recusa, na linha
    await linha(p, "Carteira de vacinação")
      .locator("input[type=file]")
      .setInputFiles("imagens-teste/falso.pdf");
    await linha(p, "Carteira de vacinação").getByRole("alert").waitFor();
    conferir(
      (await linha(p, "Carteira de vacinação")
        .getByRole("alert")
        .innerText()).includes("Envie o exame em PDF, JPG, PNG ou WebP."),
      "dona: arquivo disfarçado de PDF é recusado, com a mensagem na linha",
    );
    // Um GIF: o site avisa antes de enviar
    await linha(p, "Hemograma completo")
      .locator("input[type=file]")
      .setInputFiles("imagens-teste/amarela.gif");
    conferir(
      (await linha(p, "Hemograma completo")
        .getByRole("alert")
        .innerText()).includes("Envie o exame em PDF, JPG, PNG ou WebP."),
      "dona: GIF é barrado antes de enviar, com a mensagem na linha",
    );
    await fotografarSecao(p, "6-erros-na-linha");

    // Uma foto de exame com GPS: vira imagem, e o erro da linha some
    await linha(p, "Carteira de vacinação")
      .locator("input[type=file]")
      .setInputFiles("imagens-teste/vermelha-com-gps.jpg");
    await p.getByText("Carteira de vacinação enviada").waitFor();
    conferir(
      (await linha(p, "Carteira de vacinação").getByRole("alert").count()) ===
        0,
      "dona: depois de um envio certo, o erro da linha some",
    );
    conferir(
      await linha(p, "Carteira de vacinação")
        .getByText(`Enviado em ${HOJE}, 2 versões`)
        .isVisible(),
      "dona: a carteira ganha a 2ª versão",
    );
    // Recarregar mantém o que foi enviado (está no banco)
    await p.reload();
    await secao(p).waitFor();
    conferir(
      await linha(p, "Sorologias")
        .getByText(`Enviado em ${HOJE}`, { exact: true })
        .isVisible(),
      "dona: depois de recarregar, as sorologias continuam lá",
    );
    conferir(p.erros.length === 0, `dona: sem erros na página (${p.erros})`);
    await p.context().close();
  }

  // 3. Victor, veterinário, no perfil da Beatriz
  {
    const p = await novaPagina();
    await entrar(p, "victor@example.com");
    await p.goto(`${BASE}/tutor/T3M8P1?animal=Z7R2K4`);
    await secao(p).waitFor();
    conferir(
      (await secao(p).getByRole("button", { name: /^Abrir/ }).count()) === 3,
      "veterinário: abre os três exames do Zeus",
    );
    conferir(
      (await secao(p).locator("input[type=file]").count()) === 0,
      "veterinário: não envia exame no animal de outra pessoa",
    );
    await linha(p, "Sorologias")
      .getByRole("button", { name: "Abrir sorologias" })
      .click();
    await p.getByRole("dialog").getByRole("link", { name: "Abrir o PDF" }).waitFor();
    conferir(true, "veterinário: o PDF enviado pela dona abre");
    await p.context().close();
  }

  // 4. Pedro, outro tutor, no perfil da Beatriz
  {
    const p = await novaPagina();
    await entrar(p, "pedro@example.com");
    await p.goto(`${BASE}/tutor/T3M8P1?animal=Z7R2K4`);
    await secao(p).waitFor();
    conferir(
      (await secao(p).getByRole("button", { name: /^Abrir/ }).count()) === 0,
      "outro tutor: sem botão Abrir",
    );
    // Mesmo com o endereço em mãos, a API recusa e explica
    const direto = await p.context().request.get(`${BASE}${urlDoHemograma}`);
    const corpo = await direto.json();
    conferir(
      direto.status() === 403 &&
        corpo.erro ===
          "Só o tutor do animal e os veterinários abrem os exames.",
      `outro tutor: o endereço direto é recusado (${direto.status()}: ${corpo.erro})`,
    );
    await p.context().close();
  }

  // 5. Celular: a dona abre o PDF (o leitor fica dentro da janela)
  {
    const p = await novaPagina(390, 844);
    await entrar(p, "beatriz@example.com");
    await p.goto(`${BASE}/meu-perfil?animal=Z7R2K4`);
    await secao(p).waitFor();
    await fotografarSecao(p, "7-celular");
    conferir(
      (await p.evaluate(() => document.documentElement.scrollWidth)) === 390,
      "celular: nada passa da largura da tela",
    );
    await p.context().close();
  }
} finally {
  await nav.close();
  console.log(
    execFileSync("node", [`${process.cwd()}/resetar-exames.mjs`, INICIO], {
      cwd: BACKEND,
      encoding: "utf8",
    }).trim(),
  );
}
console.log(
  falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram",
);
