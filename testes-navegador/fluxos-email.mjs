// Os caminhos dos links que o UFVet manda por e-mail, no navegador:
// "Esqueceu a senha?" do começo ao fim, links vencidos e cortados, a espera
// da confirmação sem o e-mail na memória, a acessibilidade (axe-core) e as
// larguras de celular. Fotos em ./email-fotos.
// Uso: node ambiente-e2e.mjs rodar node fluxos-email.mjs
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { confirmarEEntrarPelaApi, linkDoEmail } from "./e2e-email.mjs";

import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const FOTOS = "capturas/email-fotos";
mkdirSync(FOTOS, { recursive: true });

const EMAIL = "fluxo.email@example.com";
const SENHA = "senha-do-fluxo";
const SENHA_NOVA = "senha-nova-do-fluxo";

const navegador = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK     " : "FALHOU "} ${texto}`);
};
const visivel = (loc) => loc.first().waitFor({ timeout: 4000 }).then(() => true, () => false);
const foto = (p, nome) => p.screenshot({ path: `${FOTOS}/${nome}.png` });

async function novaPagina(largura = 1280, altura = 900) {
  const celular = largura < 640;
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: altura },
    isMobile: celular,
    hasTouch: celular,
    locale: "pt-BR",
    reducedMotion: "reduce",
  });
  const p = await contexto.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  p.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && p.erros.push(m.text()));
  return p;
}

function noBackend(codigo) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", codigo], { cwd: BACKEND, encoding: "utf8" });
}

function apagarConta() {
  noBackend(`
    import { banco } from "./src/banco.js";
    import { indiceEmail } from "./src/cifra.js";
    await banco.usuario.deleteMany({ where: { emailIndice: indiceEmail("${EMAIL}") } });
    await banco.$disconnect();
  `);
}

async function acessibilidade(p, nome) {
  // A axe-core lê o texto da tela: antes de a fonte dos ícones carregar, a
  // lupa ainda é a palavra "search" e o nome do link pareceria errado.
  await p.evaluate(() => document.fonts.ready);
  await p
    .waitForFunction(() => document.fonts.check('20px "Material Symbols Outlined"'), null, { timeout: 10000 })
    .catch(() => {});
  await p.addScriptTag({ path: AXE });
  const { violations } = await p.evaluate(() => window.axe.run(document, { resultTypes: ["violations"] }));
  // O "Vet" vermelho do logotipo, no topo escuro, fica de fora: logotipos não
  // têm exigência de contraste (WCAG 1.4.3), e ele é igual em todo o site.
  const graves = violations
    .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !n.html.includes(">Vet<")) }))
    .filter((v) => v.nodes.length > 0 && ["serious", "critical"].includes(v.impact));
  conferir(graves.length === 0, `${nome}: sem problemas graves de acessibilidade (${graves.map((v) => v.id).join(", ")})`);
  for (const v of graves) {
    for (const n of v.nodes) console.log(`        ${v.id}: ${n.html.slice(0, 200)}`);
  }
}

const largura = (p) => p.evaluate(() => document.documentElement.scrollWidth);

