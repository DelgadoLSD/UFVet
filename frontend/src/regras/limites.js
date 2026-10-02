// Tamanho máximo dos textos digitados, igual ao das colunas do banco
// (backend/prisma/schema.prisma). O campo não deixa passar disso, e um texto
// longo demais nunca chega a ser recusado pela API.
//
// Se uma coluna mudar de tamanho no banco, o limite muda aqui também.
export const LIMITES = {
  nomeCompleto: 120, // usuario.nome_completo
  bairro: 80, // usuario.bairro
  crmv: 12, // veterinario.crmv
  nomeAnimal: 60, // animal.nome
  raca: 60, // animal.raca
  casoLiberacao: 160, // liberacao_contato.caso
};
