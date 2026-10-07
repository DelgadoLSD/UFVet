import { ANIMAIS_POR_TUTOR } from "../dados/exemplos/animais";
import { TIPOS_DOCUMENTO } from "../regras/doacao";
import { chamarApi } from "./api";
import { chamarComLogin } from "./sessao";

// Animais dos perfis.
//
// Os do próprio perfil vêm da API: cadastrar, editar, excluir e mudar a
// disponibilidade gravam de verdade (F8 a F11). O perfil de outra pessoa
// (/tutor/:codigo) ainda mostra os animais de exemplo, até a busca e os
// perfis visitados virem da API.
//
// Fotos, doações, validações, observações e exames ainda não vêm da API. Os
// animais de exemplo, que `npm run db:exemplos` cria no banco com os mesmos
// códigos, mostram os dos dados de exemplo; os outros começam sem nada. O que
// muda nessas partes do cartão vale só até recarregar a página.

const EXEMPLOS = new Map(
  Object.values(ANIMAIS_POR_TUTOR)
    .flat()
    .map((animal) => [animal.codigo, animal]),
);

// O animal como a API manda -> o animal como os cartões usam.
function paraAnimal(animal) {
  const exemplo = EXEMPLOS.get(animal.codigo);
  return {
    ...animal,
    fotos: exemplo?.fotos ?? [],
    doacoes: exemplo?.doacoes ?? [],
    validacoes: exemplo?.validacoes ?? [],
    observacoes: exemplo?.observacoes ?? [],
    documentos:
      exemplo?.documentos ??
      Object.keys(TIPOS_DOCUMENTO).map((tipo) => ({ tipo, versoes: [] })),
    // O tipo confirmado também sai dos exemplos, até a validação vir da API.
    tipoSanguineo: animal.tipoSanguineo ?? exemplo?.tipoSanguineo ?? null,
  };
}

// Animais de exemplo de um perfil visitado.
export const animaisDeExemplo = (codigoTutor) =>
  ANIMAIS_POR_TUTOR[codigoTutor] ?? [];

// Os animais de uma pessoa, do primeiro cadastrado ao último.
export async function listarAnimais(codigoTutor) {
  const { animais } = await chamarApi(
    `/usuarios/${encodeURIComponent(codigoTutor)}/animais`,
  );
  return animais.map(paraAnimal);
}

// Erros (dados inválidos) chegam como ErroApi, com a mensagem de cada campo.
export async function cadastrarAnimal(dados) {
  const { animal } = await chamarComLogin("/animais", {
    metodo: "POST",
    corpo: dados,
  });
  return paraAnimal(animal);
}

// Vai só o que mudou: dados do animal ou a disponibilidade.
export async function salvarAnimal(codigo, dados) {
  const { animal } = await chamarComLogin(
    `/animais/${encodeURIComponent(codigo)}`,
    { metodo: "PATCH", corpo: dados },
  );
  return paraAnimal(animal);
}

export async function excluirAnimal(codigo) {
  await chamarComLogin(`/animais/${encodeURIComponent(codigo)}`, {
    metodo: "DELETE",
  });
}
