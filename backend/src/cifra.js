import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

// Cifragem dos dados pessoais (CPF, e-mail e telefone). Ver a seção 6.1 de
// docs/modelagem-bd/modelo-de-dados.md para o porquê de cada escolha.
//
// Duas chaves, cada uma com uma função:
// - CHAVE_CIFRAGEM tranca o cofre: o dado é embaralhado e só volta com ela;
// - CHAVE_INDICE gera a impressão digital: o mesmo valor dá sempre o mesmo
//   índice, que é como o login acha a conta e o banco impede repetição.
// As duas ficam no .env, fora do banco. Quem tiver só o banco não tem nenhuma.

// AES-256-GCM: além de esconder o dado, detecta adulteração. Um texto cifrado
// alterado no banco não "abre" com outro conteúdo: a decifragem falha.
const ALGORITMO = "aes-256-gcm";
const BYTES_IV = 12;
const BYTES_ETIQUETA = 16;

// O prefixo diz qual chave trancou o dado. Se um dia a chave for trocada, os
// registros antigos continuam identificáveis e podem ser recifrados aos poucos.
const VERSAO = "v1";

// A chave é lida a cada uso, e não na importação: assim os testes podem
// definir as suas antes de chamar as funções.
function lerChave(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`${nome} não está definida no .env.`);
  }
  const bytes = Buffer.from(valor, "base64");
  if (bytes.length !== 32) {
    throw new Error(`${nome} precisa ter 32 bytes, codificados em base64.`);
  }
  return bytes;
}

// Tranca o texto no cofre. Cifrar duas vezes o mesmo texto dá resultados
// diferentes, porque cada vez usa um vetor inicial (IV) aleatório: quem olha o
// banco não consegue nem saber se duas pessoas têm o mesmo telefone.
export function cifrar(texto) {
  const iv = randomBytes(BYTES_IV);
  const cifrador = createCipheriv(ALGORITMO, lerChave("CHAVE_CIFRAGEM"), iv);
  const dados = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return `${VERSAO}:${Buffer.concat([iv, etiqueta, dados]).toString("base64")}`;
}

// Abre o cofre. Falha se o texto foi alterado ou se a chave não é a certa, em
// vez de devolver lixo que alguém poderia confundir com um dado real.
export function decifrar(cifrado) {
  const [versao, corpo] = cifrado.split(":");
  if (versao !== VERSAO || !corpo) {
    throw new Error("Dado cifrado em formato desconhecido.");
  }
  const bruto = Buffer.from(corpo, "base64");
  const iv = bruto.subarray(0, BYTES_IV);
  const etiqueta = bruto.subarray(BYTES_IV, BYTES_IV + BYTES_ETIQUETA);
  const dados = bruto.subarray(BYTES_IV + BYTES_ETIQUETA);

  const decifrador = createDecipheriv(ALGORITMO, lerChave("CHAVE_CIFRAGEM"), iv);
  decifrador.setAuthTag(etiqueta);
  return Buffer.concat([decifrador.update(dados), decifrador.final()]).toString(
    "utf8",
  );
}

// Impressão digital (HMAC-SHA256, em hexadecimal: 64 caracteres). Usa chave
// secreta de propósito: um SHA-256 simples do CPF seria revertido por força
// bruta, porque existem só cerca de um bilhão de CPFs possíveis.
function impressaoDigital(valor) {
  return createHmac("sha256", lerChave("CHAVE_INDICE"))
    .update(valor, "utf8")
    .digest("hex");
}

// O índice é calculado sobre o valor normalizado, para "Ana@Email.com " e
// "ana@email.com" serem a mesma conta, e "123.456.789-09" e "12345678909",
// o mesmo CPF.
export const normalizarEmail = (email) =>
  email.normalize("NFC").trim().toLowerCase();

export const normalizarCpf = (cpf) => cpf.replace(/\D/g, "");

export const indiceEmail = (email) => impressaoDigital(normalizarEmail(email));

export const indiceCpf = (cpf) => impressaoDigital(normalizarCpf(cpf));
