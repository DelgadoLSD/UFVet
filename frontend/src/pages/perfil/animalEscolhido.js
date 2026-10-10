// Qual animal do perfil aparece aberto embaixo do carrossel: o que veio no
// endereço (?animal=H4R8T2, posto pelo cartão da busca ou pela última
// escolha), ou o primeiro da lista quando o endereço não diz nenhum, ou diz
// um que não está ali (foi excluído, ou é de outro tutor). Sem animais, nenhum.
export function animalEscolhido(animais, codigo) {
  if (animais.length === 0) return null;
  const pedido = codigo?.trim().replace(/^#/, "").toUpperCase();
  return animais.find((animal) => animal.codigo === pedido) ?? animais[0];
}

// O endereço do perfil do tutor já com um animal aberto.
export const enderecoDoAnimal = (tutorCodigo, animalCodigo) =>
  `/tutor/${tutorCodigo}?animal=${animalCodigo}`;

// Os ids que ligam cada cartão do carrossel (a aba) ao cartão completo do
// mesmo animal (o painel), para o leitor de tela saber o que cada um abre.
export const idDaAba = (codigo) => `aba-${codigo}`;
export const idDoPainel = (codigo) => `painel-${codigo}`;