try {
  apagarConta();

  // Uma conta confirmada, pela API.
  {
    const p = await novaPagina();
    const resposta = await p.context().request.post(`${BASE}/api/usuarios`, {
      data: {
        papel: "TUTOR",
        nomeCompleto: "Fluxo do Email",
        email: EMAIL,
        telefone: "(31) 99999-7788",
        cidade: "Viçosa - MG",
        bairro: "Centro",
        senha: SENHA,
        aceiteTermos: true,
        cienciaResponsabilidade: true,
      },
    });
    if (resposta.status() !== 201) throw new Error(`cadastro falhou: ${await resposta.text()}`);
    await confirmarEEntrarPelaApi(p.context(), BASE, EMAIL, SENHA);
    await p.context().close();
  }

  // 1. Esqueceu a senha, do começo ao fim.
  {
    const p = await novaPagina();
    await p.goto(`${BASE}/login`);
    await p.locator("#email").fill(EMAIL);
    await p.getByRole("link", { name: "Esqueceu a senha?" }).click();
    await p.waitForURL((u) => u.pathname === "/esqueci-a-senha");
    conferir((await p.locator("#email").inputValue()) === EMAIL, "esqueceu a senha: o e-mail digitado no login vem junto");
    await acessibilidade(p, "esqueceu a senha");
    await foto(p, "1-esqueci");

    await p.locator("#email").fill("nao-e-email");
    await p.getByRole("button", { name: "Mandar o link" }).click();
    conferir(await visivel(p.getByText("Informe um e-mail válido.")), "esqueceu a senha: e-mail mal escrito avisa no campo");
    await p.locator("#email").fill(EMAIL);
    await p.getByRole("button", { name: "Mandar o link" }).click();
    await p.getByRole("heading", { name: "Confira seu e-mail" }).waitFor();
    conferir(
      (await visivel(p.getByText(/Se houver uma conta com/))) && (await visivel(p.getByText(/olhe no spam/))),
      "esqueceu a senha: a tela diz 'se houver uma conta', a validade e o aviso do spam",
    );
    await acessibilidade(p, "confira seu e-mail");
    await foto(p, "2-confira");

    await p.goto(await linkDoEmail(EMAIL, "senha"));
    await p.getByRole("heading", { name: "Crie uma senha nova" }).waitFor();
    conferir(new URL(p.url()).hash === "", "senha nova: o código sai da barra de endereço");
    await acessibilidade(p, "senha nova");
    await p.locator("#senha").fill(SENHA_NOVA);
    await p.locator("#confirmacao-senha").fill("outra-coisa");
    await p.getByRole("button", { name: "Salvar senha nova" }).click();
    conferir(await visivel(p.getByText("As duas senhas estão diferentes.")), "senha nova: senhas diferentes avisam no campo");
    await foto(p, "3-senha-nova-erro");
    await p.locator("#confirmacao-senha").fill(SENHA_NOVA);
    await p.getByRole("button", { name: "Salvar senha nova" }).click();
    await p.getByRole("heading", { name: "Senha nova criada" }).waitFor();
    conferir(true, "senha nova: criada");
    await foto(p, "4-senha-criada");
    await p.getByRole("link", { name: "Entrar" }).last().click();
    await p.waitForURL((u) => u.pathname === "/login");
    conferir((await p.locator("#email").inputValue()) === EMAIL, "depois da senha nova, entrar já vem com o e-mail");
    await p.locator("#senha").fill(SENHA);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    conferir(await visivel(p.getByText("E-mail ou senha incorretos.")), "a senha antiga não entra mais");
    await p.locator("#senha").fill(SENHA_NOVA);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await p.waitForURL((u) => u.pathname === "/meu-perfil");
    conferir(true, "a senha nova entra");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 2. Links que não valem.
  {
    const p = await novaPagina();
    await p.goto(`${BASE}/confirmar-email#${"A".repeat(43)}`);
    await p.getByRole("heading", { name: "Este link não vale mais" }).waitFor();
    conferir(await visivel(p.getByText(/receber outro/)), "confirmar: código que não existe diz que o link não vale e como receber outro");
    await acessibilidade(p, "link que não vale");
    await foto(p, "5-link-invalido");

    await p.goto(`${BASE}/confirmar-email#Ab3`);
    await p.reload();
    await p.getByRole("heading", { name: "Este link está incompleto" }).waitFor();
    conferir(true, "confirmar: link cortado diz que está incompleto");

    await p.goto(`${BASE}/nova-senha`);
    await p.getByRole("heading", { name: "Abra o link do e-mail" }).waitFor();
    conferir(await visivel(p.getByRole("link", { name: "Pedir um link novo" })), "senha nova sem link explica e leva a pedir um");

    // O link de senha já usado.
    await p.goto(await linkDoEmail(EMAIL, "senha"));
    await p.locator("#senha").fill("mais-uma-senha");
    await p.locator("#confirmacao-senha").fill("mais-uma-senha");
    await p.getByRole("button", { name: "Salvar senha nova" }).click();
    await p.getByRole("heading", { name: "Este link não vale mais" }).waitFor();
    conferir(await visivel(p.getByRole("link", { name: "Pedir um link novo" })), "senha nova: link já usado não vale, e há como pedir outro");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 3. A espera da confirmação sem o e-mail (a pessoa abriu a página direto).
  {
    const p = await novaPagina();
    await p.goto(`${BASE}/confirmar-email`);
    await p.getByRole("heading", { name: "Confirme seu e-mail" }).waitFor();
    await p.getByRole("button", { name: "Mandar o link de novo" }).click();
    conferir(await visivel(p.getByText("Informe um e-mail válido.")), "espera sem e-mail: pede o e-mail antes de mandar");
    await p.locator("#email").fill("alguem@example.com");
    await p.getByRole("button", { name: "Mandar o link de novo" }).click();
    conferir(await visivel(p.getByText(/Se houver um cadastro esperando confirmação/)), "espera sem e-mail: o aviso diz 'se houver', sem garantir o envio");
    await acessibilidade(p, "confirme seu e-mail");
    await foto(p, "6-espera-sem-email");
    await p.context().close();
  }

  // 4. No celular estreito, nada passa da largura.
  for (const [caminho, titulo] of [
    ["/confirmar-email", "Confirme seu e-mail"],
    ["/esqueci-a-senha", "Esqueceu a senha?"],
    [`/confirmar-email#${"B".repeat(43)}`, "Este link não vale mais"],
  ]) {
    const p = await novaPagina(360, 760);
    await p.goto(`${BASE}${caminho}`);
    await p.getByRole("heading", { name: titulo }).waitFor();
    const l = await largura(p);
    conferir(l <= 360, `360 px: ${titulo} cabe na tela (${l}px)`);
    await foto(p, `7-celular-${titulo.replace(/\W+/g, "-")}`);
    await p.context().close();
  }
} finally {
  apagarConta();
  await navegador.close();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
process.exitCode = falhas ? 1 : 0;
