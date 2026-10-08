import { useState } from "react";

// Fotos do animal no cartão dele. Com mais de uma, aparecem as setas (ao passar
// o mouse ou com foco do teclado), o contador e os pontos para pular direto.

function BotaoSeta({ onClick, rotulo, icone, lado }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className={`absolute ${lado} top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/60`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-xl">
        {icone}
      </span>
    </button>
  );
}

// `fotos`: os endereços das fotos, da principal em diante.
function CarrosselFotos({ fotos, nome }) {
  const [escolhida, setAtual] = useState(0);
  // Se fotos saírem da lista, a escolhida pode deixar de existir.
  const atual = Math.min(escolhida, Math.max(fotos.length - 1, 0));
  const temFotos = fotos && fotos.length > 0;
  const temVarias = temFotos && fotos.length > 1;

  const anterior = () =>
    setAtual((prev) => (prev - 1 + fotos.length) % fotos.length);
  const proxima = () => setAtual((prev) => (prev + 1) % fotos.length);

  if (!temFotos) {
    return (
      <div className="w-full h-56 lg:h-auto lg:flex-1 min-h-[240px] bg-[#fdecee] flex items-center justify-center rounded-2xl">
        <span className="text-[#8f6f6e] text-sm font-semibold">
          Sem foto ainda
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 lg:h-auto lg:flex-1 min-h-[240px] rounded-2xl overflow-hidden border border-[#eadede] group">
      {/* Todas as fotos ficam empilhadas; só a atual aparece, para a troca
          ser um esmaecer suave, sem piscar enquanto a imagem carrega. */}
      {fotos.map((foto, i) => (
        <img
          key={foto}
          src={foto}
          alt={`${nome} — foto ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {temVarias && (
        <>
          <BotaoSeta
            onClick={anterior}
            rotulo="Foto anterior"
            icone="chevron_left"
            lado="left-2"
          />
          <BotaoSeta
            onClick={proxima}
            rotulo="Próxima foto"
            icone="chevron_right"
            lado="right-2"
          />

          <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {atual + 1}/{fotos.length}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {fotos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAtual(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === atual ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CarrosselFotos;
