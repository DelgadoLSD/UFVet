import { useCallback, useEffect, useState } from "react";
import CampoBusca from "./CampoBusca";
import {
  buscarCidades,
  carregarMunicipios,
  cidadeExata,
} from "../util/localidades";

// Cidade escolhida na lista oficial do IBGE. O valor é "Nome - UF".
//
// Ao abrir, o campo já mostra as cidades da região de Viçosa para escolher com
// um clique; digitar serve para achar qualquer outra do Brasil.
function CampoCidade({ id = "cidade", rotulo = "Cidade", valor, onChange }) {
  const [lista, setLista] = useState(null);
  const [falhou, setFalhou] = useState(false);

  // A lista começa a baixar assim que o campo aparece, para estar pronta no
  // primeiro clique. Só as páginas com este campo pagam por ela.
  useEffect(() => {
    carregarMunicipios()
      .then(setLista)
      .catch(() => setFalhou(true));
  }, []);

  const sugerir = useCallback(
    (texto) =>
      lista ? buscarCidades(lista, texto, valor) : { itens: [], total: 0 },
    [lista, valor],
  );

  const aoSair = useCallback(
    (texto) => (lista ? cidadeExata(lista, texto) : null),
    [lista],
  );

  return (
    <CampoBusca
      id={id}
      rotulo={rotulo}
      valor={valor}
      onEscolher={onChange}
      sugerir={sugerir}
      aoSair={aoSair}
      carregando={!lista && !falhou}
      placeholder="Escolha ou digite a cidade"
      dica={
        falhou
          ? "Não foi possível carregar a lista de cidades. Recarregue a página e tente de novo."
          : "Digite o nome da sua cidade."
      }
      vazio={(texto) =>
        `Nenhuma cidade com “${texto}”. Confira a grafia ou digite só o começo do nome.`
      }
      erro="Escolha a cidade na lista."
      rodape={({ total, mostrados, sugestoes }) =>
        sugestoes
          ? "Cidades da região de Viçosa. Digite para buscar qualquer outra do Brasil."
          : total > mostrados
            ? `Mostrando ${mostrados} de ${total}. Continue digitando para achar a sua.`
            : null
      }
    />
  );
}

export default CampoCidade;
