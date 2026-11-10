// As seções que abrem e fecham no celular (perfil, cartão do animal, painel do
// veterinário), os botões que no celular saem da faixa e vão para o conteúdo,
// o "Mostrar/Ocultar" dos filtros e a foto da página da conta. No computador,
// confere que nada disso aparece: os painéis ficam abertos, com as ações na
// faixa. Só lê: nada é gravado (as janelas abertas fecham sem salvar).
// Uso: node ambiente-e2e.mjs rodar node fluxos-celular.mjs  (ver o README)
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:5173";
const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK    " : "FALHOU"}  ${texto}`);
};
const visivel = (l) => l.first().isVisible().catch(() => false);
const aberto = async (botao) => (await botao.getAttribute("aria-expanded")) === "true";

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
  p.on("console", (m) => m.type() === "error" && p.erros.push(m.text()));
  await p.goto(`${BASE}/login?voltar=%2Fmeu-perfil`);
  await p.locator("#email").fill(email);
  await p.locator("#senha").fill("ufvet-exemplo");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/meu-perfil");
  await p.getByRole("tablist").waitFor();
  await p.evaluate(() => document.fonts.ready);
  return p;
}

// A faixa de uma seção (o botão que abre e fecha) e a seção inteira.
const faixa = (escopo, titulo) =>
  escopo.getByRole("button", { name: titulo, exact: true });
// O "has" procura dentro de cada seção: o botão vem da página, sem o escopo
// na frente (senão ele procuraria o cartão dentro da seção).
const paginaDe = (escopo) => (escopo.page ? escopo.page() : escopo);
const secao = (escopo, titulo) =>
  escopo
    .locator("section", { has: faixa(paginaDe(escopo), titulo) })
    .last();
const cartaoAberto = (p) => p.locator("[role=tabpanel]:not([hidden])");
const cabe = async (p, largura) =>
  (await p.evaluate(() => document.documentElement.scrollWidth)) <= largura;

