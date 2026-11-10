import { useEffect, useState } from "react";
import { codigoDoLink, temCodigo } from "../regras/link";

// O código de um link mandado por e-mail, que vem no fim do endereço. Ele é
// lido uma vez e sai da barra de endereço e do histórico em seguida: quem olhar
// a tela, ou o histórico do navegador, não o copia.
export function useCodigoDoLink(hash) {
  const [codigo] = useState(() => codigoDoLink(hash));
  const [veioDoLink] = useState(() => temCodigo(hash));

  useEffect(() => {
    if (veioDoLink) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
  }, [veioDoLink]);

  return { codigo, veioDoLink };
}
