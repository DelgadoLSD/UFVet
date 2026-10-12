import { banco } from "./banco.js";
import { registrar } from "./registro.js";

// Onde ficam os arquivos enviados: as fotos e os exames dos animais.
//
// No banco, na tabela arquivo, com o conteúdo. Numa pasta da API, eles
// sumiam no site publicado: a hospedagem gratuita apaga o disco do serviço
// a cada reinício (e ele reinicia sempre que dorme). Quem usa o arquivo
// aponta para ele pelo id, com chave estrangeira (usuario.foto_id,
// animal_foto.arquivo_id, documento_versao.arquivo_id): o banco não deixa
// ninguém apontar para um arquivo que não existe, nem apagar um arquivo em
// uso.
//
// Daí a ordem em quem troca ou apaga: primeiro sai quem aponta (a foto do
// perfil, a foto do animal, a versão do exame), depois o arquivo.

export const CAMINHO_PUBLICO = "/api/arquivos";

// Um id de arquivo (uuid). O banco recusaria com erro um texto que não é
// uuid; conferido antes, o endereço errado vira só "não encontrado".
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Grava o conteúdo e devolve o id do arquivo. Só o id volta do banco, não o
// arquivo inteiro.
async function gravar(tipo, formato, conteudo) {
  const { id } = await banco.arquivo.create({
    data: { tipo, formato, conteudo },
    select: { id: true },
  });
  return id;
}

// Apaga os arquivos com estes ids. Uma falha aqui não desfaz o que pediu a
// remoção (a conta encerrada continua encerrada): o que ficou é registrado.
async function apagar(tipo, ids) {
  const validos = ids.filter((id) => ID.test(id ?? ""));
  if (validos.length === 0) return;
  try {
    await banco.arquivo.deleteMany({ where: { tipo, id: { in: validos } } });
  } catch (erro) {
    registrar("arquivo_nao_apagado", {
      arquivos: validos,
      mensagem: erro.message,
    });
  }
}

// ─── Fotos ────────────────────────────────────────────────────────────────────

// As fotos são públicas, como o perfil: app.js as entrega em /api/arquivos,
// pelo endereço que enderecoDaFoto monta.

// Guarda uma imagem já tratada (sempre WebP, ver imagens.js) e devolve o id.
export const guardarImagem = (conteudo) => gravar("FOTO", "WEBP", conteudo);

// O endereço de uma foto, que a API devolve ao site, ou null sem foto.
export const enderecoDaFoto = (id) =>
  id ? `${CAMINHO_PUBLICO}/${id}.webp` : null;

// A foto do fim de um endereço ("<id>.webp"), ou null se ela não existe. Um
// exame nunca sai por aqui, mesmo em WebP.
export async function lerFoto(nome) {
  const id = nome.endsWith(".webp") ? nome.slice(0, -".webp".length) : "";
  if (!ID.test(id)) return null;
  const arquivo = await banco.arquivo.findUnique({
    where: { id, tipo: "FOTO" },
    select: { conteudo: true },
  });
  return arquivo?.conteudo ?? null;
}

// Apaga as fotos com estes ids (quem apontava para elas já saiu).
export const apagarArquivos = (ids) => apagar("FOTO", ids);

// ─── Exames ───────────────────────────────────────────────────────────────────

// Nenhuma rota entrega um exame direto: ele costuma trazer, no cabeçalho do
// laboratório, o nome, o telefone e o endereço do tutor. O arquivo só sai
// pela API, para quem pode abri-lo (ver controladores/documentos.js).

// Guarda um exame já conferido e devolve o id. `extensao` é "webp" (imagem
// regravada) ou "pdf".
export const guardarExame = (conteudo, extensao) =>
  gravar("EXAME", extensao === "pdf" ? "PDF" : "WEBP", conteudo);

// O conteúdo e o formato (WEBP ou PDF) do exame com este id. Ele sempre
// existe: a versão que aponta para ele não deixa o banco apagá-lo.
export const lerExame = (id) =>
  banco.arquivo.findUnique({
    where: { id, tipo: "EXAME" },
    select: { conteudo: true, formato: true },
  });

// Apaga os exames com estes ids (as versões que apontavam já saíram).
export const apagarExames = (ids) => apagar("EXAME", ids);
