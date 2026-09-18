import Botao from "./Botao";
import BotaoAjuda from "./BotaoAjuda";

// Diz, antes de o tutor abrir um perfil, se ele vai conseguir ver o contato.
// Evita a descoberta frustrante só na hora de precisar.
function FaixaAcessoContatos({ acesso, onPedirLiberacao, onComoFunciona }) {
  const conteudo = {
    veterinario: {
      icone: "verified_user",
      texto:
        "Você vê os contatos dos tutores por ser veterinário. Cada consulta fica registrada com seu nome e CRMV.",
      destaque: false,
    },
    liberacao: {
      icone: "lock_open",
      texto:
        "Seu acesso aos contatos está liberado. Cada contato que você abrir fica registrado.",
      destaque: false,
    },
    "pedido-enviado": {
      icone: "hourglass_top",
      texto: `Pedido de liberação enviado para ${
        acesso.pedido?.para?.nome || "um veterinário"
      }. Assim que ele responder, os contatos aparecem nos perfis.`,
      destaque: true,
    },
    "sem-liberacao": {
      icone: "lock",
      texto:
        "Os contatos dos tutores aparecem quando um veterinário libera seu acesso durante um atendimento.",
      destaque: true,
    },
  }[acesso.motivo];

  if (!conteudo) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl px-4 py-3 ${
        conteudo.destaque
          ? "bg-[#fdecee]"
          : "bg-white border border-[#eadede]"
      }`}
    >
      <span className="material-symbols-outlined text-[20px] text-[#8e001b] shrink-0">
        {conteudo.icone}
      </span>
      <p className="flex-1 text-sm text-[#5b403f] leading-relaxed">
        {conteudo.texto}
      </p>
      <div className="flex items-center gap-3 shrink-0">
        {acesso.motivo === "sem-liberacao" && (
          <Botao tamanho="sm" onClick={onPedirLiberacao}>
            Pedir liberação
          </Botao>
        )}
        <BotaoAjuda
          rotulo="Como funciona o acesso aos contatos?"
          onClick={onComoFunciona}
        />
      </div>
    </div>
  );
}

export default FaixaAcessoContatos;
