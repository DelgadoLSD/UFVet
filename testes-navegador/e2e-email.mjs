// Os e-mails do ambiente de teste: o carteiro da API os grava como arquivos
// na PASTA_EMAILS (ver ambiente-e2e.mjs). Este ajudante acha o link do
// último e-mail mandado para um endereço.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const PASTA = process.env.PASTA_EMAILS;

// Os e-mails para `para`, do mais novo ao mais antigo. `tipo`:
// "confirmacao", "troca" ou "senha" (está no nome do arquivo).
export function emailsPara(para, tipo) {
  let nomes = [];
  try {
    nomes = readdirSync(PASTA);
  } catch {
    return [];
  }
  return nomes
    .filter((nome) => !tipo || nome.endsWith(`-${tipo}.html`))
    .sort()
    .reverse()
    .map((nome) => readFileSync(path.join(PASTA, nome), "utf8"))
    .filter((html) => html.includes(`Para: ${para}.`));
}

// O link do último e-mail para `para`, esperando até ele chegar.
export async function linkDoEmail(para, tipo, { espera = 10000 } = {}) {
  const fim = Date.now() + espera;
  while (Date.now() < fim) {
    const [html] = emailsPara(para, tipo);
    const link = html?.match(/href="([^"]+#[A-Za-z0-9_-]{43})"/)?.[1];
    if (link) return link.replaceAll("&amp;", "&");
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Nenhum e-mail ${tipo ?? ""} para ${para} em ${PASTA}`);
}

export const quantosEmails = (para, tipo) => emailsPara(para, tipo).length;

// Depois de criar a conta pela API: abre o link de confirmação (pela API,
// como a página faz) e entra, no mesmo contexto do navegador (os cookies
// valem para as páginas dele).
export async function confirmarEEntrarPelaApi(contexto, base, email, senha) {
  const link = await linkDoEmail(email, "confirmacao");
  const codigo = link.split("#")[1];
  const confirmacao = await contexto.request.post(`${base}/api/email/confirmacao`, { data: { codigo } });
  if (!confirmacao.ok()) throw new Error(`confirmação falhou: ${await confirmacao.text()}`);
  const login = await contexto.request.post(`${base}/api/sessao`, { data: { email, senha } });
  if (!login.ok()) throw new Error(`login falhou: ${await login.text()}`);
}
