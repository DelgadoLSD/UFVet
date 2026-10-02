import { FONTE_POR_ID } from "./fontes";

// Número sobrescrito que leva à fonte, na lista do fim da página. `ids` é o
// id de uma fonte de fontes.js, ou uma lista deles; `claro` é a versão para
// fundos escuros.
function NotaFonte({ ids, claro = false }) {
  const lista = (Array.isArray(ids) ? ids : [ids])
    .map((id) => FONTE_POR_ID[id])
    .sort((a, b) => a.numero - b.numero);

  return (
    <sup className="font-semibold">
      {lista.map((f, i) => (
        <span key={f.id}>
          {i > 0 && ","}
          <a
            href={`#fonte-${f.numero}`}
            title={f.curta}
            aria-label={`Fonte ${f.numero}: ${f.curta}`}
            className={`px-px hover:underline ${
              claro ? "text-white/70 hover:text-white" : "text-[#b7102a]"
            }`}
          >
            {f.numero}
          </a>
        </span>
      ))}
    </sup>
  );
}

export default NotaFonte;
