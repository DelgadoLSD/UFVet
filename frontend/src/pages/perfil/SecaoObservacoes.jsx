import { useState } from "react";
import Modal from "../../components/Modal";
import Ajuda from "../../components/Ajuda";
import Botao from "../../components/Botao";
import { formatarData, formatarHora } from "../../util/datas";

// Observações para a coleta: anotações de veterinários sobre como o animal se
// comportou em coletas anteriores, para a próxima equipe se preparar. O cartão
// mostra as mais recentes; o resto abre num modal.

const OBSERVACOES_VISIVEIS = 3;

function ItemObservacao({ item }) {
  return (
    <div className="border-l-2 border-[#e4bebc] pl-4 py-0.5">
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

// `onAdicionar` recebe só o texto: quem assina e quando é decidido no cartão
// do animal.
function SecaoObservacoes({ animal, observacoes, podeAdicionar, onAdicionar }) {
  const [adicionando, setAdicionando] = useState(false);
  const [texto, setTexto] = useState("");
  const [todasAbertas, setTodasAbertas] = useState(false);

  const cancelar = () => {
    setAdicionando(false);
    setTexto("");
  };

  const salvar = () => {
    if (!texto.trim()) return;
    onAdicionar(texto.trim());
    cancelar();
  };

  return (
    <section className="border border-[#f0e6e6] bg-[#fafafa] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-1.5 text-base font-bold text-[#1a1c1c]">
            Observações para a coleta
            <Ajuda titulo="Observações para a coleta">
              <p>
                Anotações de veterinários sobre como o animal se comportou em
                coletas anteriores — por exemplo, se é calmo ou se precisa de
                mais cuidado.
              </p>
              <p>
                Elas ajudam a equipe a preparar uma coleta tranquila para o
                doador.
              </p>
            </Ajuda>
          </h4>
          <p className="text-xs text-[#5f5e5e] mt-1">
            Temperamento e comportamento em coletas anteriores
          </p>
        </div>
        {podeAdicionar && !adicionando && (
          <Botao
            variante="secundario"
            tamanho="sm"
            icone="add"
            onClick={() => setAdicionando(true)}
          >
            Adicionar
          </Botao>
        )}
      </div>

      {adicionando && (
        <div className="bg-white border border-[#e4bebc] rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#8e001b]/30">
          <textarea
            autoFocus
            aria-label="Nova observação"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder="Ex.: dócil, coleta tranquila sem necessidade de contenção."
            className="w-full bg-white text-gray-900 [color-scheme:light] text-sm resize-none focus:outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Botao variante="fantasma" tamanho="sm" onClick={cancelar}>
              Cancelar
            </Botao>
            <Botao tamanho="sm" onClick={salvar} disabled={!texto.trim()}>
              Salvar
            </Botao>
          </div>
        </div>
      )}

      {observacoes.length > 0 ? (
        <div className="space-y-3">
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
          className="flex items-center gap-1.5 text-[#8e001b] font-semibold text-xs hover:underline underline-offset-2 w-fit mt-auto"
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
          <div className="space-y-4">
            {observacoes.map((item, i) => (
              <ItemObservacao key={i} item={item} />
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

export default SecaoObservacoes;
