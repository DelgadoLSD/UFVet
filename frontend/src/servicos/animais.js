import { ANIMAIS_POR_TUTOR } from "../dados/exemplos/animais";
import { TIPOS_DOCUMENTO } from "../regras/doacao";
import { chamarApi } from "./api";
import { chamarComLogin } from "./sessao";

// Animais dos perfis.
//
// Vêm da API, com as fotos e o histórico clínico: validações, doações e
// observações, que o veterinário registra (F19 a F24). Cadastrar, editar,
// excluir e mudar a disponibilidade também gravam de verdade (F8 a F11).
//
// Os exames ainda não vêm da API: os animais de exemplo, que
// `npm run db:exemplos` cria no banco com os mesmos códigos, mostram os dos
// dados de exemplo; os outros começam sem nenhum. O que muda nessa parte
// vale só até recarregar a página.

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
    documentos:
      exemplo?.documentos ??
      Object.keys(TIPOS_DOCUMENTO).map((tipo) => ({ tipo, versoes: [] })),
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

// Animais de exemplo de um perfil, com as fotos no mesmo formato das que vêm
// da API.
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

// Os animais do perfil de outra pessoa. Enquanto os perfis visitados ainda
// saem dos dados de exemplo, a pessoa pode não existir no banco (o tutor de
// exemplo que um tutor visita): aí ficam os animais de exemplo dela.
export async function animaisDoPerfil(codigoTutor) {
  try {
    return await listarAnimais(codigoTutor);
  } catch (falha) {
    if (falha.status === 404 && ANIMAIS_POR_TUTOR[codigoTutor]) {
      return animaisDeExemplo(codigoTutor);
    }
    throw falha;
  }
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

// ─── O que o veterinário registra ─────────────────────────────────────────────

// Cada registro devolve o animal inteiro, já com o histórico novo. Quem
// assina não vai no pedido: a API usa a conta de quem está logado.
async function registrarNoAnimal(codigo, registro, corpo) {
  const { animal } = await chamarComLogin(
    `/animais/${encodeURIComponent(codigo)}/${registro}`,
    { metodo: "POST", corpo },
  );
  return paraAnimal(animal);
}

// { criterios: { TIPAGEM: true, ... }, tipoSanguineo, nota } (F19 e F20).
export const validarAnimal = (codigo, dados) =>
  registrarNoAnimal(codigo, "validacoes", dados);

// { dataColeta: "AAAA-MM-DD", volumeMl, estabelecimentoId, nota } (F24).
export const registrarDoacao = (codigo, dados) =>
  registrarNoAnimal(codigo, "doacoes", dados);

// F23.
export const registrarObservacao = (codigo, texto) =>
  registrarNoAnimal(codigo, "observacoes", { texto });

// Hospitais e clínicas cadastrados: { id, nome, cidade, uf }.
export async function listarEstabelecimentos() {
  const { estabelecimentos } = await chamarComLogin("/estabelecimentos");
  return estabelecimentos;
}
