// Apagar uma versão de exame, no navegador: o arquivo errado (enviado depois
// da validação) sai sem mexer em nada; a sorologia que a validação conferiu
// sai com aviso, e a validação perde o efeito nas sorologias (F21). Usa um
// animal de teste da Beatriz, validado pelo Victor, e o exclui no fim.
// Uso: node ambiente-e2e.mjs rodar node fluxos-apagar-exame.mjs  (ver o README)
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5173";
const FOTOS = "capturas/exames";
mkdirSync(FOTOS, { recursive: true });
const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${texto}`);
};

async function contexto(email, largura = 1380, altura = 900) {
  const ctx = await nav.newContext({
    viewport: { width: largura, height: altura },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
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
const api = (p) => p.context().request;
const secao = (p, titulo) =>
  p.locator("[role=tabpanel]:not([hidden]) section", { hasText: titulo });
const linha = (p, nome) =>
  secao(p, "Exames e documentos").locator("li", { hasText: nome });
const pdf = readFileSync("imagens-teste/sorologia-teste.pdf");

const beatriz = await contexto("beatriz@example.com");
const victor = await contexto("victor@example.com");
let codigo;
try {
  // O animal de teste, com a sorologia, validado pelo Victor
  const criado = await api(beatriz).post(`${BASE}/api/animais`, {
    data: {
      nome: "Teste Exame",
      especie: "CAO",
      raca: "Labrador",
      sexo: "MACHO",
      castrado: true,
      dataNascimento: "2021-05-10",
      pesoKg: 30,
    },
  });
  codigo = (await criado.json()).animal.codigo;
  await api(beatriz).post(`${BASE}/api/animais/${codigo}/documentos/SOROLOGIA`, {
    multipart: {
      arquivo: { name: "sorologia.pdf", mimeType: "application/pdf", buffer: pdf },
    },
  });
  const validou = await api(victor).post(`${BASE}/api/animais/${codigo}/validacoes`, {
    data: {
      criterios: {
        TIPAGEM: true,
        PESO_IDADE: true,
        VACINACAO: true,
        SOROLOGIAS: true,
        SEM_TRANSFUSAO: true,
      },
      tipoSanguineo: "DEA 1.1+",
    },
  });
  conferir(validou.status() === 201, `cenário: o Victor validou o animal de teste (${validou.status()})`);

  const p = beatriz;
  await p.goto(`${BASE}/meu-perfil?animal=${codigo}`);
  await secao(p, "Exames e documentos").waitFor();
  conferir(
    await secao(p, "Validação veterinária").getByText("Validado por veterinário").isVisible(),
    "antes: o animal aparece validado",
  );

  // 1. O arquivo errado, depois da validação: sai sem aviso e sem mexer nela
  await linha(p, "Sorologias")
    .locator("input[type=file]")
    .setInputFiles("imagens-teste/vermelha-com-gps.jpg");
  await p.getByText("Sorologias enviadas").waitFor();
  await linha(p, "Sorologias").getByRole("button", { name: "Abrir sorologias" }).click();
  const janela = p.getByRole("dialog");
  await janela.locator("img").waitFor();
  await janela.getByRole("button", { name: "Apagar esta versão" }).click();
  const confirmacao = janela.getByRole("group", { name: /Apagar a versão de/ });
  await confirmacao.waitFor();
  conferir(
    (await confirmacao.getByText("Apagar desfaz a validação").count()) === 0,
    "arquivo errado: a confirmação não fala da validação",
  );
  conferir(
    await p.evaluate(() => document.activeElement?.getAttribute("role") === "group"),
    "arquivo errado: o foco vai para a pergunta",
  );
  await p.screenshot({ path: `${FOTOS}/8-apagar-arquivo-errado.png` });
  await confirmacao.getByRole("button", { name: "Apagar versão" }).click();
  await p.getByText("Versão apagada").waitFor();
  await janela.getByText("1 versão enviada").waitFor();
  conferir(true, "arquivo errado: apagado, e a janela segue com a versão que sobrou");
  conferir(
    await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Apagar esta versão"),
    "arquivo errado: o foco fica dentro da janela",
  );
  await p.keyboard.press("Escape");
  await janela.waitFor({ state: "detached" });
  conferir(true, "arquivo errado: o Esc fecha a janela");
  conferir(
    await secao(p, "Validação veterinária").getByText("Validado por veterinário").isVisible(),
    "arquivo errado: a validação continua valendo",
  );

  // 2. A sorologia conferida: aviso antes, e a validação perde o efeito
  await linha(p, "Sorologias").getByRole("button", { name: "Abrir sorologias" }).click();
  await janela.getByRole("link", { name: "Abrir o PDF" }).waitFor();
  await janela.getByRole("button", { name: "Apagar esta versão" }).click();
  await confirmacao.waitFor();
  const aviso = await confirmacao.innerText();
  conferir(
    aviso.includes("Apagar desfaz a validação de sorologias negativas, assinada por Dr. Victor Martins"),
    "sorologia conferida: o aviso diz o critério e quem assinou",
  );
  await p.screenshot({ path: `${FOTOS}/9-apagar-sorologia-conferida.png` });
  // Cancelar volta o foco ao botão de apagar, sem mudar nada
  await confirmacao.getByRole("button", { name: "Cancelar" }).click();
  conferir(
    await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Apagar esta versão"),
    "cancelar: o foco volta ao botão de apagar",
  );
  await janela.getByRole("button", { name: "Apagar esta versão" }).click();
  await confirmacao.getByRole("button", { name: "Apagar versão" }).click();
  await p.getByText("Versão apagada").waitFor();
  await janela.waitFor({ state: "detached" });
  conferir(true, "sorologia conferida: era a única versão, e a janela fecha");
  await p.waitForTimeout(100);
  conferir(
    await p.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Enviar sorologias"),
    "sorologia conferida: o foco vai para o botão de enviar da linha",
  );
  conferir(
    await linha(p, "Sorologias").getByText("Não enviado").isVisible(),
    "sorologia conferida: a linha volta a 'Não enviado'",
  );
  const painel = secao(p, "Validação veterinária");
  conferir(
    await painel.getByText("Validação com pendências").isVisible(),
    "sorologia conferida: o selo vira 'Validação com pendências'",
  );
  conferir(
    await painel
      .getByText("Uma sorologia que esta validação conferiu foi apagada: as sorologias precisam ser conferidas de novo.")
      .isVisible(),
    "sorologia conferida: o painel explica por quê",
  );
  conferir(
    (await painel.locator("li", { hasText: "Sorologias negativas" }).innerText()).includes("não atendido"),
    "sorologia conferida: o critério aparece como não atendido",
  );
  await painel.scrollIntoViewIfNeeded();
  await painel.screenshot({ path: `${FOTOS}/10-validacao-sem-sorologia.png` });

  // Na busca, o animal de teste deixa de contar como validado
  const busca = await api(p).get(`${BASE}/api/doadores?especie=CAO&busca=Teste%20Exame`);
  const doador = (await busca.json()).doadores.find((d) => d.codigo === codigo);
  conferir(doador && doador.validado === false, "busca: o animal não aparece mais como validado");
  conferir(p.erros.length === 0, `sem erros na página (${p.erros})`);
} finally {
  if (codigo) {
    const r = await api(beatriz).delete(`${BASE}/api/animais/${codigo}`);
    console.log(`animal de teste excluído (${r.status()})`);
  }
  await nav.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
