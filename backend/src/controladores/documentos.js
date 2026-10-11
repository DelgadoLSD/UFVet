import {
  apagarExames,
  caminhoDoExame,
  guardarExame,
} from "../armazenamento.js";
import { banco } from "../banco.js";
import { diaEmBrasilia } from "../datas.js";
import { ErroApi } from "../erros.js";
import { prepararImagemDeExame } from "../imagens.js";
import {
  MOTIVO_DA_EXCLUSAO,
  buscarComHistorico,
  criterioQueDependeDe,
  dadosDoAnimal,
  podeAbrirExames,
  validacaoEmVigor,
} from "../modelos/animal.js";
import { registrar } from "../registro.js";
import { TIPOS_DOCUMENTO } from "../validacao.js";
import { animalDoUsuario } from "./animais.js";

// Controller (do MVC) dos exames e documentos dos animais (F14 e F15): o
// hemograma, as sorologias e a carteira de vacinação.
//
// - Enviar é do dono do animal. Cada envio vira uma versão nova, e as
//   anteriores continuam guardadas, para o veterinário comparar (F15).
// - Apagar uma versão também é do dono: quem manda o arquivo errado precisa
//   poder tirá-lo. Se a validação em vigor conferiu aquele exame, o critério
//   que ele comprova perde o efeito (F21), como quando o peso muda.
// - O arquivo pode ser imagem (JPG, PNG ou WebP) ou PDF (NF14.2). A imagem
//   passa pelo mesmo tratamento das fotos (imagens.js) e é gravada sem a
//   localização GPS. O PDF é conferido pela assinatura do formato e guardado
//   como veio.
// - Abrir o arquivo é do dono e dos veterinários (podeAbrirExames, em
//   modelos/animal.js). Que exames existem, e quando foram enviados, todos
//   veem no perfil.

const arquivoInvalido = (mensagem) =>
  new ErroApi(400, mensagem, { campos: { arquivo: mensagem } });

// Todo PDF começa com "%PDF-". O tipo que o navegador declara sai só do nome
// do arquivo; quem decide é o conteúdo.
const ehPdf = (conteudo) =>
  conteudo.subarray(0, 5).toString("latin1") === "%PDF-";

// O arquivo pronto para guardar: o PDF como veio; a imagem, regravada. O que
// não é nenhum dos dois é recusado com a mensagem dos formatos aceitos.
async function prepararExame(conteudo) {
  if (ehPdf(conteudo)) return { conteudo, extensao: "pdf" };
  return {
    conteudo: await prepararImagemDeExame(conteudo, "arquivo"),
    extensao: "webp",
  };
}

// O tipo de documento do endereço (HEMOGRAMA, SOROLOGIA ou VACINACAO), sem
// diferenciar maiúsculas.
function tipoDoEndereco(req) {
  const tipo = req.params.tipo.toUpperCase();
  if (!TIPOS_DOCUMENTO.includes(tipo)) {
    throw new ErroApi(404, "Tipo de documento não encontrado.");
  }
  return tipo;
}

