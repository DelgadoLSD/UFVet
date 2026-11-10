import { useEffect } from "react";

// Fecha um menu aberto quando a pessoa clica fora dele ou aperta Esc. `raizRef`
// é o elemento do menu, e `definirAberto` recebe false para fechar. Com
// `esc: false`, quem usa o hook trata o Esc por conta própria.
export function useFecharFora(
  aberto,
  raizRef,
  definirAberto,
  { esc = true } = {},
) {
  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e) => {
      if (!raizRef.current?.contains(e.target)) definirAberto(false);
    };
    const aoTeclar = (e) => e.key === "Escape" && definirAberto(false);
    document.addEventListener("pointerdown", fecharFora);
    if (esc) document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, raizRef, definirAberto, esc]);
}
