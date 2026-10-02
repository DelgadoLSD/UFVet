import { useEffect, useState } from "react";

// Copia um texto para a área de transferência e avisa por um instante que
// copiou (o ícone vira um "check"). Usado nos códigos públicos e no contato.
//
// const [copiado, copiar] = useCopiar();
// <button onClick={() => copiar("#T3M8P1")}>...
export function useCopiar(duracaoMs = 1600) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(false), duracaoMs);
    return () => clearTimeout(timer);
  }, [copiado, duracaoMs]);

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      // Sem permissão para a área de transferência: o valor continua visível
      // na tela para ser copiado à mão.
    }
  };

  return [copiado, copiar];
}
