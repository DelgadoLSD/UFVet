import { Link } from "react-router-dom";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import { TituloComAjuda } from "../perfil/PainelSecao";
import { nomeProfissionalCurto, pronome } from "../../util/texto";
import { tempoRestante } from "../../util/datas";

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
        texto: `Liberado por ${nomeProfissionalCurto(acesso.liberacao.veterinario)}; o acesso ${tempoRestante(acesso.liberacao.expiraEm)}.`,
      };
    case "pedido-enviado": {
      const { veterinario } = acesso.pedido;
      const nome = nomeProfissionalCurto(veterinario);
      const ele = pronome(veterinario);
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
      className="rounded-2xl bg-[#1a1c1c] text-white px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-4"
    >
      {/* No celular, o botão vai para baixo do ícone e do texto, na largura
          do bloco inteiro; a partir do tablet, fica na mesma linha, à
          direita. É o botão vermelho principal do site, e não uma caixa
          branca sobre o preto. */}
      <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4">
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
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold leading-snug">
            <TituloComAjuda
              titulo={conteudo.titulo}
              margem="ml-1"
              ajuda={
                <BotaoAjuda
                  claro
                  rotulo="Como funciona o acesso aos contatos?"
                  onClick={onComoFunciona}
                />
              }
            />
          </p>
          <p className="mt-0.5 text-sm text-white/70 leading-snug text-pretty">
            {conteudo.texto}
          </p>
        </div>
      </div>
      {acesso.motivo === "sem-liberacao" && (
        <Botao
          icone="lock_open"
          className="w-full sm:w-auto shrink-0 max-sm:h-11"
          onClick={onPedirLiberacao}
        >
          Pedir liberação
        </Botao>
      )}
      {acesso.motivo === "visitante" && (
        <Botao
          as={Link}
          to="/login?voltar=/buscar"
          icone="login"
          className="w-full sm:w-auto shrink-0 max-sm:h-11"
        >
          Entrar
        </Botao>
      )}
    </section>
  );
}

export default FaixaAcessoContatos;
