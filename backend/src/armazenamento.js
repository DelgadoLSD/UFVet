import { randomUUID } from "node:crypto";
import { banco } from "./banco.js";
import { registrar } from "./registro.js";

// Onde ficam os arquivos enviados: as fotos e os exames dos animais.
//
// No banco, na tabela arquivo, com o conteúdo. Numa pasta da API, eles
// sumiam no site publicado: a hospedagem gratuita apaga o disco do serviço
// a cada reinício (e ele reinicia sempre que dorme). As outras tabelas
// guardam só o endereço de cada foto (animal_foto.url, usuario.foto_url) e o
// nome de cada exame (documento_versao.arquivo_url). Para levar os arquivos
// a um serviço de arquivos na nuvem, este é o único arquivo que muda.

export const CAMINHO_PUBLICO = "/api/arquivos";

// O nome é sorteado aqui, nunca vem de quem enviou: ninguém adivinha o
// endereço de um arquivo nem grava por cima do de outra pessoa. Toda imagem
// é gravada em WebP (ver imagens.js); o exame em PDF fica em PDF.
const NOME_DE_FOTO = /^[0-9a-f-]{36}\.webp$/;
const NOME_DE_EXAME = /^[0-9a-f-]{36}\.(webp|pdf)$/;

// Grava o conteúdo com um nome sorteado e devolve o nome. Só o nome volta
// do banco, não o arquivo inteiro.
async function gravar(tipo, conteudo, extensao) {
  const nome = `${randomUUID()}.${extensao}`;
  await banco.arquivo.create({
    data: { nome, tipo, conteudo },
    select: { nome: true },
  });
  return nome;
}

// O conteúdo (os bytes) do arquivo com este nome e deste tipo, ou null se
// ele não existe.
async function ler(tipo, nome) {
  const arquivo = await banco.arquivo.findUnique({
    where: { nome, tipo },
    select: { conteudo: true },
  });
  return arquivo?.conteudo ?? null;
}

// Apaga os arquivos com estes nomes. Uma falha aqui não desfaz o que pediu a
// remoção (a conta encerrada continua encerrada): o que ficou é registrado.
async function apagar(tipo, nomes) {
  if (nomes.length === 0) return;
  try {
    await banco.arquivo.deleteMany({ where: { tipo, nome: { in: nomes } } });
  } catch (erro) {
    registrar("arquivo_nao_apagado", {
      arquivos: nomes,
      mensagem: erro.message,
    });
  }
}

// ─── Fotos ────────────────────────────────────────────────────────────────────

// As fotos são públicas, como o perfil: app.js as entrega em /api/arquivos.

// Guarda uma imagem já tratada e devolve o endereço dela.
export async function guardarImagem(conteudo) {
  const nome = await gravar("FOTO", conteudo, "webp");
  return `${CAMINHO_PUBLICO}/${nome}`;
}

// A foto com este nome (o fim do endereço), ou null se ela não existe. Um
// exame nunca sai por aqui, mesmo em WebP.
export const lerFoto = (nome) =>
  NOME_DE_FOTO.test(nome) ? ler("FOTO", nome) : Promise.resolve(null);

// O nome do arquivo de um endereço de foto, ou null para qualquer outro.
function nomeDoEndereco(endereco) {
  if (typeof endereco !== "string") return null;
  if (!endereco.startsWith(`${CAMINHO_PUBLICO}/`)) return null;
  const nome = endereco.slice(CAMINHO_PUBLICO.length + 1);
  return NOME_DE_FOTO.test(nome) ? nome : null;
}

// Apaga as fotos de endereços devolvidos por guardarImagem; os outros são
// ignorados.
export async function apagarArquivos(enderecos) {
  await apagar("FOTO", enderecos.map(nomeDoEndereco).filter(Boolean));
}

// ─── Exames ───────────────────────────────────────────────────────────────────

// Nenhuma rota entrega um exame direto: ele costuma trazer, no cabeçalho do
// laboratório, o nome, o telefone e o endereço do tutor. O arquivo só sai
// pela API, para quem pode abri-lo (ver controladores/documentos.js).

// Guarda um exame já conferido e devolve o nome dele. `extensao` é "webp"
// (imagem regravada) ou "pdf".
export const guardarExame = (conteudo, extensao) =>
  gravar("EXAME", conteudo, extensao);

// O conteúdo do exame com este nome, ou null para um nome que não saiu de
// guardarExame ou que não está mais guardado.
export const lerExame = (nome) =>
  NOME_DE_EXAME.test(nome) ? ler("EXAME", nome) : Promise.resolve(null);

// Apaga os exames com estes nomes; nomes que não saíram de guardarExame são
// ignorados.
export async function apagarExames(nomes) {
  await apagar(
    "EXAME",
    nomes.filter((nome) => NOME_DE_EXAME.test(nome)),
  );
}
