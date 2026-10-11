import { useState } from "react";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import ModalComoFuncionaValidacao from "../../components/ModalComoFuncionaValidacao";
import PainelSecao from "./PainelSecao";
import { ESTILO_CRITERIO } from "./estiloCriterio";
import {
  CRITERIOS_DOACAO,
  avisoSemEfeito,
  criteriosEmVigor,
  statusValidacao,
  validaAte,
} from "../../regras/doacao";
import { formatarData } from "../../util/datas";

// Painel da validação veterinária no cartão do animal: o status, quem assinou,
// até quando vale e o checklist dos critérios. O veterinário valida ou revisa
// pelo botão na faixa do painel; o tutor vê o resultado e o que fazer para
// chegar lá.

// A explicação diz o que o status muda na prática, no dia da coleta: é isso
// que um tutor leigo precisa saber para decidir, não o termo técnico. O
// `selo` é a etiqueta sólida com o nome do status, no topo do painel, nas
// cores do site: verde só para o que é obviamente bom (validado), vermelho
// para pendências, preto para vencida e cinza para o que ainda não foi feito.
const ESTILO_VALIDACAO = {
  validado: {
    titulo: "Validado por veterinário",
    explicacao: (nome) =>
      `Um veterinário já conferiu os exames e os critérios de doação de ${nome}. No hospital, basta uma checagem rápida (exame físico e um exame de sangue simples) e a coleta pode acontecer no mesmo dia.`,
    selo: "bg-emerald-700 text-white",
  },
  pendencias: {
    titulo: "Validação com pendências",
    explicacao: (nome) =>
      `Um veterinário conferiu os critérios de ${nome} e alguns itens abaixo ainda não foram atendidos. Eles precisarão ser verificados no hospital antes de uma coleta.`,
    selo: "bg-[#9e0a24] text-white",
  },
  vencida: {
    titulo: "Validação vencida",
    explicacao: (nome) =>
      `A validação vale por 1 ano, porque os testes para doenças transmitidas pelo sangue precisam ser refeitos anualmente. ${nome} pode doar normalmente, mas esses exames serão refeitos no hospital antes da coleta.`,
    selo: "bg-[#1a1c1c] text-white",
  },
  pendente: {
    titulo: "Ainda não validado",
    explicacao: (nome) =>
      `${nome} pode doar normalmente — só ainda não teve os exames conferidos por um veterinário aqui. Antes da coleta, o hospital fará os exames de triagem: os testes de doenças costumam levar alguns dias, e o sangue só pode ser usado depois dos resultados.`,
    selo: "bg-[#5f5e5e] text-white",
  },
};

// Botão do veterinário em cada status, na faixa vermelha do painel: validar
// o que nunca foi validado ou venceu fica em destaque (branco cheio); revisar
// o que vale fica discreto (branco translúcido, como editar e excluir no
// cabeçalho do cartão). No celular, o texto curto cabe na mesma linha do
// título; o leitor de tela ouve sempre o texto inteiro.
const ACAO_VALIDACAO = {
  pendente: { texto: "Validar doador", curto: "Validar", variante: "claro" },
  vencida: { texto: "Renovar validação", curto: "Renovar", variante: "claro" },
  pendencias: {
    texto: "Revisar validação",
    curto: "Revisar",
    variante: "sobreVermelho",
  },
  validado: {
    texto: "Revisar validação",
    curto: "Revisar",
    variante: "sobreVermelho",
  },
};

