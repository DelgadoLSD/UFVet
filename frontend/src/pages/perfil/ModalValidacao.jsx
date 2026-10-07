import { useState } from "react";
import Modal from "../../components/Modal";
import Botao from "../../components/Botao";
import { useSessao } from "../../servicos/sessao";
import {
  CRITERIOS_DOACAO,
  ESPECIES,
  REFERENCIA_DOADOR,
  TIPOS_SANGUINEOS,
  statusValidacao,
  todosCriterios,
} from "../../regras/doacao";
import { hojeISO, idadeEmAnos, textoIdade } from "../../util/datas";
import { formatarPeso, nomeProfissional } from "../../util/texto";

// O veterinário marca os critérios de doação que conferiu e assina. Uma
// validação assinada nunca é editada: revisar cria uma validação nova, e a
// anterior fica no histórico como substituída.

// Um critério do checklist, marcado ou não.
function OpcaoCriterio({ criterio, referencia, marcado, onAlternar }) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-pressed={marcado}
      className={`flex items-start gap-3 text-left rounded-xl border p-3 transition-colors ${
        marcado
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-[#e4bebc] hover:border-[#8e001b]/50"
      }`}
    >
      <span
        aria-hidden="true"
        className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          marcado
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "border-[#c9a5a5] bg-white"
        }`}
      >
        {marcado && (
          <span className="material-symbols-outlined text-[14px]">check</span>
        )}
      </span>
      <span>
        <span className="block text-sm font-semibold text-[#1a1c1c]">
          {criterio.rotulo}
        </span>
        <span className="block text-xs text-[#5f5e5e] mt-0.5">
          {criterio.descricao(referencia)}
        </span>
      </span>
    </button>
  );
}

// `animal` traz o tipo sanguíneo e a validação atuais; `onSalvar` recebe a
// validação nova, com os campos da tabela validacao do banco.
function ModalValidacao({ animal, validacao, onSalvar, onFechar }) {
  const usuario = useSessao();
  const referencia = REFERENCIA_DOADOR[animal.especie];
  // Validação vencida começa zerada: renovar exige reconferir, não só
  // confirmar.
  const aproveitarAnterior =
    !!validacao && statusValidacao(validacao) !== "vencida";
  const [criterios, setCriterios] = useState(() =>
    aproveitarAnterior ? { ...validacao.criterios } : todosCriterios(false),
  );
  const [nota, setNota] = useState(aproveitarAnterior ? validacao.nota : "");
  // O perfil só ganha tipo sanguíneo aqui: marcar a tipagem obriga a dizer
  // qual foi o resultado, e é esse valor que passa a aparecer na busca.
  const [tipo, setTipo] = useState(animal.tipoSanguineo);

  const marcados = CRITERIOS_DOACAO.filter((c) => criterios[c.chave]).length;
  const completa = marcados === CRITERIOS_DOACAO.length;
  // Tipagem conferida sem dizer o resultado deixaria o perfil com um selo e
  // nenhum tipo, o contrário do que a validação serve para resolver.
  const faltaTipo = criterios.TIPAGEM && !tipo;

  const alternar = (chave) =>
    setCriterios((prev) => ({ ...prev, [chave]: !prev[chave] }));

  const salvar = () =>
    onSalvar({
      criterios,
      // Sem a tipagem conferida, a validação não confirma tipo nenhum.
      tipoSanguineoConfirmado: criterios.TIPAGEM ? tipo : null,
      nota: nota.trim(),
      veterinarioNome: nomeProfissional(usuario),
      crmv: usuario.crmv,
      realizadaEm: hojeISO(),
    });

  return (
    <Modal
      titulo={`Validar doador — ${animal.nome}`}
      subtitulo={[
        ESPECIES[animal.especie].rotulo,
        animal.tipoSanguineo || "sem tipagem",
        formatarPeso(animal.pesoKg),
        textoIdade(
          idadeEmAnos(animal.dataNascimento),
          animal.nascimentoAproximado,
        ).toLowerCase(),
      ].join(", ")}
      onFechar={onFechar}
      rodape={
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-[#5f5e5e] leading-snug">
            Assinado por{" "}
            <strong className="text-[#1a1c1c]">
              {nomeProfissional(usuario)}
            </strong>
            , CRMV {usuario.crmv}
          </p>
          <div className="flex gap-2">
            <Botao variante="secundario" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao icone="check" disabled={faltaTipo} onClick={salvar}>
              Confirmar validação
            </Botao>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-[#5b403f] leading-relaxed">
          Marque os critérios que você conferiu — no prontuário do hospital ou
          presencialmente. A validação fica visível aos tutores, assinada com
          seu CRMV, e vale por 1 ano.
        </p>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-bold ${completa ? "text-emerald-700" : "text-amber-700"}`}
          >
            {completa
              ? "Todos os critérios conferidos"
              : `${marcados} de ${CRITERIOS_DOACAO.length} critérios — ficará com pendências`}
          </span>
          <button
            type="button"
            onClick={() => setCriterios(todosCriterios(!completa))}
            className="text-xs font-semibold text-[#8e001b] hover:underline underline-offset-2"
          >
            {completa ? "Desmarcar todos" : "Marcar todos"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {CRITERIOS_DOACAO.map((c) => (
            <OpcaoCriterio
              key={c.chave}
              criterio={c}
              referencia={referencia}
              marcado={criterios[c.chave]}
              onAlternar={() => alternar(c.chave)}
            />
          ))}
        </div>

        {criterios.TIPAGEM && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-[#1a1c1c]">
              Qual tipo o exame mostrou?
            </p>
            <p className="text-xs text-[#5f5e5e] mt-0.5">
              {animal.tipoSanguineo
                ? `Hoje o perfil mostra ${animal.tipoSanguineo}. O que você marcar aqui passa a valer.`
                : `${animal.nome} ainda não tem tipo registrado. É você quem assina esse dado.`}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {TIPOS_SANGUINEOS[animal.especie].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  aria-pressed={tipo === t}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    tipo === t
                      ? "bg-[#8e001b] text-white border-[#8e001b]"
                      : "bg-white text-[#1a1c1c] border-[#d8cfcf] hover:border-[#8e001b]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {faltaTipo ? (
              <p className="text-xs text-amber-700 font-semibold mt-3">
                Escolha o tipo para poder confirmar a validação.
              </p>
            ) : (
              tipo !== animal.tipoSanguineo && (
                <p className="text-xs text-[#8e001b] font-semibold mt-3">
                  O perfil passa a mostrar {tipo}, com sua assinatura.
                </p>
              )
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="nota-validacao"
            className="block text-sm font-semibold text-[#1a1c1c] mb-1.5"
          >
            Nota (opcional)
          </label>
          <textarea
            id="nota-validacao"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            placeholder="Ex.: sorologia de Leishmania ainda não apresentada."
            className="w-full bg-white text-gray-900 [color-scheme:light] border border-[#e4bebc] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8e001b]"
          />
        </div>
      </div>
    </Modal>
  );
}

export default ModalValidacao;
