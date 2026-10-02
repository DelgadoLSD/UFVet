// Código público de alguém (#T3M8P1) ao lado do nome, só para leitura. Para um
// código que se copia com um clique, use CodigoCopiavel.
//
// `claro` é a versão para fundos vermelhos ou escuros.
function EtiquetaCodigo({ codigo, claro = false }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
        claro ? "bg-white/20 text-white" : "bg-[#fdecee] text-[#8e001b]"
      }`}
    >
      #{codigo}
    </span>
  );
}

export default EtiquetaCodigo;