// Um critério do checklist, numa caixa. Sem validação, só o nome; com ela,
// caixa verde-clara com ✓ quando atendido e caixa vermelha cheia com ✕
// quando não (ver estiloCriterio.js).
function ItemCriterio({ criterio, validacao }) {
  // O que vale hoje: o critério que perdeu o efeito depois da assinatura (o
  // peso mudou, um exame conferido foi apagado) não conta (F21).
  const atendido = validacao && criteriosEmVigor(validacao)[criterio.chave];
  const estilo =
    ESTILO_CRITERIO[
      !validacao ? "semValidacao" : atendido ? "atendido" : "naoAtendido"
    ];

  return (
    <li
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${estilo.caixa}`}
    >
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[18px] shrink-0 ${estilo.corIcone}`}
      >
        {estilo.icone}
      </span>
      <span>
        {criterio.rotulo}
        {validacao && (
          <span className="sr-only">
            : {atendido ? "atendido" : "não atendido"}
          </span>
        )}
      </span>
    </li>
  );
}

function PainelValidacao({
  nomeAnimal,
  validacao,
  totalValidacoes,
  podeValidar,
  ehDono,
  onValidar,
  onVerHistorico,
}) {
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);
  const status = statusValidacao(validacao);
  const estilo = ESTILO_VALIDACAO[status];
  const acao = ACAO_VALIDACAO[status];

  return (
    <PainelSecao
      titulo="Validação veterinária"
      ajuda={
        <BotaoAjuda
          rotulo="Como funciona a validação?"
          onClick={() => setExplicacaoAberta(true)}
          claro
        />
      }
      acao={
        podeValidar && (
          <Botao
            variante={acao.variante}
            tamanho="xs"
            icone="fact_check"
            aria-label={acao.texto}
            onClick={onValidar}
          >
            <span className="sm:hidden">{acao.curto}</span>
            <span className="hidden sm:inline">{acao.texto}</span>
          </Botao>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-bold ${estilo.selo}`}
        >
          {estilo.titulo}
        </span>
        {validacao && (
          <div className="text-xs text-[#5f5e5e] leading-snug">
            <p>
              {validacao.veterinarioNome}, CRMV {validacao.crmv}
            </p>
            <p>
              Em {formatarData(validacao.realizadaEm)},{" "}
              {status === "vencida" ? "venceu em" : "válida até"}{" "}
              {formatarData(validaAte(validacao))}
            </p>
          </div>
        )}
      </div>

      <p className="text-sm text-[#5b403f] leading-relaxed">
        {estilo.explicacao(nomeAnimal)}
      </p>

      {/* F21: o tutor mudou um dado que a validação conferiu, ou apagou um
          exame que ela conferiu. O registro assinado continua igual; só
          aquele critério perde o efeito, até um veterinário conferir de
          novo. */}
      {status !== "vencida" && avisoSemEfeito(validacao, nomeAnimal) && (
        <p className="text-xs font-semibold text-[#9e0a24] leading-relaxed">
          {avisoSemEfeito(validacao, nomeAnimal)}
        </p>
      )}

      <ul
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${
          status === "vencida" ? "opacity-60" : ""
        }`}
      >
        {CRITERIOS_DOACAO.map((c) => (
          <ItemCriterio key={c.chave} criterio={c} validacao={validacao} />
        ))}
      </ul>

      {validacao?.nota && (
        <p className="text-xs text-[#5b403f] leading-relaxed">
          <strong className="text-[#1a1c1c]">Nota do veterinário:</strong>{" "}
          {validacao.nota}
        </p>
      )}

      {ehDono && !podeValidar && status !== "validado" && (
        <p className="text-xs text-[#5b403f] leading-relaxed">
          Enviar os exames na seção abaixo ajuda um veterinário a validar{" "}
          {nomeAnimal} — e deixa a doação mais rápida quando alguém precisar.
        </p>
      )}

      {validacao && (
        <button
          type="button"
          onClick={onVerHistorico}
          className="self-start text-xs font-semibold text-[#9e0a24] hover:underline underline-offset-2"
        >
          {totalValidacoes > 1
            ? `Ver histórico de validações (${totalValidacoes})`
            : "Ver histórico de validações"}
        </button>
      )}

      {explicacaoAberta && (
        <ModalComoFuncionaValidacao
          onFechar={() => setExplicacaoAberta(false)}
        />
      )}
    </PainelSecao>
  );
}

export default PainelValidacao;
