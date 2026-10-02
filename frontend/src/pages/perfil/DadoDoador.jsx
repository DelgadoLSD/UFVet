import Ajuda from "../../components/Ajuda";

// Um dado do animal em destaque no cartão (tipo sanguíneo, peso, idade,
// doações): rótulo, valor grande e um detalhe embaixo.
//
// - `destaque` pinta o quadro de vermelho (só o tipo sanguíneo confirmado);
// - `alerta` deixa o detalhe em âmbar, quando o valor está fora do critério;
// - `ajuda` ({ titulo, texto }) põe um "?" no canto inferior direito;
// - `acao` ({ icone, rotulo, onClick }) ocupa o mesmo canto no lugar da ajuda:
//   onde há um histórico para abrir, a explicação vai junto, dentro dele.
//
// O "?" fica no canto, fora da linha do rótulo: assim o texto centraliza
// sozinho e o botão nunca colide com rótulos longos.
function DadoDoador({ rotulo, valor, detalhe, alerta, destaque, ajuda, acao }) {
  return (
    <div
      className={`relative rounded-xl border px-3 pt-3 pb-5 flex flex-col items-center justify-center text-center gap-1 ${
        destaque
          ? "bg-[#8e001b] border-[#8e001b]"
          : "bg-[#fafafa] border-[#f0e6e6]"
      }`}
    >
      {acao ? (
        <button
          type="button"
          onClick={acao.onClick}
          aria-label={acao.rotulo}
          title={acao.rotulo}
          className="group absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] focus-visible:ring-offset-1"
        >
          <span
            aria-hidden="true"
            className="w-[17px] h-[17px] rounded-full bg-[#8e001b]/10 text-[#8e001b] flex items-center justify-center transition-colors group-hover:bg-[#8e001b] group-hover:text-white"
          >
            <span className="material-symbols-outlined text-[12px]">
              {acao.icone}
            </span>
          </span>
        </button>
      ) : (
        ajuda && (
          <Ajuda
            titulo={ajuda.titulo}
            claro={destaque}
            className="absolute bottom-1.5 right-1.5"
          >
            {ajuda.texto}
          </Ajuda>
        )
      )}
      <span
        className={`text-xs font-semibold ${
          destaque ? "text-white/80" : "text-[#5f5e5e]"
        }`}
      >
        {rotulo}
      </span>
      <span
        className={`font-extrabold leading-tight ${
          destaque ? "text-white text-2xl" : "text-[#1a1c1c] text-lg"
        }`}
      >
        {valor}
      </span>
      {detalhe && (
        <span
          className={`text-[10px] font-semibold leading-snug ${
            alerta
              ? "text-amber-700"
              : destaque
                ? "text-white/80"
                : "text-[#5f5e5e]"
          }`}
        >
          {detalhe}
        </span>
      )}
    </div>
  );
}

export default DadoDoador;
