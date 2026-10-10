import { useEffect, useRef } from "react";

// Mantém uma informação da tela em dia com o servidor, para o que pode mudar
// por ação de outra pessoa (um veterinário que libera o acesso, um tutor que
// manda um pedido). Do jeito que a maioria dos sites faz, sem conexão aberta
// o tempo todo:
// - pergunta de novo ao servidor quando a pessoa volta para a aba (ou para a
//   janela do navegador);
// - e, com a aba à vista, a cada `intervaloMs`. Com a aba escondida, não
//   pergunta nada: ninguém está olhando, e o servidor não é incomodado.
//
// `atualizar` é a função que busca de novo; `ligado` desliga tudo (para o
// visitante, por exemplo).
export function useAtualizacaoPeriodica(atualizar, intervaloMs, ligado = true) {
  // A função mais recente, sem recomeçar o relógio a cada desenho da tela.
  const atual = useRef(atualizar);
  useEffect(() => {
    atual.current = atualizar;
  });

  useEffect(() => {
    if (!ligado) return;
    const visivel = () => document.visibilityState === "visible";
    const aoVoltar = () => visivel() && atual.current();
    const relogio = setInterval(aoVoltar, intervaloMs);
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      clearInterval(relogio);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [intervaloMs, ligado]);
}
