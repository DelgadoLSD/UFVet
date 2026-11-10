// Confere no navegador o histórico clínico ligado à API (F19 a F24): o
// veterinário de exemplo (Victor) abre o perfil da tutora de exemplo
// (Beatriz) e, na Luna, valida, registra uma doação e escreve uma
// observação; a tutora não vê esses botões; e, quando ela muda o peso da Luna,
// a validação mostra que peso e idade precisam ser conferidos de novo (F21).
// No fim, tudo o que o roteiro criou na Luna é apagado e o peso volta.
// Uso: node ambiente-e2e.mjs rodar node fluxos-validacao.mjs  (ver o README)
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
const FOTOS = "capturas/validacao-fotos";
mkdirSync(FOTOS, { recursive: true });
const SENHA = "ufvet-exemplo";
const TEXTO_OBSERVACAO = "Calma durante a coleta do roteiro de teste.";
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const navegador = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const inicio = new Date();

function conferir(condicao, descricao) {
  console.log(`${condicao ? "OK     " : "FALHOU "} ${descricao}`);
  if (!condicao) falhas++;
}

function noBackend(codigo) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", codigo], {
    cwd: BACKEND,
    encoding: "utf8",
  });
}

// Devolve a Luna ao estado dos exemplos (nunca validada, sem doações nem
// observações, 4,5 kg, pausada): apaga também o que um teste feito à mão
// deixou nela.
function devolverLuna() {
  noBackend(`
    import { banco } from "./src/banco.js";
    const luna = await banco.animal.findUnique({ where: { codigo: "L4N8C1" } });
    await banco.animal.update({
      where: { id: luna.id },
      data: { pesoKg: 4.5, tipoSanguineo: null, tipagemValidacaoId: null, disponivel: false },
    });
    for (const tabela of ["validacao", "doacao", "observacao"]) {
      await banco[tabela].deleteMany({ where: { animalId: luna.id } });
    }
    await banco.$disconnect();
  `);
}