try {
  // ─── 1. Celular: a tutora no próprio perfil ─────────────────────────────
  {
    const p = await entrar("beatriz@example.com", 390);
    const contato = faixa(p, "Contato");
    const local = faixa(p, "Localização");
    conferir(
      !(await aberto(contato)) && !(await aberto(local)),
      "no próprio perfil, Contato e Localização começam fechados",
    );
    conferir(
      await visivel(secao(p, "Contato").getByText(/^\(\d{2}\) \d{5}-\d{4}$/)),
      "fechado, o Contato mostra o telefone na faixa",
    );
    conferir(
      (await visivel(secao(p, "Localização").getByText("Ramos, Viçosa - MG"))) &&
        !(await visivel(secao(p, "Localização").getByText("Bairro", { exact: true }))),
      "fechada, a Localização mostra bairro e cidade numa linha, sem a ficha",
    );
    await local.click();
    conferir(
      (await aberto(local)) &&
        (await visivel(secao(p, "Localização").getByText("Bairro", { exact: true }))) &&
        (await visivel(secao(p, "Localização").getByText(/^Ocultar/))),
      "tocar na faixa abre a ficha, e a faixa passa a dizer Ocultar",
    );
    await local.click();
    conferir(!(await aberto(local)), "tocar de novo fecha");

    const animal = cartaoAberto(p);
    const validacao = faixa(animal, "Validação veterinária");
    const obs = faixa(animal, "Observações para a coleta");
    const exames = faixa(animal, "Exames e documentos");
    conferir(
      !(await aberto(validacao)) && !(await aberto(obs)) && !(await aberto(exames)),
      "no cartão do animal, validação, observações e exames começam fechados",
    );
    conferir(
      (await visivel(secao(animal, "Validação veterinária").getByText("Validação vencida"))) &&
        (await visivel(secao(animal, "Observações para a coleta").getByText(/^\d+ observaç(ão|ões)$|^Nenhuma registrada ainda$/))) &&
        (await visivel(secao(animal, "Exames e documentos").getByText(/^\d de 3 enviados$|^Nenhum enviado ainda$/))),
      "cada faixa fechada diz o que tem dentro (vencida, observações, exames enviados)",
    );

    // O "?" da faixa abre a explicação dele, sem abrir a seção.
    await secao(animal, "Exames e documentos")
      .getByRole("button", { name: /^Entenda/ })
      .click();
    conferir(
      (await visivel(p.getByRole("tooltip"))) && !(await aberto(exames)),
      "o ? da faixa abre a explicação e não abre a seção",
    );
    await p.keyboard.press("Escape");
    await p.mouse.click(5, 300);

    await exames.click();
    conferir(
      (await aberto(exames)) &&
        (await visivel(secao(animal, "Exames e documentos").getByText("Hemograma completo"))),
      "aberta, a seção de exames mostra as linhas",
    );
    conferir(await cabe(p, 390), "nada passa da largura da tela (390)");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // ─── 2. Celular: o veterinário no próprio perfil ────────────────────────
  {
    const p = await entrar("victor@example.com", 390);
    const registro = faixa(p, "Registro profissional");
    conferir(
      !(await aberto(registro)) &&
        (await visivel(secao(p, "Registro profissional").getByText(/^CRMV 78120-MG, /))),
      "o Registro profissional começa fechado, com o CRMV na faixa",
    );
    const acesso = faixa(p, "Acesso aos contatos");
    const painel = p.locator("section", { has: acesso });
    const temPedido = await visivel(painel.getByText(/^\d+ pedidos? esperando$/));
    conferir(
      !(await aberto(acesso)) &&
        !(await visivel(painel.getByRole("button", { name: "Liberar acesso" }))),
      "o painel de acesso começa fechado, sem o botão de liberar",
    );
    conferir(temPedido, "fechado, o painel avisa do pedido esperando, em etiqueta");
    await acesso.click();
    conferir(
      (await aberto(acesso)) &&
        (await visivel(painel.getByRole("button", { name: "Liberar acesso" }))) &&
        (await visivel(painel.getByRole("button", { name: "Recusar" }))),
      "aberto, aparecem Liberar acesso e o pedido, com Recusar",
    );
    await painel
      .getByRole("button", { name: "Como funciona o acesso aos contatos?" })
      .click();
    conferir(
      (await visivel(p.getByRole("dialog"))) && (await aberto(acesso)),
      "o ? do painel abre a explicação sem fechar o painel",
    );
    await p.keyboard.press("Escape");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // ─── 3. Celular: o veterinário visita a tutora ──────────────────────────
  {
    const p = await entrar("victor@example.com", 390);
    await p.goto(`${BASE}/tutor/T3M8P1?animal=Z7R2K4`);
    await p.getByRole("tablist").waitFor();
    const contato = faixa(p, "Contato");
    conferir(
      (await aberto(contato)) &&
        (await visivel(p.getByRole("button", { name: "Ver contato" }))),
      "no perfil de outra pessoa, o Contato já vem aberto, com Ver contato",
    );
    conferir(
      !(await aberto(faixa(p, "Localização"))),
      "e a Localização vem fechada",
    );

    const animal = cartaoAberto(p);
    const validacao = faixa(animal, "Validação veterinária");
    const renovar = animal.getByRole("button", { name: "Renovar validação" });
    conferir(!(await visivel(renovar)), "fechada a validação, o botão de renovar não aparece");
    await validacao.click();
    const larguraBotao = await renovar.evaluate((b) => b.getBoundingClientRect().width);
    const larguraSecao = await secao(animal, "Validação veterinária").evaluate(
      (s) => s.getBoundingClientRect().width,
    );
    conferir(
      larguraBotao >= larguraSecao - 40,
      `aberta, Renovar validação fica no conteúdo, na largura toda (${Math.round(larguraBotao)} de ${Math.round(larguraSecao)} px)`,
    );
    await renovar.click();
    conferir(await visivel(p.getByRole("dialog")), "e abre a janela da validação");
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "detached" });

    await faixa(animal, "Observações para a coleta").click();
    await animal.getByRole("button", { name: "Adicionar observação" }).click();
    conferir(
      await visivel(animal.getByRole("textbox", { name: "Nova observação" })),
      "Adicionar observação, no conteúdo, abre o campo",
    );
    conferir(await cabe(p, 390), "nada passa da largura da tela (390)");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);

    // ─── 4. Celular: os filtros da busca ──────────────────────────────────
    await p.goto(`${BASE}/buscar`);
    const filtros = p.getByRole("button", { name: "Mostrar" });
    await filtros.waitFor();
    conferir(!(await aberto(filtros)), "na busca, os filtros começam fechados, com Mostrar");
    await filtros.click();
    const ocultar = p.getByRole("button", { name: "Ocultar" });
    conferir(
      (await aberto(ocultar)) && (await visivel(p.getByText("Espécie", { exact: true }))),
      "Mostrar abre os filtros, e o botão passa a Ocultar",
    );
    await p.context().close();
  }

  // ─── 5. Celular: a página da conta ──────────────────────────────────────
  {
    const p = await entrar("beatriz@example.com", 390);
    await p.goto(`${BASE}/conta`);
    await p.getByRole("heading", { name: "Minha conta" }).waitFor();
    const trocar = p.getByRole("button", { name: "Trocar foto de perfil" });
    const remover = p.getByRole("button", { name: "Remover foto de perfil" });
    conferir(
      (await visivel(trocar)) && (await visivel(remover)),
      "a foto vem com Trocar e Remover embaixo",
    );
    const foto = await p
      .locator("section", { hasText: "Seus dados" })
      .locator("img")
      .first()
      .evaluate((i) => Math.round(i.getBoundingClientRect().width));
    conferir(foto >= 180, `a foto ficou grande (${foto} px de largura)`);
    conferir(
      (await p.getByText("Quem recebe seu contato vê essa foto.").count()) === 0 &&
        (await visivel(p.getByText(/^Aparecem no seu perfil\./))),
      "sem o texto da foto, e o texto de Seus dados diz quem vê os dados",
    );
    conferir(await cabe(p, 390), "a conta cabe na tela (390)");
    await p.context().close();
  }

  // ─── 6. Celular estreito (360) ──────────────────────────────────────────
  {
    const p = await entrar("victor@example.com", 360);
    conferir(await cabe(p, 360), "o perfil do veterinário cabe em 360 px");
    await p.goto(`${BASE}/conta`);
    await p.getByRole("heading", { name: "Minha conta" }).waitFor();
    conferir(await cabe(p, 360), "a conta cabe em 360 px");
    await p.context().close();
  }

  // ─── 7. Computador: nada abre e fecha ───────────────────────────────────
  {
    const p = await entrar("victor@example.com", 1380);
    conferir(
      (await faixa(p, "Localização").count()) === 0 &&
        (await faixa(p, "Acesso aos contatos").count()) === 0,
      "no computador, os painéis não viram botão de abrir e fechar",
    );
    conferir(
      (await visivel(p.getByText("Bairro", { exact: true }))) &&
        (await visivel(p.getByRole("button", { name: "Liberar acesso" }))),
      "os painéis ficam abertos, com Liberar acesso à vista",
    );
    await p.goto(`${BASE}/tutor/T3M8P1?animal=Z7R2K4`);
    await p.getByRole("tablist").waitFor();
    const animal = cartaoAberto(p);
    const naFaixa = animal
      .locator("section", { hasText: "Validação veterinária" })
      .first()
      .getByRole("button", { name: "Renovar validação" });
    conferir(
      (await visivel(naFaixa)) &&
        (await visivel(animal.getByRole("button", { name: "Adicionar", exact: true }))) &&
        (await animal.getByRole("button", { name: "Adicionar observação" }).count()) === 0,
      "as ações continuam na faixa (Renovar validação, Adicionar)",
    );
    conferir(
      await visivel(animal.getByText("Hemograma completo")),
      "os exames ficam à vista, sem precisar abrir",
    );
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }
} finally {
  await nav.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
