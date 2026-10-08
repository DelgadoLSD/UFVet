import { useState } from "react";
import Modal from "../../components/Modal";
import Ajuda from "../../components/Ajuda";
import AvisoErro from "../../components/AvisoErro";
import Botao from "../../components/Botao";
import PainelSecao from "./PainelSecao";
import { formatarData, formatarHora } from "../../util/datas";

// Observações para a coleta: anotações de veterinários sobre como o animal se
// comportou em coletas anteriores, para a próxima equipe se preparar. O cartão
// mostra as mais recentes; o resto abre num modal.

const OBSERVACOES_VISIVEIS = 3;

// Uma observação: quem escreveu e quando, e o texto. As observações se
// separam por linhas finas, numa lista sem caixa em volta.
function ItemObservacao({ item }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span className="font-semibold text-[#1a1c1c]">{item.autorNome}</span>
        <span className="text-[#5f5e5e]">
          {formatarData(item.criadoEm)} às {formatarHora(item.criadoEm)}
        </span>
      </p>
      <p className="text-sm text-[#1a1c1c] mt-0.5 leading-relaxed">
        {item.texto}
      </p>
    </div>
  );
}

// `onAdicionar` recebe só o texto e grava na API, que assina com a conta de
// quem está logado e marca a hora. Se a gravação falhar, o texto fica e o
// motivo aparece.
function SecaoObservacoes({ animal, observacoes, podeAdicionar, onAdicionar }) {
  const [adicionando, setAdicionando] = useState(false);
  const [texto, setTexto] = useState("");
  const [todasAbertas, setTodasAbertas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const cancelar = () => {
    setAdicionando(false);
    setTexto("");
    setErro("");
  };

  const salvar = async () => {
    // O botão fica ligado: salvar sem texto explica o que falta.
    if (!texto.trim()) {
      setErro("Escreva a observação antes de salvar.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await onAdicionar(texto.trim());
      cancelar();
    } catch (falha) {
      setErro(falha.campos?.texto ?? falha.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <PainelSecao
      titulo="Observações para a coleta"
      ajuda={
        <Ajuda titulo="Observações para a coleta" claro>
          <p>
            Anotações de veterinários sobre como o animal se comportou em
            coletas anteriores — por exemplo, se é calmo ou se precisa de mais
            cuidado.
          </p>
          <p>
            Elas ajudam a equipe a preparar uma coleta tranquila para o doador.
          </p>
        </Ajuda>
      }
      acao={
        podeAdicionar &&
        !adicionando && (
          <Botao
            variante="claro"
            tamanho="xs"
            icone="add"
            onClick={() => setAdicionando(true)}
          >
            Adicionar
          </Botao>
        )
      }
      subtitulo="Temperamento e comportamento em coletas anteriores"
    >
      {adicionando && (
        <div className="bg-white border border-[#e4bebc] rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#9e0a24]/30">
          <textarea
            autoFocus
            aria-label="Nova observação"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErro("");
            }}
            rows={3}
            placeholder="Ex.: dócil, coleta tranquila sem necessidade de contenção."
            className="w-full bg-white text-gray-900 [color-scheme:light] text-sm resize-none focus:outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Botao variante="fantasma" tamanho="sm" onClick={cancelar}>
              Cancelar
            </Botao>
            <Botao tamanho="sm" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Botao>
          </div>
          {erro && (
            <div className="mt-2">
              <AvisoErro>{erro}</AvisoErro>
            </div>
          )}
        </div>
      )}

      {observacoes.length > 0 ? (
        <div className="divide-y divide-[#f0e6e6]">
          {observacoes.slice(0, OBSERVACOES_VISIVEIS).map((item, i) => (
            <ItemObservacao key={i} item={item} />
          ))}
        </div>
      ) : (
        !adicionando && (
          <p className="text-sm text-[#5f5e5e] italic">
            Nenhuma observação registrada ainda.
          </p>
        )
      )}

      {observacoes.length > OBSERVACOES_VISIVEIS && (
        <button
          type="button"
          onClick={() => setTodasAbertas(true)}
          className="flex items-center gap-1.5 text-[#9e0a24] font-semibold text-xs hover:underline underline-offset-2 w-fit mt-auto"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px]"
          >
            unfold_more
          </span>
          Ver todas ({observacoes.length - OBSERVACOES_VISIVEIS} mais)
        </button>
      )}

      {todasAbertas && (
        <Modal
          titulo={`Observações para a coleta — ${animal.nome}`}
          subtitulo={`${observacoes.length} registros`}
          onFechar={() => setTodasAbertas(false)}
        >
          <div className="divide-y divide-[#f0e6e6]">
            {observacoes.map((item, i) => (
              <ItemObservacao key={i} item={item} />
            ))}
          </div>
        </Modal>
      )}
    </PainelSecao>
  );
}

export default SecaoObservacoes;
