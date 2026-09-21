import { useState } from "react";
import Botao from "./Botao";
import BotaoAjuda from "./BotaoAjuda";

const TELEFONE_OCULTO = "(••) •••••-••••";

// Mantém o domínio à vista: dá pra saber que o e-mail existe sem expor quem é.
const ocultarEmail = (email) => {
  const [usuario, dominio] = email.split("@");
  return `${usuario.slice(0, 1)}${"•".repeat(Math.max(usuario.length - 1, 3))}@${dominio}`;
};

function LinhaContato({ icone, children }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-[#1a1c1c] min-w-0">
      <span className="material-symbols-outlined text-[18px] text-[#8f6f6e] shrink-0">
        {icone}
      </span>
      <span className="min-w-0 flex items-center gap-1.5 flex-wrap">
        {children}
      </span>
    </li>
  );
}

function ValorCopiavel({ valor, rotulo }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <>
      <span className="truncate">{valor}</span>
      <button
        type="button"
        onClick={copiar}
        aria-label={`Copiar ${rotulo}`}
        className="w-6 h-6 rounded-md flex items-center justify-center text-[#8f6f6e] hover:text-[#8e001b] hover:bg-[#fdecee] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
      >
        <span
          className={`material-symbols-outlined text-[15px] ${copiado ? "text-emerald-600" : ""}`}
        >
          {copiado ? "check" : "content_copy"}
        </span>
      </button>
    </>
  );
}

// Caixa de aviso dos estados sem acesso: fica logo abaixo dos dados ocultos,
// dizendo o que fazer em vez de só barrar.
function AvisoAcesso({ children, acao }) {
  return (
    <div className="mt-3 rounded-xl bg-[#fdecee] px-3.5 py-3">
      <p className="text-xs text-[#5b403f] leading-relaxed">{children}</p>
      {acao}
    </div>
  );
}

// Contato de um perfil. Só aparece inteiro para quem tem acesso: veterinários,
// ou tutores com liberação de um veterinário.
function BlocoContato({
  perfil,
  primeiroNome,
  ehProprio,
  acesso,
  meuCodigo,
  onPedirLiberacao,
  onComoFunciona,
}) {
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
            ? `A doação é voluntária: combine com ${primeiroNome} antes de contar com ela.`
            : acesso.motivo === "veterinario"
              ? "Você vê os contatos por ser veterinário."
              : "Seu acesso foi liberado por um veterinário e vale até o prazo terminar."}
        </p>
      ) : acesso.motivo === "pedido-enviado" ? (
        <AvisoAcesso>
          Pedido enviado para {acesso.pedido?.para?.nome || "um veterinário"}.
          Assim que ele liberar, o contato aparece aqui.
        </AvisoAcesso>
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
          caso. Ele libera pelo seu código
          {meuCodigo ? ` #${meuCodigo}` : ""}.
        </AvisoAcesso>
      )}
    </div>
  );
}

export default BlocoContato;
