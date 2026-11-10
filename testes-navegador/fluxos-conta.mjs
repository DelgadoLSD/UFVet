// Confere no navegador a página "Minha conta" ligada à API: mudar os dados,
// trocar o e-mail e a senha, sair de todos os aparelhos e encerrar a conta.
// Uso: node ambiente-e2e.mjs rodar node fluxos-conta.mjs  (ver o README)
import { chromium } from "playwright-core";
import { confirmarEEntrarPelaApi, linkDoEmail } from "./e2e-email.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from "node:url";
const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const FOTOS = "capturas/conta-fotos";
mkdirSync(FOTOS, { recursive: true });

const EMAIL = "fluxo.conta@example.com";
const EMAIL_NOVO = "fluxo.conta.novo@example.com";
const SENHA = "senha-do-fluxo";
const SENHA_NOVA = "senha-nova-do-fluxo";

const navegador = await chromium.launch({ channel: "msedge" });
let falhas = 0;

function conferir(condicao, descricao) {
  console.log(`${condicao ? "OK     " : "FALHOU "} ${descricao}`);
  if (!condicao) falhas++;
}

async function novaPagina(largura = 1280, altura = 900) {
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    reducedMotion: "reduce",
  });
  const p = await contexto.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  // Respostas 4xx esperadas (senha errada) aparecem no console como
  // "Failed to load resource"; não são erros do site.
  p.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !m.text().startsWith("Failed to load resource") &&
      p.erros.push(m.text()),
  );
  return p;
}

// Espera o elemento aparecer (até 3 s) antes de conferir.
const visivel = (loc) =>
  loc
    .first()
    .waitFor({ timeout: 3000 })
    .then(
      () => true,
      () => false,
    );

const foto = (p, nome, inteira = false) =>
  p.screenshot({ path: `${FOTOS}/${nome}.png`, fullPage: inteira });

function noBackend(codigo) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", codigo], {
    cwd: BACKEND,
    encoding: "utf8",
  });
}

function limparDadosDeTeste() {
  noBackend(`
    import { banco } from "./src/banco.js";
    import { indiceEmail } from "./src/cifra.js";
    const emails = ["${EMAIL}", "${EMAIL_NOVO}"];
    await banco.usuario.deleteMany({ where: { emailIndice: { in: emails.map(indiceEmail) } } });
    await banco.$disconnect();
  `);
}

// Cria a conta de teste pela API, já logada neste navegador.
async function criarConta(p) {
  const resposta = await p.context().request.post(`${BASE}/api/usuarios`, {
    data: {
      papel: "TUTOR",
      nomeCompleto: "Fluxo da Conta",
      email: EMAIL,
      telefone: "(31) 99999-1234",
      cidade: "Viçosa - MG",
      bairro: "Centro",
      senha: SENHA,
      aceiteTermos: true,
      cienciaResponsabilidade: true,
    },
  });
  if (resposta.status() !== 201) {
    throw new Error(`cadastro de teste falhou: ${await resposta.text()}`);
  }
  await confirmarEEntrarPelaApi(p.context(), BASE, EMAIL, SENHA);
}

async function entrar(p, email, senha, voltar = "/conta") {
  await p.goto(`${BASE}/login?voltar=${encodeURIComponent(voltar)}`);
  await p.locator("#email").fill(email);
  await p.locator("#senha").fill(senha);
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === voltar);
}

const botaoSalvar = (p) =>
  p.getByRole("button", { name: /Salvar alterações|Salvando/ });

limparDadosDeTeste();

