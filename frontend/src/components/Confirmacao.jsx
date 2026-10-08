import { useConfirmacao } from "../hooks/confirmacoes";

// A faixa que confirma que algo foi salvo (ver hooks/confirmacoes.js). Fica
// uma só no site inteiro, embaixo e no centro da tela, por cima de tudo,
// inclusive das janelas: a confirmação vale também depois que a janela fecha
// ou a página muda.
//
// Preta com o "✓" num círculo vermelho, as cores do site, e em pílula, a
// forma que o site usa para situação (botões têm cantos arredondados). O
// contorno claro, quase invisível no branco, separa a faixa dos blocos
// pretos da página.
//
// O contêiner existe sempre, para o leitor de tela anunciar cada confirmação
// que entra nele.
function Confirmacao() {
  const confirmacao = useConfirmacao();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      {confirmacao && (
        <div
          key={confirmacao.id}
          className={`confirmacao flex items-center gap-3 max-w-md bg-[#1a1a1a] text-white pl-2 pr-5 py-2 ring-1 ring-white/15 shadow-[0_16px_40px_-12px_rgba(26,26,26,0.55)] ${
            confirmacao.detalhe ? "rounded-[22px]" : "rounded-full"
          } ${confirmacao.saindo ? "confirmacao-saindo" : ""}`}
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-[#9e0a24] flex items-center justify-center shrink-0"
          >
            <span
              className="material-symbols-outlined text-[19px]"
              style={{ fontVariationSettings: '"wght" 600' }}
            >
              check
            </span>
          </span>
          <span className="min-w-0 py-1">
            <span className="block text-sm font-semibold leading-snug">
              {confirmacao.texto}
            </span>
            {confirmacao.detalhe && (
              <span className="block text-[13px] text-white/70 leading-snug mt-0.5">
                {confirmacao.detalhe}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export default Confirmacao;
