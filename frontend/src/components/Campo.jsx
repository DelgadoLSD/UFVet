import { useState } from "react";

// Campo de formulário com rótulo em cima. `extra` fica à direita do rótulo
// (ex.: "Esqueceu a senha?"); `senha` adiciona o botão de mostrar/ocultar.
function Campo({
  id,
  rotulo,
  extra,
  senha = false,
  type = "text",
  className = "",
  ...props
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <label htmlFor={id} className="text-sm font-semibold text-[#1a1c1c]">
          {rotulo}
        </label>
        {extra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={senha ? (visivel ? "text" : "password") : type}
          {...props}
          className={`w-full h-12 px-4 ${senha ? "pr-12" : ""} ${CLASSE_ENTRADA}`}
        />
        {senha && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visivel}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-[#8f6f6e] hover:text-[#8e001b] hover:bg-[#fdecee] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
          >
            <span className="material-symbols-outlined text-[20px]">
              {visivel ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// Exportada para os campos com busca (cidade, bairro) terem a mesma aparência.
export const CLASSE_ENTRADA =
  "bg-white border border-[#dccfcf] rounded-xl text-base text-[#1a1c1c] placeholder:text-[#a79d9d] shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10";

export default Campo;
