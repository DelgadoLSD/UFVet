import {
  apagarArquivos,
  apagarExames,
  guardarImagem,
} from "../armazenamento.js";
import { banco } from "../banco.js";
import { codigoDoEndereco } from "../codigos.js";
import {
  deDataDoBanco,
  hojeISO,
  paraDataDoBanco,
  subtrairAnos,
} from "../datas.js";
import { ErroApi } from "../erros.js";
import { prepararFoto } from "../imagens.js";
import { MAXIMO_FOTOS_POR_ANIMAL } from "../middlewares/envio.js";
import {
  COM_FOTOS,
  COM_HISTORICO,
  buscarComHistorico,
  codigoAnimalLivre,
  dadosDoAnimal,
  invalidarPesoIdade,
  podeAbrirExames,
} from "../modelos/animal.js";
import { registrar } from "../registro.js";
import { esquemaAnimal, esquemaEdicaoAnimal } from "../validacao.js";

// Controller (do MVC) dos animais: cadastrar (F8), ver, editar (F9), excluir
// (F10), mudar a disponibilidade (F11) e as fotos de cada um (NF8.3).
//
// Ver é público, como a busca (NF16.4): os dados do animal não identificam
// ninguém. A exceção são os arquivos dos exames, que só o dono e os
// veterinários abrem (ver controladores/documentos.js). Mudar exige ser o
// dono, que é sempre quem está logado.

// Os dados de um pedido. Sem fotos, o corpo é JSON. Com fotos, é um
// formulário com arquivos (multipart): os dados vêm num campo "dados", em
// JSON, e as fotos no campo "fotos".
function dadosDoPedido(req) {
  if (!req.is("multipart/form-data")) return req.body ?? {};
  try {
    return JSON.parse(req.body?.dados ?? "{}");
  } catch {
    throw new ErroApi(400, "Os dados enviados estão mal formados.");
  }
}

const fotosInvalidas = (mensagem) =>
  new ErroApi(400, mensagem, { campos: { fotos: mensagem } });

// Trata e guarda as fotos enviadas, na ordem do envio, e devolve os
// endereços. Todas são tratadas antes de a primeira ser guardada: com uma
// foto ruim no meio, nenhuma fica gravada.
async function guardarFotos(arquivos) {
  const tratadas = [];
  for (const arquivo of arquivos) {
    tratadas.push(await prepararFoto(arquivo.buffer, "fotos"));
  }
  const enderecos = [];
  try {
    for (const imagem of tratadas) enderecos.push(await guardarImagem(imagem));
  } catch (erro) {
    await apagarArquivos(enderecos);
    throw erro;
  }
  return enderecos;
}

// A data de nascimento a gravar, conforme o tutor informou (NF8.2). A idade
// aproximada vira a data equivalente, marcada como aproximada: assim a
// estimativa envelhece junto com o animal, em vez de ficar congelada.
function nascimentoInformado({ dataNascimento, idadeAproximada }) {
  if (dataNascimento !== undefined) {
    return {
      dataNascimento: paraDataDoBanco(dataNascimento),
      nascimentoAproximado: false,
    };
  }
  if (idadeAproximada !== undefined) {
    return {
      dataNascimento: paraDataDoBanco(subtrairAnos(hojeISO(), idadeAproximada)),
      nascimentoAproximado: true,
    };
  }
  return {};
}

// O animal pelo código do endereço, com as fotos, se for de quem está
// logado. O de outra pessoa recebe a mesma resposta de um que não existe:
// quem tenta mexer no animal alheio não fica sabendo de nada. Os exames
// (controladores/documentos.js) usam a mesma conferência.
export async function animalDoUsuario(req) {
  const animal = await banco.animal.findUnique({
    where: { codigo: codigoDoEndereco(req.params.codigo) },
    include: COM_FOTOS,
  });
  if (!animal || animal.tutorId !== req.usuario.id) {
    throw new ErroApi(404, "Animal não encontrado.");
  }
  return animal;
}

