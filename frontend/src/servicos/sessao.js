import { useSyncExternalStore } from "react";
import { CONTAS } from "../dados/exemplos/pessoas";

// Quem está usando o site.
//
// Enquanto não há login de verdade, o site simula duas contas, alternadas
// pelo menu do topo: o veterinário, que vê os contatos livremente, e a
// tutora, que só vê com liberação. Recarregar a página volta para a primeira
// conta. Na integração, este serviço passa a perguntar à API quem está
// logado, e as telas continuam usando useSessao().

export { CONTAS };

let conta = CONTAS[0];
const ouvintes = new Set();

const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};

const avisarTodos = () => ouvintes.forEach((aviso) => aviso());

// A conta atual; a tela volta a desenhar quando ela muda.
export function useSessao() {
  return useSyncExternalStore(assinar, () => conta);
}

export function trocarConta(codigo) {
  const escolhida = CONTAS.find((c) => c.codigo === codigo);
  if (!escolhida || escolhida === conta) return;
  conta = escolhida;
  avisarTodos();
}

// Edição do próprio cadastro. Sem back-end, o dado novo vale só até recarregar
// a página, mas vale no site inteiro: o cartão do perfil e o menu do topo
// leem daqui.
export function atualizarConta(dados) {
  const atualizada = { ...conta, ...dados };
  CONTAS[CONTAS.indexOf(conta)] = atualizada;
  conta = atualizada;
  avisarTodos();
}
