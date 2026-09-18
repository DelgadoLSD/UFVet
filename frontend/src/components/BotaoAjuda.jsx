// Ponto de ajuda padrão do site: o mesmo "?" redondo usado nos dados dos
// animais, sozinho. O texto ao lado era redundante — o símbolo já diz que ali
// se tira uma dúvida, e o rótulo vive no aria-label e na dica do mouse.
// O círculo é pequeno para acompanhar o texto, mas o botão ocupa 24px, que é
// o mínimo confortável para clicar e tocar.
function BotaoAjuda({ rotulo, onClick, claro = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className={`group inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        claro ? "focus-visible:ring-white" : "focus-visible:ring-[#b7102a]"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex items-center justify-center w-[17px] h-[17px] rounded-full text-[10px] font-bold leading-none transition-colors ${
          claro
            ? "bg-white/20 text-white group-hover:bg-white group-hover:text-[#8e001b]"
            : "bg-[#8e001b]/10 text-[#8e001b] group-hover:bg-[#8e001b] group-hover:text-white"
        }`}
      >
        ?
      </span>
    </button>
  );
}

export default BotaoAjuda;
