// Confere no navegador os fluxos de login e cadastro ligados à API, e
// fotografa as telas novas em ./login-fotos para olhar.
// Uso: node ambiente-e2e.mjs rodar node fluxos-login.mjs  (ver o README)
import { chromium } from "playwright-core";
import { linkDoEmail } from "./e2e-email.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from "node:url";
const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const FOTOS = "capturas/login-fotos";
mkdirSync(FOTOS, { recursive: true });

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
  // Respostas 4xx esperadas (senha errada, e-mail repetido) aparecem no
  // console do navegador como "Failed to load resource"; não são erros do site.
  p.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && p.erros.push(m.text()));
  return p;
}

// Espera o elemento aparecer (até 3 s) antes de conferir.
const visivel = (loc) => loc.first().waitFor({ timeout: 3000 }).then(() => true, () => false);

const foto = (p, nome, inteira = false) =>
  p.screenshot({ path: `${FOTOS}/${nome}.png`, fullPage: inteira });

// Roda um trecho de código no back-end (com o .env dele) e devolve a saída.
function noBackend(codigo) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", codigo], {
    cwd: BACKEND,
    encoding: "utf8",
  });
}

function criarConviteDeTeste() {
  const saida = execFileSync(
    process.execPath,
    ["scripts/convite.js", "--nome", "Teste Fluxo", "--crmv", "99998", "--uf", "MG"],
    { cwd: BACKEND, encoding: "utf8" },
  );
  return saida.match(/Código: ([A-Z0-9-]+)/)[1];
}

function limparDadosDeTeste() {
  noBackend(`
    import { banco } from "./src/banco.js";
    import { indiceEmail } from "./src/cifra.js";
    const emails = ["fluxo.tutor@example.com", "fluxo.tutor@gmial.com", "fluxo.vet@example.com"];
    await banco.usuario.deleteMany({ where: { emailIndice: { in: emails.map(indiceEmail) } } });
    await banco.conviteVeterinario.deleteMany({ where: { nome: "Teste Fluxo" } });
    await banco.$disconnect();
  `);
}

limparDadosDeTeste();