// 1. Mudar os dados
{
  const p = await novaPagina();
  await criarConta(p);
  await p.goto(`${BASE}/conta`);
  await p.getByRole("heading", { name: "Minha conta" }).waitFor();
  conferir(
    (await p.locator("#nome").inputValue()) === "Fluxo da Conta",
    "a página abre com os dados da conta",
  );
  conferir(await botaoSalvar(p).isDisabled(), "sem mudança, Salvar fica desligado");

  await p.locator("#nome").fill("Fluxo Mudado da Silva");
  conferir(
    await visivel(p.getByText("Alterações não salvas")),
    "mudar um campo mostra que há alterações não salvas (NF3.2)",
  );

  await p.locator("#telefone").fill("");
  await p.locator("#telefone").pressSequentially("3112345678");
  await p.locator("#telefone").blur();
  conferir(
    await visivel(p.getByText("Telefone inválido. Confira o DDD e o número.")),
    "telefone inválido avisa ao sair do campo",
  );
  await p.locator("#telefone").fill("");
  await p.locator("#telefone").pressSequentially("3138991234");
  conferir(
    (await p.locator("#telefone").inputValue()) === "(31) 3899-1234",
    "o telefone ganha a máscara",
  );

  // Trocar a cidade apaga o bairro, e Salvar espera o novo.
  await p.locator("#cidade").click();
  await p.waitForSelector('[role="option"]');
  await p.locator("#cidade").fill("Teixeiras");
  await p.keyboard.press("Enter");
  conferir(
    await visivel(p.getByText("Escolha a cidade e o bairro para salvar.")),
    "trocar a cidade pede o bairro antes de salvar",
  );
  // Teixeiras não tem lista de bairros: o que se digita já vale.
  await p.locator("#bairro").fill("Centro");

  await foto(p, "1-dados-alterados", true);
  await botaoSalvar(p).click();
  conferir(
    await visivel(p.getByText("Alterações salvas")),
    "salvar mostra Alterações salvas",
  );
  conferir(
    await visivel(p.locator("header").getByText("Fluxo Silva")),
    "o topo passa a mostrar o nome novo",
  );

  await p.reload();
  await p.getByRole("heading", { name: "Minha conta" }).waitFor();
  conferir(
    (await p.locator("#nome").inputValue()) === "Fluxo Mudado da Silva" &&
      (await p.locator("#telefone").inputValue()) === "(31) 3899-1234" &&
      (await p.locator("#cidade").inputValue()).startsWith("Teixeiras"),
    "recarregando, os dados novos continuam (vieram da API)",
  );
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 2. Trocar o e-mail
{
  const p = await novaPagina();
  await entrar(p, EMAIL, SENHA);
  await p.locator("#email").fill("beatriz@example.com");
  await p.locator("#email").blur();
  conferir(
    await visivel(p.getByText("Já existe uma conta com este e-mail.")),
    "e-mail de outra conta avisa ao sair do campo",
  );

  await p.locator("#email").fill(EMAIL_NOVO);
  conferir(
    await visivel(p.locator("#senha-email")),
    "trocar o e-mail faz aparecer o campo da senha atual",
  );
  await botaoSalvar(p).click();
  conferir(
    await visivel(p.getByText("Digite sua senha para trocar o e-mail.")),
    "salvar sem a senha avisa no campo",
  );
  await p.locator("#senha-email").fill("nao-e-a-senha");
  await botaoSalvar(p).click();
  conferir(
    await visivel(p.getByText("Senha incorreta.")),
    "senha errada avisa no campo",
  );
  await foto(p, "2-email-senha-errada", true);
  await p.locator("#senha-email").fill(SENHA);
  await botaoSalvar(p).click();
  conferir(
    await visivel(p.getByText("Falta confirmar o e-mail novo")),
    "com a senha certa, o site avisa que falta confirmar o e-mail novo",
  );
  conferir(
    (await p.locator("#senha-email").count()) === 0 &&
      (await p.locator("#email").inputValue()) === EMAIL,
    "depois de salvar, o campo da senha some e o e-mail continua o atual",
  );
  conferir(
    await visivel(p.getByText("Troca esperando confirmação.")),
    "a conta mostra a troca esperando confirmação",
  );
  await foto(p, "2b-troca-pendente", true);
  // Abre o link do e-mail novo, na mesma aba (a conta logada).
  await p.goto(await linkDoEmail(EMAIL_NOVO, "troca"));
  await p.getByRole("heading", { name: "E-mail trocado" }).waitFor();
  conferir(true, "o link do e-mail novo faz a troca");
  await foto(p, "2c-email-trocado");
  await p.getByRole("link", { name: "Voltar para a Minha conta" }).click();
  await p.waitForURL((u) => u.pathname === "/conta");
  conferir(
    (await p.locator("#email").inputValue()) === EMAIL_NOVO &&
      !(await visivel(p.getByText("Troca esperando confirmação."))),
    "a Minha conta passa a mostrar o e-mail novo, sem o aviso",
  );
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();

  const q = await novaPagina();
  await q.goto(`${BASE}/login`);
  await q.locator("#email").fill(EMAIL);
  await q.locator("#senha").fill(SENHA);
  await q.getByRole("button", { name: "Entrar", exact: true }).click();
  conferir(
    await visivel(q.getByRole("alert")),
    "o e-mail antigo não entra mais",
  );
  await q.context().close();
}

// 3. Trocar a senha: os outros aparelhos saem
{
  const computador = await novaPagina();
  await entrar(computador, EMAIL_NOVO, SENHA);
  const celular = await novaPagina(390, 844);
  await entrar(celular, EMAIL_NOVO, SENHA);

  await celular.getByRole("button", { name: "Alterar senha" }).click();
  await celular.locator("#senha-atual").fill("nao-e-a-senha");
  await celular.locator("#senha-nova").fill(SENHA_NOVA);
  await celular.locator("#senha-confirmacao").fill(SENHA_NOVA);
  await celular.getByRole("button", { name: "Salvar senha" }).click();
  conferir(
    await visivel(celular.getByText("Senha incorreta.")),
    "senha atual errada avisa embaixo do campo",
  );
  await celular.locator("#senha-atual").fill(SENHA);
  await celular.getByRole("button", { name: "Salvar senha" }).click();
  conferir(
    await visivel(
      celular.getByText("Os outros aparelhos saíram da conta."),
    ),
    "a senha muda e a página avisa",
  );
  await foto(celular, "3-senha-alterada-celular", true);
  await celular.reload();
  conferir(
    await visivel(celular.getByRole("heading", { name: "Minha conta" })),
    "este aparelho continua logado",
  );

  // O computador ainda mostra a página, mas o crachá dele não vale mais.
  await computador.locator("#nome").fill("Fluxo Outro Nome");
  await botaoSalvar(computador).click();
  await computador.waitForURL((u) => u.pathname === "/login");
  conferir(
    await visivel(
      computador.getByText("Sua sessão terminou. Entre de novo para continuar."),
    ),
    "no outro aparelho, a próxima ação leva para Entrar, com o aviso",
  );
  await foto(computador, "4-sessao-terminou");
  await computador.locator("#email").fill(EMAIL_NOVO);
  await computador.locator("#senha").fill(SENHA_NOVA);
  await computador.getByRole("button", { name: "Entrar", exact: true }).click();
  await computador.waitForURL((u) => u.pathname === "/conta");
  conferir(true, "entrando com a senha nova, volta para a conta");
  conferir(
    computador.erros.length + celular.erros.length === 0,
    `sem erros no console (${[...computador.erros, ...celular.erros].join(" | ")})`,
  );
  await computador.context().close();
  await celular.context().close();
}

// 4. Sair de todos os aparelhos
{
  const outro = await novaPagina();
  await entrar(outro, EMAIL_NOVO, SENHA_NOVA, "/meu-perfil");
  const p = await novaPagina();
  await entrar(p, EMAIL_NOVO, SENHA_NOVA);
  await p.getByRole("button", { name: "Sair de todos os aparelhos" }).click();
  await p.waitForURL((u) => u.pathname === "/login");
  conferir(
    await visivel(
      p.getByText("Você saiu da conta em todos os aparelhos, inclusive neste."),
    ),
    "sair de todos leva para Entrar, com o aviso",
  );
  await foto(p, "5-saiu-de-todos");
  await outro.reload();
  await outro.waitForURL((u) => u.pathname === "/login");
  conferir(true, "o outro aparelho também saiu");

  // Saindo de Entrar sem entrar, o aviso não reaparece na próxima visita.
  await p.goto(`${BASE}/`);
  await p.goto(`${BASE}/login?voltar=%2Fconta`);
  await p.locator("#email").waitFor();
  conferir(
    (await p.getByText("Você saiu da conta em todos os aparelhos").count()) === 0,
    "o aviso não reaparece numa visita seguinte a Entrar",
  );
  await p.locator("#email").fill(EMAIL_NOVO);
  await p.locator("#senha").fill(SENHA_NOVA);
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/conta");
  conferir(true, "entrando de novo, volta para a conta");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await outro.context().close();
  await p.context().close();
}

// 5. Encerrar a conta
{
  const p = await novaPagina();
  await entrar(p, EMAIL_NOVO, SENHA_NOVA);
  await p.getByRole("button", { name: "Encerrar minha conta" }).click();
  const modal = p.getByRole("dialog");
  await modal.waitFor();
  // Sem a senha, o botão não fica desligado: o clique diz o que falta.
  await modal.getByRole("button", { name: "Encerrar conta" }).click();
  conferir(
    await modal
      .getByText("Digite a sua senha para confirmar o encerramento.")
      .isVisible(),
    "sem a senha, encerrar diz o que falta em vez de não fazer nada",
  );
  await p.locator("#senha-encerrar").fill("nao-e-a-senha");
  // O Enter no campo da senha envia, como o botão.
  await p.keyboard.press("Enter");
  conferir(
    await visivel(modal.getByText("Senha incorreta.")),
    "senha errada avisa e a conta continua",
  );
  await foto(p, "6-encerrar-senha-errada");
  await p.locator("#senha-encerrar").fill(SENHA_NOVA);
  await modal.getByRole("button", { name: "Encerrar conta" }).click();
  await p.waitForURL((u) => u.pathname === "/");
  await p.waitForTimeout(500);
  conferir(new URL(p.url()).pathname === "/", "a conta encerrada leva ao início");
  conferir(
    await visivel(p.getByRole("link", { name: "Entrar" })),
    "o topo volta a ser o do visitante",
  );
  await p.goBack().catch(() => {});
  await p.waitForTimeout(500);
  conferir(
    new URL(p.url()).pathname !== "/conta" || (await visivel(p.locator("#email"))),
    "voltar no navegador não reabre a conta encerrada",
  );
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();

  const q = await novaPagina();
  await q.goto(`${BASE}/login`);
  await q.locator("#email").fill(EMAIL_NOVO);
  await q.locator("#senha").fill(SENHA_NOVA);
  await q.getByRole("button", { name: "Entrar", exact: true }).click();
  conferir(await visivel(q.getByRole("alert")), "a conta encerrada não entra mais");
  await q.context().close();
}

// 6. A página da conta no celular estreito
{
  const p = await novaPagina(360, 740);
  await entrar(p, "beatriz@example.com", "ufvet-exemplo");
  await p.locator("#email").fill("outro@example.com");
  await p.locator("#senha-email").waitFor();
  const largura = await p.evaluate(() => document.documentElement.scrollWidth);
  conferir(largura <= 360, `a conta cabe em 360 px (largura da página: ${largura})`);
  await foto(p, "7-conta-celular-360", true);
  await p.context().close();
}

limparDadosDeTeste();
await navegador.close();
console.log(
  falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram",
);
process.exitCode = falhas ? 1 : 0;
