import { banco } from "../banco.js";
import { hojeISO, paraDataDoBanco, subtrairAnos } from "../datas.js";
import { ErroApi } from "../erros.js";
import { codigoAnimalLivre, dadosDoAnimal } from "../modelos/animal.js";
import { registrar } from "../registro.js";
import { esquemaAnimal, esquemaEdicaoAnimal } from "../validacao.js";

// Controller (do MVC) dos animais: cadastrar (F8), ver, editar (F9), excluir
// (F10) e mudar a disponibilidade (F11).
//
// Ver é público, como a busca (NF16.4): os dados do animal não identificam
// ninguém. Mudar exige ser o dono, que é sempre quem está logado.

// Código público no endereço (/animais/Z7R2K4), em maiúsculas.
const codigoDoEndereco = (valor) => valor.trim().toUpperCase();

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

// O animal pelo código do endereço, se for de quem está logado. O de outra
// pessoa recebe a mesma resposta de um que não existe: quem tenta mexer no
// animal alheio não fica sabendo de nada.
async function animalDoUsuario(req) {
  const animal = await banco.animal.findUnique({
    where: { codigo: codigoDoEndereco(req.params.codigo) },
  });
  if (!animal || animal.tutorId !== req.usuario.id) {
    throw new ErroApi(404, "Animal não encontrado.");
  }
  return animal;
}

// GET /api/usuarios/:codigo/animais — os animais de uma pessoa, do primeiro
// cadastrado ao último, para o perfil dela.
export async function listarAnimais(req, res) {
  const tutor = await banco.usuario.findUnique({
    where: { codigo: codigoDoEndereco(req.params.codigo) },
    select: { id: true },
  });
  if (!tutor) throw new ErroApi(404, "Pessoa não encontrada.");

  const animais = await banco.animal.findMany({
    where: { tutorId: tutor.id },
    orderBy: { criadoEm: "asc" },
  });
  res.json({ animais: animais.map(dadosDoAnimal) });
}

// POST /api/animais — cadastra um animal de quem está logado (F8). Ele já
// nasce disponível para doação.
export async function cadastrarAnimal(req, res) {
  const dados = esquemaAnimal.parse(req.body ?? {});

  const animal = await banco.animal.create({
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
    },
  });
  registrar("animal_cadastrado", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
  });
  res.status(201).json({ animal: dadosDoAnimal(animal) });
}

// PATCH /api/animais/:codigo — muda os dados (F9) ou a disponibilidade (F11).
// Vem só o que mudou.
//
// Quando a validação clínica estiver ligada à API, mudar o peso ou o
// nascimento vai também invalidar o critério de peso e idade (F21).
export async function editarAnimal(req, res) {
  // Primeiro o dono, depois os dados: sobre o animal alheio, nem as regras
  // de preenchimento respondem.
  const animal = await animalDoUsuario(req);
  const dados = esquemaEdicaoAnimal.parse(req.body ?? {});

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

  // Campo que não veio fica como estava (o Prisma ignora o que é undefined).
  const atualizado = await banco.animal.update({
    where: { id: animal.id },
    data: {
      nome: dados.nome,
      especie: dados.especie,
      raca: dados.raca,
      sexo: dados.sexo,
      castrado: dados.castrado,
      pesoKg: dados.pesoKg,
      disponivel: dados.disponivel,
      ...nascimentoInformado(dados),
    },
  });
  registrar("animal_alterado", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
    campos: Object.keys(dados),
  });
  res.json({ animal: dadosDoAnimal(atualizado) });
}

// DELETE /api/animais/:codigo — exclui o animal (F10). O banco apaga junto
// fotos, exames, validações, observações e doações dele (onDelete no
// schema.prisma). Quando o site guardar fotos e exames, os arquivos também
// vão precisar ser apagados do armazenamento aqui.
export async function excluirAnimal(req, res) {
  const animal = await animalDoUsuario(req);
  await banco.animal.delete({ where: { id: animal.id } });
  registrar("animal_excluido", {
    usuarioId: req.usuario.id,
    animal: animal.codigo,
  });
  res.status(204).end();
}
