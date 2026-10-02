import { useState } from "react";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import ModalComoFuncionaValidacao from "../../components/ModalComoFuncionaValidacao";
import {
  CRITERIOS_DOACAO,
  statusValidacao,
  validaAte,
} from "../../regras/doacao";
import { formatarData } from "../../util/datas";

// Painel da validação veterinária no cartão do animal: o status, quem assinou,
// até quando vale e o checklist dos critérios. O veterinário valida ou revisa
// por aqui; o tutor vê o resultado e o que fazer para chegar lá.

// A explicação diz o que o status muda na prática, no dia da coleta: é isso
// que um tutor leigo precisa saber para decidir, não o termo técnico.
const ESTILO_VALIDACAO = {
  validado: {
    titulo: "Validado por veterinário",
    explicacao: (nome) =>
      `Um veterinário já conferiu os exames e os critérios de doação de ${nome}. No hospital, basta uma checagem rápida (exame físico e um exame de sangue simples) e a coleta pode acontecer no mesmo dia.`,
    icone: "verified_user",
    caixa: "border-emerald-200 bg-emerald-50/40",
    circulo: "bg-emerald-600",
    cor: "text-emerald-900",
  },
  pendencias: {
    titulo: "Validação com pendências",
    explicacao: (nome) =>
      `Um veterinário conferiu os critérios de ${nome} e alguns itens abaixo ainda não foram atendidos. Eles precisarão ser verificados no hospital antes de uma coleta.`,
    icone: "rule",
    caixa: "border-amber-200 bg-amber-50/40",
    circulo: "bg-amber-500",
    cor: "text-amber-900",
  },
  vencida: {
    titulo: "Validação vencida",
    explicacao: (nome) =>
      `A validação vale por 1 ano, porque os testes para doenças transmitidas pelo sangue precisam ser refeitos anualmente. ${nome} pode doar normalmente, mas esses exames serão refeitos no hospital antes da coleta.`,
    icone: "update",
    caixa: "border-orange-200 bg-orange-50/40",
    circulo: "bg-orange-500",
    cor: "text-orange-900",
  },
  pendente: {
    titulo: "Ainda não validado",
    explicacao: (nome) =>
      `${nome} pode doar normalmente — só ainda não teve os exames conferidos por um veterinário aqui. Antes da coleta, o hospital fará os exames de triagem: os testes de doenças costumam levar alguns dias, e o sangue só pode ser usado depois dos resultados.`,
    icone: "schedule",
    caixa: "border-[#f0e6e6] bg-[#fafafa]",
    circulo: "bg-[#8f6f6e]",
    cor: "text-[#1a1c1c]",
  },
};

// Botão do veterinário em cada status: validar o que nunca foi validado ou
// venceu fica em destaque; revisar o que vale fica discreto.
const ACAO_VALIDACAO = {
  pendente: { texto: "Validar doador", variante: "primario" },
  vencida: { texto: "Renovar validação", variante: "primario" },
  pendencias: { texto: "Revisar validação", variante: "secundario" },
  validado: { texto: "Revisar validação", variante: "secundario" },
};

// Um critério do checklist. Sem validação, o círculo fica vazio; com ela,
// verde quando atendido e âmbar quando não.
function ItemCriterio({ criterio, validacao }) {
  const atendido = validacao?.criterios[criterio.chave];
  const icone = !validacao
    ? "radio_button_unchecked"
    : atendido
      ? "check_circle"
      : "remove_circle";
  const cor = !validacao
    ? "text-[#c9a5a5]"
    : atendido
      ? "text-emerald-600"
      : "text-amber-600";

  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[18px] ${cor}`}
      >
        {icone}
      </span>
      <span
        className={validacao && !atendido ? "text-amber-900" : "text-[#1a1c1c]"}
      >
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
    <div
      className={`border rounded-xl p-5 flex flex-col gap-4 ${estilo.caixa}`}
    >
      {/* Botão fixo no canto superior direito: o texto ao lado encolhe e
          quebra linha, mas nunca empurra o botão para baixo. */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            aria-hidden="true"
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${estilo.circulo}`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {estilo.icone}
            </span>
          </span>
          <div className="min-w-0">
            <p
              className={`flex items-center gap-2 font-bold text-sm ${estilo.cor}`}
            >
              {estilo.titulo}
              <BotaoAjuda
                rotulo="Como funciona a validação?"
                onClick={() => setExplicacaoAberta(true)}
              />
            </p>
            {validacao && (
              <div className="text-xs text-[#5f5e5e] mt-0.5 space-y-0.5">
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
        </div>

        {podeValidar && (
          <Botao
            variante={acao.variante}
            tamanho="sm"
            icone="fact_check"
            onClick={onValidar}
            className="self-start"
          >
            {acao.texto}
          </Botao>
        )}
      </div>

      <p className="text-sm text-[#5b403f] leading-relaxed">
        {estilo.explicacao(nomeAnimal)}
      </p>

      <ul
        className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 ${
          status === "vencida" ? "opacity-60" : ""
        }`}
      >
        {CRITERIOS_DOACAO.map((c) => (
          <ItemCriterio key={c.chave} criterio={c} validacao={validacao} />
        ))}
      </ul>

      {validacao?.nota && (
        <p className="text-xs text-[#5b403f] bg-white/70 border border-[#f0e6e6] rounded-lg px-3 py-2 leading-relaxed">
          <strong className="text-[#1a1c1c]">Nota do veterinário:</strong>{" "}
          {validacao.nota}
        </p>
      )}

      {ehDono && !podeValidar && status !== "validado" && (
        <p className="flex items-start gap-2 text-xs text-[#5b403f] bg-white/70 border border-[#f0e6e6] rounded-lg px-3 py-2 leading-relaxed">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px] text-[#8e001b] shrink-0"
          >
            lightbulb
          </span>
          <span>
            Enviar os exames na seção abaixo ajuda um veterinário a validar{" "}
            {nomeAnimal} — e deixa a doação mais rápida quando alguém precisar.
          </span>
        </p>
      )}

      {validacao && (
        <button
          type="button"
          onClick={onVerHistorico}
          className="self-start text-xs font-semibold text-[#8e001b] hover:underline underline-offset-2"
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
    </div>
  );
}

export default PainelValidacao;