// POST /api/animais/:codigo/documentos/:tipo — o dono envia um exame (F14),
// no campo "arquivo". O documento daquele tipo nasce no primeiro envio, e
// cada envio é uma versão nova dele (F15), com quem enviou e quando.
// Responde com o animal inteiro, como os registros do histórico: o site
// troca o cartão de uma vez.
export async function enviarDocumento(req, res) {
  // Primeiro o dono, depois o resto: sobre o animal alheio, nem o tipo nem o
  // arquivo respondem.
  const animal = await animalDoUsuario(req);
  const tipo = tipoDoEndereco(req);
  if (!req.file) throw arquivoInvalido("Escolha o arquivo do exame.");

  const { conteudo, extensao } = await prepararExame(req.file.buffer);
  const nome = await guardarExame(conteudo, extensao);
  try {
    // O documento é criado só se ainda não existe ("on conflict do
    // nothing"): dois envios ao mesmo tempo não esbarram um no outro.
    await banco.documento.createMany({
      data: [{ animalId: animal.id, tipo }],
      skipDuplicates: true,
    });
    const documento = await banco.documento.findUnique({
      where: { animalId_tipo: { animalId: animal.id, tipo } },
      select: { id: true },
    });
    await banco.documentoVersao.create({
      data: {
        documentoId: documento.id,
        arquivoUrl: nome,
        enviadoPorId: req.usuario.id,
        enviadoPorNome: req.usuario.nomeCompleto,
      },
    });
  } catch (erro) {
    // Sem a versão no banco, o arquivo guardado não serve para nada.
    await apagarExames([nome]);
    throw erro;
  }
  registrar("documento_enviado", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    tipo,
    formato: extensao,
  });
  const atualizado = await buscarComHistorico(animal.id);
  res.status(201).json({
    animal: dadosDoAnimal(atualizado, { abreExames: true }),
  });
}

// ─── Abrir e apagar uma versão ────────────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// A versão do endereço, com o documento e o animal dela, ou null.
const versaoDoEndereco = (id) =>
  UUID.test(id)
    ? banco.documentoVersao.findUnique({
        where: { id },
        include: {
          documento: {
            select: {
              id: true,
              tipo: true,
              animal: {
                select: { id: true, codigo: true, nome: true, tutorId: true },
              },
            },
          },
        },
      })
    : null;

// O nome com que o arquivo é salvo no computador de quem abre:
// "hemograma-zeus-2026-03-02.pdf". Só letras sem acento, números e hífens,
// para valer em qualquer sistema.
const NOMES_PARA_SALVAR = {
  HEMOGRAMA: "hemograma",
  SOROLOGIA: "sorologias",
  VACINACAO: "carteira-de-vacinacao",
};
function nomeParaSalvar(versao) {
  const { tipo, animal } = versao.documento;
  const nomeDoAnimal =
    animal.nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || animal.codigo.toLowerCase();
  const extensao = versao.arquivoUrl.endsWith(".pdf") ? "pdf" : "webp";
  return `${NOMES_PARA_SALVAR[tipo]}-${nomeDoAnimal}-${diaEmBrasilia(versao.enviadoEm)}.${extensao}`;
}

// O arquivo sumiu da pasta (apagado à mão, ou a hospedagem limpou o disco):
// a versão continua no histórico, e quem abre fica sabendo o que fazer.
function semArquivo(versao) {
  registrar("exame_sem_arquivo", { versao: versao.id });
  return new ErroApi(
    404,
    "O arquivo deste exame não está mais guardado. Ele precisa ser enviado de novo.",
  );
}

// O arquivo vai como está no disco, com o tipo pela extensão (WebP ou PDF).
// Sem as marcas de cache do Express: quem decide o cache é abrirDocumento.
const enviarArquivo = (res, caminho) =>
  new Promise((resolve, reject) => {
    res.sendFile(
      caminho,
      { cacheControl: false, etag: false, lastModified: false },
      (erro) => (erro ? reject(erro) : resolve()),
    );
  });

