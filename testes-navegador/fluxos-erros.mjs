// Confere no navegador que nenhum clique "não faz nada": no registro de
// doação, o que falta aparece embaixo de cada campo; e os erros gerais da API
// (limite de registros, sem conexão) aparecem à vista, inclusive numa tela de
// notebook, no registro de doação, na validação, na edição do animal e na
// página da conta. Os pedidos que dariam erro são interceptados aqui, no
// navegador: nada chega a ser gravado. Só a última parte registra uma doação
// de verdade, para conferir o caminho inteiro, e a apaga no fim.
// Uso: node ambiente-e2e.mjs rodar node fluxos-erros.mjs  (ver o README)
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from "node:url";
// Com vários animais, o perfil mostra um de cada vez: escolhe o animal no
// carrossel (quando há carrossel) e devolve o cartão completo dele.
async function abrirAnimal(p, nome) {
  await p.getByRole("article").first().waitFor();
  const aba = p
    .getByRole("tab")
    .filter({ has: p.getByText(nome, { exact: true }) });
  if (await aba.count()) await aba.click();
  const cartao = p.getByRole("article", { name: nome });
  await cartao.waitFor();
  return cartao;
}

const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
mkdirSync("capturas/erros", { recursive: true });
const inicio = new Date();

// Apaga as doações que este roteiro registrou na Luna. O resto da Luna
// (inclusive uma validação feita à mão antes) fica como estava.
function apagarDoacoesDoRoteiro() {
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { banco } from "./src/banco.js";
       const luna = await banco.animal.findUnique({ where: { codigo: "L4N8C1" } });
       await banco.doacao.deleteMany({
         where: { animalId: luna.id, criadoEm: { gte: new Date("${inicio.toISOString()}") } },
       });
       await banco.$disconnect();`,
    ],
    { cwd: BACKEND },
  );
}
const SENHA = "ufvet-exemplo";
const LIMITE = "Muitos registros feitos em pouco tempo. Tente de novo mais tarde.";
const SEM_CONEXAO = "Não foi possível falar com o servidor";
const NOTEBOOK = { width: 1366, height: 657 };
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const navegador = await chromium.launch({ channel: "msedge" });
let falhas = 0;

function conferir(condicao, descricao) {
  console.log(`${condicao ? "OK     " : "FALHOU "} ${descricao}`);
  if (!condicao) falhas++;
}

async function entrarComoVictor(viewport = { width: 1280, height: 900 }) {
  const contexto = await navegador.newContext({
    viewport,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  await contexto.request.post(`${BASE}/api/sessao`, {
    data: { email: "victor@example.com", senha: SENHA },
  });
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
  // Quantos registros de doação saíram do navegador.
  p.doacoesEnviadas = 0;
  p.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/doacoes")) p.doacoesEnviadas++;
  });
  return p;
}

// Responde a um pedido com o limite de registros da API, sem deixá-lo chegar
// a ela. Os outros métodos no mesmo endereço seguem normalmente.
const comLimite = (metodo) => (rota) =>
  rota.request().method() === metodo
    ? rota.fulfill({ status: 429, json: { erro: LIMITE } })
    : rota.continue();

const visivel = (loc) =>
  loc
    .first()
    .waitFor({ timeout: 5000 })
    .then(
      () => true,
      () => false,
    );

// O aviso está inteiro à vista, sem precisar rolar. Estar dentro da altura da
// tela não basta: no fim do corpo de uma janela com rolagem, ele fica cortado
// pela rolagem. Por isso o navegador diz o que aparece nas bordas de cima e de
// baixo do aviso; se for o próprio aviso, ele está à vista.
async function aVista(loc) {
  return loc.first().evaluate((aviso) => {
    const caixa = aviso.getBoundingClientRect();
    if (caixa.height === 0 || caixa.top < 0 || caixa.bottom > innerHeight) {
      return false;
    }
    const x = caixa.left + caixa.width / 2;
    return [caixa.top + 2, caixa.bottom - 2].every((y) =>
      aviso.contains(document.elementFromPoint(x, y)),
    );
  });
}

function rotuloDeHoje() {
  const [ano, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

// Abre o formulário de registro de doação da Luna.
async function abrirRegistroDaLuna(p) {
  await p.goto(`${BASE}/tutor/T3M8P1`);
  const luna = await abrirAnimal(p, "Luna");
  // O botão da faixa de dados abre o formulário direto.
  await luna.getByRole("button", { name: "Registrar doação de Luna" }).click();
  return p.getByRole("dialog");
}

try {
  // 1. Registrar sem o dia e sem o volume mostra o que falta
  {
    const p = await entrarComoVictor();
    const modal = await abrirRegistroDaLuna(p);
    await modal.getByRole("button", { name: "Registrar doação" }).click();
    conferir(
      (await visivel(modal.getByText("Escolha no calendário o dia da coleta."))) &&
        (await visivel(modal.getByText("Informe o volume em mL."))) &&
        p.doacoesEnviadas === 0,
      "registrar sem o dia e sem o volume mostra o que falta, sem chamar a API",
    );

    // 2. Escolher o dia tira o aviso dele; 1500 mL é barrado na tela
    await modal.getByRole("button", { name: rotuloDeHoje(), exact: true }).click();
    const avisoDoDiaSumiu =
      (await modal.getByText("Escolha no calendário o dia da coleta.").count()) === 0;
    await modal.locator("#volume-doacao").fill("1500");
    await modal.getByRole("button", { name: "Registrar doação" }).click();
    conferir(
      avisoDoDiaSumiu &&
        (await visivel(modal.getByText("Confira o volume: mais de 1000 mL."))) &&
        p.doacoesEnviadas === 0,
      "escolher o dia tira o aviso; 1500 mL é barrado antes de chamar a API",
    );
    await p.screenshot({ path: "capturas/erros/erros-1-doacao-campos.png" });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 3. Num notebook, o erro geral do registro de doação fica à vista
  {
    const p = await entrarComoVictor(NOTEBOOK);
    await p.route("**/api/animais/L4N8C1/doacoes", comLimite("POST"));
    const modal = await abrirRegistroDaLuna(p);
    await modal.getByRole("button", { name: rotuloDeHoje(), exact: true }).click();
    await modal.locator("#volume-doacao").fill("50");
    await modal.getByRole("button", { name: "Registrar doação" }).click();
    const aviso = modal.getByRole("alert").filter({ hasText: LIMITE });
    conferir(
      (await visivel(aviso)) && (await aVista(aviso)),
      "notebook: o limite de registros aparece à vista no registro de doação",
    );
    await p.screenshot({ path: "capturas/erros/erros-2-doacao-notebook.png" });
    await p.context().close();
  }

  // 4. Num notebook, o erro geral da validação fica à vista
  {
    const p = await entrarComoVictor(NOTEBOOK);
    await p.route("**/api/animais/L4N8C1/validacoes", comLimite("POST"));
    await p.goto(`${BASE}/tutor/T3M8P1`);
    const luna = await abrirAnimal(p, "Luna");
    await luna
      .getByRole("button", { name: /Validar doador|Revisar validação|Renovar validação/ })
      .click();
    const modal = p.getByRole("dialog");
    // Exato: sem isso, "Marcar todos" também acha o "Desmarcar todos".
    const marcarTodos = modal.getByRole("button", { name: "Marcar todos", exact: true });
    if (await marcarTodos.count()) await marcarTodos.click();
    await modal.getByRole("button", { name: "Tipo B", exact: true }).click();
    await modal.getByRole("button", { name: "Confirmar validação" }).click();
    const aviso = modal.getByRole("alert").filter({ hasText: LIMITE });
    conferir(
      (await visivel(aviso)) && (await aVista(aviso)),
      "notebook: o limite de registros aparece à vista na validação",
    );
    await p.screenshot({ path: "capturas/erros/erros-3-validacao-notebook.png" });
    await p.context().close();
  }

  // 5. Editar um animal sem conexão diz o que houve
  {
    const p = await entrarComoVictor();
    await p.route("**/api/animais/B3L6D9", (rota) =>
      rota.request().method() === "PATCH" ? rota.abort() : rota.continue(),
    );
    await p.goto(`${BASE}/meu-perfil`);
    await p.getByRole("button", { name: "Editar Bela" }).click();
    const modal = p.getByRole("dialog");
    await p.locator("#animal-peso").fill("28.5");
    await modal.getByRole("button", { name: "Salvar alterações" }).click();
    conferir(
      await visivel(modal.getByRole("alert").filter({ hasText: SEM_CONEXAO })),
      "editar um animal sem conexão mostra o aviso",
    );
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 6. Na página da conta, o erro geral aparece nos dados e na senha
  {
    const p = await entrarComoVictor();
    await p.route("**/api/conta", comLimite("PATCH"));
    await p.route("**/api/conta/senha", comLimite("PUT"));
    await p.goto(`${BASE}/conta`);
    await p.locator("#nome").fill("Victor Hugo Martins Teste");
    await p.getByRole("button", { name: "Salvar alterações" }).click();
    conferir(
      await visivel(p.getByRole("alert").filter({ hasText: LIMITE })),
      "salvar os dados da conta com a API recusando mostra o aviso",
    );

    await p.getByRole("button", { name: "Alterar senha" }).click();
    await p.locator("#senha-atual").fill(SENHA);
    await p.locator("#senha-nova").fill("Outra-senha-segura-2026");
    await p.locator("#senha-confirmacao").fill("Outra-senha-segura-2026");
    await p.getByRole("button", { name: "Salvar senha" }).click();
    const formSenha = p.locator("form", {
      has: p.getByRole("button", { name: "Salvar senha" }),
    });
    const avisoSenha = formSenha.getByRole("alert");
    const viuAviso = await visivel(avisoSenha.filter({ hasText: LIMITE }));
    if (!viuAviso) {
      console.log("  avisos no formulário de senha:", await avisoSenha.allTextContents());
      await p.screenshot({ path: "capturas/erros/erros-4-senha.png", fullPage: true });
    }
    conferir(viuAviso, "trocar a senha com a API recusando mostra o aviso");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 7. Registrar de verdade, depois de um aviso, funciona até o fim
  {
    const p = await entrarComoVictor(NOTEBOOK);
    const modal = await abrirRegistroDaLuna(p);
    await modal.getByRole("button", { name: "Registrar doação" }).click();
    await modal.getByRole("button", { name: rotuloDeHoje(), exact: true }).click();
    await modal.locator("#volume-doacao").fill("50");
    await modal.getByRole("button", { name: "Registrar doação" }).click();
    conferir(
      (await visivel(p.getByText("Doação registrada"))) &&
        (await visivel(
          modal.getByText("Coletado por Dr. Victor Martins, CRMV 78120-MG"),
        )) &&
        p.doacoesEnviadas === 1,
      "registrar de verdade grava a doação, confirma e mostra na lista",
    );
    await p.screenshot({ path: "capturas/erros/erros-5-doacao-registrada.png" });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }
} finally {
  await navegador.close();
  apagarDoacoesDoRoteiro();
}

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exit(falhas ? 1 : 0);
