import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verificarChaves } from "./cifra.js";

// Configuração da API, lida do .env no computador ou das variáveis de
// ambiente da hospedagem. Tudo é conferido quando a API liga: faltando um
// segredo, ela se recusa a subir, em vez de falhar no meio de um atendimento.

dotenv.config({ quiet: true });

const ambiente = process.env.NODE_ENV ?? "development";

// Segredos são 32 bytes aleatórios em base64, gerados com o comando que está
// no .env.example.
function lerSegredo(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`${nome} não está definida no .env.`);
  }
  if (Buffer.from(valor, "base64").length < 32) {
    throw new Error(`${nome} precisa ter 32 bytes, codificados em base64.`);
  }
  return Buffer.from(valor, "base64");
}

verificarChaves();

// Publicada, a API precisa mandar e-mails: sem eles, ninguém confirma o
// e-mail e ninguém novo entra no site. No computador, sem o script, os
// e-mails viram arquivos (ver carteiro.js).
if (ambiente === "production") {
  for (const nome of [
    "ENDERECO_DO_SITE",
    "EMAIL_SCRIPT_URL",
    "EMAIL_SCRIPT_SEGREDO",
  ]) {
    if (!process.env[nome]) {
      throw new Error(
        `${nome} não está definida. Sem ela, o UFVet não manda o e-mail de confirmação, e ninguém novo consegue entrar. Veja a seção "E-mails" do backend/README.md.`,
      );
    }
  }
}

export const config = Object.freeze({
  ambiente,
  producao: ambiente === "production",
  // A porta: publicada, a hospedagem diz qual usar (o Render avisa pela
  // variável PORT); no computador, 3000, a que o Vite espera.
  porta: Number(process.env.PORTA ?? process.env.PORT ?? 3000),

  // Assina os crachás de sessão. Trocar este segredo desconecta todo mundo
  // de uma vez (útil se ele vazar).
  jwtSegredo: lerSegredo("JWT_SEGREDO"),

  // Quantos intermediários (proxies) há entre a internet e a API. No
  // computador, nenhum; publicada no Render, os que o render.yaml diz (lá
  // está como o número foi conferido). Sem este número, o limite de
  // tentativas enxergaria todo mundo com o endereço do intermediário.
  proxiesConfiaveis: Number(process.env.PROXIES_CONFIAVEIS ?? 0),

  // O endereço do site, para os links dos e-mails. Vem daqui, e não do
  // pedido: um cabeçalho Host forjado faria o link de senha nova apontar
  // para o site de outra pessoa.
  enderecoDoSite: (
    process.env.ENDERECO_DO_SITE ?? "http://localhost:5173"
  ).replace(/\/+$/, ""),

  // O carteiro dos e-mails (ver carteiro.js): o script do Google na conta
  // Gmail do projeto e a senha que só ele e a API conhecem. Sem o script,
  // os e-mails viram arquivos nesta pasta.
  email: Object.freeze({
    scriptUrl: process.env.EMAIL_SCRIPT_URL || null,
    scriptSegredo: process.env.EMAIL_SCRIPT_SEGREDO || null,
    pasta: path.resolve(
      process.env.PASTA_EMAILS ??
        fileURLToPath(new URL("../emails-locais", import.meta.url)),
    ),
  }),

  // O site já montado (npm run build, no frontend), que a API entrega no
  // mesmo endereço quando publicada: um serviço só, e o cookie de sessão é do
  // próprio site. No computador, quem entrega o site é o Vite, e isto fica
  // desligado (ver app.js).
  pastaSite:
    ambiente === "production"
      ? path.resolve(
          process.env.PASTA_SITE ??
            fileURLToPath(new URL("../../frontend/dist", import.meta.url)),
        )
      : null,
});
