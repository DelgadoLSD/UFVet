// O "?" de ajuda do site, o mesmo em todo lugar: o ícone de ajuda (um ponto
// de interrogação num círculo vazado), sozinho, ao lado do que ele explica.
// Em vermelho sobre fundo claro; em branco sobre as faixas vermelhas e os
// blocos pretos (`claro`). Ao passar o mouse, ao focar ou com a explicação
// aberta, o círculo fica cheio (ver .simbolo-ajuda no index.css). O texto
// ao lado era redundante: o rótulo vive no aria-label e na dica do mouse.
//
// O botão tem 24px, o mínimo confortável para clicar; no toque, uma área
// invisível em volta chega a 40px.
//
// `BotaoSimboloAjuda` é só o desenho do botão: o "?" que abre um balão
// (Ajuda) e o que abre uma janela com a explicação completa (BotaoAjuda, o
// padrão deste arquivo) usam o mesmo.
export function BotaoSimboloAjuda({ claro = false, className = "", ...props }) {
  // A área de toque é posicionada pelo próprio botão. Quem já o posiciona
  // (como o canto das células de dados, com absolute) não pode perder essa
  // posição.
  const posicao = className.split(" ").includes("absolute") ? "" : "relative";

  return (
    <button
      type="button"
      {...props}
      className={`botao-ajuda ${posicao} toque:before:absolute toque:before:-inset-2 inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full normal-case tracking-normal transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        claro
          ? "text-white/90 hover:text-white focus-visible:ring-white"
          : "text-[#9e0a24] hover:text-[#7d0a1d] focus-visible:ring-[#9e0a24]"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined simbolo-ajuda text-[20px]"
      >
        help
      </span>
    </button>
  );
}

// O "?" que abre uma janela com a explicação completa (como funciona a
// validação, o acesso aos contatos).
function BotaoAjuda({ rotulo, onClick, claro = false, className = "" }) {
  return (
    <BotaoSimboloAjuda
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      claro={claro}
      className={className}
    />
  );
}

export default BotaoAjuda;
