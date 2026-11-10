// Confere no navegador os animais do próprio perfil ligados à API: listar,
// cadastrar (com data e com idade estimada), editar, mudar a disponibilidade
// e excluir. Uso: node fluxos-animais.mjs (site em :5173 e API em :3000).
import { chromium } from "playwright-core";
import { confirmarEEntrarPelaApi } from "./e2e-email.mjs";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

import { fileURLToPath } from "node:url";
const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const FOTOS = "capturas/animais-fotos";
mkdirSync(FOTOS, { recursive: true });

const EMAIL = "fluxo.animais@example.com";
const SENHA = "senha-do-fluxo";

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
    .waitFor({ timeout: 4000 })
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
    await banco.usuario.deleteMany({ where: { emailIndice: indiceEmail("${EMAIL}") } });
    await banco.$disconnect();
  `);
}

async function criarConta(p) {
  const resposta = await p.context().request.post(`${BASE}/api/usuarios`, {
    data: {
      papel: "TUTOR",
      nomeCompleto: "Fluxo dos Animais",
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

async function entrar(p, email, senha) {
  await p.goto(`${BASE}/login?voltar=%2Fmeu-perfil`);
  await p.locator("#email").fill(email);
  await p.locator("#senha").fill(senha);
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => u.pathname === "/meu-perfil");
}

const escolher = (modal, grupo, opcao) =>
  modal
    .getByRole("group", { name: grupo })
    .getByRole("button", { name: opcao, exact: true })
    .click();

// Quantos animais o perfil mostra: as abas do carrossel ou, sem carrossel,
// o texto "N animais cadastrados".
// Sem carrossel: com nenhum animal, o texto "0 animais cadastrados"; com um
// só, o cartão dele (no próprio perfil, o topo mostra o botão de cadastrar).
async function quantosAnimais(p) {
  const texto = p.getByText(/^\d+ anima(l|is) cadastrados?$/);
  const tabs = p.getByRole("tablist");
  const cartao = p.getByRole("article");
  await texto.or(tabs).or(cartao).first().waitFor();
  // No próprio perfil, a primeira aba é o cartão de cadastrar: não conta.
  if (await tabs.count()) {
    return (
      (await p.getByRole("tab").count()) -
      (await p.getByRole("tab", { name: "Cadastrar animal", exact: true }).count())
    );
  }
  if (await texto.count()) return Number((await texto.innerText()).split(" ")[0]);
  return cartao.count();
}
// O cadastro: o botão grande (sem animais) ou o cartão de cadastrar, a
// primeira aba do carrossel.
const abrirCadastro = (p) =>
  p
    .getByRole("button", { name: /^Cadastrar (novo )?animal/ })
    .or(p.getByRole("tab", { name: "Cadastrar animal", exact: true }))
    .first()
    .click();

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

limparDadosDeTeste();

// 1. Conta de exemplo: os animais vêm do banco, com o histórico do exemplo
{
  const p = await novaPagina();
  await entrar(p, "beatriz@example.com", "ufvet-exemplo");
  conferir(
    await visivel(p.getByRole("heading", { name: "Zeus" })),
    "a Beatriz vê o Zeus, vindo da API",
  );
  conferir(
    (await quantosAnimais(p)) === 2,
    "e a contagem diz 2 animais",
  );
  conferir(
    await visivel(p.getByText("DEA 1.1+")),
    "o Zeus continua com o tipo e o histórico do exemplo",
  );
  await foto(p, "1-beatriz-animais");
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 2. Cadastrar
{
  const p = await novaPagina();
  await criarConta(p);
  await p.goto(`${BASE}/meu-perfil`);
  await quantosAnimais(p);
  conferir(
    (await quantosAnimais(p)) === 0,
    "conta nova começa sem animais",
  );

  await abrirCadastro(p);
  const modal = p.getByRole("dialog");
  await modal.getByRole("button", { name: "Cadastrar animal" }).click();
  conferir(
    (await visivel(modal.getByText("Preencha este campo."))) &&
      (await visivel(modal.getByText("Escolha macho ou fêmea."))) &&
      (await visivel(modal.getByText("Informe o peso em kg."))),
    "enviar vazio aponta o que falta, embaixo de cada campo",
  );
  await foto(p, "2-cadastro-erros");

  await p.locator("#animal-nome").fill("Rex");
  await escolher(modal, "Sexo", "Macho");
  await escolher(modal, "Castrado(a)?", "Sim");
  await modal.getByText("SRD / Não sei a raça").click();
  await p.locator("#animal-nascimento").fill("2022-05-10");
  await p.locator("#animal-peso").fill("30");
  await modal.getByRole("button", { name: "Cadastrar animal" }).click();
  await modal.waitFor({ state: "detached" });
  conferir(
    await visivel(p.getByRole("heading", { name: "Rex" })),
    "o Rex aparece no perfil",
  );
  conferir(
    await visivel(p.getByText("Rex cadastrado")),
    "a confirmação diz que o Rex foi cadastrado",
  );
  conferir(
    (await quantosAnimais(p)) === 1,
    "a contagem passa para 1",
  );

  // Com idade estimada.
  await abrirCadastro(p);
  await p.locator("#animal-nome").fill("Mia");
  await escolher(modal, "Espécie", "Gato");
  await escolher(modal, "Sexo", "Fêmea");
  await escolher(modal, "Castrado(a)?", "Não");
  await escolher(modal, "Como informar a idade", "Estimar");
  await p.locator("#animal-idade").fill("3");
  await p.locator("#animal-peso").fill("4.5");
  await modal.getByRole("button", { name: "Cadastrar animal" }).click();
  await modal.waitFor({ state: "detached" });
  conferir(
    await visivel(p.getByText("Cerca de 3 anos")),
    "a idade estimada aparece como aproximada (Cerca de 3 anos)",
  );

  await p.reload();
  await quantosAnimais(p);
  conferir(
    (await quantosAnimais(p)) === 2 &&
      (await visivel(p.getByRole("heading", { name: "Mia" }))),
    "recarregando, os dois continuam (vieram da API)",
  );
  await foto(p, "3-dois-animais", true);
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 3. Editar, disponibilidade e excluir
{
  const p = await novaPagina();
  await entrar(p, EMAIL, SENHA);
  await quantosAnimais(p);

  // A Mia, com idade estimada, abre sem mostrar a data aproximada.
  await abrirAnimal(p, "Mia");
  await p.getByRole("button", { name: "Editar Mia" }).click();
  const modal = p.getByRole("dialog");
  conferir(
    (await p.locator("#animal-idade").inputValue()) === "3",
    "editando a Mia, o formulário abre na idade estimada (3), sem a data",
  );
  await modal.getByRole("button", { name: "Cancelar" }).click();

  await abrirAnimal(p, "Rex");
  await p.getByRole("button", { name: "Editar Rex" }).click();
  await p.locator("#animal-peso").fill("33");
  await modal.getByRole("button", { name: "Salvar alterações" }).click();
  await modal.waitFor({ state: "detached" });
  conferir(await visivel(p.getByText("33 kg")), "o peso novo aparece no cartão");

  // A disponibilidade agora é uma chave de duas opções embaixo da foto.
  const chaveDoRex = () =>
    p.getByRole("group", { name: "Disponibilidade de Rex para doação" });
  const indisponivelMarcado = async () =>
    (await chaveDoRex()
      .getByRole("button", { name: "Indisponível", exact: true })
      .getAttribute("aria-pressed")) === "true";

  await chaveDoRex()
    .getByRole("button", { name: "Indisponível", exact: true })
    .click();
  conferir(
    (await visivel(p.getByText("Rex saiu da busca"))) &&
      (await indisponivelMarcado()),
    "a chave tira o Rex da busca",
  );

  await p.reload();
  await quantosAnimais(p);
  conferir(
    (await visivel(p.getByText("33 kg"))) && (await indisponivelMarcado()),
    "recarregando, o peso e a disponibilidade continuam",
  );

  await abrirAnimal(p, "Mia");
  await p.getByRole("button", { name: "Excluir Mia" }).click();
  await foto(p, "4-excluir-mia");
  await modal.getByRole("button", { name: "Excluir Mia" }).click();
  await modal.waitFor({ state: "detached" });
  conferir(
    (await p.getByRole("heading", { name: "Mia" }).count()) === 0 &&
      (await quantosAnimais(p)) === 1,
    "a Mia sai do perfil",
  );
  conferir(
    await visivel(p.getByText("Mia excluída")),
    "a confirmação diz que a Mia foi excluída, no feminino",
  );
  await p.reload();
  await quantosAnimais(p);
  conferir(
    (await p.getByRole("heading", { name: "Mia" }).count()) === 0,
    "recarregando, a Mia continua excluída",
  );
  conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
  await p.context().close();
}

// 4. API fora do ar: a página avisa e deixa tentar de novo
{
  const p = await novaPagina();
  await entrar(p, EMAIL, SENHA);
  await quantosAnimais(p);
  await p.route("**/api/usuarios/*/animais", (rota) => rota.abort());
  await p.reload();
  conferir(
    await visivel(p.getByText("Não foi possível falar com o servidor")),
    "sem resposta da API, a página avisa",
  );
  conferir(
    (await p.getByText("–", { exact: true }).count()) === 2,
    "sem a lista, o cartão do perfil mostra traços, não zeros",
  );
  await foto(p, "5-sem-api");
  await p.unroute("**/api/usuarios/*/animais");
  await p.getByRole("button", { name: "Tentar de novo" }).click();
  conferir(
    await visivel(p.getByRole("heading", { name: "Rex" })),
    "Tentar de novo busca a lista e mostra o Rex",
  );
  await p.context().close();
}

// 5. Perfil de outra pessoa (o Lucas, do banco)
{
  const p = await novaPagina();
  await p.goto(`${BASE}/tutor/T7X9K2`);
  conferir(
    await visivel(p.getByRole("heading", { name: "Thor" })),
    "o perfil visitado mostra os animais do Lucas, vindos do banco",
  );
  conferir(
    (await p.getByRole("button", { name: /^Editar / }).count()) === 0,
    "e sem botões de editar",
  );
  await p.context().close();
}

// 6. Celular estreito
{
  const p = await novaPagina(360, 740);
  await entrar(p, EMAIL, SENHA);
  await quantosAnimais(p);
  const largura = await p.evaluate(() => document.documentElement.scrollWidth);
  conferir(largura <= 360, `o perfil cabe em 360 px (largura: ${largura})`);
  // Quando passa, diz quem passou da borda (os de cima, sem os de dentro).
  if (largura > 360) {
    const culpados = await p.evaluate(() => {
      const achados = [];
      for (const el of document.querySelectorAll("body *")) {
        const b = el.getBoundingClientRect();
        if (!b.width || b.right <= 360.5) continue;
        if (achados.some((a) => a.el.contains(el))) continue;
        achados.push({ el, b });
      }
      return achados.slice(0, 8).map(({ el, b }) =>
        `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 120)} → ${Math.round(b.right)}px; pai overflow-x: ${getComputedStyle(el.parentElement).overflowX} [${(el.innerText || "").replace(/\s+/g, " ").slice(0, 40)}]`);
    });
    for (const c of culpados) console.log("        passa: " + c);
  }
  await abrirCadastro(p);
  await p.getByRole("dialog").waitFor();
  await foto(p, "6-cadastro-celular");
  await p.context().close();
}

limparDadosDeTeste();
await navegador.close();
console.log(
  falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram",
);
process.exitCode = falhas ? 1 : 0;
