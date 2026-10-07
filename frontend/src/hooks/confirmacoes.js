import { useSyncExternalStore } from "react";

// A confirmação de que algo foi salvo (a foto trocada, os dados da conta, o
// animal cadastrado): uma faixa embaixo da tela, que aparece por alguns
// segundos e some sozinha (components/Confirmacao.jsx). Uma de cada vez: a
// nova toma o lugar da anterior.
//
//   confirmar("Alterações salvas");
//   confirmar("Alterações salvas", "Use o novo e-mail para entrar.");

const DURACAO_MS = 3500;
// Com uma segunda linha, mais tempo para ler.
const DURACAO_COM_DETALHE_MS = 6000;
// O tempo da animação de saída (index.css).
const SAIDA_MS = 180;

let atual = null;
let contador = 0;
let temporizador;
const ouvintes = new Set();

const avisar = () => ouvintes.forEach((ouvinte) => ouvinte());

function sair() {
  if (!atual) return;
  atual = { ...atual, saindo: true };
  avisar();
  temporizador = setTimeout(() => {
    atual = null;
    avisar();
  }, SAIDA_MS);
}

export function confirmar(texto, detalhe) {
  clearTimeout(temporizador);
  atual = { id: ++contador, texto, detalhe, saindo: false };
  avisar();
  temporizador = setTimeout(
    sair,
    detalhe ? DURACAO_COM_DETALHE_MS : DURACAO_MS,
  );
}

// A confirmação na tela agora, ou null: { texto, detalhe, saindo }.
export const confirmacaoAtual = () => atual;

export function useConfirmacao() {
  return useSyncExternalStore((ouvinte) => {
    ouvintes.add(ouvinte);
    return () => ouvintes.delete(ouvinte);
  }, confirmacaoAtual);
}
