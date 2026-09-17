import { useState } from "react";
import Modal from "./Modal";
import Botao from "./Botao";
import Campo from "./Campo";
import { tempoRestante } from "../util/tempo";

const DURACOES = [
  { horas: 24, rotulo: "24 horas" },
  { horas: 72, rotulo: "3 dias" },
  { horas: 168, rotulo: "7 dias" },
];

// O veterinário libera pelo código do tutor: nomes se repetem, códigos não.
function ModalLiberarAcesso({ tutores, liberacoes, onConfirmar, onClose }) {
  const [codigo, setCodigo] = useState("");
  const [duracao, setDuracao] = useState(72);
  const [caso, setCaso] = useState("");

  const buscado = codigo.trim().toUpperCase();
  const tutor = buscado.length >= 6 ? tutores.find((t) => t.codigo === buscado) : null;
  const jaLiberado = tutor && liberacoes.find((l) => l.codigo === tutor.codigo);
  const naoEncontrado = buscado.length >= 6 && !tutor;

  return (
    <Modal
      titulo="Liberar acesso aos contatos"
      subtitulo="Enquanto a liberação estiver ativa, o tutor vê telefone e e-mail dos doadores"
      onClose={onClose}
      rodape={
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-[#5f5e5e] leading-snug max-w-xs">
            Cada contato que o tutor consultar fica registrado, com a sua
            liberação no histórico.
          </p>
          <div className="flex gap-2">
            <Botao variante="secundario" onClick={onClose}>
              Cancelar
            </Botao>
            <Botao
              disabled={!tutor || !!jaLiberado}
              onClick={() =>
                onConfirmar({ tutor, horas: duracao, caso: caso.trim() })
              }
            >
              Liberar acesso
            </Botao>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Campo
          id="codigo-tutor"
          rotulo="Código do tutor"
          placeholder="T3M8P1"
          value={codigo}
          maxLength={6}
          autoComplete="off"
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          extra={
            <span className="text-xs text-[#5f5e5e]">
              Aparece ao lado do nome, no perfil
            </span>
          }
        />

        {naoEncontrado && (
          <p className="flex items-start gap-2 text-sm text-[#8e001b]">
            <span className="material-symbols-outlined text-[18px]">error</span>
            Nenhum tutor com esse código. Confira com a pessoa que está no
            atendimento.
          </p>
        )}

        {tutor && (
          <div className="rounded-xl border border-[#eadede] bg-[#fafafa] p-4">
            <p className="font-bold text-[#1a1c1c]">{tutor.nome}</p>
            <p className="text-sm text-[#5f5e5e] mt-0.5">
              {tutor.cidade}
              {tutor.animais ? `. ${tutor.animais}` : ""}
            </p>
            {jaLiberado && (
              <p className="mt-3 text-sm font-semibold text-[#8e001b]">
                Este tutor já está com acesso liberado, {tempoRestante(jaLiberado.expiraEm)}.
              </p>
            )}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
            Por quanto tempo
          </p>
          <div className="flex p-1 bg-[#f5efef] rounded-xl gap-1">
            {DURACOES.map((d) => (
              <button
                key={d.horas}
                type="button"
                onClick={() => setDuracao(d.horas)}
                aria-pressed={duracao === d.horas}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
                  duracao === d.horas
                    ? "bg-[#b7102a] text-white shadow-[0_1px_3px_rgba(142,0,27,0.3)]"
                    : "text-[#5f5e5e] hover:text-[#1a1c1c]"
                }`}
              >
                {d.rotulo}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#5f5e5e] mt-2">
            O acesso expira sozinho. Você pode renovar ou encerrar antes.
          </p>
        </div>

        <Campo
          id="caso-atendimento"
          rotulo="Caso (opcional)"
          placeholder="Ex.: Luna, transfusão hoje"
          value={caso}
          onChange={(e) => setCaso(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export default ModalLiberarAcesso;
