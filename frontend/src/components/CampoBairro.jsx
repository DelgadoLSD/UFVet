import { useCallback, useId } from "react";
import Campo from "./Campo";
import CampoBusca from "./CampoBusca";
import { bairroExato, bairrosDe, buscarBairros } from "../util/localidades";

// Bairro da cidade escolhida. Onde há lista de bairros, a pessoa escolhe nela
// ou usa o nome que digitou; onde não há, digita.

// Mesmo limite da coluna usuario.bairro no banco.
const TAMANHO_MAXIMO = 80;

function CampoBairro({ id = "bairro", rotulo = "Bairro", cidade, valor, onChange }) {
  const lista = cidade ? bairrosDe(cidade) : null;
  const ajudaId = useId();

  const sugerir = useCallback(
    (texto) => buscarBairros(lista ?? [], texto),
    [lista],
  );

  // Quem digita "centro" e sai do campo fica com "Centro", como na lista.
  const aoSair = useCallback(
    (texto) =>
      (lista && bairroExato(lista, texto)) || texto.trim().replace(/\s+/g, " "),
    [lista],
  );

  if (!cidade) {
    return (
      <CampoBusca
        id={id}
        rotulo={rotulo}
        valor=""
        onEscolher={() => {}}
        sugerir={sugerir}
        desabilitado
        placeholder="Escolha a cidade primeiro"
      />
    );
  }

  if (!lista) {
    const nomeCidade = cidade.replace(/ - [A-Z]{2}$/, "");
    return (
      <div>
        <Campo
          id={id}
          rotulo={rotulo}
          placeholder="Nome do seu bairro"
          autoComplete="off"
          maxLength={TAMANHO_MAXIMO}
          aria-describedby={ajudaId}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        />
        <p id={ajudaId} className="text-xs text-[#5f5e5e] mt-2">
          Ainda não temos a lista de bairros de {nomeCidade}. Digite o nome do
          seu.
        </p>
      </div>
    );
  }

  return (
    <CampoBusca
      id={id}
      rotulo={rotulo}
      valor={valor}
      onEscolher={onChange}
      sugerir={sugerir}
      aoSair={aoSair}
      placeholder="Escolha ou digite o bairro"
      maxLength={TAMANHO_MAXIMO}
      rodape={() => "Lista de bairros: colaboradores do OpenStreetMap."}
    />
  );
}

export default CampoBairro;
