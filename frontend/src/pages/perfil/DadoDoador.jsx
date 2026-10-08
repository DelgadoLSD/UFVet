import Ajuda from "../../components/Ajuda";

// Um dado do animal (tipo sanguíneo, peso, idade, doações): rótulo, valor
// grande e um detalhe embaixo. É uma célula da faixa vermelho-clara do cartão
// (DadosDoAnimal), que desenha as divisões brancas entre as células.
//
// - `destaque` pinta a célula de vermelho: só o tipo sanguíneo confirmado em
//   exame. É a única célula vermelha do cartão, para o tipo de sangue ser o
//   primeiro número que se lê;
// - `apagado` deixa o valor menor e em cinza (#5f5e5e, legível sobre o
//   vermelho-claro mesmo no tamanho menor), numa linha só, para o que
//   ainda não se sabe: "A confirmar" nunca quebra num "A" solto, que pareceria
//   o tipo A de um gato. A altura da linha é a mesma do valor normal, para
//   as células vizinhas continuarem alinhadas;
// - `alerta` deixa o detalhe em vermelho, quando o valor está fora do
//   critério;
// - `ajuda` ({ titulo, texto }) põe um "?" no canto superior direito;
// - `className` acerta o lugar da célula na grade (quantas colunas ocupa).
//
// O "?" fica no canto, fora da linha do rótulo: assim o texto não colide com
// o botão, mesmo quando o rótulo é longo. Célula com algo para fazer (as
// doações) não usa este componente: botão com nome escrito, não ícone no
// canto, que parecia mais uma ajuda.
function DadoDoador({
  rotulo,
  valor,
  detalhe,
  destaque,
  apagado,
  alerta,
  ajuda,
  className = "",
}) {
  const estiloValor = destaque
    ? "text-2xl leading-tight text-white"
    : apagado
      ? "text-base leading-[1.875rem] whitespace-nowrap text-[#5f5e5e]"
      : "text-2xl leading-tight text-[#1a1c1c]";
  const corDetalhe = alerta
    ? "font-semibold text-[#9e0a24]"
    : destaque
      ? "font-semibold text-white/85"
      : "text-[#5b403f]";

  return (
    <div
      className={`relative px-4 py-3.5 flex flex-col gap-0.5 min-w-0 ${
        destaque ? "bg-[#9e0a24]" : "bg-[#fdecee]"
      } ${className}`}
    >
      {ajuda && (
        <Ajuda
          titulo={ajuda.titulo}
          claro={destaque}
          className="absolute top-2.5 right-2.5"
        >
          {ajuda.texto}
        </Ajuda>
      )}
      <span
        className={`text-xs font-semibold pr-6 ${
          destaque ? "text-white/85" : "text-[#5b403f]"
        }`}
      >
        {rotulo}
      </span>
      <span
        className={`font-extrabold tracking-tight tabular-nums ${estiloValor}`}
      >
        {valor}
      </span>
      {detalhe && (
        <span className={`text-xs leading-snug ${corDetalhe}`}>{detalhe}</span>
      )}
    </div>
  );
}

export default DadoDoador;