// GET /api/usuarios/:codigo/animais — os animais de uma pessoa, do primeiro
// cadastrado ao último, para o perfil dela. Os exames vão com o endereço dos
// arquivos só para quem pode abri-los: o próprio tutor e os veterinários.
export async function listarAnimais(req, res) {
  const tutor = await banco.usuario.findUnique({
    where: { codigo: codigoDoEndereco(req.params.codigo) },
    select: { id: true },
  });
  if (!tutor) throw new ErroApi(404, "Pessoa não encontrada.");

  const animais = await banco.animal.findMany({
    where: { tutorId: tutor.id },
    orderBy: { criadoEm: "asc" },
    include: COM_HISTORICO,
  });
  const abreExames = podeAbrirExames(req.usuario, tutor.id);
  res.json({
    animais: animais.map((animal) => dadosDoAnimal(animal, { abreExames })),
  });
}

// POST /api/animais — cadastra um animal de quem está logado (F8), com as
// fotos, se vierem, na ordem do envio. Ele já nasce disponível para doação.
export async function cadastrarAnimal(req, res) {
  const dados = esquemaAnimal.parse(dadosDoPedido(req));
  const enderecos = await guardarFotos(req.files ?? []);

  let animal;
  try {
    animal = await banco.animal.create({
      data: {
        codigo: await codigoAnimalLivre(),
        tutorId: req.usuario.id,
        nome: dados.nome,
        especie: dados.especie,
        raca: dados.raca ?? null,
        sexo: dados.sexo,
        castrado: dados.castrado,
        pesoKg: dados.pesoKg,
        ...nascimentoInformado(dados),
        fotos: {
          create: enderecos.map((url, ordem) => ({ url, ordem })),
        },
      },
      select: { id: true, codigo: true },
    });
  } catch (erro) {
    // Sem o animal no banco, as fotos guardadas não servem para nada.
    await apagarArquivos(enderecos);
    throw erro;
  }
  registrar("animal_cadastrado", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    fotos: enderecos.length,
  });
  // Gravar as fotos junto faz o Prisma abrir uma transação, e buscar o
  // histórico dentro dela mandaria várias consultas ao mesmo tempo pela mesma
  // conexão. Por isso o animal completo é buscado depois, como na edição.
  const cadastrado = await buscarComHistorico(animal.id);
  res
    .status(201)
    .json({ animal: dadosDoAnimal(cadastrado, { abreExames: true }) });
}

// Confere a nova ordem das fotos (ver esquemaEdicaoAnimal) contra as fotos
// atuais e as enviadas, antes de qualquer arquivo ser tratado.
function conferirOrdemDasFotos(atuais, ordem, enviadas) {
  if (ordem === undefined) {
    if (atuais.length + enviadas > MAXIMO_FOTOS_POR_ANIMAL) {
      throw fotosInvalidas(
        `Cada animal pode ter até ${MAXIMO_FOTOS_POR_ANIMAL} fotos.`,
      );
    }
    return;
  }
  const ids = new Set(atuais.map((foto) => foto.id));
  const novas = ordem.filter((item) => item === "nova").length;
  const desconhecida = ordem.some((item) => item !== "nova" && !ids.has(item));
  if (novas !== enviadas || desconhecida) {
    throw fotosInvalidas("Lista de fotos inválida.");
  }
}

// As fotos na ordem final: { id } das que continuam e { url } das novas.
function fotosDepois(atuais, ordem, enderecosNovos) {
  if (ordem === undefined) {
    return [
      ...atuais.map(({ id }) => ({ id })),
      ...enderecosNovos.map((url) => ({ url })),
    ];
  }
  const novas = [...enderecosNovos];
  return ordem.map((item) =>
    item === "nova" ? { url: novas.shift() } : { id: item },
  );
}

// Grava a ordem final das fotos de um animal, dentro da transação.
async function gravarFotos(tx, animalId, depois) {
  const ficam = depois.filter((foto) => foto.id);
  await tx.animalFoto.deleteMany({
    where: {
      animalId,
      id: { notIn: ficam.map((foto) => foto.id) },
    },
  });
  // A ordem é única por animal: trocar duas fotos de lugar diretamente
  // esbarraria nisso. As que ficam passam antes por uma ordem provisória.
  for (const [indice, foto] of ficam.entries()) {
    await tx.animalFoto.update({
      where: { id: foto.id },
      data: { ordem: 100 + indice },
    });
  }
  for (const [ordem, foto] of depois.entries()) {
    if (foto.id) {
      await tx.animalFoto.update({ where: { id: foto.id }, data: { ordem } });
    } else {
      await tx.animalFoto.create({ data: { animalId, url: foto.url, ordem } });
    }
  }
}

