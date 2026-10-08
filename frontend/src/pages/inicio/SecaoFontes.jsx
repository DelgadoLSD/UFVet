import { FONTES } from "./fontes";
import { CONTAINER } from "./estilos";

// Lista de fontes no fim da página inicial. Cada número sobrescrito ao longo
// do texto (NotaFonte) leva até o item correspondente, que fica destacado.
function SecaoFontes() {
  return (
    <section id="fontes" className="py-16 bg-white border-t border-[#f3e6e8]">
      <div className={CONTAINER}>
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6 lg:gap-20">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#1a1c1c] mb-2">
              Fontes
            </h2>
            <p className="text-sm text-[#5f5e5e] leading-relaxed">
              Os números pequenos ao longo da página indicam de onde vem cada
              informação. Nada aqui substitui a orientação do veterinário.
            </p>
          </div>
          <ol className="space-y-1">
            {FONTES.map((f, i) => (
              <li
                key={f.id}
                id={`fonte-${i + 1}`}
                className="scroll-mt-28 grid grid-cols-[1.75rem_1fr] gap-2 px-3 py-2 -mx-3 rounded-lg target:bg-[#fdecee]"
              >
                <span className="text-sm font-bold text-[#9e0a24] tabular-nums">
                  {i + 1}
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#5b403f] leading-relaxed hover:text-[#7d0a1d] hover:underline underline-offset-2"
                >
                  {f.completa}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default SecaoFontes;
