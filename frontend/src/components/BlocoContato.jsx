import { useState } from "react";
import Botao from "./Botao";

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
// ou tutores com liberação de um veterinário. Ver o contato fica registrado.
function BlocoContato({
  perfil,
  primeiroNome,
  ehProprio,
  acesso,
  consultasRecebidas = 0,
  meuCodigo,
  onConsultar,
  onPedirLiberacao,
  onComoFunciona,
  onVerRegistro,
}) {
  const [revelado, setRevelado] = useState(false);

  const ver = () => {
    setRevelado(true);
    onConsultar?.();
  };

  const visivel = ehProprio || revelado;
  const restantes = acesso.liberacao
    ? acesso.liberacao.limite - acesso.liberacao.consultas
    : null;

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="text-xs font-semibold text-[#8f6f6e]">Contato</p>
        {!ehProprio && acesso.pode && !revelado && (
          <Botao variante="editar" tamanho="sm" onClick={ver}>
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
          Só quem tem acesso liberado vê seu contato.{" "}
          <button
            type="button"
            onClick={onVerRegistro}
            className="font-semibold text-[#8e001b] hover:underline underline-offset-2"
          >
            {consultasRecebidas === 0
              ? "Ver o registro"
              : `Ver quem já viu (${consultasRecebidas})`}
          </button>
        </p>
      ) : acesso.pode ? (
        <p className="mt-2.5 text-xs text-[#5f5e5e] leading-relaxed">
          {revelado
            ? `Consulta registrada. ${primeiroNome} pode ver quem viu o contato.`
            : acesso.motivo === "veterinario"
              ? "Você vê contatos por ser veterinário. A consulta fica registrada com seu nome e CRMV."
              : `Acesso liberado por um veterinário. Você ainda pode ver ${restantes} ${
                  restantes === 1 ? "contato" : "contatos"
                }.`}
        </p>
      ) : acesso.motivo === "pedido-enviado" ? (
        <AvisoAcesso>
          Seu pedido foi enviado. Assim que um veterinário liberar, o contato
          aparece aqui.
        </AvisoAcesso>
      ) : acesso.motivo === "limite" ? (
        <AvisoAcesso
          acao={
            <button
              type="button"
              onClick={onComoFunciona}
              className="mt-2 text-xs font-semibold text-[#8e001b] hover:underline underline-offset-2"
            >
              Como funciona
            </button>
          }
        >
          Você já viu {acesso.liberacao.limite} contatos com esta liberação.
          Peça ao veterinário do atendimento para renovar o seu acesso.
        </AvisoAcesso>
      ) : (
        <AvisoAcesso
          acao={
            <div className="mt-2.5 flex items-center gap-3 flex-wrap">
              <Botao tamanho="sm" onClick={onPedirLiberacao}>
                Pedir liberação
              </Botao>
              <button
                type="button"
                onClick={onComoFunciona}
                className="text-xs font-semibold text-[#8e001b] hover:underline underline-offset-2"
              >
                Como funciona
              </button>
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
