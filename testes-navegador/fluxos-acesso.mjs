import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

import { fileURLToPath } from "node:url";
// O acesso aos contatos de ponta a ponta, com as contas de exemplo:
// a Beatriz pede, o Victor libera e recusa, confere tutores no modal, renova
// e encerra; o Paulo vê só o que é dele. No fim, devolve o banco ao estado
// dos exemplos (npm run db:exemplos).
// Uso: node ambiente-e2e.mjs rodar node fluxos-acesso.mjs  (ver o README)

const BASE = process.env.BASE ?? "http://localhost:5173";
const BACKEND = fileURLToPath(new URL("../backend", import.meta.url));
const RESETAR = new URL("./resetar-acessos.mjs", import.meta.url).pathname.replace(/^\//, "");

// Começa e termina no estado dos exemplos: encerra o que uma rodada
// anterior (interrompida) deixou e recria os exemplos.
function voltarAosExemplos() {
  execSync(`node "${decodeURIComponent(RESETAR)}"`, { cwd: BACKEND, stdio: "ignore" });
  execSync("npm run db:exemplos", { cwd: BACKEND, stdio: "ignore" });
}
voltarAosExemplos();
const FOTOS = "capturas/acesso";
mkdirSync(FOTOS, { recursive: true });
const nav = await chromium.launch({ channel: "msedge" });
let falhas = 0;
const conferir = (ok, texto) => {
  if (!ok) falhas++;
  console.log(`${ok ? "OK  " : "FALHA"}  ${texto}`);
};
const visivel = (l) => l.first().isVisible().catch(() => false);

async function entrar(email) {
  const ctx = await nav.newContext({ viewport: { width: 1380, height: 900 }, locale: "pt-BR", reducedMotion: "reduce" });
  const p = await ctx.newPage();
  p.erros = [];
  p.on("pageerror", (e) => p.erros.push(e.message));
  p.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load") && p.erros.push(m.text()));
  await p.goto(`${BASE}/login`);
  await p.getByPlaceholder("seu@email.com").fill(email);
  await p.getByPlaceholder("Sua senha").fill("ufvet-exemplo");
  await p.locator('button[type="submit"]').click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  return p;
}
const faixa = (p) => p.locator('section[aria-label="Acesso aos contatos"]');
const painel = (p) => p.locator("section", { has: p.getByRole("heading", { name: "Acesso aos contatos" }) });

try {
  // 1. A Beatriz pede a liberação ao Victor, pela busca
  {
    const p = await entrar("beatriz@example.com");
    await p.goto(`${BASE}/buscar`);
    await faixa(p).getByText("Você ainda não vê os contatos").waitFor();
    await faixa(p).getByRole("button", { name: "Pedir liberação" }).click();
    const modal = p.getByRole("dialog");

    await p.locator("#codigo-vet").fill("T7X9K2");
    await modal.getByText("é de um tutor").waitFor();
    conferir(true, "o código de um tutor no lugar do veterinário diz o que aconteceu");

    await p.locator("#codigo-vet").fill("");
    await modal.getByRole("combobox", { name: "Local do atendimento" }).click();
    await p.getByRole("option", { name: /Hospital Veterinário UFV/ }).click();
    await modal.getByText("Victor Hugo Martins").waitFor();
    conferir(await visivel(modal.getByText("Paulo Rezende")), "escolhendo o hospital, aparecem os veterinários dele (Paulo e Victor)");
    await modal.getByRole("button", { name: /Victor Hugo Martins/ }).click();
    await modal.getByText("CRMV 78120-MG").waitFor();
    conferir(true, "escolher na lista preenche o código e mostra o cartão do Victor");

    await modal.getByRole("button", { name: "Enviar pedido" }).click();
    conferir(await visivel(modal.getByText(/Conte o que está acontecendo, com pelo menos 5/)), "enviar sem contar o caso diz o que falta");
    await p.locator("#caso-pedido").fill("Luna precisa de transfusão hoje no HV-UFV");
    await p.screenshot({ path: `${FOTOS}/1-pedido.png` });
    await modal.getByRole("button", { name: "Enviar pedido" }).click();
    await modal.waitFor({ state: "detached" });
    conferir(await visivel(p.getByText("Pedido enviado para Dr. Victor")), "o aviso embaixo confirma o pedido");
    conferir(await visivel(faixa(p).getByText("Pedido enviado para Dr. Victor")), "a faixa da busca passa a dizer que o pedido foi enviado");
    await p.reload();
    await faixa(p).getByText("Pedido enviado para Dr. Victor").waitFor();
    conferir(true, "recarregando, o pedido continua (veio do banco)");
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 2. O Victor responde: libera a Beatriz, recusa o Lucas, confere tutores
  {
    const p = await entrar("victor@example.com");
    await p.goto(`${BASE}/meu-perfil`);
    await painel(p).getByText("2 tutores esperando liberação").waitFor();
    conferir(true, "o painel do Victor mostra os 2 pedidos (Lucas e Beatriz)");
    await p.screenshot({ path: `${FOTOS}/2-painel-victor.png`, fullPage: false });
    const pedidoDaBeatriz = painel(p).locator("li", { hasText: "Beatriz dos Reis" });
    await pedidoDaBeatriz.getByRole("button", { name: /Liberar 3 dias/ }).click();
    await p.getByText("Acesso liberado para Beatriz").waitFor();
    await painel(p).getByText("1 tutor esperando liberação").waitFor();
    conferir(await visivel(painel(p).locator("li", { hasText: "Beatriz dos Reis" }).getByRole("button", { name: "Encerrar" })), "liberar o pedido leva a Beatriz para a lista de liberações");

    await painel(p).locator("li", { hasText: "Lucas Silva Delgado" }).getByRole("button", { name: "Recusar" }).click();
    await p.getByText("Pedido de Lucas recusado").waitFor();
    conferir(!(await visivel(painel(p).getByText(/esperando liberação/))), "recusar tira o pedido do Lucas da lista");

    // Conferência antes de liberar
    await painel(p).getByRole("button", { name: "Liberar acesso" }).click();
    const modal = p.getByRole("dialog");
    await p.locator("#codigo-tutor").fill("T5W2K6");
    await modal.getByText(/Já está com acesso liberado por Dr\. Paulo/).waitFor();
    conferir(true, "a Camila aparece como já liberada pelo Dr. Paulo (outro veterinário)");
    await modal.getByRole("button", { name: "Liberar acesso" }).click();
    conferir(await visivel(modal.getByText(/já tem o acesso liberado/)), "tentar liberar quem já tem acesso explica por que não");
    await p.locator("#codigo-tutor").fill("V9P3R7");
    await modal.getByText(/é de um veterinário/).waitFor();
    conferir(true, "o código de um veterinário diz que ele já vê os contatos");
    await p.locator("#codigo-tutor").fill("TZZZZZ");
    await modal.getByText(/Nenhum tutor com o código #TZZZZZ/).waitFor();
    conferir(true, "um código que ninguém usa diz que não existe");
    await p.locator("#codigo-tutor").fill("T7X9K2");
    await modal.getByText("Thor (cão), Frajola (gato) e Bolt (cão)").waitFor();
    conferir(true, "o Lucas aparece com os animais dele numa frase, antes de confirmar");
    const prazos = modal.getByRole("group", { name: "Por quanto tempo" });
    await prazos.getByRole("button", { name: "24 horas" }).click();
    await prazos.getByRole("button", { name: "24 horas", pressed: true }).waitFor();
    await p.screenshot({ path: `${FOTOS}/3-conferencia.png` });
    await modal.getByRole("button", { name: "Liberar acesso" }).click();
    await modal.waitFor({ state: "detached" });
    await p.getByText("Acesso liberado para Lucas").waitFor();
    const linhaDoLucas = painel(p).locator("li", { hasText: "Lucas Silva Delgado" });
    const prazoDoLucas = await linhaDoLucas.getByText(/expira em/).innerText();
    conferir(/expira em 2[34] horas/.test(prazoDoLucas), `liberar pelo código põe o Lucas na lista, com o prazo escolhido de 24 horas (${prazoDoLucas})`);

    // Renovar e encerrar
    const linhaDoPedro = painel(p).locator("li", { hasText: "Pedro Alves" });
    await linhaDoPedro.getByRole("button", { name: "Renovar" }).click();
    const menu = p.getByRole("menu", { name: "Renovar o acesso de Pedro Alves" });
    await menu.getByText(/Hoje o acesso termina/).waitFor();
    const opcoes = await menu.getByRole("menuitem").evaluateAll((itens) => itens.map((i) => [i.innerText.replace(/\s+/g, " "), i.disabled]));
    conferir(opcoes.length === 3 && opcoes.every(([texto, desligada]) => /até [^,\s]{3}, \d{2}\/\d{2} às \d{2}:\d{2}/.test(texto) && !desligada), `renovar abre os 3 prazos, cada um com o dia em que terminaria (${opcoes.map((o) => o[0]).join(" | ")})`);
    await p.screenshot({ path: `${FOTOS}/6-menu-renovar.png` });
    await menu.getByRole("menuitem", { name: /7 dias/ }).click();
    await p.getByText(/Acesso de Pedro renovado até/).waitFor();
    const prazoDoPedro = await painel(p).locator("li", { hasText: "Pedro Alves" }).getByText(/expira em/).innerText();
    conferir(/expira em [67] dias/.test(prazoDoPedro), `escolher 7 dias dá ao Pedro o prazo escolhido (${prazoDoPedro.trim()})`);
    await painel(p).locator("li", { hasText: "Lucas Silva Delgado" }).getByRole("button", { name: "Encerrar" }).click();
    await p.getByText("Acesso de Lucas encerrado").waitFor();
    await p.waitForTimeout(400);
    conferir(!(await visivel(painel(p).locator("li", { hasText: "Lucas Silva Delgado" }))), "encerrar tira o Lucas da lista");
    conferir(!(await visivel(painel(p).getByText("Camila Nunes"))), "a liberação da Camila, dada pelo Paulo, não aparece no painel do Victor");
    await p.screenshot({ path: `${FOTOS}/4-painel-depois.png` });
    conferir(p.erros.length === 0, `sem erros no console (${p.erros.join(" | ")})`);
    await p.context().close();
  }

  // 3. A Beatriz, liberada, vê o contato
  {
    const p = await entrar("beatriz@example.com");
    await p.goto(`${BASE}/buscar`);
    await faixa(p).getByText("Contatos liberados").waitFor();
    conferir(await visivel(faixa(p).getByText(/Liberado por Dr\. Victor; o acesso expira em/)), "a faixa diz quem liberou e quanto falta");
    await p.screenshot({ path: `${FOTOS}/5-busca-liberada.png` });
    await p.goto(`${BASE}/tutor/T7X9K2`);
    await p.getByRole("button", { name: "Ver contato" }).click();
    await p.getByText("lucas@example.com").waitFor();
    conferir(true, "no perfil do Lucas, Ver contato mostra o e-mail");
    await p.context().close();
  }

  // 4. O Paulo vê só a liberação que ele deu
  {
    const p = await entrar("paulo@example.com");
    await p.goto(`${BASE}/meu-perfil`);
    await painel(p).getByText("Camila Nunes").waitFor();
    conferir(!(await visivel(painel(p).getByText("Beatriz dos Reis"))) && !(await visivel(painel(p).getByText("Pedro Alves"))), "o painel do Paulo mostra só a Camila");
    // A Camila tem mais de 2 dias: renovar por 24 horas encurtaria, e a opção fica desligada.
    await painel(p).locator("li", { hasText: "Camila Nunes" }).getByRole("button", { name: "Renovar" }).click();
    const menu = p.getByRole("menu", { name: "Renovar o acesso de Camila Nunes" });
    const vinteQuatro = menu.getByRole("menuitem", { name: /24 horas/ });
    conferir((await vinteQuatro.isDisabled()) && /termina antes do prazo atual/.test(await vinteQuatro.innerText()), "com mais de 24 horas restantes, renovar por 24 horas fica desligado e diz por quê");
    await p.keyboard.press("Escape");
    conferir((await menu.count()) === 0, "Esc fecha o menu de renovação");
    await p.context().close();
  }

  // 5. O Victor encerra a liberação da Beatriz: ela deixa de ver o contato
  {
    const vet = await entrar("victor@example.com");
    await vet.goto(`${BASE}/meu-perfil`);
    await painel(vet).locator("li", { hasText: "Beatriz dos Reis" }).getByRole("button", { name: "Encerrar" }).click();
    await vet.getByText("Acesso de Beatriz encerrado").waitFor();
    // O Pedro volta ao exemplo (6 horas) quando o db:exemplos recria a liberação dele.
    await painel(vet).locator("li", { hasText: "Pedro Alves" }).getByRole("button", { name: "Encerrar" }).click();
    await vet.getByText("Acesso de Pedro encerrado").waitFor();
    await vet.context().close();
    const p = await entrar("beatriz@example.com");
    await p.goto(`${BASE}/buscar`);
    await faixa(p).getByText("Você ainda não vê os contatos").waitFor();
    conferir(true, "encerrada a liberação, a Beatriz volta a não ver os contatos");
    await p.context().close();
  }
  // 6. No topo, a foto leva ao perfil; a setinha abre as outras opções. Uma
  // janela só, no computador e depois na largura do celular: as fotos já
  // baixadas ficam guardadas, e o teste não esbarra no limite geral da API.
  {
    const p = await entrar("lucas@example.com");
    for (const [largura, altura, onde] of [[1380, 900, "computador"], [390, 844, "celular"]]) {
      await p.setViewportSize({ width: largura, height: altura });
      await p.goto(`${BASE}/buscar`);
      await p.getByRole("link", { name: /Meu perfil/ }).click();
      await p.waitForURL(/\/meu-perfil$/);
      conferir(true, `no ${onde}, clicar na foto do topo abre o próprio perfil`);
      await p.getByRole("button", { name: "Mais opções da conta" }).click();
      const itens = await p.getByRole("menuitem").allInnerTexts();
      conferir(JSON.stringify(itens.map((t) => t.replace(/^\S+\s*/, "").trim())) === JSON.stringify(["Minha conta", "Sair"]), `no ${onde}, a setinha abre Minha conta e Sair`);
      await p.screenshot({ path: `${FOTOS}/7-topo-${onde}.png` });
      await p.keyboard.press("Escape");
    }
    await p.context().close();
  }
} finally {
  await nav.close();
  voltarAosExemplos();
}
console.log(falhas ? `\n${falhas} verificação(ões) falharam` : "\nTodas as verificações passaram");
