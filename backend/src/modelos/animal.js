import { banco } from "../banco.js";
import { sortearCodigoAnimal, sortearCodigoLivre } from "../codigos.js";
import { deDataDoBanco, hojeISO, paraDataDoBanco } from "../datas.js";
import { CRITERIOS_DOACAO, TIPOS_DOCUMENTO } from "../validacao.js";

// Model (do MVC) dos animais: como achar um animal no banco e o que dele pode
// sair da API. A tabela em si está em prisma/schema.prisma.

// Um código público que nenhum animal usa (NF6.1).
export const codigoAnimalLivre = () =>
  sortearCodigoLivre(
    sortearCodigoAnimal,
    async (codigo) =>
      !!(await banco.animal.findUnique({
        where: { codigo },
        select: { id: true },
      })),
  );

// As fotos de um animal, da principal (ordem 0) em diante. Basta para as
// conferências dos controladores.
export const COM_FOTOS = { fotos: { orderBy: { ordem: "asc" } } };

// Tudo o que o perfil mostra de um animal: as fotos, os exames e o histórico
// que os veterinários registram. Validações e observações vêm da mais
// recente para a mais antiga; doações, da coleta mais recente para a mais
// antiga; as versões de cada exame, da primeira enviada à última (F15).
export const COM_HISTORICO = {
  ...COM_FOTOS,
  validacoes: {
    include: { criterios: true },
    orderBy: { criadoEm: "desc" },
  },
  doacoes: {
    include: { estabelecimento: { select: { nome: true } } },
    orderBy: [{ dataColeta: "desc" }, { criadoEm: "desc" }],
  },
  observacoes: { orderBy: { criadoEm: "desc" } },
  documentos: { include: { versoes: { orderBy: { enviadoEm: "asc" } } } },
};

// O animal com o histórico, pelo id interno.
export const buscarComHistorico = (id) =>
  banco.animal.findUnique({ where: { id }, include: COM_HISTORICO });

// "78120" e "MG" -> "78120-MG", como o CRMV aparece nas assinaturas.
const crmvCompleto = ({ crmv, ufCrmv }) => `${crmv}-${ufCrmv}`;

// Uma validação assinada (F19). Os critérios vão como estão no registro
// assinado, que nunca muda (NF19.4). Quando ela perdeu efeito, `invalidacao`
// diz quando e por quê: substituída por uma validação nova, ou, com o peso ou
// o nascimento alterados depois, o critério de peso e idade deixa de valer
// (F21). O site junta as duas coisas para mostrar a situação.
function dadosDaValidacao(validacao) {
  const atendidos = new Map(
    validacao.criterios.map(({ criterio, atendido }) => [criterio, atendido]),
  );
  return {
    realizadaEm: deDataDoBanco(validacao.realizadaEm),
    validaAte: deDataDoBanco(validacao.validaAte),
    veterinarioNome: validacao.veterinarioNome,
    crmv: crmvCompleto(validacao),
    criterios: Object.fromEntries(
      CRITERIOS_DOACAO.map((criterio) => [
        criterio,
        atendidos.get(criterio) ?? false,
      ]),
    ),
    tipoSanguineoConfirmado: validacao.tipoSanguineoConfirmado,
    nota: validacao.nota ?? "",
    invalidacao: validacao.invalidadaEm
      ? { em: validacao.invalidadaEm, motivo: validacao.invalidadaMotivo }
      : null,
  };
}

// Uma coleta registrada (F24 e F25): quando, onde, quanto e quem acompanhou.
function dadosDaDoacao(doacao) {
  return {
    dataColeta: deDataDoBanco(doacao.dataColeta),
    volumeMl: doacao.volumeMl,
    estabelecimento: doacao.estabelecimento.nome,
    veterinarioNome: doacao.veterinarioNome,
    crmv: crmvCompleto(doacao),
    nota: doacao.nota ?? "",
  };
}

// Quem abre os arquivos dos exames de um animal: o dono e os veterinários,
// que validam o doador com eles (F14). Um exame costuma trazer, no cabeçalho
// do laboratório, o nome, o telefone e o endereço do tutor, que não saem
// para qualquer pessoa que visite o perfil.
export const podeAbrirExames = (usuario, tutorId) =>
  !!usuario && (usuario.id === tutorId || usuario.papel === "VETERINARIO");

// Onde o site abre o arquivo de uma versão de exame (rota protegida, ver
// controladores/documentos.js).
export const enderecoDoExame = (versao) =>
  `/api/documentos/versoes/${versao.id}`;

// ─── Exame apagado depois da validação (F21) ──────────────────────────────────

// O critério da validação que cada documento comprova, e o motivo gravado
// quando o tutor apaga um exame que a validação conferiu. O hemograma não
// entra: ele não comprova nenhum dos cinco critérios (é conferido antes de
// cada coleta), então apagá-lo não muda a validação.
const CRITERIO_DO_DOCUMENTO = {
  SOROLOGIA: "SOROLOGIAS",
  VACINACAO: "VACINACAO",
};
export const MOTIVO_DA_EXCLUSAO = {
  SOROLOGIA: "EXCLUSAO_SOROLOGIA",
  VACINACAO: "EXCLUSAO_VACINACAO",
};

