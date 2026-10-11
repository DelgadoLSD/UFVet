import { chamarApi } from "./api";
import { chamarComLogin } from "./sessao";

// Animais dos perfis.
//
// Vêm da API como os cartões usam: as fotos ({ id, url }, da principal em
// diante), os exames (os três tipos, cada um com as versões enviadas) e o
// histórico clínico: validações, doações e observações, que o veterinário
// registra (F19 a F24). Cadastrar, editar, excluir, mudar a disponibilidade e
// enviar exames também gravam de verdade (F8 a F11, F14).

// O corpo do pedido: JSON, ou, com fotos novas, um formulário com arquivos,
// com os dados no campo "dados" e as fotos no campo "fotos", na ordem.
function corpoDoPedido(dados, arquivos = []) {
  if (arquivos.length === 0) return dados;
  const formulario = new FormData();
  formulario.append("dados", JSON.stringify(dados));
  for (const arquivo of arquivos) formulario.append("fotos", arquivo);
  return formulario;
}

// Os animais de uma pessoa, do primeiro cadastrado ao último: os do próprio
// perfil e os do perfil de outra pessoa.
export async function listarAnimais(codigoTutor) {
  const { animais } = await chamarApi(
    `/usuarios/${encodeURIComponent(codigoTutor)}/animais`,
  );
  return animais;
}

// Cadastra com as fotos escolhidas, na ordem (a primeira é a principal).
// Erros (dados inválidos, foto recusada) chegam como ErroApi, com a mensagem
// de cada campo.
export async function cadastrarAnimal(dados, arquivos) {
  const { animal } = await chamarComLogin("/animais", {
    metodo: "POST",
    corpo: corpoDoPedido(dados, arquivos),
  });
  return animal;
}

// Vai só o que mudou: dados, disponibilidade ou fotos. A nova ordem das fotos
// vai em `dados.fotos` (ver pages/perfil/formularioAnimal.js), e as fotos
// novas, em `arquivos`.
export async function salvarAnimal(codigo, dados, arquivos) {
  const { animal } = await chamarComLogin(
    `/animais/${encodeURIComponent(codigo)}`,
    { metodo: "PATCH", corpo: corpoDoPedido(dados, arquivos) },
  );
  return animal;
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
  return animal;
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

// ─── Exames ───────────────────────────────────────────────────────────────────

// Envia o arquivo de um exame do animal (F14): `tipo` é HEMOGRAMA, SOROLOGIA
// ou VACINACAO. Cada envio vira uma versão nova, e as anteriores continuam
// guardadas (F15). Devolve o animal com a lista nova; um arquivo recusado
// chega como ErroApi, com a mensagem no campo "arquivo".
export async function enviarDocumento(codigo, tipo, arquivo) {
  const formulario = new FormData();
  formulario.append("arquivo", arquivo);
  const { animal } = await chamarComLogin(
    `/animais/${encodeURIComponent(codigo)}/documentos/${tipo}`,
    { metodo: "POST", corpo: formulario },
  );
  return animal;
}

// O arquivo de uma versão de exame (Blob), para a janela do exame. A API só
// manda o endereço (arquivoUrl) para quem pode abrir, o dono do animal e os
// veterinários, e confere de novo a cada pedido.
export const baixarExame = (versao) =>
  chamarComLogin(versao.arquivoUrl.replace(/^\/api/, ""), {
    comoArquivo: true,
  });

// Apaga uma versão de exame que o próprio tutor enviou (o arquivo errado,
// por exemplo). Devolve { animal, criterioInvalidado }: o animal atualizado
// e o critério da validação que perdeu o efeito (F21), quando a validação em
// vigor tinha conferido aquele arquivo, ou null.
export const apagarVersaoDoExame = (versao) =>
  chamarComLogin(`/documentos/versoes/${encodeURIComponent(versao.id)}`, {
    metodo: "DELETE",
  });

// Hospitais e clínicas cadastrados: { id, nome, cidade, uf }.
export async function listarEstabelecimentos() {
  const { estabelecimentos } = await chamarComLogin("/estabelecimentos");
  return estabelecimentos;
}
