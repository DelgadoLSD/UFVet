import { useState } from "react";
import { useSessao } from "../servicos/sessao";

// O modal aberto numa página ("pedido", "cadastrar"... ou null), que fecha
// sozinho quando a aba passa para outra conta (alguém saiu e entrou com
// outra em outra aba; ver servicos/sessao.js): o que estava aberto era da
// conta anterior. Um pedido de liberação começado pela tutora não fica
// aberto na tela do veterinário, por exemplo.
//
//   const [modal, setModal] = useModalDaConta();
export function useModalDaConta() {
  const conta = useSessao()?.codigo ?? null;
  const [aberto, setAberto] = useState({ modal: null, conta });
  const modal = aberto.conta === conta ? aberto.modal : null;
  const setModal = (novo) => setAberto({ modal: novo, conta });
  return [modal, setModal];
}
