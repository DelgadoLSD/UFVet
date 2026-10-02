import { useEffect, useRef, useState } from "react";

// Conteúdo que aparece suavemente (sobe e ganha opacidade) quando entra na
// tela, uma vez só. `atraso`, em milissegundos, escalona os itens de uma
// mesma linha. Quem pede menos movimento no sistema vê tudo de imediato.
function Surgir({ atraso = 0, className = "", children }) {
  const ref = useRef(null);
  // Navegadores sem IntersectionObserver mostram tudo desde o início.
  const [visivel, setVisivel] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visivel) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [visivel]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visivel ? `${atraso}ms` : "0ms" }}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Surgir;
