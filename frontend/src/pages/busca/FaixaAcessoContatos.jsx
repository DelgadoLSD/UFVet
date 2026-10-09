import { Link } from "react-router-dom";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import { acharVeterinario } from "../../servicos/pessoas";
import { nomeProfissionalCurto, pronome } from "../../util/texto";

// Faixa acima dos resultados da busca que diz, antes de o tutor abrir um
// perfil, se ele vai conseguir ver o contato. Evita a descoberta frustrante
// só na hora de precisar.
//
// É um bloco preto, como o painel "Acesso aos contatos" do veterinário no
// perfil: o mesmo assunto tem a mesma cara nas duas páginas. Um título curto
// diz a situação de quem está vendo, uma linha explica, e o botão faz o que
// falta (entrar ou pedir a liberação). O ícone fica num círculo vermelho
// quando falta fazer algo, e num círculo apagado quando não.
//
// `acesso` é o resultado de acessoDe() (servicos/acessoContatos).

function conteudoDaFaixa(acesso) {
  switch (acesso.motivo) {
    case "veterinario":
      return {
        icone: "verified_user",
        titulo: "Você vê todos os contatos",
        texto: "Por ser veterinário, não precisa de liberação.",
      };
    case "liberacao":
      return {
        icone: "lock_open",
        titulo: "Contatos liberados",
        texto: "Seu acesso vale até o prazo da liberação terminar.",
      };
    case "pedido-enviado": {
      const veterinario = acharVeterinario(acesso.pedido.veterinarioCodigo);
      const nome = veterinario
        ? nomeProfissionalCurto(veterinario)
        : "um veterinário";
      const ele = veterinario ? pronome(veterinario) : "ele";
      return {
        icone: "hourglass_top",
        titulo: `Pedido enviado para ${nome}`,
        texto: `Assim que ${ele} responder, os contatos aparecem nos perfis.`,
      };
    }
    case "sem-liberacao":
      return {
        icone: "lock",
        titulo: "Você ainda não vê os contatos",
        texto:
          "Eles aparecem quando um veterinário libera seu acesso durante um atendimento.",
        falta: true,
      };
    case "visitante":
      return {
        icone: "lock",
        titulo: "Entre para ver os contatos",
        texto:
          "Eles aparecem para quem tem conta e recebe a liberação de um veterinário durante um atendimento.",
        falta: true,
      };
    default:
      return null;
  }
}

function FaixaAcessoContatos({ acesso, onPedirLiberacao, onComoFunciona }) {
  const conteudo = conteudoDaFaixa(acesso);
  if (!conteudo) return null;

  return (
    <section
      aria-label="Acesso aos contatos"
      className="rounded-2xl bg-[#1a1c1c] text-white px-4 py-4 sm:px-5 flex items-start sm:items-center gap-4"
    >
      <span
        aria-hidden="true"
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
          conteudo.falta ? "bg-[#9e0a24]" : "bg-white/10"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {conteudo.icone}
        </span>
      </span>

      {/* No celular, o botão vai para baixo do texto; a partir do tablet,
          fica na mesma linha, à direita. */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-3">
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1 text-[15px] font-bold leading-snug">
            {conteudo.titulo}
            <BotaoAjuda
              claro
              rotulo="Como funciona o acesso aos contatos?"
              onClick={onComoFunciona}
            />
          </p>
          <p className="mt-0.5 text-sm text-white/70 leading-snug text-pretty">
            {conteudo.texto}
          </p>
        </div>
        {acesso.motivo === "sem-liberacao" && (
          <Botao
            variante="claro"
            tamanho="sm"
            className="self-start sm:self-auto shrink-0"
            onClick={onPedirLiberacao}
          >
            Pedir liberação
          </Botao>
        )}
        {acesso.motivo === "visitante" && (
          <Botao
            as={Link}
            to="/login?voltar=/buscar"
            variante="claro"
            tamanho="sm"
            className="self-start sm:self-auto shrink-0"
          >
            Entrar
          </Botao>
        )}
      </div>
    </section>
  );
}

export default FaixaAcessoContatos;
