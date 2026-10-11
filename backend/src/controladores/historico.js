import { banco } from "../banco.js";
import { codigoDoEndereco } from "../codigos.js";
import {
  deDataDoBanco,
  hojeISO,
  paraDataDoBanco,
  somarAnos,
} from "../datas.js";
import { ErroApi } from "../erros.js";
import { buscarComHistorico, dadosDoAnimal } from "../modelos/animal.js";
import { assinaturaDe } from "../modelos/usuario.js";
import { registrar } from "../registro.js";
import {
  CRITERIOS_DOACAO,
  TIPOS_SANGUINEOS,
  esquemaDoacao,
  esquemaObservacao,
  esquemaValidacao,
} from "../validacao.js";

// Controller (do MVC) do histórico clínico de um animal, que só o
// veterinário escreve: a validação dos critérios de doação, com o tipo
// sanguíneo (F19 e F20), as doações realizadas (F24) e as observações sobre a
// coleta (F23). As rotas passam antes por exigirLogin e
// exigirPapel("VETERINARIO") (NF19.1, NF24.1).
//
// O veterinário pode registrar em qualquer animal, inclusive nos próprios:
// ele também é tutor, e pode ser ele quem valida e acompanha a coleta.
//
// Nada disso é editado nem apagado depois: um registro assinado fica como
// foi feito (NF19.4). Por isso não existem rotas de alteração aqui.

// Qualquer animal, pelo código do endereço.
async function animalPeloCodigo(req) {
  const animal = await banco.animal.findUnique({
    where: { codigo: codigoDoEndereco(req.params.codigo) },
  });
  if (!animal) throw new ErroApi(404, "Animal não encontrado.");
  return animal;
}

const campoInvalido = (campo, mensagem) =>
  new ErroApi(400, mensagem, { campos: { [campo]: mensagem } });

// Responde com o animal inteiro, já com o registro novo: o site troca o
// cartão de uma vez, sem montar o histórico por conta própria. Quem
// registra é veterinário, e veterinários abrem os exames.
async function responderComAnimal(res, animal) {
  res.status(201).json({
    animal: dadosDoAnimal(await buscarComHistorico(animal.id), {
      abreExames: true,
    }),
  });
}

// POST /api/animais/:codigo/validacoes — o veterinário assina a validação
// dos critérios de doação (F19). Ela vale por um ano (NF19.3). A validação
// anterior não muda: perde efeito, marcada como substituída por esta
// (NF19.4). Com a tipagem conferida, o tipo do exame passa a ser o tipo do
// animal (F20); sem ela, o tipo que já havia continua.
export async function validarAnimal(req, res) {
  const animal = await animalPeloCodigo(req);
  const dados = esquemaValidacao.parse(req.body ?? {});

  const tipo = dados.criterios.TIPAGEM ? dados.tipoSanguineo : null;
  if (tipo && !TIPOS_SANGUINEOS[animal.especie].includes(tipo)) {
    throw campoInvalido(
      "tipoSanguineo",
      animal.especie === "CAO"
        ? "Escolha um tipo da classificação DEA, a dos cães."
        : "Escolha o tipo A, B ou AB, os tipos dos gatos.",
    );
  }

  const assinatura = assinaturaDe(req.usuario);
  const hoje = hojeISO();
  await banco.$transaction(async (tx) => {
    await tx.validacao.updateMany({
      where: { animalId: animal.id, invalidadaEm: null },
      data: { invalidadaEm: new Date(), invalidadaMotivo: "NOVA_VALIDACAO" },
    });
    const validacao = await tx.validacao.create({
      data: {
        animalId: animal.id,
        veterinarioId: req.usuario.id,
        veterinarioNome: assinatura.nome,
        crmv: assinatura.crmv,
        ufCrmv: assinatura.ufCrmv,
        realizadaEm: paraDataDoBanco(hoje),
        validaAte: paraDataDoBanco(somarAnos(hoje, 1)),
        tipoSanguineoConfirmado: tipo,
        nota: dados.nota || null,
        criterios: {
          create: CRITERIOS_DOACAO.map((criterio) => ({
            criterio,
            atendido: dados.criterios[criterio],
          })),
        },
      },
    });
    if (tipo) {
      await tx.animal.update({
        where: { id: animal.id },
        data: { tipoSanguineo: tipo, tipagemValidacaoId: validacao.id },
      });
    }
  });

  registrar("validacao_registrada", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    atendidos: CRITERIOS_DOACAO.filter((c) => dados.criterios[c]),
    tipoSanguineo: tipo,
  });
  await responderComAnimal(res, animal);
}

// POST /api/animais/:codigo/doacoes — o veterinário registra uma coleta que
// aconteceu (F24), assinada por ele. A disponibilidade e o intervalo de
// recuperação saem da coleta mais recente, então o registro já vale na hora
// (NF24.4). O total de doações não é guardado: sai da lista (F26).
export async function registrarDoacao(req, res) {
  const animal = await animalPeloCodigo(req);
  const dados = esquemaDoacao.parse(req.body ?? {});

  if (dados.dataColeta < deDataDoBanco(animal.dataNascimento)) {
    throw campoInvalido(
      "dataColeta",
      "A data da coleta não pode ser antes do nascimento do animal.",
    );
  }
  const estabelecimento = await banco.estabelecimento.findUnique({
    where: { id: dados.estabelecimentoId },
    select: { id: true },
  });
  if (!estabelecimento) {
    throw campoInvalido(
      "estabelecimentoId",
      "Escolha onde a coleta foi feita.",
    );
  }

  const assinatura = assinaturaDe(req.usuario);
  await banco.doacao.create({
    data: {
      animalId: animal.id,
      estabelecimentoId: estabelecimento.id,
      veterinarioId: req.usuario.id,
      veterinarioNome: assinatura.nome,
      crmv: assinatura.crmv,
      ufCrmv: assinatura.ufCrmv,
      dataColeta: paraDataDoBanco(dados.dataColeta),
      volumeMl: dados.volumeMl,
      nota: dados.nota || null,
    },
  });

  registrar("doacao_registrada", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    dataColeta: dados.dataColeta,
  });
  await responderComAnimal(res, animal);
}

// POST /api/animais/:codigo/observacoes — o veterinário anota como o animal
// se comportou na coleta (F23), com o nome dele e a hora.
export async function registrarObservacao(req, res) {
  const animal = await animalPeloCodigo(req);
  const dados = esquemaObservacao.parse(req.body ?? {});

  await banco.observacao.create({
    data: {
      animalId: animal.id,
      autorId: req.usuario.id,
      autorNome: assinaturaDe(req.usuario).nome,
      texto: dados.texto,
    },
  });

  registrar("observacao_registrada", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
  });
  await responderComAnimal(res, animal);
}

// GET /api/estabelecimentos — os hospitais e clínicas cadastrados, para o
// veterinário escolher onde uma coleta foi feita.
export async function listarEstabelecimentos(req, res) {
  const estabelecimentos = await banco.estabelecimento.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, cidade: true, uf: true },
  });
  res.json({ estabelecimentos });
}
