import { useEffect, useState } from "react";
import { listarEstabelecimentos } from "../servicos/animais";

// Os hospitais e clínicas do site, e os mesmos como opções de um campo de
// escolha. Se a lista não vier, `erro` diz o motivo.
export function useEstabelecimentos() {
  const [estado, setEstado] = useState({ lista: [], erro: "" });

  useEffect(() => {
    let valendo = true;
    listarEstabelecimentos().then(
      (lista) => valendo && setEstado({ lista, erro: "" }),
      (falha) => valendo && setEstado({ lista: [], erro: falha.message }),
    );
    return () => {
      valendo = false;
    };
  }, []);

  const opcoes = estado.lista.map((local) => ({
    valor: local.id,
    rotulo: local.nome,
    descricao: `${local.cidade} - ${local.uf}`,
    icone: "local_hospital",
  }));

  return { ...estado, opcoes };
}
