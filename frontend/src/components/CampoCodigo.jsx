import { limparCodigo } from "../util/texto";

// Campo para digitar o código público de alguém (#T3M8P1), com o "#" fixo na
// frente. O que a pessoa digita ou cola é limpo na hora: maiúsculas, sem "#"
// nem espaços, no máximo 6 caracteres. `onMudar` recebe o código já limpo.
function CampoCodigo({ id, rotulo, dica, placeholder, valor, onMudar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <label htmlFor={id} className="text-sm font-semibold text-[#1a1c1c]">
          {rotulo}
        </label>
        <span className="text-xs text-[#5f5e5e]">{dica}</span>
      </div>
      <div className="flex items-center h-12 pl-4 bg-white border border-[#dccfcf] rounded-xl shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors focus-within:border-[#9e0a24] focus-within:ring-4 focus-within:ring-[#9e0a24]/10">
        <span
          aria-hidden="true"
          className="text-lg font-semibold text-[#8f6f6e] select-none"
        >
          #
        </span>
        <input
          id={id}
          value={valor}
          autoComplete="off"
          spellCheck="false"
          placeholder={placeholder}
          onChange={(e) => onMudar(limparCodigo(e.target.value))}
          className="flex-1 h-full px-2 bg-transparent text-base font-semibold tracking-[0.12em] text-[#1a1c1c] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a79d9d] focus:outline-none"
        />
      </div>
    </div>
  );
}

export default CampoCodigo;
