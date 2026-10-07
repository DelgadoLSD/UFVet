import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { registrar } from "./registro.js";

// Onde ficam os arquivos enviados (por enquanto, as fotos).
//
// No computador, numa pasta da API (config.pastaArquivos), que app.js serve
// em /api/arquivos. Publicado o site, as hospedagens gratuitas apagam essa
// pasta a cada atualização: este é o único arquivo que muda, para guardar e
// apagar num serviço de arquivos na nuvem, que devolve o endereço de cada
// arquivo. O banco guarda só o endereço (animal_foto.url, usuario.foto_url).

export const CAMINHO_PUBLICO = "/api/arquivos";

// O nome é sorteado aqui, nunca vem de quem enviou: ninguém adivinha o
// endereço de uma foto, nem consegue gravar fora da pasta ("../") ou por cima
// do arquivo de outra pessoa. Toda imagem é gravada em WebP (ver imagens.js).
const NOME_DE_ARQUIVO = /^[0-9a-f-]{36}\.webp$/;

// Guarda uma imagem já tratada e devolve o endereço dela.
export async function guardarImagem(conteudo) {
  await mkdir(config.pastaArquivos, { recursive: true });
  const nome = `${randomUUID()}.webp`;
  // "wx": falha em vez de sobrescrever, se o nome já existisse.
  await writeFile(path.join(config.pastaArquivos, nome), conteudo, {
    flag: "wx",
  });
  return `${CAMINHO_PUBLICO}/${nome}`;
}

// O nome do arquivo de um endereço desta pasta, ou null para qualquer outro.
function nomeDoEndereco(endereco) {
  if (typeof endereco !== "string") return null;
  if (!endereco.startsWith(`${CAMINHO_PUBLICO}/`)) return null;
  const nome = endereco.slice(CAMINHO_PUBLICO.length + 1);
  return NOME_DE_ARQUIVO.test(nome) ? nome : null;
}

// Apaga os arquivos de endereços devolvidos por guardarImagem; os outros são
// ignorados. Uma falha aqui não desfaz o que pediu a remoção (a conta
// encerrada continua encerrada): o arquivo que ficou é registrado.
export async function apagarArquivos(enderecos) {
  await Promise.all(
    enderecos.map(async (endereco) => {
      const nome = nomeDoEndereco(endereco);
      if (!nome) return;
      try {
        await rm(path.join(config.pastaArquivos, nome), { force: true });
      } catch (erro) {
        registrar("arquivo_nao_apagado", {
          arquivo: nome,
          mensagem: erro.message,
        });
      }
    }),
  );
}
