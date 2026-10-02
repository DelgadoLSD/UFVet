import { useState } from "react";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import { useCopiar } from "../../hooks/useCopiar";
import { acharVeterinario } from "../../servicos/pessoas";
import { nomeProfissionalCurto, primeiroNome, pronome } from "../../util/texto";

// Contato (e-mail e telefone) no cartão de um perfil. Só aparece inteiro para
// quem tem acesso: veterinários, ou tutores com liberação de um veterinário.
// Para os outros, os dados ficam mascarados e um aviso diz o que fazer, em vez
// de só barrar.
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

function LinhaContato({ icone, children }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-[#1a1c1c] min-w-0">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px] text-[#8f6f6e] shrink-0"
      >
        {icone}
      </span>
      <span className="min-w-0 flex items-center gap-1.5 flex-wrap">
        {children}
      </span>
    </li>
  );
}

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
        className="w-6 h-6 rounded-md flex items-center justify-center text-[#8f6f6e] hover:text-[#8e001b] hover:bg-[#fdecee] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
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

// Caixa de aviso dos estados sem acesso, logo abaixo dos dados ocultos.
function AvisoAcesso({ children, acao }) {
  return (
    <div className="mt-3 rounded-xl bg-[#fdecee] px-3.5 py-3">
      <p className="text-xs text-[#5b403f] leading-relaxed">{children}</p>
      {acao}
    </div>
  );
}

// Quem recebeu o pedido de liberação, para o aviso de "pedido enviado".
function AvisoPedidoEnviado({ pedido }) {
  const veterinario = acharVeterinario(pedido.veterinarioCodigo);
  return (
    <AvisoAcesso>
      Pedido enviado para{" "}
      {veterinario ? nomeProfissionalCurto(veterinario) : "um veterinário"}.
      Assim que {veterinario ? pronome(veterinario) : "ele"} liberar, o contato
      aparece aqui.
    </AvisoAcesso>
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

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-[#8f6f6e]">Contato</p>
        {!ehProprio && acesso.pode && !revelado && (
          <Botao
            variante="editar"
            tamanho="sm"
            onClick={() => setRevelado(true)}
          >
            Ver contato
          </Botao>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        <LinhaContato icone="mail">
          {visivel ? (
            <ValorCopiavel valor={perfil.email} rotulo="e-mail" />
          ) : (
            <span className="truncate text-[#5f5e5e]">
              {ocultarEmail(perfil.email)}
            </span>
          )}
        </LinhaContato>
        <LinhaContato icone="call">
          {visivel ? (
            <ValorCopiavel valor={perfil.telefone} rotulo="telefone" />
          ) : (
            <span className="tracking-wider text-[#5f5e5e]">
              {TELEFONE_OCULTO}
            </span>
          )}
        </LinhaContato>
      </ul>

      {ehProprio ? (
        <p className="mt-2.5 text-xs text-[#5f5e5e] leading-relaxed">
          Só quem tem acesso liberado por um veterinário vê seu contato.
        </p>
      ) : acesso.pode ? (
        <p className="mt-2.5 text-xs text-[#5f5e5e] leading-relaxed">
          {revelado
            ? `A doação é voluntária: combine com ${primeiroNome(perfil.nome)} antes de contar com ela.`
            : acesso.motivo === "veterinario"
              ? "Você vê os contatos por ser veterinário."
              : "Seu acesso foi liberado por um veterinário e vale até o prazo terminar."}
        </p>
      ) : acesso.motivo === "pedido-enviado" ? (
        <AvisoPedidoEnviado pedido={acesso.pedido} />
      ) : (
        <AvisoAcesso
          acao={
            <div className="mt-2.5 flex items-center gap-3 flex-wrap">
              <Botao tamanho="sm" onClick={onPedirLiberacao}>
                Pedir liberação
              </Botao>
              <BotaoAjuda
                rotulo="Como funciona o acesso aos contatos?"
                onClick={onComoFunciona}
              />
            </div>
          }
        >
          O contato aparece enquanto um veterinário estiver acompanhando seu
          caso. Ele libera pelo seu código #{meuCodigo}.
        </AvisoAcesso>
      )}
    </div>
  );
}

export default BlocoContato;
