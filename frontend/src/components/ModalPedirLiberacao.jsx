import { useState } from "react";
import Modal from "./Modal";
import AvisoErro from "./AvisoErro";
import Botao from "./Botao";
import Avatar from "./Avatar";
import Selecao from "./Selecao";
import AreaTexto from "./AreaTexto";
import CampoCodigo from "./CampoCodigo";
import EtiquetaCodigo from "./EtiquetaCodigo";
import { useSessao } from "../servicos/sessao";
import { pedirLiberacao } from "../servicos/acessoContatos";
import {
  HOSPITAIS,
  acharVeterinario,
  veterinariosDe,
} from "../servicos/pessoas";
import { TAMANHO_MINIMO_CASO } from "../regras/acessoContatos";
import { TAMANHO_CODIGO, tratamento } from "../util/texto";

// Pedido de um tutor para ver os contatos dos doadores. O pedido vai para um
// veterinário específico, que assume a responsabilidade se liberar: o tutor
// escolhe pelo código (do mesmo jeito que o veterinário libera pelo código do
// tutor) ou procurando na lista do hospital.
//
// Aberto pela busca e pelo perfil de outro tutor.

// Dados do veterinário escolhido, para o tutor conferir antes de enviar.
function CartaoVeterinario({ veterinario }) {
  return (
    <div className="rounded-xl border border-[#eadede] bg-white p-4 flex items-center gap-4">
      <Avatar
        pessoa={veterinario}
        tamanho="w-14 h-14"
        fundo="bg-[#9e0a24]"
        formato="rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-[#1a1c1c]">{veterinario.nomeCompleto}</p>
          <EtiquetaCodigo codigo={veterinario.codigo} />
        </div>
        <p className="text-sm text-[#5f5e5e] mt-0.5">
          CRMV {veterinario.crmv}. {veterinario.hospital}.
        </p>
      </div>
    </div>
  );
}

// Lista dos veterinários de um hospital; escolher um preenche o código.
function ListaVeterinarios({ veterinarios, onEscolher }) {
  return (
    <ul className="mt-3 rounded-xl border border-[#eadede] divide-y divide-[#f0e6e6] overflow-hidden">
      {veterinarios.map((v) => (
        <li key={v.codigo}>
          <button
            type="button"
            onClick={() => onEscolher(v.codigo)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#faf6f6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e0a24]"
          >
            <Avatar pessoa={v} tamanho="w-9 h-9" fundo="bg-[#9e0a24]" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-[#1a1c1c] truncate">
                {tratamento(v)} {v.nomeCompleto}
              </span>
              <span className="block text-xs text-[#5f5e5e]">
                CRMV {v.crmv}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[#b9a9a9]"
            >
              chevron_right
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ModalPedirLiberacao({ onFechar }) {
  const usuario = useSessao();
  const [codigo, setCodigo] = useState("");
  const [hospital, setHospital] = useState("");
  const [caso, setCaso] = useState("");
  const [erro, setErro] = useState("");

  const completo = codigo.length === TAMANHO_CODIGO;
  const veterinario = completo ? acharVeterinario(codigo) : null;
  const naoEncontrado = completo && !veterinario;

  // Mudar qualquer campo tira o aviso, que era sobre o que estava antes.
  const mudando = (definir) => (valor) => {
    definir(valor);
    setErro("");
  };

  // O botão fica ligado: enviar sem o veterinário ou sem contar o caso diz o
  // que falta, acima dos botões.
  const enviar = () => {
    if (!veterinario) {
      setErro(
        naoEncontrado
          ? `Nenhum veterinário com o código #${codigo}. Confira o código ou procure pelo local do atendimento.`
          : "Escolha o veterinário: digite o código dele ou procure pelo local do atendimento.",
      );
      return;
    }
    if (caso.trim().length < TAMANHO_MINIMO_CASO) {
      setErro(
        `Conte o que está acontecendo, com pelo menos ${TAMANHO_MINIMO_CASO} caracteres.`,
      );
      return;
    }
    pedirLiberacao({ usuario, veterinario, caso: caso.trim() });
    onFechar();
  };

  return (
    <Modal
      titulo="Pedir liberação de contatos"
      subtitulo="O pedido vai para o veterinário que está acompanhando o seu caso"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col gap-3">
          <AvisoErro>{erro}</AvisoErro>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-[#5f5e5e] leading-snug max-w-xs">
              O pedido vai com o seu código #{usuario.codigo}, para o
              veterinário saber de quem é.
            </p>
            <div className="flex gap-2">
              <Botao variante="secundario" onClick={onFechar}>
                Cancelar
              </Botao>
              <Botao onClick={enviar}>Enviar pedido</Botao>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <CampoCodigo
          id="codigo-vet"
          rotulo="Código do veterinário"
          dica="Aparece no perfil dele, ao lado do nome"
          placeholder="V7H4M2"
          valor={codigo}
          onMudar={mudando(setCodigo)}
        />

        {veterinario ? (
          <CartaoVeterinario veterinario={veterinario} />
        ) : (
          <div>
            <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
              {naoEncontrado
                ? `Nenhum veterinário com o código #${codigo}. Procure pelo local:`
                : "Ou procure pelo local do atendimento"}
            </p>
            <Selecao
              rotulo="Local do atendimento"
              valor={hospital}
              onEscolher={mudando(setHospital)}
              placeholder="Selecione o hospital ou clínica"
              icone="local_hospital"
              opcoes={HOSPITAIS.map((h) => ({
                valor: h.id,
                rotulo: h.nome,
                descricao: h.cidade,
                icone: "local_hospital",
              }))}
            />
            {hospital && (
              <ListaVeterinarios
                veterinarios={veterinariosDe(hospital)}
                onEscolher={mudando(setCodigo)}
              />
            )}
          </div>
        )}

        <AreaTexto
          id="caso-pedido"
          rotulo="O que está acontecendo"
          dica="Quanto mais claro, mais rápido ele confirma e libera."
          placeholder="Ex.: Luna está internada no HV-UFV e precisa de transfusão hoje."
          value={caso}
          onChange={(e) => mudando(setCaso)(e.target.value)}
        />

        <ul className="flex flex-col gap-2 text-sm text-[#5b403f] bg-[#fafafa] border border-[#eadede] rounded-xl p-4">
          <li className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-[#9e0a24] shrink-0"
            >
              schedule
            </span>
            O acesso liberado tem prazo e expira sozinho.
          </li>
          <li className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-[#9e0a24] shrink-0"
            >
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
