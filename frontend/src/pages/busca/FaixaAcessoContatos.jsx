import { Link } from "react-router-dom";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import { acharVeterinario } from "../../servicos/pessoas";
import { nomeProfissionalCurto, pronome } from "../../util/texto";

// Faixa acima dos resultados da busca que diz, antes de o tutor abrir um
// perfil, se ele vai conseguir ver o contato. Evita a descoberta frustrante
// só na hora de precisar.
//
// `acesso` é o resultado de acessoDe() (servicos/acessoContatos).

function conteudoDaFaixa(acesso) {
  switch (acesso.motivo) {
    case "veterinario":
      return {
        icone: "verified_user",
        texto:
          "Você vê os contatos dos tutores por ser veterinário, sem precisar de liberação.",
        destaque: false,
      };
    case "liberacao":
      return {
        icone: "lock_open",
        texto:
          "Seu acesso aos contatos está liberado e vale até o prazo da liberação terminar.",
        destaque: false,
      };
    case "pedido-enviado": {
      const veterinario = acharVeterinario(acesso.pedido.veterinarioCodigo);
      const nome = veterinario
        ? nomeProfissionalCurto(veterinario)
        : "um veterinário";
      const ele = veterinario ? pronome(veterinario) : "ele";
      return {
        icone: "hourglass_top",
        texto: `Pedido de liberação enviado para ${nome}. Assim que ${ele} responder, os contatos aparecem nos perfis.`,
        destaque: true,
      };
    }
    case "sem-liberacao":
      return {
        icone: "lock",
        texto:
          "Os contatos dos tutores aparecem quando um veterinário libera seu acesso durante um atendimento.",
        destaque: true,
      };
    case "visitante":
      return {
        icone: "lock",
        texto:
          "Os contatos dos tutores aparecem para quem tem conta e recebe a liberação de um veterinário durante um atendimento.",
        destaque: true,
      };
    default:
      return null;
  }
}

function FaixaAcessoContatos({ acesso, onPedirLiberacao, onComoFunciona }) {
  const conteudo = conteudoDaFaixa(acesso);
  if (!conteudo) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl px-4 py-3 ${
        conteudo.destaque ? "bg-[#fdecee]" : "bg-white border border-[#eadede]"
      }`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[20px] text-[#9e0a24] shrink-0"
      >
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
        {acesso.motivo === "visitante" && (
          <Botao as={Link} to="/login?voltar=/buscar" tamanho="sm">
            Entrar
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