async function entrarComo(email) {
  const contexto = await navegador.newContext({
    viewport: { width: 1280, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  if (email) {
    await contexto.request.post(`${BASE}/api/sessao`, {
      data: { email, senha: SENHA },
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

// O histórico da Luna como a API devolve.
async function historicoDaLuna(p) {
  const resposta = await p.context().request.get(`${BASE}/api/usuarios/T3M8P1/animais`);
  const { animais } = await resposta.json();
  return animais.find((a) => a.codigo === "L4N8C1");
}

// "8 de outubro de 2026": o rótulo do dia de hoje no calendário.
function rotuloDeHoje() {
  const [ano, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

try {
  devolverLuna();

  // 1. O veterinário no perfil da tutora: os animais vêm da API
  {
    const p = await entrarComo("victor@example.com");
    await p.goto(`${BASE}/tutor/T3M8P1`);
    const zeus = await abrirAnimal(p, "Zeus");
    await zeus.waitFor();
    conferir(
      (await visivel(zeus.getByText("DEA 1.1+"))) &&
        (await visivel(zeus.getByText("Validação vencida"))),
      "o Zeus aparece com o tipo e a validação vencida, vindos do banco",
    );
    const luna = await abrirAnimal(p, "Luna");
    conferir(await visivel(luna.getByText("Ainda não validado")), "a Luna aparece sem validação");

    // 2. Validar
    await luna.getByRole("button", { name: "Validar doador" }).click();
    const modal = p.getByRole("dialog");
    await modal.getByRole("button", { name: "Marcar todos" }).click();
    await modal.getByRole("button", { name: "Tipo B", exact: true }).click();
    await p.screenshot({ path: `${FOTOS}/1-validando.png` });
    await modal.getByRole("button", { name: "Confirmar validação" }).click();
    await modal.waitFor({ state: "detached" });
    conferir(await visivel(p.getByText("Validação registrada")), "a confirmação diz que a validação foi registrada");
    conferir(
      (await visivel(luna.getByText("Validado por veterinário"))) &&
        (await visivel(luna.getByText("Tipo B", { exact: true }))) &&
        (await visivel(luna.getByText("Dr. Victor Martins, CRMV 78120-MG"))),
      "a Luna fica validada, com o tipo B e a assinatura do Victor",
    );

    // 3. Doação: o botão da faixa de dados abre o formulário direto
    await luna.getByRole("button", { name: "Registrar doação de Luna" }).click();
    const doacoes = p.getByRole("dialog");
    await doacoes.getByRole("button", { name: rotuloDeHoje(), exact: true }).click();
    await doacoes.locator("#volume-doacao").fill("50");
    await p.screenshot({ path: `${FOTOS}/2-doacao.png` });
    await doacoes.getByRole("button", { name: "Registrar doação" }).click();
    conferir(await visivel(p.getByText("Doação registrada")), "a confirmação diz que a doação foi registrada");
    conferir(
      await visivel(doacoes.getByText("Coletado por Dr. Victor Martins, CRMV 78120-MG")),
      "a coleta entra no histórico, assinada pelo Victor",
    );
    await doacoes.getByRole("button", { name: "Fechar" }).last().click();
    await doacoes.waitFor({ state: "detached" });

    // 4. Observação
    await luna.getByRole("button", { name: "Adicionar" }).click();
    await luna.getByRole("textbox", { name: "Nova observação" }).fill(TEXTO_OBSERVACAO);
    await luna.getByRole("button", { name: "Salvar" }).click();
    conferir(await visivel(p.getByText("Observação registrada")), "a confirmação diz que a observação foi registrada");
    conferir(await visivel(luna.getByText(TEXTO_OBSERVACAO)), "a observação aparece no cartão");

    // 5. Recarregando, tudo continua (veio da API)
    await p.reload();
    await abrirAnimal(p, "Luna");
    const depois = await historicoDaLuna(p);
    conferir(
      depois.validacoes.length === 1 &&
        depois.tipoSanguineo === "Tipo B" &&
        depois.doacoes.length === 1 &&
        depois.doacoes[0].volumeMl === 50 &&
        depois.observacoes[0]?.texto === TEXTO_OBSERVACAO,
      "recarregando, validação, tipo, doação e observação estão gravados",
    );
    await p.screenshot({ path: `${FOTOS}/3-luna-validada.png`, fullPage: true });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 6. A tutora não vê os botões do veterinário, e o F21
  {
    const p = await entrarComo("beatriz@example.com");
    await p.goto(`${BASE}/meu-perfil`);
    const luna = await abrirAnimal(p, "Luna");
    await luna.waitFor();
    conferir(
      (await luna.getByRole("button", { name: "Validar doador" }).count()) === 0 &&
        (await luna.getByRole("button", { name: "Adicionar" }).count()) === 0,
      "a tutora não vê validar nem adicionar observação",
    );

    await p.getByRole("button", { name: "Editar Luna" }).click();
    const modal = p.getByRole("dialog");
    await p.locator("#animal-peso").fill("4.8");
    await modal.getByRole("button", { name: "Salvar alterações" }).click();
    await modal.waitFor({ state: "detached" });
    conferir(
      (await visivel(luna.getByText("O peso de Luna mudou"))) &&
        (await visivel(luna.getByText("Validação com pendências"))),
      "mudar o peso deixa peso e idade para conferir de novo (F21)",
    );
    await p.screenshot({ path: `${FOTOS}/4-f21.png`, fullPage: true });

    // O histórico de validações mostra o mesmo que o painel
    await luna.getByRole("button", { name: "Ver histórico de validações" }).click();
    const historico = p.getByRole("dialog");
    const pesoIdade = await historico
      .locator("li li", { hasText: "Peso e idade" })
      .first()
      .textContent();
    conferir(
      (await visivel(historico.getByText("Vigente, com pendências"))) &&
        pesoIdade.includes("Peso e idade: não atendido") &&
        (await visivel(
          historico.getByText("O peso de Luna mudou depois desta validação"),
        )),
      "o histórico de validações também mostra peso e idade sem efeito (F21)",
    );
    await p.screenshot({ path: `${FOTOS}/5-historico-f21.png` });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 7. Quem visita o perfil do Lucas, sem conta, vê os animais dele (do banco)
  {
    const p = await entrarComo(null);
    await p.goto(`${BASE}/tutor/T7X9K2`);
    conferir(
      await visivel(p.getByRole("heading", { name: "Thor" })),
      "o perfil do Lucas, aberto sem conta, mostra o Thor",
    );
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }
} finally {
  devolverLuna();
  await navegador.close();
}

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exit(falhas ? 1 : 0);
