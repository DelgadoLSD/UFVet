import { createContext } from "react";

// Verdadeiro quando os termos são lidos numa janela por cima de outra página
// (ModalTermos), e não em /termos. Na janela, as seções já aparecem prontas,
// sem surgir na rolagem, e nada no texto leva para fora dela.
export const NaJanela = createContext(false);