// A validação que vale agora, entre as do animal (da mais recente para a mais
// antiga, cada uma com os critérios): a mais recente, se não venceu nem
// perdeu o efeito. As anteriores já foram substituídas.
export function validacaoEmVigor(validacoes) {
  const [maisRecente] = validacoes;
  if (!maisRecente || maisRecente.invalidadaEm) return null;
  if (deDataDoBanco(maisRecente.validaAte) < hojeISO()) return null;
  return maisRecente;
}

// O critério da validação em vigor que perde o efeito se esta versão de exame
// for apagada, ou null. Perde quando a versão já estava no site quando o
// veterinário validou (ele pode ter conferido com ela) e o critério que o
// documento comprova foi marcado como atendido. Uma versão enviada depois da
// validação, como o arquivo errado que o tutor acabou de mandar, sai sem
// mexer em nada.
export function criterioQueDependeDe(versao, tipo, vigente) {
  const criterio = CRITERIO_DO_DOCUMENTO[tipo];
  if (!criterio || !vigente) return null;
  if (versao.enviadoEm > vigente.criadoEm) return null;
  const atendido = vigente.criterios.some(
    (c) => c.criterio === criterio && c.atendido,
  );
  return atendido ? criterio : null;
}

// Os três documentos do animal (NF14.1), sempre todos e na mesma ordem, com
// as versões enviadas (F15). Todos veem que exames existem e quando foram
// enviados; o endereço do arquivo só vai para quem pode abri-lo. Cada versão
// diz também que critério perde o efeito se ela for apagada
// (`criterioAfetado`), para o site avisar antes.
function dadosDosDocumentos(documentos, vigente, podeAbrir) {
  return TIPOS_DOCUMENTO.map((tipo) => {
    const documento = documentos.find((d) => d.tipo === tipo);
    return {
      tipo,
      versoes: (documento?.versoes ?? []).map((versao) => ({
        id: versao.id,
        enviadoEm: versao.enviadoEm,
        enviadoPorNome: versao.enviadoPorNome,
        formato: versao.arquivoUrl.endsWith(".pdf") ? "pdf" : "imagem",
        arquivoUrl: podeAbrir ? enderecoDoExame(versao) : null,
        criterioAfetado: criterioQueDependeDe(versao, tipo, vigente),
      })),
    };
  });
}

// Uma observação sobre a coleta (F23), com autor e data.
const dadosDaObservacao = (observacao) => ({
  criadoEm: observacao.criadoEm,
  autorNome: observacao.autorNome,
  texto: observacao.texto,
});

// O animal como a API o devolve, buscado com COM_HISTORICO. O id interno, o
// dono e a validação que confirmou a tipagem não saem: o animal é
// identificado pelo código público. A idade não vem pronta (F12): o site a
// calcula da data de nascimento, e, quando a data é aproximada, mostra só a
// idade, nunca a data (NF12.2). Cada foto leva o id, que o site usa para
// reordenar ou remover.
//
// O total de doações e a data da última não são campos: saem da lista de
// doações (F26), e assim nunca discordam dela.
//
// `abreExames` diz se quem pediu abre os arquivos dos exames (ver
// podeAbrirExames acima). Sem ele, os exames vão sem os endereços.
export function dadosDoAnimal(animal, { abreExames = false } = {}) {
  return {
    codigo: animal.codigo,
    nome: animal.nome,
    especie: animal.especie,
    raca: animal.raca,
    sexo: animal.sexo,
    castrado: animal.castrado,
    dataNascimento: deDataDoBanco(animal.dataNascimento),
    nascimentoAproximado: animal.nascimentoAproximado,
    // O banco guarda decimal(5,2), que chega como texto exato; na API, número.
    pesoKg: Number(animal.pesoKg),
    tipoSanguineo: animal.tipoSanguineo,
    disponivel: animal.disponivel,
    fotos: animal.fotos.map((foto) => ({ id: foto.id, url: foto.url })),
    validacoes: animal.validacoes.map(dadosDaValidacao),
    doacoes: animal.doacoes.map(dadosDaDoacao),
    observacoes: animal.observacoes.map(dadosDaObservacao),
    documentos: dadosDosDocumentos(
      animal.documentos,
      validacaoEmVigor(animal.validacoes),
      abreExames,
    ),
    criadoEm: animal.criadoEm,
  };
}

// Quando o tutor muda o peso ou a data de nascimento, o critério de peso e
// idade da validação em vigor deixa de valer: foi conferido sobre outro valor
// (F21). O registro assinado não muda; a validação ganha a marca de
// invalidação, com o motivo (EDICAO_PESO ou EDICAO_NASCIMENTO). Roda dentro
// da transação da edição. Devolve true quando havia validação em vigor para
// marcar.
export async function invalidarPesoIdade(tx, animalId, motivo) {
  const vigente = await tx.validacao.findFirst({
    where: {
      animalId,
      invalidadaEm: null,
      validaAte: { gte: paraDataDoBanco(hojeISO()) },
    },
    orderBy: { criadoEm: "desc" },
    select: { id: true },
  });
  if (!vigente) return false;
  await tx.validacao.update({
    where: { id: vigente.id },
    data: { invalidadaEm: new Date(), invalidadaMotivo: motivo },
  });
  return true;
}
