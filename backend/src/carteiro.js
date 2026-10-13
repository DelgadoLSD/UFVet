import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { registrar } from "./registro.js";

// O carteiro: leva os e-mails do UFVet (o link de confirmar o e-mail e o de
// criar uma senha nova). O texto de cada e-mail está em emails.js.
//
// Publicado, o envio passa por um pequeno programa do Google, o Apps Script,
// instalado na conta Gmail do projeto (scripts/carteiro.gs; o passo a passo
// está no README). Por dois motivos: o Render grátis bloqueia o envio direto
// de e-mail (as portas SMTP), e um e-mail que sai do próprio Gmail é aceito
// pelos outros provedores, enquanto um serviço de e-mail sem domínio próprio
// cai mais no spam. A API chama o script pela internet, com uma senha que só
// os dois conhecem (EMAIL_SCRIPT_SEGREDO).
//
// Sem o script, no computador, nenhum e-mail sai: cada mensagem vira um
// arquivo .html na pasta de e-mails locais, para abrir no navegador e clicar
// no link. Nos testes automatizados, as mensagens ficam na caixaDeSaida, na
// memória, e nunca vão para o script, mesmo que o .env tenha um.

// As mensagens "enviadas" durante os testes. Com `foraDoAr` ligado, o envio
// falha, como quando o Google não responde.
export const caixaDeSaida = [];
caixaDeSaida.foraDoAr = false;

// Chama o script do Google. Ele responde { ok: true } quando mandou, ou
// { ok: false, erro } com o motivo: "senha" (a senha não confere), "cota"
// (o limite diário do Gmail acabou), "pedido" ou "envio". O Google responde
// por um redirecionamento, que o fetch segue sozinho.
export async function enviarPeloScript(
  { para, assunto, texto, html },
  { url, segredo } = config.email,
) {
  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segredo, para, assunto, texto, html }),
    signal: AbortSignal.timeout(20_000),
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok || corpo?.ok !== true) {
    const motivo = corpo?.erro ? ` (${corpo.erro})` : "";
    throw new Error(`o script respondeu ${resposta.status}${motivo}`);
  }
}

// "2026-10-13T21:30:15.123Z" -> "2026-10-13_21-30-15-123", para o nome do
// arquivo, na ordem em que os e-mails saíram.
const carimbo = () =>
  new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

// Grava o e-mail como página, com o destinatário e o assunto no alto.
async function guardarNaPasta({ tipo, para, assunto, html }) {
  await mkdir(config.email.pasta, { recursive: true });
  const arquivo = path.join(config.email.pasta, `${carimbo()}-${tipo}.html`);
  const cabecalho = `<p style="font:14px monospace;background:#fffbe6;padding:8px">E-mail que não saiu do computador. Para: ${escaparHtml(para)}. Assunto: ${escaparHtml(assunto)}.</p>`;
  await writeFile(arquivo, cabecalho + html, "utf8");
  console.log(`E-mail guardado em ${arquivo} (abra no navegador)`);
}

function escaparHtml(texto) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function transporte() {
  if (config.ambiente === "test") {
    return async (mensagem) => {
      if (caixaDeSaida.foraDoAr) throw new Error("o carteiro está fora do ar");
      caixaDeSaida.push(mensagem);
    };
  }
  return config.email.scriptUrl ? enviarPeloScript : guardarNaPasta;
}

// Manda um e-mail ({ tipo, para, assunto, texto, html }, de emails.js).
// Devolve true se ele saiu e false se não: quem chama decide o que dizer à
// pessoa. O registro guarda o tipo e o motivo da falha, nunca o endereço.
export async function enviarEmail(mensagem) {
  try {
    await transporte()(mensagem);
    registrar("email_enviado", { tipo: mensagem.tipo });
    return true;
  } catch (erro) {
    registrar("email_nao_enviado", {
      tipo: mensagem.tipo,
      motivo: erro.message,
    });
    return false;
  }
}

// Envios que a resposta não espera. Servem aos pedidos em que a demora
// denunciaria quem tem conta ("Esqueceu a senha?": se só as contas que
// existem esperassem o e-mail sair, a resposta mais lenta diria que o
// e-mail tem conta). `tarefa` é uma função que cria o link e manda o
// e-mail. Os testes esperam esses envios com aguardarEnvios.
const emAndamento = new Set();

export function enviarEmSegundoPlano(tarefa) {
  const envio = Promise.resolve()
    .then(tarefa)
    .catch((erro) => registrar("email_nao_enviado", { motivo: erro.message }))
    .finally(() => emAndamento.delete(envio));
  emAndamento.add(envio);
}

export const aguardarEnvios = () => Promise.all([...emAndamento]);
