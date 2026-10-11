import Modal from "../../components/Modal";
import {
  CRITERIOS_DOACAO,
  criteriosEmVigor,
  avisoSemEfeito,
  statusValidacao,
  validaAte,
} from "../../regras/doacao";
import { dataPorExtenso } from "../../util/datas";
import { ESTILO_CRITERIO } from "./estiloCriterio";

// Histórico de validações do animal. A mais recente é a que vale hoje; as
// demais nunca foram apagadas nem alteradas: uma validação assinada não muda
// depois. Quando o veterinário revisa, nasce uma validação nova, e a anterior
// fica marcada como substituída. É essa lista que prova isso.

// O selo de cada validação, nas mesmas cores do painel do cartão: verde só
// para a que vale sem pendências, vermelho para pendências, preto para
// vencida e cinza para a substituída.
const SELO = {
  validado: { rotulo: "Vigente", classe: "bg-emerald-700 text-white" },
  pendencias: {
    rotulo: "Vigente, com pendências",
    classe: "bg-[#9e0a24] text-white",
  },
  vencida: { rotulo: "Vencida", classe: "bg-[#1a1c1c] text-white" },
  substituida: { rotulo: "Substituída", classe: "bg-[#f1ecec] text-[#5f5e5e]" },
};

// Um critério, com o nome escrito: atendido numa caixa verde-clara com ✓; não
// atendido numa caixa vermelha cheia com ✕ (ver estiloCriterio.js). Cada
// etiqueta diz o próprio nome, sem depender de uma coluna de cabeçalho.
function EtiquetaCriterio({ criterio, atendido }) {
  const estilo = ESTILO_CRITERIO[atendido ? "atendido" : "naoAtendido"];
  return (
    <li
      className={`inline-flex items-center gap-1.5 h-8 pl-2 pr-3 rounded-full border text-xs font-bold ${estilo.caixa}`}
    >
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[17px] ${estilo.corIcone}`}
      >
        {estilo.icone}
      </span>
      {criterio.curto}
      <span className="sr-only">
        : {atendido ? "atendido" : "não atendido"}
      </span>
    </li>
  );
}

function ItemValidacao({ validacao, status, nomeAnimal }) {
  const selo = SELO[status];
  // A mais recente mostra os critérios em vigor, como o painel do cartão: um
  // critério perde o efeito quando o tutor muda o peso ou o nascimento, ou
  // apaga um exame conferido, depois da assinatura (F21). As substituídas
  // mostram o que foi assinado. Como no painel, o aviso não aparece na
  // vencida, que já perdeu o efeito inteira.
  const atual = status !== "substituida";
  const criterios = atual ? criteriosEmVigor(validacao) : validacao.criterios;
  const aviso =
    atual && status !== "vencida" && avisoSemEfeito(validacao, nomeAnimal);
  const prazo =
    {
      vencida: `Venceu em ${dataPorExtenso(validaAte(validacao))}.`,
      substituida: "Substituída por uma validação mais nova.",
    }[status] ?? `Vale até ${dataPorExtenso(validaAte(validacao))}.`;

  return (
    <li className="py-6 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-base font-bold text-[#1a1c1c]">
          {dataPorExtenso(validacao.realizadaEm)}
        </p>
        <span
          className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-bold ${selo.classe}`}
        >
          {selo.rotulo}
        </span>
      </div>
      <p className="mt-1 text-sm text-[#5b403f] leading-relaxed">
        Assinada por {validacao.veterinarioNome}, CRMV {validacao.crmv}. {prazo}
      </p>

      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Critérios">
        {CRITERIOS_DOACAO.map((c) => (
          <EtiquetaCriterio
            key={c.chave}
            criterio={c}
            atendido={criterios[c.chave]}
          />
        ))}
      </ul>

      {aviso && (
        <p className="mt-3 text-xs font-semibold text-[#9e0a24] leading-relaxed">
          {aviso}
        </p>
      )}

      {validacao.tipoSanguineoConfirmado && (
        <p className="mt-3 text-sm text-[#5b403f]">
          Tipo confirmado no exame:{" "}
          <strong className="text-[#1a1c1c]">
            {validacao.tipoSanguineoConfirmado}
          </strong>
        </p>
      )}

      {validacao.nota && (
        <p className="mt-3 rounded-lg bg-[#faf6f6] px-3.5 py-2.5 text-sm text-[#5b403f] leading-relaxed">
          {validacao.nota}
        </p>
      )}
    </li>
  );
}

// `validacoes` vem da mais recente para a mais antiga. Só a primeira tem o
// status calculado; as outras já foram substituídas.
function ModalHistoricoValidacao({ animal, validacoes, onFechar }) {
  return (
    <Modal
      titulo={`Validações de ${animal.nome}`}
      subtitulo={
        validacoes.length === 1
          ? "1 validação registrada"
          : `${validacoes.length} validações registradas`
      }
      largura="max-w-2xl"
      onFechar={onFechar}
    >
      <ul className="divide-y divide-[#f0e6e6]">
        {validacoes.map((v, i) => (
          <ItemValidacao
            key={i}
            validacao={v}
            status={i === 0 ? statusValidacao(v) : "substituida"}
            nomeAnimal={animal.nome}
          />
        ))}
      </ul>

      <p className="text-xs text-[#5f5e5e] leading-relaxed mt-6 pt-4 border-t border-[#f0e6e6]">
        Uma validação assinada não é editada. Quando o veterinário revisa os
        critérios, nasce uma validação nova, e a anterior fica aqui, marcada
        como substituída.
      </p>
    </Modal>
  );
}

export default ModalHistoricoValidacao;
