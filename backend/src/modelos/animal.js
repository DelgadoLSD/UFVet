import { banco } from "../banco.js";
import { sortearCodigoAnimal, sortearCodigoLivre } from "../codigos.js";
import { deDataDoBanco, hojeISO, paraDataDoBanco } from "../datas.js";
import { CRITERIOS_DOACAO } from "../validacao.js";

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

// Tudo o que o perfil mostra de um animal: as fotos e o histórico que os
// veterinários registram. Validações e observações vêm da mais recente para
// a mais antiga; doações, da coleta mais recente para a mais antiga.
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
export function dadosDoAnimal(animal) {
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
