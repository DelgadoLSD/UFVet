import { useState } from "react";
import Modal from "./Modal";
import Botao from "./Botao";
import Avatar from "./Avatar";
import Selecao from "./Selecao";

const TAMANHO_CODIGO = 6;

const limparCodigo = (texto) =>
  texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, TAMANHO_CODIGO);

const tratamento = (vet) => (vet.genero === "F" ? "Dra." : "Dr.");

function CartaoVeterinario({ vet }) {
  return (
    <div className="rounded-xl border border-[#eadede] bg-white p-4 flex items-center gap-4">
      <Avatar
        pessoa={vet}
        tamanho="w-14 h-14"
        fundo="bg-[#b7102a]"
        formato="rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{vet.nome}</p>
          <span className="text-xs font-semibold text-[#8e001b] bg-[#fdecee] px-2 py-0.5 rounded-md">
            #{vet.codigo}
          </span>
        </div>
        <p className="text-sm text-[#5f5e5e] mt-0.5">
          CRMV {vet.crmv}. {vet.hospital}.
        </p>
      </div>
    </div>
  );
}

// O pedido vai para um veterinário específico, escolhido pelo código (como o
// veterinário faz com o código do tutor) ou pela lista do hospital.
function ModalPedirLiberacao({
  usuario,
  hospitais,
  veterinarios,
  onConfirmar,
  onClose,
}) {
  const [codigo, setCodigo] = useState("");
  const [hospital, setHospital] = useState("");
  const [caso, setCaso] = useState("");

  const completo = codigo.length === TAMANHO_CODIGO;
  const vet = completo ? veterinarios.find((v) => v.codigo === codigo) : null;
  const doHospital = hospital
    ? veterinarios.filter((v) => v.hospitalId === hospital)
    : [];
  const naoEncontrado = completo && !vet;
  const podeEnviar = !!vet && caso.trim().length >= 5;

  return (
    <Modal
      titulo="Pedir liberação de contatos"
      subtitulo="O pedido vai para o veterinário que está acompanhando o seu caso"
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
              disabled={!podeEnviar}
              onClick={() => onConfirmar({ caso: caso.trim(), veterinario: vet })}
            >
              Enviar pedido
            </Botao>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <label
              htmlFor="codigo-vet"
              className="text-sm font-semibold text-[#1a1c1c]"
            >
              Código do veterinário
            </label>
            <span className="text-xs text-[#5f5e5e]">
              Aparece no perfil dele, ao lado do nome
            </span>
          </div>
          <div className="flex items-center h-12 pl-4 bg-white border border-[#dccfcf] rounded-xl shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors focus-within:border-[#b7102a] focus-within:ring-4 focus-within:ring-[#b7102a]/10">
            <span className="text-lg font-semibold text-[#8f6f6e] select-none">
              #
            </span>
            <input
              id="codigo-vet"
              value={codigo}
              autoComplete="off"
              spellCheck="false"
              placeholder="V7H4M2"
              onChange={(e) => setCodigo(limparCodigo(e.target.value))}
              className="flex-1 h-full px-2 bg-transparent text-base font-semibold tracking-[0.12em] text-[#1a1c1c] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a79d9d] focus:outline-none"
            />
          </div>
        </div>

        {vet ? (
          <CartaoVeterinario vet={vet} />
        ) : (
          <div>
            <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
              {naoEncontrado
                ? `Nenhum veterinário com o código #${codigo}. Procure pelo local:`
                : "Ou procure pelo local do atendimento"}
            </p>
            <Selecao
              valor={hospital}
              onChange={setHospital}
              placeholder="Selecione o hospital ou clínica"
              icone="local_hospital"
              opcoes={hospitais.map((h) => ({
                valor: h.id,
                rotulo: h.nome,
                descricao: h.cidade,
                icone: "local_hospital",
              }))}
            />
            {hospital && (
            <ul className="mt-3 rounded-xl border border-[#eadede] divide-y divide-[#f0e6e6] overflow-hidden">
              {doHospital.map((v) => (
                <li key={v.codigo}>
                  <button
                    type="button"
                    onClick={() => setCodigo(v.codigo)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#faf6f6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
                  >
                    <Avatar
                      pessoa={v}
                      tamanho="w-9 h-9"
                      fundo="bg-[#b7102a]"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#1a1c1c] truncate">
                        {tratamento(v)} {v.nome}
                      </span>
                      <span className="block text-xs text-[#5f5e5e]">
                        CRMV {v.crmv}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-[#b9a9a9]">
                      chevron_right
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            )}
          </div>
        )}

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
          <p className="text-xs text-[#5f5e5e] mt-2">
            Quanto mais claro, mais rápido ele confirma e libera.
          </p>
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
              volunteer_activism
            </span>
            A doação continua voluntária: o tutor do doador pode dizer não.
          </li>
        </ul>
      </div>
    </Modal>
  );
}

export default ModalPedirLiberacao;
