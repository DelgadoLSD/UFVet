import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import { useCopiar } from "../../hooks/useCopiar";
import PainelSecao, { CampoPainel } from "./PainelSecao";
import { acharVeterinario } from "../../servicos/pessoas";
import { nomeProfissionalCurto, primeiroNome, pronome } from "../../util/texto";

// Contato (e-mail e telefone) no cartão de um perfil. Só aparece inteiro para
// quem tem acesso: veterinários, ou tutores com liberação de um veterinário.
// Para os outros, inclusive o visitante sem conta, os dados ficam mascarados
// e um aviso diz o que fazer, em vez de só barrar (NF33.2).
//
// `acesso` é o resultado de acessoDe() (servicos/acessoContatos): se a pessoa
// pode ver e por quê.

const TELEFONE_OCULTO = "(••) •••••-••••";

// Mantém o domínio à vista: dá para saber que o e-mail existe sem expor de
// quem é.
const ocultarEmail = (email) => {
  const [usuario, dominio] = email.split("@");
  return `${usuario.slice(0, 1)}${"•".repeat(Math.max(usuario.length - 1, 3))}@${dominio}`;
};

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
  const veterinario = acharVeterinario(pedido.veterinarioCodigo);
  return (
    <Nota>
      Pedido enviado para{" "}
      {veterinario ? nomeProfissionalCurto(veterinario) : "um veterinário"}.
      Assim que {veterinario ? pronome(veterinario) : "ele"} liberar, o contato
      aparece aqui.
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
  // telefone de outra pessoa sem ter pedido para ver.
  const [revelado, setRevelado] = useState(false);

  const visivel = ehProprio || revelado;
  const local = useLocation();
  const semAcesso = !ehProprio && !acesso.pode;

  // O que fazer fica sempre no mesmo lugar, na faixa vermelha: ver o
  // contato, pedir a liberação ou entrar na conta.
  let acao = null;
  if (!ehProprio && acesso.pode && !revelado) {
    acao = (
      <Botao variante="claro" tamanho="xs" onClick={() => setRevelado(true)}>
        Ver contato
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
  } else if (semAcesso && acesso.motivo !== "pedido-enviado") {
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
        {visivel ? (
          <ValorCopiavel valor={perfil.email} rotulo="e-mail" />
        ) : (
          <span className="truncate font-normal text-[#5f5e5e]">
            {ocultarEmail(perfil.email)}
          </span>
        )}
      </CampoPainel>
      <CampoPainel rotulo="Telefone">
        {visivel ? (
          <ValorCopiavel valor={perfil.telefone} rotulo="telefone" />
        ) : (
          <span className="tracking-wider font-normal text-[#5f5e5e]">
            {TELEFONE_OCULTO}
          </span>
        )}
      </CampoPainel>

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
