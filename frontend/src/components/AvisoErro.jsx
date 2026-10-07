// Mensagem de erro de um formulário inteiro (senha errada, servidor fora do
// ar), logo acima do botão de enviar. Erros de um campo só aparecem embaixo
// do próprio campo. O leitor de tela anuncia a mensagem assim que ela surge.
function AvisoErro({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-[#fdecee] px-3.5 py-3 text-sm text-[#8e001b] leading-snug"
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px] shrink-0"
      >
        error
      </span>
      {children}
    </p>
  );
}

export default AvisoErro;