// PATCH /api/animais/:codigo — muda os dados (F9), a disponibilidade (F11) ou
// as fotos. Vem só o que mudou. Dados e fotos são gravados juntos: se uma
// parte falha, nada muda.
//
// Mudar de verdade o peso ou o nascimento também tira o efeito do critério
// de peso e idade da validação em vigor (F21), na mesma transação: ele foi
// conferido sobre o valor antigo.
export async function editarAnimal(req, res) {
  // Primeiro o dono, depois os dados: sobre o animal alheio, nem as regras
  // de preenchimento respondem.
  const animal = await animalDoUsuario(req);
  const dados = esquemaEdicaoAnimal.parse(dadosDoPedido(req));
  const enviadas = req.files ?? [];

  // F21: o que conta é o valor mudar, não o campo vir no pedido. O peso e o
  // nascimento podem vir iguais aos de antes (o formulário manda tudo).
  const nascimento = nascimentoInformado(dados);
  const mudouPeso =
    dados.pesoKg !== undefined && dados.pesoKg !== Number(animal.pesoKg);
  const mudouNascimento =
    nascimento.dataNascimento !== undefined &&
    deDataDoBanco(nascimento.dataNascimento) !==
      deDataDoBanco(animal.dataNascimento);
  const motivoInvalidacao = mudouPeso
    ? "EDICAO_PESO"
    : mudouNascimento
      ? "EDICAO_NASCIMENTO"
      : null;

  // Os tipos sanguíneos são de cada espécie: confirmada a tipagem, trocar a
  // espécie deixaria o animal com um tipo que não existe para ela.
  if (
    dados.especie !== undefined &&
    dados.especie !== animal.especie &&
    animal.tipoSanguineo
  ) {
    const mensagem = "A espécie não muda depois da tipagem confirmada.";
    throw new ErroApi(400, mensagem, { campos: { especie: mensagem } });
  }

  conferirOrdemDasFotos(animal.fotos, dados.fotos, enviadas.length);
  const mudaFotos = dados.fotos !== undefined || enviadas.length > 0;
  const enderecosNovos = await guardarFotos(enviadas);
  const depois = fotosDepois(animal.fotos, dados.fotos, enderecosNovos);
  const removidas = animal.fotos.filter(
    (atual) => !depois.some((foto) => foto.id === atual.id),
  );

  let invalidou = false;
  try {
    await banco.$transaction(async (tx) => {
      // Campo que não veio fica como estava (o Prisma ignora o que é
      // undefined).
      await tx.animal.update({
        where: { id: animal.id },
        data: {
          nome: dados.nome,
          especie: dados.especie,
          raca: dados.raca,
          sexo: dados.sexo,
          castrado: dados.castrado,
          pesoKg: dados.pesoKg,
          disponivel: dados.disponivel,
          ...nascimento,
        },
      });
      if (motivoInvalidacao) {
        invalidou = await invalidarPesoIdade(tx, animal.id, motivoInvalidacao);
      }
      if (mudaFotos) await gravarFotos(tx, animal.id, depois);
    });
  } catch (erro) {
    await apagarArquivos(enderecosNovos);
    throw erro;
  }
  // Só depois de gravado: os arquivos das fotos que saíram.
  await apagarArquivos(removidas.map((foto) => foto.url));

  const atualizado = await buscarComHistorico(animal.id);
  if (invalidou) {
    registrar("validacao_invalidada", {
      usuarioId: req.usuario.id,
      animal: animal.codigo,
      motivo: motivoInvalidacao,
    });
  }
  registrar("animal_alterado", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    campos: mudaFotos
      ? [...new Set([...Object.keys(dados), "fotos"])]
      : Object.keys(dados),
  });
  res.json({ animal: dadosDoAnimal(atualizado, { abreExames: true }) });
}

// DELETE /api/animais/:codigo — exclui o animal (F10). O banco apaga junto
// fotos, exames, validações, observações e doações dele (onDelete no
// schema.prisma); depois, saem os arquivos das fotos e dos exames.
export async function excluirAnimal(req, res) {
  const animal = await animalDoUsuario(req);
  const exames = await banco.documentoVersao.findMany({
    where: { documento: { animalId: animal.id } },
    select: { arquivoUrl: true },
  });
  await banco.animal.delete({ where: { id: animal.id } });
  await apagarArquivos(animal.fotos.map((foto) => foto.url));
  await apagarExames(exames.map((exame) => exame.arquivoUrl));
  registrar("animal_excluido", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
  });
  res.status(204).end();
}
