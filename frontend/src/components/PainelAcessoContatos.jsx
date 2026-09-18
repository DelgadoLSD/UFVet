import Botao from "./Botao";
import { horasRestantes, tempoRestante, quando } from "../util/tempo";

function Prazo({ expiraEm }) {
  const urgente = horasRestantes(expiraEm) < 24;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        urgente ? "bg-[#fdecee] text-[#8e001b]" : "bg-[#f3eeee] text-[#5b403f]"
      }`}
    >
      <span className="material-symbols-outlined text-[15px]">schedule</span>
      {tempoRestante(expiraEm)}
    </span>
  );
}

function Codigo({ valor }) {
  return (
    <span className="text-xs font-semibold text-[#8e001b] bg-[#fdecee] px-2 py-0.5 rounded-md">
      #{valor}
    </span>
  );
}

function Pedido({ pedido, onLiberar, onRecusar }) {
  return (
    <li className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{pedido.nome}</p>
          <Codigo valor={pedido.codigo} />
          <span className="text-xs text-[#5f5e5e]">{quando(pedido.quando)}</span>
        </div>
        <p className="text-sm text-[#5b403f] mt-1 leading-snug">
          {pedido.caso}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Botao variante="perigo" tamanho="sm" onClick={() => onRecusar(pedido.id)}>
          Recusar
        </Botao>
        <Botao tamanho="sm" onClick={() => onLiberar(pedido)}>
          Liberar 3 dias
        </Botao>
      </div>
    </li>
  );
}

function Liberacao({ liberacao, onRenovar, onEncerrar }) {
  const noLimite = liberacao.consultas >= liberacao.limite;
  return (
    <li className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{liberacao.nome}</p>
          <Codigo valor={liberacao.codigo} />
        </div>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-snug">
          {liberacao.caso || "Sem caso informado"}.{" "}
          <span className={noLimite ? "font-semibold text-[#8e001b]" : ""}>
            {liberacao.consultas} de {liberacao.limite} contatos
            {noLimite ? " (limite atingido)" : ""}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Prazo expiraEm={liberacao.expiraEm} />
        <Botao
          variante="secundario"
          tamanho="sm"
          title="Devolve o prazo e zera o limite de contatos"
          onClick={() => onRenovar(liberacao.id)}
        >
          Renovar
        </Botao>
        <Botao
          variante="perigo"
          tamanho="sm"
          onClick={() => onEncerrar(liberacao.id)}
        >
          Encerrar
        </Botao>
      </div>
    </li>
  );
}

// Painel do veterinário: pedidos esperando resposta, quem está com acesso
// liberado, por quanto tempo ainda e quantas consultas cada um já fez.
function PainelAcessoContatos({
  liberacoes,
  pedidos,
  consultasFeitas,
  onLiberar,
  onLiberarPedido,
  onRecusarPedido,
  onRenovar,
  onEncerrar,
  onVerRegistro,
  onComoFunciona,
}) {
  return (
    <section className="bg-white rounded-2xl border border-[#eadede] shadow-[0_1px_2px_rgba(26,28,28,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#eadede] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#1a1c1c]">
            Acesso aos contatos
          </h2>
          <p className="text-sm text-[#5f5e5e] mt-0.5 leading-relaxed">
            Tutores em atendimento com você podem ver o contato dos doadores
            enquanto a liberação estiver ativa.{" "}
            <button
              type="button"
              onClick={onComoFunciona}
              className="font-semibold text-[#8e001b] hover:underline underline-offset-2"
            >
              Como funciona
            </button>
          </p>
        </div>
        <Botao icone="add" onClick={onLiberar} className="shrink-0 self-start">
          Liberar acesso
        </Botao>
      </div>

      {pedidos.length > 0 && (
        <div className="bg-[#fff7f7] border-b border-[#f0e6e6]">
          <p className="px-6 pt-4 text-sm font-semibold text-[#8e001b]">
            {pedidos.length === 1
              ? "1 tutor esperando liberação"
              : `${pedidos.length} tutores esperando liberação`}
          </p>
          <ul className="divide-y divide-[#f0e6e6]">
            {pedidos.map((p) => (
              <Pedido
                key={p.id}
                pedido={p}
                onLiberar={onLiberarPedido}
                onRecusar={onRecusarPedido}
              />
            ))}
          </ul>
        </div>
      )}

      {liberacoes.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-semibold text-[#1a1c1c]">
            Ninguém com acesso liberado agora.
          </p>
          <p className="text-sm text-[#5f5e5e] mt-1 max-w-md mx-auto leading-relaxed">
            Libere quando um tutor precisar falar com doadores durante um
            atendimento. O acesso expira sozinho no prazo que você escolher.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#f0e6e6]">
          {liberacoes.map((l) => (
            <Liberacao
              key={l.id}
              liberacao={l}
              onRenovar={onRenovar}
              onEncerrar={onEncerrar}
            />
          ))}
        </ul>
      )}

      <div className="px-6 py-4 bg-[#fafafa] border-t border-[#f0e6e6] flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5f5e5e]">
          {consultasFeitas === 0
            ? "Você ainda não consultou nenhum contato."
            : `Você consultou ${consultasFeitas} ${
                consultasFeitas === 1 ? "contato" : "contatos"
              } nos últimos 30 dias.`}
        </p>
        <button
          type="button"
          onClick={onVerRegistro}
          className="text-sm font-semibold text-[#8e001b] hover:underline underline-offset-2"
        >
          Ver registro
        </button>
      </div>
    </section>
  );
}

export default PainelAcessoContatos;
