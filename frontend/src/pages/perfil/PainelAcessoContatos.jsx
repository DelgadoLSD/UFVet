import { useEffect, useRef, useState } from "react";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import EtiquetaCodigo from "../../components/EtiquetaCodigo";
import ModalLiberarAcesso from "./ModalLiberarAcesso";
import { confirmar } from "../../hooks/confirmacoes";
import {
  encerrarAcesso,
  liberarAcesso,
  recusarPedido,
  renovarAcesso,
  usePainelAcesso,
} from "../../servicos/acessoContatos";
import {
  DURACAO_PADRAO_HORAS,
  opcoesDeRenovacao,
  rotuloDuracao,
} from "../../regras/acessoContatos";
import {
  diaEHora,
  horasRestantes,
  quando,
  tempoRestante,
} from "../../util/datas";
import { primeiroNome } from "../../util/texto";

// Painel do veterinário, no próprio perfil, para cuidar do acesso aos
// contatos: pedidos que chegaram para ele e as liberações que ele deu. Tudo
// vem da API, que só mostra a cada veterinário o que é dele (NF28.5).
//
// Bloco preto no meio de uma página clara: é a área de responsabilidade do
// veterinário, e precisa ser reconhecida de longe.

// Etiqueta com o tempo que falta. Fica vermelha no último dia.
function Prazo({ expiraEm }) {
  const urgente = horasRestantes(expiraEm) < 24;
  return (
    <span
      title={`Termina ${diaEHora(expiraEm)}`}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        urgente ? "bg-[#fdecee] text-[#9e0a24]" : "bg-[#f3eeee] text-[#5b403f]"
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
// resposta, e salta antes do resto. `ocupado` desliga os botões enquanto a
// resposta vai para a API.
function Pedido({ pedido, ocupado, onLiberar, onRecusar }) {
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
        <Botao
          variante="contornoClaro"
          tamanho="sm"
          disabled={ocupado}
          onClick={onRecusar}
        >
          Recusar
        </Botao>
        <Botao
          variante="claro"
          tamanho="sm"
          disabled={ocupado}
          onClick={onLiberar}
        >
          Liberar {rotuloDuracao(DURACAO_PADRAO_HORAS)}
        </Botao>
      </div>
    </li>
  );
}

// "Renovar" abre a escolha do prazo novo, contado de agora (F30): cada
// opção diz quando o acesso passaria a terminar. A que terminaria antes do
// prazo atual fica desligada: renovar só estende, e para tirar o acesso
// antes existe o "Encerrar". Fecha com Esc ou clicando fora.
function MenuRenovar({ liberacao, ocupado, onRenovar }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const listaRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    // O foco vai para a primeira opção que pode ser escolhida.
    listaRef.current?.querySelector("button:not(:disabled)")?.focus();
    const fecharFora = (e) => {
      if (!raizRef.current?.contains(e.target)) setAberto(false);
    };
    const aoTeclar = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  // As opções são calculadas ao abrir, com o relógio de agora.
  const opcoes = aberto ? opcoesDeRenovacao(liberacao.expiraEm) : [];

  return (
    <div ref={raizRef} className="relative">
      <Botao
        variante="secundario"
        tamanho="sm"
        disabled={ocupado}
        aria-expanded={aberto}
        aria-haspopup="menu"
        onClick={() => setAberto((agora) => !agora)}
      >
        Renovar
        <span
          aria-hidden="true"
          className={`material-symbols-outlined text-[18px] -mr-1 transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </Botao>

      {aberto && (
        <div
          ref={listaRef}
          role="menu"
          aria-label={`Renovar o acesso de ${liberacao.tutorNome}`}
          className="absolute right-0 top-full mt-2 z-30 w-72 p-1.5 bg-white border border-[#eadede] rounded-xl shadow-[0_12px_32px_-8px_rgba(26,28,28,0.25)] animate-aparecer"
        >
          <p className="px-2.5 pt-2 pb-2.5 text-xs text-[#5f5e5e] leading-relaxed">
            Hoje o acesso termina{" "}
            <strong className="font-semibold text-[#1a1c1c]">
              {diaEHora(liberacao.expiraEm)}
            </strong>
            . Renovar, a partir de agora, por:
          </p>
          {opcoes.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              role="menuitem"
              disabled={opcao.encurta}
              onClick={() => {
                setAberto(false);
                onRenovar(opcao.valor);
              }}
              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-[#faf3f3] focus-visible:outline-none focus-visible:bg-[#faf3f3] disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <span
                className={`text-sm font-bold ${
                  opcao.encurta ? "text-[#b9a9a9]" : "text-[#1a1c1c]"
                }`}
              >
                {opcao.rotulo}
              </span>
              <span
                className={`text-xs text-right ${
                  opcao.encurta ? "text-[#b9a9a9]" : "text-[#5f5e5e]"
                }`}
              >
                {opcao.encurta
                  ? "termina antes do prazo atual"
                  : `até ${diaEHora(opcao.terminaEm)}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Liberacao({ liberacao, ocupado, onRenovar, onEncerrar }) {
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
        <MenuRenovar
          liberacao={liberacao}
          ocupado={ocupado}
          onRenovar={onRenovar}
        />
        <Botao
          variante="perigo"
          tamanho="sm"
          disabled={ocupado}
          onClick={onEncerrar}
        >
          Encerrar
        </Botao>
      </div>
    </li>
  );
}

function PainelAcessoContatos({ onComoFunciona }) {
  const painel = usePainelAcesso();
  const { pedidos, liberacoes } = painel;
  const [liberando, setLiberando] = useState(false);
  // A linha (o id) cuja ação está a caminho da API, e o erro da última ação.
  const [ocupado, setOcupado] = useState(null);
  const [erro, setErro] = useState("");

  // Toda ação segue o mesmo caminho: desliga os botões da linha, chama a
  // API, busca as listas de novo (também quando dá errado: outro
  // veterinário pode ter liberado o mesmo tutor antes, por exemplo) e então
  // confirma embaixo da tela ou diz o que deu errado em cima das listas.
  // `mensagem` pode ser uma função do que a API respondeu.
  const agir = async (id, acao, mensagem) => {
    setOcupado(id);
    setErro("");
    try {
      const resultado = await acao();
      await painel.recarregar();
      confirmar(
        typeof mensagem === "function" ? mensagem(resultado) : mensagem,
      );
    } catch (falha) {
      await painel.recarregar();
      setErro(falha.message);
    } finally {
      setOcupado(null);
    }
  };

  // Aceitar um pedido libera pelo prazo padrão; o caso continua no pedido.
  const liberarPedido = (pedido) =>
    agir(
      pedido.id,
      () =>
        liberarAcesso({
          pedido: pedido.id,
          duracaoHoras: DURACAO_PADRAO_HORAS,
        }),
      `Acesso liberado para ${primeiroNome(pedido.tutorNome)}`,
    );
  const recusar = (pedido) =>
    agir(
      pedido.id,
      () => recusarPedido(pedido.id),
      `Pedido de ${primeiroNome(pedido.tutorNome)} recusado`,
    );
  const renovar = (liberacao, duracaoHoras) =>
    agir(
      liberacao.id,
      () => renovarAcesso(liberacao.id, duracaoHoras),
      (renovada) =>
        `Acesso de ${primeiroNome(liberacao.tutorNome)} renovado até ${diaEHora(renovada.expiraEm)}`,
    );
  const encerrar = (liberacao) =>
    agir(
      liberacao.id,
      () => encerrarAcesso(liberacao.id),
      `Acesso de ${primeiroNome(liberacao.tutorNome)} encerrado`,
    );

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

      <AvisoErro>{erro}</AvisoErro>

      {!painel.pronto ? (
        <p role="status" className="py-6 text-center text-sm text-white/60">
          Carregando os pedidos e as liberações…
        </p>
      ) : painel.erro && pedidos.length === 0 && liberacoes.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <AvisoErro>{painel.erro}</AvisoErro>
          <Botao
            variante="claro"
            tamanho="sm"
            icone="refresh"
            onClick={painel.recarregar}
          >
            Tentar de novo
          </Botao>
        </div>
      ) : (
        <>
          {pedidos.length > 0 && (
            <div className="rounded-xl bg-[#9e0a24] overflow-hidden">
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
                    ocupado={ocupado === p.id}
                    onLiberar={() => liberarPedido(p)}
                    onRecusar={() => recusar(p)}
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
            <ul className="rounded-xl bg-white divide-y divide-[#f0e6e6]">
              {liberacoes.map((l) => (
                <Liberacao
                  key={l.id}
                  liberacao={l}
                  ocupado={ocupado === l.id}
                  onRenovar={(horas) => renovar(l, horas)}
                  onEncerrar={() => encerrar(l)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {liberando && (
        <ModalLiberarAcesso
          onFechar={() => setLiberando(false)}
          onLiberado={painel.recarregar}
        />
      )}
    </section>
  );
}

export default PainelAcessoContatos;
