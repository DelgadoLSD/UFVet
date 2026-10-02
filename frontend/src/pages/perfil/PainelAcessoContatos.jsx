import { useState } from "react";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import EtiquetaCodigo from "../../components/EtiquetaCodigo";
import ModalLiberarAcesso from "./ModalLiberarAcesso";
import { useSessao } from "../../servicos/sessao";
import {
  encerrarAcesso,
  liberacoesAtivas,
  liberacoesDe,
  liberarAcesso,
  pedidosPara,
  recusarPedido,
  renovarAcesso,
  useAcessoContatos,
} from "../../servicos/acessoContatos";
import {
  DURACAO_PADRAO_HORAS,
  rotuloDuracao,
} from "../../regras/acessoContatos";
import { horasRestantes, quando, tempoRestante } from "../../util/datas";

// Painel do veterinário, no próprio perfil, para cuidar do acesso aos
// contatos: pedidos que chegaram para ele e as liberações que ele deu.
//
// Bloco preto no meio de uma página clara: é a área de responsabilidade do
// veterinário, e precisa ser reconhecida de longe.

// Etiqueta com o tempo que falta. Fica vermelha no último dia.
function Prazo({ expiraEm }) {
  const urgente = horasRestantes(expiraEm) < 24;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        urgente ? "bg-[#fdecee] text-[#8e001b]" : "bg-[#f3eeee] text-[#5b403f]"
      }`}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[15px]"
      >
        schedule
      </span>
      {tempoRestante(expiraEm)}
    </span>
  );
}

// Pedidos ficam em vermelho dentro do bloco preto: é o que precisa de
// resposta, e salta antes do resto.
function Pedido({ pedido, onLiberar, onRecusar }) {
  return (
    <li className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-white">{pedido.tutorNome}</p>
          <EtiquetaCodigo codigo={pedido.tutorCodigo} claro />
          <span className="text-xs text-white/60">
            {quando(pedido.criadoEm)}
          </span>
        </div>
        <p className="text-sm text-white/80 mt-1 leading-snug">{pedido.caso}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Botao variante="contornoClaro" tamanho="sm" onClick={onRecusar}>
          Recusar
        </Botao>
        <Botao variante="claro" tamanho="sm" onClick={onLiberar}>
          Liberar {rotuloDuracao(DURACAO_PADRAO_HORAS)}
        </Botao>
      </div>
    </li>
  );
}

function Liberacao({ liberacao }) {
  return (
    <li className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{liberacao.tutorNome}</p>
          <EtiquetaCodigo codigo={liberacao.tutorCodigo} />
        </div>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-snug">
          {liberacao.caso || "Sem caso informado"}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Prazo expiraEm={liberacao.expiraEm} />
        <Botao
          variante="secundario"
          tamanho="sm"
          title="Devolve o prazo cheio da liberação"
          onClick={() => renovarAcesso(liberacao.id)}
        >
          Renovar
        </Botao>
        <Botao
          variante="perigo"
          tamanho="sm"
          onClick={() => encerrarAcesso(liberacao.id)}
        >
          Encerrar
        </Botao>
      </div>
    </li>
  );
}

function PainelAcessoContatos({ onComoFunciona }) {
  const usuario = useSessao();
  const acessoContatos = useAcessoContatos();
  const [liberando, setLiberando] = useState(false);

  const pedidos = pedidosPara(usuario.codigo, acessoContatos);
  // Só o que este veterinário liberou: quem renova ou encerra é quem assumiu
  // a responsabilidade por aquele acesso.
  const liberacoes = liberacoesDe(
    usuario.codigo,
    liberacoesAtivas(acessoContatos.liberacoes),
  );

  // Aceitar um pedido libera pelo prazo padrão. No banco, a liberação guarda
  // o id do pedido (pedido_id) e o texto do caso continua no pedido; aqui ele
  // é copiado só para aparecer na lista.
  const liberarPedido = (pedido) =>
    liberarAcesso({
      tutorCodigo: pedido.tutorCodigo,
      tutorNome: pedido.tutorNome,
      veterinarioCodigo: usuario.codigo,
      duracaoHoras: DURACAO_PADRAO_HORAS,
      caso: pedido.caso,
    });

  return (
    <section className="bg-[#1a1a1a] rounded-2xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              Acesso aos contatos
            </h2>
            <BotaoAjuda
              claro
              rotulo="Como funciona o acesso aos contatos?"
              onClick={onComoFunciona}
            />
          </div>
          <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-xl">
            Tutores em atendimento com você podem ver o contato dos doadores
            enquanto a liberação estiver ativa. Aqui aparecem só as que você
            liberou.
          </p>
        </div>
        <Botao
          icone="add"
          onClick={() => setLiberando(true)}
          className="shrink-0 self-start"
        >
          Liberar acesso
        </Botao>
      </div>

      {pedidos.length > 0 && (
        <div className="rounded-xl bg-[#8e001b] overflow-hidden">
          <p className="px-5 pt-4 text-sm font-semibold text-white">
            {pedidos.length === 1
              ? "1 tutor esperando liberação"
              : `${pedidos.length} tutores esperando liberação`}
          </p>
          <ul className="divide-y divide-white/15">
            {pedidos.map((p) => (
              <Pedido
                key={p.id}
                pedido={p}
                onLiberar={() => liberarPedido(p)}
                onRecusar={() => recusarPedido(p.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {liberacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 px-6 py-10 text-center">
          <p className="font-semibold text-white">
            Você não liberou ninguém agora.
          </p>
          <p className="text-sm text-white/60 mt-1 max-w-md mx-auto leading-relaxed">
            Libere quando um tutor precisar falar com doadores durante um
            atendimento. O acesso expira sozinho no prazo que você escolher.
          </p>
        </div>
      ) : (
        <ul className="rounded-xl bg-white divide-y divide-[#f0e6e6] overflow-hidden">
          {liberacoes.map((l) => (
            <Liberacao key={l.id} liberacao={l} />
          ))}
        </ul>
      )}

      {liberando && <ModalLiberarAcesso onFechar={() => setLiberando(false)} />}
    </section>
  );
}

export default PainelAcessoContatos;
