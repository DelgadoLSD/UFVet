import { MESES_CURTOS, paraData } from "../../util/datas";

// Dia em destaque e mês/ano embaixo, à esquerda de cada linha dos históricos
// (doações e validações). Nos dois, a data é a identidade do registro, então
// ela vira o marcador da linha, e as duas listas leem como a mesma linguagem
// visual.
function MarcadorData({ data }) {
  const d = paraData(data);
  return (
    <div className="w-12 shrink-0 text-center">
      <p className="text-xl font-extrabold text-[#9e0a24] leading-none tabular-nums">
        {String(d.getDate()).padStart(2, "0")}
      </p>
      <p className="text-[11px] text-[#8f6f6e] mt-1 leading-none">
        {MESES_CURTOS[d.getMonth()]} {d.getFullYear()}
      </p>
    </div>
  );
}

export default MarcadorData;
