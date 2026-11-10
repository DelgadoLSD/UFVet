// Dados como a API manda -> como as telas usam. Fica num arquivo próprio, sem
// importar nada, para a sessão e as consultas de pessoas poderem usá-lo sem se
// importarem entre si.

const crmvCompleto = ({ crmv, ufCrmv }) => `${crmv}-${ufCrmv}`;

// O perfil público de uma pessoa. Não tem e-mail nem telefone: o contato vem à
// parte, só para quem pode ver (buscarContato). A conta logada parte daqui e
// acrescenta o que é só dela (ver servicos/sessao.js).
export function paraPerfil(usuario) {
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
      crmv: crmvCompleto(veterinario),
      hospital: veterinario.estabelecimento.nome,
      validacoesRealizadas: veterinario.validacoesRealizadas,
    }),
  };
}

// Um veterinário como a API o resume (em quem liberou, a quem se pede).
export const paraVeterinario = (veterinario) => ({
  codigo: veterinario.codigo,
  papel: "VETERINARIO",
  nomeCompleto: veterinario.nomeCompleto,
  tratamento: veterinario.tratamento,
  crmv: crmvCompleto(veterinario),
  hospital: veterinario.estabelecimento.nome,
  foto: veterinario.fotoUrl,
});