// GET /api/documentos/versoes/:id — o arquivo de uma versão de exame, para o
// dono do animal e para os veterinários. É o endereço que vai em arquivoUrl
// (modelos/animal.js); o site o abre na janela do exame ou numa aba nova.
//
// O navegador não guarda cópia (no-store): num computador dividido, como o
// de um hospital, quem usar depois não reabre o exame pelo histórico. A
// política de segurança deixa o arquivo ser mostrado dentro do próprio site
// (a janela do exame) e nada mais: nenhum script, de nenhum lugar.
export async function abrirDocumento(req, res) {
  const versao = await versaoDoEndereco(req.params.id);
  if (!versao) throw new ErroApi(404, "Exame não encontrado.");
  if (!podeAbrirExames(req.usuario, versao.documento.animal.tutorId)) {
    throw new ErroApi(
      403,
      "Só o tutor do animal e os veterinários abrem os exames.",
    );
  }

  const caminho = caminhoDoExame(versao.arquivoUrl);
  if (!caminho) throw semArquivo(versao);

  res.set({
    "Cache-Control": "private, no-store",
    "Content-Disposition": `inline; filename="${nomeParaSalvar(versao)}"`,
    "Content-Security-Policy":
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; object-src 'self'; frame-ancestors 'self'",
  });
  try {
    await enviarArquivo(res, caminho);
  } catch (erro) {
    // A pessoa fechou a janela no meio do envio: não há a quem responder.
    if (res.headersSent) return;
    res.removeHeader("Content-Disposition");
    if (erro.code === "ENOENT") throw semArquivo(versao);
    throw erro;
  }
}

// DELETE /api/documentos/versoes/:id — o dono apaga uma versão que enviou: o
// registro e o arquivo. Sem versões, o documento sai junto.
//
// Se a versão já estava no site quando a validação em vigor foi assinada, e
// o critério que ela comprova foi atendido (as sorologias, a vacinação), a
// validação perde o efeito, com o motivo (EXCLUSAO_SOROLOGIA ou
// EXCLUSAO_VACINACAO): sem o arquivo, ninguém mais consegue conferir aquele
// critério. O registro assinado não muda (F21). Tudo na mesma transação: ou
// a versão sai e a validação perde o efeito, ou nada muda.
//
// Responde com o animal inteiro e com o critério que perdeu o efeito (ou
// null).
export async function apagarVersao(req, res) {
  const versao = await versaoDoEndereco(req.params.id);
  // O exame do animal de outra pessoa recebe a mesma resposta de um que não
  // existe, como nos animais.
  if (!versao || versao.documento.animal.tutorId !== req.usuario.id) {
    throw new ErroApi(404, "Exame não encontrado.");
  }
  const { documento } = versao;
  const animal = documento.animal;

  let criterio = null;
  await banco.$transaction(async (tx) => {
    // Só consultas simples dentro da transação (ver avisos-do-banco.js nos
    // testes): a validação mais recente e, depois, os critérios dela.
    const maisRecente = await tx.validacao.findFirst({
      where: { animalId: animal.id },
      orderBy: { criadoEm: "desc" },
      select: { id: true, criadoEm: true, validaAte: true, invalidadaEm: true },
    });
    const criterios = maisRecente
      ? await tx.validacaoCriterio.findMany({
          where: { validacaoId: maisRecente.id },
          select: { criterio: true, atendido: true },
        })
      : [];
    const vigente = validacaoEmVigor(
      maisRecente ? [{ ...maisRecente, criterios }] : [],
    );
    criterio = criterioQueDependeDe(versao, documento.tipo, vigente);

    await tx.documentoVersao.delete({ where: { id: versao.id } });
    const restantes = await tx.documentoVersao.count({
      where: { documentoId: documento.id },
    });
    if (restantes === 0) {
      await tx.documento.delete({ where: { id: documento.id } });
    }
    if (criterio) {
      await tx.validacao.update({
        where: { id: vigente.id },
        data: {
          invalidadaEm: new Date(),
          invalidadaMotivo: MOTIVO_DA_EXCLUSAO[documento.tipo],
        },
      });
    }
  });
  // Só depois de gravado: o arquivo.
  await apagarExames([versao.arquivoUrl]);

  registrar("documento_apagado", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    tipo: documento.tipo,
  });
  if (criterio) {
    registrar("validacao_invalidada", {
      usuarioId: req.usuario.id,
      animal: animal.codigo,
      motivo: MOTIVO_DA_EXCLUSAO[documento.tipo],
    });
  }
  const atualizado = await buscarComHistorico(animal.id);
  res.json({
    animal: dadosDoAnimal(atualizado, { abreExames: true }),
    criterioInvalidado: criterio,
  });
}
