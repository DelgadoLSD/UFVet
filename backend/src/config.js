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

export const config = Object.freeze({
  ambiente,
  producao: ambiente === "production",
  porta: Number(process.env.PORTA ?? 3000),

  // Assina os crachás de sessão. Trocar este segredo desconecta todo mundo
  // de uma vez (útil se ele vazar).
  jwtSegredo: lerSegredo("JWT_SEGREDO"),

  // Quantos intermediários (proxies) há entre a internet e a API. No
  // computador, nenhum; publicada, a hospedagem costuma ter um ou dois. Sem
  // este número, o limite de tentativas enxergaria todo mundo com o endereço
  // do intermediário.
  proxiesConfiaveis: Number(process.env.PROXIES_CONFIAVEIS ?? 0),

  // A pasta das fotos enviadas, enquanto elas ficam no próprio computador
  // (ver armazenamento.js). Os testes usam uma pasta temporária.
  pastaArquivos: path.resolve(
    process.env.PASTA_ARQUIVOS ??
      fileURLToPath(new URL("../arquivos", import.meta.url)),
  ),
});
