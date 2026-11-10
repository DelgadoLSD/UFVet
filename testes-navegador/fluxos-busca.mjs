// Confere no navegador a busca de doadores e o perfil de outra pessoa, já
// ligados à API, com os exemplos de `npm run db:exemplos`. Só lê: nada é
// gravado.
// Uso: node ambiente-e2e.mjs rodar node fluxos-busca.mjs  (ver o README)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5173";
const FOTOS = "capturas/busca-fotos";
mkdirSync(FOTOS, { recursive: true });

const navegador = await chromium.launch({ channel: "msedge" });
let falhas = 0;

function conferir(condicao, descricao) {
  console.log(`${condicao ? "OK     " : "FALHOU "} ${descricao}`);
  if (!condicao) falhas++;
}

async function abrir(email, viewport = { width: 1280, height: 900 }) {
  const contexto = await navegador.newContext({
    viewport,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  if (email) {
    await contexto.request.post(`${BASE}/api/sessao`, {
      data: { email, senha: "ufvet-exemplo" },
    });
  }
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

// Espera a contagem da busca e devolve os nomes dos cartões, na ordem.
async function resultados(p, contagem) {
  await p.getByText(contagem, { exact: true }).waitFor({ timeout: 8000 });
  await p.locator('[aria-busy="false"]').waitFor();
  return p
    .locator('[aria-busy="false"] article')
    .evaluateAll((cartoes) => cartoes.map((c) => c.getAttribute("aria-label")));
}

const contagem = (n) =>
  `${n} ${n === 1 ? "doador disponível" : "doadores disponíveis"} com esses filtros`;

try {
  // 1. O visitante busca: todos os disponíveis aparecem. Desde 04/11, os
  // critérios são o ideal, e não uma proibição: quem atende a mais critérios
  // vem primeiro e, entre iguais, os validados. Só o tutor tira um animal da
  // busca (o Max está pausado; a Luna e a Nina, indisponíveis).
  {
    const p = await abrir(null);
    await p.goto(`${BASE}/buscar`);
    const caes = await resultados(p, contagem(8));
    conferir(
      JSON.stringify(caes) ===
        JSON.stringify(["Barão", "Bela", "Duque", "Rex", "Thor", "Bolt"]),
      `cães: 8, de 6 em 6, os validados dentro do ideal primeiro (${caes.join(", ")})`,
    );
    conferir(
      !caes.includes("Max"),
      "o Max, que o tutor pausou, fica de fora",
    );
    await p.screenshot({ path: `${FOTOS}/1-busca-caes.png`, fullPage: true });

    await p.getByRole("button", { name: "Carregar mais 2" }).click();
    await p.getByRole("article", { name: "Zeus" }).waitFor();
    const todos = await p
      .locator('[aria-busy="false"] article')
      .evaluateAll((cartoes) => cartoes.map((c) => c.getAttribute("aria-label")));
    conferir(
      JSON.stringify(todos.slice(6)) === JSON.stringify(["Pipoca", "Zeus"]) &&
        (await p.getByRole("button", { name: /Carregar mais/ }).count()) === 0,
      "Carregar mais traz o Pipoca e, por último, o Zeus: ele doou há menos de 90 dias, então fica fora do ideal num ponto, mas continua na busca; o botão some",
    );

    await p
      .getByRole("group", { name: "Espécie" })
      .getByRole("button", { name: "Gato" })
      .click();
    const gatos = await resultados(p, contagem(4));
    conferir(
      JSON.stringify(gatos) ===
        JSON.stringify(["Frajola", "Gizmo", "Simba", "Amora"]),
      `gatos: 4, a Amora por último (abaixo do peso ideal), sem a Luna e a Nina, indisponíveis (${gatos.join(", ")})`,
    );

    await p
      .getByRole("group", { name: "Espécie" })
      .getByRole("button", { name: "Cão" })
      .click();
    await resultados(p, contagem(8));
    await p.getByRole("button", { name: "DEA 1.1 negativo", exact: true }).click();
    const negativos = await resultados(p, contagem(2));
    conferir(
      JSON.stringify(negativos) === JSON.stringify(["Bela", "Rex"]),
      `com o tipo DEA 1.1 negativo, só quem tem a tipagem confirmada (${negativos.join(", ")})`,
    );
    await p.getByRole("button", { name: "DEA 1.1 negativo", exact: true }).click();

    await p.getByRole("textbox", { name: "Buscar doadores" }).fill("#h4r8t2");
    const porCodigo = await resultados(p, contagem(1));
    conferir(
      JSON.stringify(porCodigo) === JSON.stringify(["Thor"]),
      "a busca pelo código, com #, acha o Thor",
    );
    await p.getByRole("button", { name: "Limpar busca" }).click();

    await p.getByRole("combobox", { name: "Cidade" }).click();
    await p.getByRole("option", { name: /Teixeiras - MG/ }).click();
    const teixeiras = await resultados(p, contagem(2));
    conferir(
      JSON.stringify(teixeiras) === JSON.stringify(["Rex", "Pipoca"]),
      `na cidade de Teixeiras, os cães da Camila (${teixeiras.join(", ")})`,
    );

    await p.getByRole("group", { name: "Validação" }).getByRole("button", { name: "Só validados" }).click();
    const validados = await resultados(p, contagem(1));
    conferir(
      JSON.stringify(validados) === JSON.stringify(["Rex"]),
      "apenas validados, em Teixeiras: só o Rex",
    );
    await p.screenshot({ path: `${FOTOS}/2-busca-filtrada.png`, fullPage: true });
    conferir(
      (await p.getByText("@example.com").count()) === 0,
      "nenhum contato aparece na busca",
    );
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 2. Do cartão ao perfil, como visitante: a pessoa vem da API, sem contato
  {
    const p = await abrir(null);
    await p.goto(`${BASE}/buscar`);
    await resultados(p, contagem(8));
    await p.getByRole("link", { name: "Ver perfil de Thor" }).click();
    await p.waitForURL("**/tutor/T7X9K2?animal=H4R8T2");
    await p.getByRole("heading", { name: "Lucas Silva Delgado" }).waitFor();
    // Os animais chegam num pedido à parte, logo depois da pessoa.
    await p.getByRole("article", { name: "Thor" }).waitFor();
    // Os animais ficam no carrossel; o clicado na busca já vem aberto.
    const animais = await p
      .getByRole("tab")
      .evaluateAll((abas) => abas.map((a) => a.dataset.codigo));
    const aberto = await p.getByRole("tabpanel").getByRole("article").getAttribute("aria-label");
    conferir(
      JSON.stringify(animais) === JSON.stringify(["H4R8T2", "F6J3R9", "B7Q2M5"]) && aberto === "Thor",
      `o perfil é o do Lucas, com os animais dele no carrossel (${animais.join(", ")}) e o Thor aberto`,
    );
    conferir(
      (await visivel(p.getByText("••••••••@••••••"))) &&
        (await p.getByText("lucas@example.com").count()) === 0 &&
        (await visivel(p.getByRole("link", { name: "Entrar" }).last())),
      "o contato fica mascarado, sem nada do e-mail, com o botão Entrar",
    );
    await p.screenshot({ path: `${FOTOS}/3-perfil-visitante.png` });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 3. O veterinário revela o contato; a tutora só pode pedir a liberação
  {
    const p = await abrir("victor@example.com");
    await p.goto(`${BASE}/tutor/T7X9K2`);
    await p.getByRole("button", { name: "Ver contato" }).click();
    conferir(
      (await visivel(p.getByText("lucas@example.com"))) &&
        (await visivel(p.getByText("(31) 99715-2280"))),
      "o veterinário clica em Ver contato e vê o e-mail e o telefone do Lucas",
    );
    await p.screenshot({ path: `${FOTOS}/4-contato-veterinario.png` });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();

    const t = await abrir("beatriz@example.com");
    await t.goto(`${BASE}/tutor/T7X9K2`);
    await t.getByRole("heading", { name: "Lucas Silva Delgado" }).waitFor();
    conferir(
      (await visivel(t.getByRole("button", { name: "Pedir liberação" }))) &&
        (await t.getByRole("button", { name: "Ver contato" }).count()) === 0,
      "a tutora sem liberação vê Pedir liberação, e não Ver contato",
    );
    await t.context().close();
  }

  // 4. Código que ninguém usa, e o próprio código
  {
    const p = await abrir("beatriz@example.com");
    await p.goto(`${BASE}/tutor/TZZZZZ`);
    conferir(
      (await visivel(p.getByRole("heading", { name: "Perfil não encontrado" }))) &&
        (await visivel(p.getByRole("link", { name: "Ir para a busca" }))),
      "um código que ninguém usa diz que o perfil não existe e leva à busca",
    );
    await p.screenshot({ path: `${FOTOS}/5-nao-encontrado.png` });

    await p.goto(`${BASE}/tutor/t3m8p1`);
    await p.waitForURL("**/meu-perfil");
    conferir(true, "abrir o próprio código leva ao Meu perfil");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 5. Celular: a busca cabe na tela
  {
    const p = await abrir(null, { width: 390, height: 844 });
    await p.goto(`${BASE}/buscar`);
    await resultados(p, contagem(8));
    const largura = await p.evaluate(() => document.documentElement.scrollWidth);
    conferir(largura <= 390, `a busca cabe em 390 px (largura: ${largura})`);
    await p.screenshot({ path: `${FOTOS}/6-busca-celular.png` });
    await p.context().close();
  }
} finally {
  await navegador.close();
}

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exit(falhas ? 1 : 0);
