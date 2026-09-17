import { useState } from "react";
import Modal from "./Modal";
import { quando } from "../util/tempo";

function Lista({ itens, vazio, descrever }) {
  if (itens.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[#5f5e5e]">{vazio}</p>
    );
  }
  return (
    <ul className="divide-y divide-[#f0e6e6]">
      {itens.map((item) => (
        <li key={item.id} className="py-4 flex items-start gap-3">
          <span className="w-9 h-9 rounded-full bg-[#faf0f0] text-[#8e001b] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">
              visibility
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#1a1c1c]">
              <span className="font-semibold">{item.nome}</span>{" "}
              <span className="text-[#8f6f6e]">#{item.codigo}</span>
            </p>
            <p className="text-xs text-[#5f5e5e] mt-0.5 leading-relaxed">
              {descrever(item)}
            </p>
          </div>
          <span className="text-xs text-[#5f5e5e] whitespace-nowrap shrink-0">
            {quando(item.quando)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Registro de consultas: o que você viu e quem viu o seu contato. É o que
// mantém a abertura dos telefones sob responsabilidade de alguém.
function ModalRegistroConsultas({ feitas, recebidas, abaInicial = "feitas", onClose }) {
  const [aba, setAba] = useState(abaInicial);

  const abas = [
    { val: "feitas", rotulo: `Você consultou (${feitas.length})` },
    { val: "recebidas", rotulo: `Viram seu contato (${recebidas.length})` },
  ];

  return (
    <Modal
      titulo="Registro de consultas"
      subtitulo="Toda vez que um contato é aberto, fica registrado dos dois lados"
      largura="max-w-2xl"
      onClose={onClose}
    >
      <div className="flex p-1 bg-[#f5efef] rounded-xl gap-1 mb-2">
        {abas.map((op) => (
          <button
            key={op.val}
            type="button"
            onClick={() => setAba(op.val)}
            aria-pressed={aba === op.val}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
              aba === op.val
                ? "bg-white text-[#8e001b] shadow-[0_1px_3px_rgba(26,28,28,0.12)]"
                : "text-[#5f5e5e] hover:text-[#1a1c1c]"
            }`}
          >
            {op.rotulo}
          </button>
        ))}
      </div>

      {aba === "feitas" ? (
        <Lista
          itens={feitas}
          vazio="Você ainda não consultou nenhum contato."
          descrever={(item) =>
            item.permissao === "veterinario"
              ? "Você viu o contato como veterinário."
              : `Você viu o contato com a liberação de ${item.permissao}.`
          }
        />
      ) : (
        <Lista
          itens={recebidas}
          vazio="Ninguém viu seu contato até agora."
          descrever={(item) =>
            item.permissao === "veterinario"
              ? `${item.papel} que viu seu contato no atendimento.`
              : `Tutor com acesso liberado por ${item.permissao}.`
          }
        />
      )}
    </Modal>
  );
}

export default ModalRegistroConsultas;
