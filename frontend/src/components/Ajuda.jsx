import { useBalao } from "../hooks/useBalao";
import { BotaoSimboloAjuda } from "./BotaoAjuda";

// O "?" que explica um dado num balão curto. No computador abre ao pousar o
// mouse por um instante, sem precisar clicar; no celular, e para quem
// prefere, abre com clique (o funcionamento do balão está em
// hooks/useBalao). O desenho é o do "?" de todo o site (BotaoAjuda).
//
// Para um "?" que abre uma janela com a explicação completa, use BotaoAjuda.
function Ajuda({ titulo, children, claro = false, className = "" }) {
  const { botao, balao } = useBalao();

  return (
    <>
      <BotaoSimboloAjuda
        {...botao}
        aria-label={`Entenda: ${titulo}`}
        claro={claro}
        className={`cursor-help ${className}`}
      />
      {balao(titulo, children)}
    </>
  );
}

export default Ajuda;
