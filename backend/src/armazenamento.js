import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { registrar } from "./registro.js";

// Onde ficam os arquivos enviados: as fotos e os exames dos animais.
//
// No computador, em pastas da API. Publicado o site, as hospedagens
// gratuitas apagam essas pastas a cada atualização: este é o único arquivo
// que muda, para guardar e apagar num serviço de arquivos na nuvem. O banco
// guarda só o endereço de cada foto (animal_foto.url, usuario.foto_url) e o
// nome de cada exame (documento_versao.arquivo_url).

export const CAMINHO_PUBLICO = "/api/arquivos";

// O nome é sorteado aqui, nunca vem de quem enviou: ninguém adivinha o
// endereço de um arquivo, nem consegue gravar fora da pasta ("../") ou por
// cima do arquivo de outra pessoa. Toda imagem é gravada em WebP (ver
// imagens.js); o exame em PDF fica em PDF.
const NOME_DE_FOTO = /^[0-9a-f-]{36}\.webp$/;
const NOME_DE_EXAME = /^[0-9a-f-]{36}\.(webp|pdf)$/;

// Grava o conteúdo com um nome sorteado e devolve o nome.
async function gravar(pasta, conteudo, extensao) {
  await mkdir(pasta, { recursive: true });
  const nome = `${randomUUID()}.${extensao}`;
  // "wx": falha em vez de sobrescrever, se o nome já existisse.
  await writeFile(path.join(pasta, nome), conteudo, { flag: "wx" });
  return nome;
}

// Apaga os arquivos com estes nomes. Uma falha aqui não desfaz o que pediu a
// remoção (a conta encerrada continua encerrada): o arquivo que ficou é
// registrado.
async function apagar(pasta, nomes) {
  await Promise.all(
    nomes.map(async (nome) => {
      try {
        await rm(path.join(pasta, nome), { force: true });
      } catch (erro) {
        registrar("arquivo_nao_apagado", {
          arquivo: nome,
          mensagem: erro.message,
        });
      }
    }),
  );
}

// ─── Fotos ────────────────────────────────────────────────────────────────────

// As fotos ficam em config.pastaArquivos, que app.js serve em /api/arquivos:
// são públicas, como o perfil.

// Guarda uma imagem já tratada e devolve o endereço dela.
export async function guardarImagem(conteudo) {
  const nome = await gravar(config.pastaArquivos, conteudo, "webp");
  return `${CAMINHO_PUBLICO}/${nome}`;
}

// O nome do arquivo de um endereço desta pasta, ou null para qualquer outro.
function nomeDoEndereco(endereco) {
  if (typeof endereco !== "string") return null;
  if (!endereco.startsWith(`${CAMINHO_PUBLICO}/`)) return null;
  const nome = endereco.slice(CAMINHO_PUBLICO.length + 1);
  return NOME_DE_FOTO.test(nome) ? nome : null;
}

// Apaga os arquivos de endereços devolvidos por guardarImagem; os outros são
// ignorados.
export async function apagarArquivos(enderecos) {
  await apagar(
    config.pastaArquivos,
    enderecos.map(nomeDoEndereco).filter(Boolean),
  );
}

// ─── Exames ───────────────────────────────────────────────────────────────────

// Os exames ficam em config.pastaExames, que nenhuma rota serve direto: um
// exame costuma trazer, no cabeçalho do laboratório, o nome, o telefone e o
// endereço do tutor. O arquivo só sai pela API, para quem pode abri-lo (ver
// controladores/documentos.js).

// Guarda um exame já conferido e devolve o nome dele na pasta. `extensao` é
// "webp" (imagem regravada) ou "pdf".
export const guardarExame = (conteudo, extensao) =>
  gravar(config.pastaExames, conteudo, extensao);

// Onde está, no disco, o exame com este nome, ou null para um nome que não
// saiu de guardarExame.
export const caminhoDoExame = (nome) =>
  NOME_DE_EXAME.test(nome) ? path.join(config.pastaExames, nome) : null;

// Apaga os exames com estes nomes; nomes que não saíram de guardarExame são
// ignorados.
export async function apagarExames(nomes) {
  await apagar(
    config.pastaExames,
    nomes.filter((nome) => NOME_DE_EXAME.test(nome)),
  );
}
