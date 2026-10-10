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

// O cartão de cadastrar um animal novo, no carrossel do próprio perfil. Ele
// é o primeiro da fila, logo à esquerda do primeiro animal, que é o que a
// página abre no centro: assim o "+" aparece à vista, sem ninguém precisar
// procurar (no fim da fila, sumia para quem tinha muitos animais).
export const NOVO_ANIMAL = "novo";

// A fila do carrossel: o cartão de cadastrar (quando `comCadastro`) e os
// códigos dos animais.
export const itensDoCarrossel = (animais, comCadastro) => [
  ...(comCadastro ? [NOVO_ANIMAL] : []),
  ...animais.map((animal) => animal.codigo),
];

// O que fica no centro do carrossel: o cartão de cadastrar, se foi ele o
// escolhido (e ele existe), ou o animal escolhido (ver animalEscolhido). Sem
// animais, o cartão de cadastrar, se houver; senão, nada.
export function itemDoCentro(animais, codigo, comCadastro) {
  if (comCadastro && codigo === NOVO_ANIMAL) return NOVO_ANIMAL;
  return (
    animalEscolhido(animais, codigo)?.codigo ??
    (comCadastro ? NOVO_ANIMAL : null)
  );
}
