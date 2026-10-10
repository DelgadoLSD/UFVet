import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import { useCopiar } from "../../hooks/useCopiar";
import PainelSecao, { CampoPainel } from "./PainelSecao";
import { buscarContato } from "../../servicos/pessoas";
import { nomeProfissionalCurto, primeiroNome, pronome } from "../../util/texto";

// Contato (e-mail e telefone) no cartão de um perfil. Só aparece inteiro para
// quem tem acesso: veterinários, ou tutores com liberação de um veterinário.
// Para os outros, inclusive o visitante sem conta, os dados ficam mascarados
// e um aviso diz o que fazer, em vez de só barrar (NF33.2).
//
// `acesso` é o resultado de acessoDe() (servicos/acessoContatos): se a pessoa
// pode ver e por quê. No perfil de outra pessoa, o contato não vem com o
// perfil: "Ver contato" o pede à API, que confere de novo quem pode ver.

// Antes de revelar, nada do contato aparece: nem a primeira letra nem o
// domínio do e-mail. Só a forma, para ficar claro que o dado existe.
const EMAIL_OCULTO = "••••••••@••••••";
const TELEFONE_OCULTO = "(••) •••••-••••";

// O dado à mostra, com um botão ao lado para copiar.
function ValorCopiavel({ valor, rotulo }) {
  const [copiado, copiar] = useCopiar();

  return (
    <>
      <span className="truncate">{valor}</span>
      <button
        type="button"
        onClick={() => copiar(valor)}
        aria-label={`Copiar ${rotulo}`}
        className="w-6 h-6 rounded-md flex items-center justify-center text-[#8f6f6e] hover:text-[#7d0a1d] hover:bg-[#fdecee] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[15px] ${copiado ? "text-emerald-600" : ""}`}
        >
          {copiado ? "check" : "content_copy"}
        </span>
      </button>
    </>
  );
}

// A linha de explicação embaixo dos dados, a mesma em todos os casos: curta,
// para a caixa não crescer. O botão do que fazer (ver, pedir liberação,
// entrar) fica na faixa vermelha, no mesmo lugar para todo mundo.
function Nota({ children }) {
  return <p className="text-xs text-[#5f5e5e] leading-relaxed">{children}</p>;
}

// Quem recebeu o pedido de liberação, para o aviso de "pedido enviado".
function NotaPedidoEnviado({ pedido }) {
  const { veterinario } = pedido;
  return (
    <Nota>
      Pedido enviado para {nomeProfissionalCurto(veterinario)}. Assim que{" "}
      {pronome(veterinario)} liberar, o contato aparece aqui.
    </Nota>
  );
}

function BlocoContato({
  perfil,
  ehProprio,
  acesso,
  meuCodigo,
  onPedirLiberacao,
  onComoFunciona,
}) {
  // Mesmo com acesso, o contato só aparece depois de um clique: ninguém vê o
  // telefone de outra pessoa sem ter pedido para ver. No próprio perfil, ele
  // já vem com a conta.
  const [revelado, setRevelado] = useState(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState("");

  const contato = ehProprio ? perfil : revelado;
  const verContato = async () => {
    setAbrindo(true);
    setErro("");
    try {
      setRevelado(await buscarContato(perfil.codigo));
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAbrindo(false);
    }
  };
  const local = useLocation();
  const semAcesso = !ehProprio && !acesso.pode;

  // O que fazer fica sempre no mesmo lugar, na faixa vermelha: ver o
  // contato, pedir a liberação ou entrar na conta.
  let acao = null;
  if (!ehProprio && acesso.pode && !revelado) {
    acao = (
      <Botao
        variante="claro"
        tamanho="xs"
        disabled={abrindo}
        onClick={verContato}
      >
        {abrindo ? "Abrindo…" : "Ver contato"}
      </Botao>
    );
  } else if (acesso.motivo === "visitante") {
    acao = (
      <Botao
        as={Link}
        to={`/login?voltar=${encodeURIComponent(local.pathname)}`}
        variante="claro"
        tamanho="xs"
      >
        Entrar
      </Botao>
    );
  } else if (
    semAcesso &&
    acesso.motivo !== "pedido-enviado" &&
    acesso.motivo !== "carregando"
  ) {
    acao = (
      <Botao variante="claro" tamanho="xs" onClick={onPedirLiberacao}>
        Pedir liberação
      </Botao>
    );
  }

  return (
    <PainelSecao
      titulo="Contato"
      nivel="h2"
      ajuda={
        semAcesso && (
          <BotaoAjuda
            claro
            rotulo="Como funciona o acesso aos contatos?"
            onClick={onComoFunciona}
          />
        )
      }
      acao={acao}
    >
      <CampoPainel rotulo="E-mail">
        {contato ? (
          <ValorCopiavel valor={contato.email} rotulo="e-mail" />
        ) : (
          <span className="truncate font-normal tracking-wider text-[#5f5e5e]">
            {EMAIL_OCULTO}
          </span>
        )}
      </CampoPainel>
      <CampoPainel rotulo="Telefone">
        {contato ? (
          <ValorCopiavel valor={contato.telefone} rotulo="telefone" />
        ) : (
          <span className="tracking-wider font-normal text-[#5f5e5e]">
            {TELEFONE_OCULTO}
          </span>
        )}
      </CampoPainel>

      <AvisoErro>{erro}</AvisoErro>

      {ehProprio ? (
        <p className="text-xs text-[#5f5e5e] leading-relaxed">
          Só quem tem acesso liberado por um veterinário vê seu contato.
        </p>
      ) : acesso.pode ? (
        <p className="text-xs text-[#5f5e5e] leading-relaxed">
          {revelado
            ? `A doação é voluntária: combine com ${primeiroNome(perfil.nomeCompleto)} antes de contar com ela.`
            : acesso.motivo === "veterinario"
              ? "Você vê os contatos por ser veterinário."
              : "Seu acesso foi liberado por um veterinário e vale até o prazo terminar."}
        </p>
      ) : acesso.motivo === "pedido-enviado" ? (
        <NotaPedidoEnviado pedido={acesso.pedido} />
      ) : acesso.motivo === "visitante" ? (
        <Nota>Entre na sua conta para pedir a liberação a um veterinário.</Nota>
      ) : (
        <Nota>
          Um veterinário que acompanha seu caso libera o contato pelo seu código
          #{meuCodigo}.
        </Nota>
      )}
    </PainelSecao>
  );
}

export default BlocoContato;
