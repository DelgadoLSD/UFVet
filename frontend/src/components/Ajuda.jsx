import { useBalao } from "../hooks/useBalao";

// Botão "?" que explica um dado num balão. No computador abre ao pousar o
// mouse por um instante, sem precisar clicar; no celular, e para quem prefere,
// abre com clique (o funcionamento do balão está em hooks/useBalao).
//
// Para um "?" que abre um modal com a explicação completa, use BotaoAjuda.
function Ajuda({ titulo, children, claro = false, className = "" }) {
  const { botao, balao } = useBalao();

  return (
    <>
      <button
        {...botao}
        aria-label={`Entenda: ${titulo}`}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none normal-case tracking-normal cursor-help transition-colors shrink-0 ${
          claro
            ? "bg-white/25 text-white hover:bg-white hover:text-[#7d0a1d]"
            : "bg-[#9e0a24]/10 text-[#9e0a24] hover:bg-[#7d0a1d] hover:text-white"
        } ${className}`}
      >
        ?
      </button>
      {balao(titulo, children)}
    </>
  );
}

export default Ajuda;
