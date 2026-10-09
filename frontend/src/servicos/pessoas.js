import { HOSPITAIS, TUTORES, VETERINARIOS } from "../dados/exemplos/pessoas";
import { chamarApi } from "./api";
import { chamarComLogin } from "./sessao";

// Consultas sobre pessoas e locais de atendimento.
//
// O perfil de outra pessoa e o contato dela vêm da API. As pessoas que os
// pedidos e as liberações de contato citam ainda saem dos dados de exemplo,
// até essa parte vir da API.

// Hospitais e clínicas atendidos pelo site.
export { HOSPITAIS };

// Tutor pelo código público, para o veterinário conferir quem vai liberar.
export const acharTutor = (codigo) => TUTORES.find((t) => t.codigo === codigo);

// Veterinário pelo código público, para o tutor endereçar um pedido.
export const acharVeterinario = (codigo) =>
  VETERINARIOS.find((v) => v.codigo === codigo);

// Veterinários de um hospital ou clínica: cada um atua em um local só.
export const veterinariosDe = (hospitalId) =>
  VETERINARIOS.filter((v) => v.hospitalId === hospitalId);

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
