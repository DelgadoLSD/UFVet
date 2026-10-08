import { useId } from "react";

// Campo de texto de várias linhas, com rótulo em cima e uma dica embaixo
// (ligada ao campo para leitores de tela). Mesmo desenho dos campos de uma
// linha, sem a sombra.
function AreaTexto({ id, rotulo, dica, linhas = 3, ...props }) {
  const dicaId = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#1a1c1c] mb-2"
      >
        {rotulo}
      </label>
      <textarea
        id={id}
        rows={linhas}
        aria-describedby={dica ? dicaId : undefined}
        {...props}
        className="w-full px-4 py-3 bg-white border border-[#dccfcf] rounded-xl text-base text-[#1a1c1c] placeholder:text-[#a79d9d] resize-none transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#9e0a24] focus:ring-4 focus:ring-[#9e0a24]/10"
      />
      {dica && (
        <p id={dicaId} className="text-xs text-[#5f5e5e] mt-2">
          {dica}
        </p>
      )}
    </div>
  );
}

export default AreaTexto;
