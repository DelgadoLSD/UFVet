import { useState } from "react";
import Modal from "./Modal";
import Botao from "./Botao";
import Campo from "./Campo";
import Avatar from "./Avatar";
import { tempoRestante } from "../util/tempo";

const DURACOES = [
  { horas: 24, rotulo: "24 horas" },
  { horas: 72, rotulo: "3 dias" },
  { horas: 168, rotulo: "7 dias" },
];

const TAMANHO_CODIGO = 6;

// O código é copiado do perfil com "#" na frente; aqui ele é limpo para que
// colar direto funcione.
const limparCodigo = (texto) =>
  texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, TAMANHO_CODIGO);

function CartaoTutor({ tutor, jaLiberado }) {
  return (
    <div className="rounded-xl border border-[#eadede] bg-white p-4 flex items-center gap-4">
      <Avatar
        pessoa={tutor}
        tamanho="w-16 h-16"
        fundo="bg-[#b7102a]"
        formato="rounded-xl"
        textoIniciais="text-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{tutor.nome}</p>
          <span className="text-xs font-semibold text-[#8e001b] bg-[#fdecee] px-2 py-0.5 rounded-md">
            #{tutor.codigo}
          </span>
        </div>
        <p className="text-sm text-[#5f5e5e] mt-0.5 leading-snug">
          {tutor.cidade}. {tutor.animais}.
        </p>
        {tutor.membroDesde && (
          <p className="text-xs text-[#8f6f6e] mt-0.5">
            No UFVet desde {tutor.membroDesde}
          </p>
        )}
        {jaLiberado && (
          <p className="mt-2 text-sm font-semibold text-[#8e001b]">
            Já está com acesso liberado, {tempoRestante(jaLiberado.expiraEm)}.
          </p>
        )}
      </div>
    </div>
  );
}

function Vazio({ children, alerta = false }) {
  return (
    <div
      className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm ${
        alerta
          ? "border-[#e9aab3] bg-[#fff7f7] text-[#8e001b]"
          : "border-[#e2cfcf] text-[#8f6f6e]"
      }`}
    >
      {children}
    </div>
  );
}

// O veterinário libera pelo código do tutor: nomes se repetem, códigos não. A
// foto e os dados aparecem antes de confirmar, para ele ver se errou o código.
function ModalLiberarAcesso({
  tutores,
  liberacoes,
  codigoInicial = "",
  onConfirmar,
  onClose,
}) {
  const [codigo, setCodigo] = useState(limparCodigo(codigoInicial));
  const [duracao, setDuracao] = useState(72);
  const [caso, setCaso] = useState("");

  const completo = codigo.length === TAMANHO_CODIGO;
  const tutor = completo ? tutores.find((t) => t.codigo === codigo) : null;
  const jaLiberado = tutor && liberacoes.find((l) => l.codigo === tutor.codigo);

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
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <label
              htmlFor="codigo-tutor"
              className="text-sm font-semibold text-[#1a1c1c]"
            >
              Código do tutor
            </label>
            <span className="text-xs text-[#5f5e5e]">
              Aparece ao lado do nome, no perfil
            </span>
          </div>
          <div className="flex items-center h-12 pl-4 bg-white border border-[#dccfcf] rounded-xl shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors focus-within:border-[#b7102a] focus-within:ring-4 focus-within:ring-[#b7102a]/10">
            <span className="text-lg font-semibold text-[#8f6f6e] select-none">
              #
            </span>
            <input
              id="codigo-tutor"
              value={codigo}
              autoComplete="off"
              spellCheck="false"
              placeholder="T3M8P1"
              onChange={(e) => setCodigo(limparCodigo(e.target.value))}
              className="flex-1 h-full px-2 bg-transparent text-base font-semibold tracking-[0.12em] text-[#1a1c1c] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a79d9d] focus:outline-none"
            />
          </div>
        </div>

        {tutor ? (
          <CartaoTutor tutor={tutor} jaLiberado={jaLiberado} />
        ) : completo ? (
          <Vazio alerta>
            Nenhum tutor com o código #{codigo}. Confira com a pessoa que está
            no atendimento.
          </Vazio>
        ) : (
          <Vazio>
            Digite os {TAMANHO_CODIGO} caracteres do código para ver de quem é.
          </Vazio>
        )}

        <div>
          <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
            Por quanto tempo
          </p>
          <div className="flex p-1 bg-white border border-[#e2d6d6] rounded-xl gap-1">
            {DURACOES.map((d) => (
              <button
                key={d.horas}
                type="button"
                onClick={() => setDuracao(d.horas)}
                aria-pressed={duracao === d.horas}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
                  duracao === d.horas
                    ? "bg-[#b7102a] text-white"
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