// 1. Visitante
{
  const p = await novaPagina();
  await p.goto(`${BASE}/buscar`);
  await p.getByText("Entre para ver os contatos").waitFor();
  conferir(true, "visitante vê a busca, com o aviso de que precisa de conta");
  conferir(await visivel(p.locator("header").getByRole("link", { name: "Cadastre-se" })), "o topo mostra Cadastre-se");
  await foto(p, "1-busca-visitante");

  await p.goto(`${BASE}/tutor/T7X9K2`);
  await p.getByText("Entre na sua conta para pedir a liberação a um veterinário.").waitFor();
  conferir(
    (await p.getByText("@example.com").count()) === 0,
    "visitante abre um perfil (da API) e vê o contato mascarado, com o aviso para entrar",
  );
  await foto(p, "2-perfil-visitante");

  await p.goto(`${BASE}/meu-perfil`);
  await p.waitForURL("**/login?voltar=%2Fmeu-perfil");
  conferir(true, "visitante em /meu-perfil vai para Entrar");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 2. Login
{
  const p = await novaPagina();
  await p.goto(`${BASE}/login?voltar=/conta`);
  await p.locator("#email").fill("victor@example.com");
  await p.locator("#senha").fill("senha-errada");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.getByRole("alert").waitFor();
  conferir((await p.getByRole("alert").innerText()).includes("E-mail ou senha incorretos"), "senha errada mostra a mensagem");
  await foto(p, "3-login-erro");

  await p.locator("#senha").fill("ufvet-exemplo");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/conta");
  conferir(true, "login certo volta para a página pedida (/conta)");
  conferir(await visivel(p.getByText("Victor Martins").first()), "o topo mostra o nome curto (Victor Martins)");
  conferir(!(await p.locator("main").innerText()).includes("CPF"), "a conta não mostra CPF (o cadastro não pede mais)");
  conferir(await visivel(p.getByRole("heading", { name: "Minha conta" })), "o título da página é Minha conta");
  conferir(await visivel(p.getByText("Hospital Veterinário UFV").first()), "a conta mostra o local de atuação, fixo");
  await foto(p, "4-conta-victor", true);

  await p.reload();
  await p.getByText("Victor Martins").first().waitFor();
  conferir(true, "recarregar a página mantém a pessoa logada (cookie)");

  await p.goto(`${BASE}/meu-perfil`);
  await p.getByText("Acesso aos contatos").waitFor();
  conferir(true, "o veterinário vê o painel de acesso aos contatos");
  await p.getByRole("button", { name: "Mais opções da conta" }).click();
  await foto(p, "5-menu-conta");
  await p.getByRole("menuitem", { name: "Sair" }).click();
  await p.waitForURL(`${BASE}/`);
  await p.getByRole("link", { name: "Entrar" }).first().waitFor();
  conferir(true, "Sair leva ao início, deslogado");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 3. Cadastro de tutor
{
  const p = await novaPagina();
  await p.goto(`${BASE}/cadastrar`);
  await p.getByRole("button", { name: /Sou tutor/ }).click();
  await p.getByRole("button", { name: "Continuar" }).click();
  conferir(await visivel(p.getByText("Preencha este campo.")), "Continuar vazio mostra o que falta");
  await foto(p, "6-cadastro-erros");
  await p.locator("#nome-completo").fill("Fluxo de Teste");
  conferir(
    (await p.locator("#cpf").count()) === 0 && (await p.locator("#email").count()) === 0 &&
      !(await p.locator("main").innerText()).includes("CPF"),
    "a etapa 2 pede o nome e o telefone, sem CPF nem e-mail",
  );
  await p.locator("#telefone").pressSequentially("31999991234567");
  conferir((await p.locator("#telefone").inputValue()) === "(31) 99999-1234", "o telefone ganha a máscara e para em 11 números");
  // O preenchimento automático troca o valor de uma vez, muitas vezes com o
  // +55 do Brasil na frente.
  await p.locator("#telefone").fill("+55 31 98888-7777");
  conferir(
    (await p.locator("#telefone").inputValue()) === "(31) 98888-7777" &&
      (await p.locator("#telefone").getAttribute("autocomplete")) === "tel-national",
    "o telefone que chega com +55 fica só com o DDD e o número",
  );
  await p.locator("#telefone").fill("(31) 1234-5678");
  await p.locator("#telefone").blur();
  conferir(await visivel(p.getByText("Telefone inválido. Confira o DDD e o número.")), "telefone inválido avisa ao sair do campo");
  await p.locator("#telefone").fill("(31) 99999-1234");
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.locator("#cidade").click();
  await p.waitForSelector('[role="option"]');
  await p.locator("#cidade").fill("vicosa");
  await p.keyboard.press("Enter");
  await p.locator("#bairro").fill("Centro");
  await p.keyboard.press("Enter");
  await p.getByRole("button", { name: "Continuar" }).click();

  // O e-mail fica na última etapa, junto da senha.
  await p.getByRole("heading", { name: "E-mail e senha" }).waitFor();
  await p.locator("#email").fill("beatriz@example.com");
  await p.locator("#email").blur();
  await p.getByText("Já existe uma conta com este e-mail.").waitFor({ timeout: 3000 }).catch(() => {});
  conferir(await visivel(p.getByText("Já existe uma conta com este e-mail.")), "e-mail com conta avisa ao sair do campo, na última etapa");
  // Digitado errado: "gmial".
  await p.locator("#email").fill("fluxo.tutor@gmial.com");
  await p.locator("#senha").fill("senha-de-teste");
  await p.locator("#confirmacao-senha").fill("senha-de-teste");
  await p.locator("#aceite-termos").check();
  await p.locator("#ciencia-responsabilidade").check();
  await p.getByRole("button", { name: "Finalizar cadastro" }).click();

  // Sem o e-mail confirmado, a conta não entra.
  await p.waitForURL((u) => u.pathname === "/confirmar-email");
  await p.getByRole("heading", { name: "Confirme seu e-mail" }).waitFor();
  conferir(
    (await visivel(p.getByText("fluxo.tutor@gmial.com"))) &&
      (await visivel(p.getByText(/olhe no spam/))),
    "o cadastro termina pedindo para abrir o e-mail, com o aviso do spam",
  );

  // O e-mail errado se corrige ali mesmo, sem refazer o cadastro.
  const linkDoErrado = await linkDoEmail("fluxo.tutor@gmial.com", "confirmacao");
  await p.getByRole("button", { name: "Corrigir o e-mail" }).click();
  conferir(
    (await p.locator("#email-certo").inputValue()) === "fluxo.tutor@gmial.com",
    "corrigir: o campo já vem com o e-mail digitado, para consertar só o erro",
  );
  await p.locator("#email-certo").fill("fluxo.tutor@example.com");
  await foto(p, "7z-corrigindo");
  await p.getByRole("button", { name: "Mandar para este e-mail" }).click();
  await p.getByText("E-mail corrigido.", { exact: false }).waitFor();
  conferir(
    (await visivel(p.getByText("fluxo.tutor@example.com"))) && (await p.getByText("fluxo.tutor@gmial.com").count()) === 0,
    "corrigido, a tela mostra o e-mail certo",
  );
  await foto(p, "7y-corrigido");
  const outra = await novaPagina();
  await outra.goto(linkDoErrado);
  await outra.getByRole("heading", { name: "Este link não vale mais" }).waitFor();
  conferir(true, "o link mandado para o e-mail errado não vale mais");
  await outra.context().close();
  await foto(p, "7a-confirme-o-email");
  await p.getByRole("button", { name: "Mandar de novo" }).click();
  await p.getByText(/Mandamos outro link às [0-9]{2}:[0-9]{2}/).waitFor();
  conferir(true, "o botão manda o link de novo e diz para onde");

  await p.goto(`${BASE}/login`);
  await p.locator("#email").fill("fluxo.tutor@example.com");
  await p.locator("#senha").fill("senha-de-teste");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.getByText(/Falta confirmar o seu e-mail/).waitFor();
  conferir(
    await visivel(p.getByRole("button", { name: "Mandar o link de novo" })),
    "sem confirmar, a senha certa não entra, e a página oferece o link de novo",
  );
  await foto(p, "7b-login-sem-confirmar");

  await p.goto(await linkDoEmail("fluxo.tutor@example.com", "confirmacao"));
  await p.getByRole("heading", { name: "E-mail confirmado" }).waitFor();
  conferir(new URL(p.url()).hash === "", "o código do link sai da barra de endereço");
  await foto(p, "7c-email-confirmado");
  await p.getByRole("link", { name: "Entrar" }).last().click();
  await p.waitForURL((u) => u.pathname === "/login");
  conferir(
    (await p.locator("#email").inputValue()) === "fluxo.tutor@example.com",
    "a página de entrar já vem com o e-mail confirmado",
  );
  await p.locator("#senha").fill("senha-de-teste");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/meu-perfil");
  conferir(
    (await visivel(p.locator("main").getByText("Tutor(a)", { exact: true }))) &&
      (await visivel(p.locator("main").getByText("Viçosa - MG", { exact: true }))),
    "a conta nova abre no perfil, como Tutor(a), em Viçosa",
  );
  await foto(p, "7-perfil-tutor-novo");

  // E-mail repetido: volta para a etapa 2 com a mensagem no campo.
  await p.getByRole("button", { name: "Mais opções da conta" }).click();
  await p.getByRole("menuitem", { name: "Sair" }).click();
  await p.goto(`${BASE}/cadastrar`);
  await p.getByRole("button", { name: /Sou tutor/ }).click();
  await p.locator("#nome-completo").fill("Outra Pessoa");
  await p.locator("#telefone").fill("(31) 98888-7777");
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.locator("#cidade").click();
  await p.waitForSelector('[role="option"]');
  await p.locator("#cidade").fill("vicosa");
  await p.keyboard.press("Enter");
  await p.locator("#bairro").fill("Centro");
  await p.keyboard.press("Enter");
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.locator("#email").fill("fluxo.tutor@example.com");
  await p.locator("#senha").fill("outra-senha-123");
  await p.locator("#confirmacao-senha").fill("outra-senha-123");
  await p.locator("#aceite-termos").check();
  await p.locator("#ciencia-responsabilidade").check();
  await p.getByRole("button", { name: "Finalizar cadastro" }).click();
  await p.getByText("Já existe uma conta com este e-mail.").waitFor();
  conferir(await visivel(p.getByRole("heading", { name: "E-mail e senha" })), "a conta recém-criada já conta como e-mail repetido, e a página fica na etapa do e-mail");
  await foto(p, "8-email-repetido");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 4. Cadastro de veterinária com convite
{
  const codigo = criarConviteDeTeste();
  const p = await novaPagina();
  await p.goto(`${BASE}/cadastrar`);
  await p.getByRole("button", { name: /Sou veterinário/ }).click();
  await p.locator("#nome-completo").fill("Ana Fluxo Souza");
  await p.locator("#telefone").fill("(31) 98888-1234");
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.locator("#cidade").click();
  await p.waitForSelector('[role="option"]');
  await p.locator("#cidade").fill("vicosa");
  await p.keyboard.press("Enter");
  await p.locator("#bairro").fill("Centro");
  await p.keyboard.press("Enter");
  await p.getByRole("button", { name: "Continuar" }).click();

  await p.locator("#convite").fill("ABCD-EFGH");
  await p.getByText("Convite inválido").waitFor();
  conferir(true, "código inventado mostra que o convite é inválido");
  await p.locator("#convite").fill(codigo.toLowerCase().replace("-", ""));
  await p.getByText("Convite para Teste Fluxo").waitFor();
  conferir((await p.locator("#convite").inputValue()) === codigo, "o código digitado ganha maiúsculas e o traço");
  conferir(await visivel(p.getByText("CRMV 99998-MG, no Hospital Veterinário UFV.")), "o cartão mostra o CRMV e o local do convite");
  await p.getByRole("button", { name: "Dra." }).click();
  await foto(p, "9-convite-valido");
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.locator("#email").fill("fluxo.vet@example.com");
  await p.locator("#senha").fill("senha-de-teste");
  await p.locator("#confirmacao-senha").fill("senha-de-teste");
  await p.locator("#aceite-termos").check();
  await p.locator("#ciencia-responsabilidade").check();
  await p.getByRole("button", { name: "Finalizar cadastro" }).click();
  await p.waitForURL((u) => u.pathname === "/confirmar-email");
  await p.goto(await linkDoEmail("fluxo.vet@example.com", "confirmacao"));
  await p.getByRole("heading", { name: "E-mail confirmado" }).waitFor();
  await p.getByRole("link", { name: "Entrar" }).last().click();
  await p.locator("#senha").fill("senha-de-teste");
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/meu-perfil");
  conferir(
    (await visivel(p.locator("main").getByText("Veterinária", { exact: true }))) &&
      (await visivel(p.locator("main").getByText("Hospital Veterinário UFV", { exact: true }))),
    "a conta nova é de Veterinária, no HV-UFV",
  );
  conferir(
    await visivel(p.locator("main").getByText("99998-MG", { exact: true })),
    "o perfil mostra o CRMV do convite",
  );
  await foto(p, "10-perfil-vet-novo", true);
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 5. Topo do visitante no celular estreito
{
  const p = await novaPagina(360, 740);
  await p.goto(`${BASE}/`);
  await p.getByRole("link", { name: "Cadastre-se" }).first().waitFor();
  const largura = await p.evaluate(() => document.documentElement.scrollWidth);
  conferir(largura <= 360, `o topo do visitante cabe em 360 px (largura da página: ${largura})`);
  await foto(p, "11-topo-celular-360");
  await p.context().close();
}

limparDadosDeTeste();
await navegador.close();
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
