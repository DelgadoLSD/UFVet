import { ANIMAIS_POR_TUTOR } from "../dados/exemplos/animais";
import { TIPOS_DOCUMENTO } from "../regras/doacao";
import { chamarApi } from "./api";
import { chamarComLogin } from "./sessao";

// Animais dos perfis.
//
// Os do próprio perfil vêm da API, com as fotos: cadastrar, editar, excluir
// e mudar a disponibilidade gravam de verdade (F8 a F11). O perfil de outra
// pessoa (/tutor/:codigo) ainda mostra os animais de exemplo, até a busca e
// os perfis visitados virem da API.
//
// Doações, validações, observações e exames ainda não vêm da API. Os animais
// de exemplo, que `npm run db:exemplos` cria no banco com os mesmos códigos,
// mostram os dos dados de exemplo; os outros começam sem nada. O que muda
// nessas partes do cartão vale só até recarregar a página.

const EXEMPLOS = new Map(
  Object.values(ANIMAIS_POR_TUTOR)
    .flat()
    .map((animal) => [animal.codigo, animal]),
);

// O animal como a API manda -> o animal como os cartões usam. As fotos vêm
// como { id, url }, da principal em diante.
function paraAnimal(animal) {
  const exemplo = EXEMPLOS.get(animal.codigo);
  return {
    ...animal,
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

// O corpo do pedido: JSON, ou, com fotos novas, um formulário com arquivos,
// com os dados no campo "dados" e as fotos no campo "fotos", na ordem.
function corpoDoPedido(dados, arquivos = []) {
  if (arquivos.length === 0) return dados;
  const formulario = new FormData();
  formulario.append("dados", JSON.stringify(dados));
  for (const arquivo of arquivos) formulario.append("fotos", arquivo);
  return formulario;
}

// Animais de exemplo de um perfil visitado, com as fotos no mesmo formato
// das que vêm da API.
export const animaisDeExemplo = (codigoTutor) =>
  (ANIMAIS_POR_TUTOR[codigoTutor] ?? []).map((animal) => ({
    ...animal,
    fotos: animal.fotos.map((url) => ({ id: null, url })),
  }));

// Os animais de uma pessoa, do primeiro cadastrado ao último.
export async function listarAnimais(codigoTutor) {
  const { animais } = await chamarApi(
    `/usuarios/${encodeURIComponent(codigoTutor)}/animais`,
  );
  return animais.map(paraAnimal);
}

// Cadastra com as fotos escolhidas, na ordem (a primeira é a principal).
// Erros (dados inválidos, foto recusada) chegam como ErroApi, com a mensagem
// de cada campo.
export async function cadastrarAnimal(dados, arquivos) {
  const { animal } = await chamarComLogin("/animais", {
    metodo: "POST",
    corpo: corpoDoPedido(dados, arquivos),
  });
  return paraAnimal(animal);
}

// Vai só o que mudou: dados, disponibilidade ou fotos. A nova ordem das fotos
// vai em `dados.fotos` (ver pages/perfil/formularioAnimal.js), e as fotos
// novas, em `arquivos`.
export async function salvarAnimal(codigo, dados, arquivos) {
  const { animal } = await chamarComLogin(
    `/animais/${encodeURIComponent(codigo)}`,
    { metodo: "PATCH", corpo: corpoDoPedido(dados, arquivos) },
  );
  return paraAnimal(animal);
}

export async function excluirAnimal(codigo) {
  await chamarComLogin(`/animais/${encodeURIComponent(codigo)}`, {
    metodo: "DELETE",
  });
}
