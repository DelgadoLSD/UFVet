import { ESPECIES } from "../regras/doacao";
import { chamarApi } from "./api";
import { chamarComLogin } from "./sessao";

// Consultas sobre pessoas e locais de atendimento, pela API: o perfil de
// outra pessoa, o contato dela, os veterinários de cada hospital e a
// conferência do tutor antes de liberar o acesso aos contatos.

// O perfil público como a API manda -> a pessoa como as telas usam, com os
// mesmos nomes da conta logada (ver servicos/sessao.js). Não tem e-mail nem
// telefone: o contato vem à parte, só para quem pode ver (buscarContato).
function paraPerfil(usuario) {
  const { veterinario } = usuario;
  return {
    codigo: usuario.codigo,
    papel: usuario.papel,
    nomeCompleto: usuario.nomeCompleto,
    cidade: usuario.cidade,
    bairro: usuario.bairro,
    membroDesde: usuario.membroDesde,
    foto: usuario.fotoUrl,
    ...(veterinario && {
      tratamento: veterinario.tratamento,
      crmv: `${veterinario.crmv}-${veterinario.ufCrmv}`,
      hospital: veterinario.estabelecimento.nome,
      validacoesRealizadas: veterinario.validacoesRealizadas,
    }),
  };
}

// Um veterinário como a API o resume (em quem liberou, a quem se pede) -> do
// jeito que as telas usam.
export const paraVeterinario = (veterinario) => ({
  codigo: veterinario.codigo,
  papel: "VETERINARIO",
  nomeCompleto: veterinario.nomeCompleto,
  tratamento: veterinario.tratamento,
  crmv: `${veterinario.crmv}-${veterinario.ufCrmv}`,
  hospital: veterinario.estabelecimento.nome,
  foto: veterinario.fotoUrl,
});

// Os animais de um tutor numa frase: "Zeus (cão) e Luna (gato)".
export function resumoDosAnimais(animais) {
  if (animais.length === 0) return "Nenhum animal cadastrado";
  const itens = animais.map(
    (animal) =>
      `${animal.nome} (${ESPECIES[animal.especie].rotulo.toLowerCase()})`,
  );
  return new Intl.ListFormat("pt-BR", {
    style: "long",
    type: "conjunction",
  }).format(itens);
}

// O perfil aberto em /tutor/:codigo, que qualquer um vê.
export async function buscarPerfil(codigo) {
  const { usuario } = await chamarApi(
    `/usuarios/${encodeURIComponent(codigo)}`,
  );
  return paraPerfil(usuario);
}

// O contato ({ email, telefone }) de uma pessoa, só para quem pode ver: o
// veterinário, ou o tutor com uma liberação em vigor (F33). Os outros
// recebem o motivo, num ErroApi.
export async function buscarContato(codigo) {
  const { contato } = await chamarComLogin(
    `/usuarios/${encodeURIComponent(codigo)}/contato`,
  );
  return contato;
}

// Os veterinários de um hospital ou clínica, para o tutor escolher a quem
// pedir a liberação quando não sabe o código (NF27.2).
export async function veterinariosDe(estabelecimentoId) {
  const { veterinarios } = await chamarComLogin(
    `/estabelecimentos/${encodeURIComponent(estabelecimentoId)}/veterinarios`,
  );
  return veterinarios.map(paraVeterinario);
}

// O tutor de um código, para o veterinário conferir antes de liberar
// (NF28.3): o perfil, os animais numa frase e a liberação que ele já tem,
// se tiver (de qualquer veterinário). Um código de veterinário ou que
// ninguém usa vem como ErroApi, com o motivo.
export async function conferirTutor(codigo) {
  const { tutor, liberacao } = await chamarComLogin(
    `/usuarios/${encodeURIComponent(codigo)}/acesso`,
  );
  return {
    tutor: {
      ...paraPerfil(tutor),
      animaisResumo: resumoDosAnimais(tutor.animais),
    },
    liberacao: liberacao && {
      expiraEm: liberacao.expiraEm,
      veterinario: paraVeterinario(liberacao.veterinario),
    },
  };
}
