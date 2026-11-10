import AvisoErro from "./AvisoErro";
import Botao from "./Botao";

// O que aparece quando uma lista não veio: o motivo e o botão de buscar de novo.
function ErroComTentar({
  erro,
  onTentar,
  className = "",
  variante = "secundario",
  tamanho,
}) {
  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      <AvisoErro>{erro}</AvisoErro>
      <Botao
        variante={variante}
        tamanho={tamanho}
        icone="refresh"
        onClick={onTentar}
      >
        Tentar de novo
      </Botao>
    </div>
  );
}

export default ErroComTentar;
