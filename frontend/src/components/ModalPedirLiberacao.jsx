import { useState } from "react";
import Modal from "./Modal";
import Botao from "./Botao";

// Tutor pede o acesso sem precisar estar na frente do veterinário. O pedido
// cai no perfil de quem está de plantão, que libera ou não.
function ModalPedirLiberacao({ usuario, onConfirmar, onClose }) {
  const [caso, setCaso] = useState("");

  return (
    <Modal
      titulo="Pedir liberação de contatos"
      subtitulo="Um veterinário do hospital confere o pedido e libera o seu acesso"
      onClose={onClose}
      rodape={
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-[#5f5e5e] leading-snug max-w-xs">
            O pedido vai com o seu código #{usuario.codigo}, para o veterinário
            saber de quem é.
          </p>
          <div className="flex gap-2">
            <Botao variante="secundario" onClick={onClose}>
              Cancelar
            </Botao>
            <Botao
              disabled={caso.trim().length < 5}
              onClick={() => onConfirmar(caso.trim())}
            >
              Enviar pedido
            </Botao>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-[#5b403f] leading-relaxed">
          Conte rapidamente o que está acontecendo. Quanto mais claro, mais
          rápido o veterinário consegue confirmar e liberar.
        </p>

        <div>
          <label
            htmlFor="caso-pedido"
            className="block text-sm font-semibold text-[#1a1c1c] mb-2"
          >
            O que está acontecendo
          </label>
          <textarea
            id="caso-pedido"
            rows={3}
            value={caso}
            onChange={(e) => setCaso(e.target.value)}
            placeholder="Ex.: Luna está internada no HV-UFV e precisa de transfusão hoje."
            className="w-full px-4 py-3 bg-white border border-[#dccfcf] rounded-xl text-base text-[#1a1c1c] placeholder:text-[#a79d9d] resize-none transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10"
          />
        </div>

        <ul className="flex flex-col gap-2 text-sm text-[#5b403f] bg-[#fafafa] border border-[#eadede] rounded-xl p-4">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8e001b] shrink-0">
              schedule
            </span>
            O acesso liberado tem prazo e expira sozinho.
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8e001b] shrink-0">
              visibility
            </span>
            Cada contato que você abrir fica registrado para o dono do contato.
          </li>
        </ul>
      </div>
    </Modal>
  );
}

export default ModalPedirLiberacao;
