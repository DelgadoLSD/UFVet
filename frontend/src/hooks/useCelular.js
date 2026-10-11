import { useSyncExternalStore } from "react";

// A tela é de celular? Abaixo de 640px, a mesma divisa do "sm" do Tailwind:
// é ali que os painéis do perfil deixam de ficar lado a lado e passam a abrir
// e fechar. Acompanha o celular girando e a janela mudando de tamanho.
const CELULAR = "(max-width: 639.98px)";

function assinar(avisar) {
  const consulta = window.matchMedia(CELULAR);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

const ehCelular = () => window.matchMedia(CELULAR).matches;

export const useCelular = () => useSyncExternalStore(assinar, ehCelular);
