import { useState } from "react";
import Botao from "../../components/Botao";
import BotaoAjuda from "../../components/BotaoAjuda";
import ModalCriteriosDoacao from "../../components/ModalCriteriosDoacao";
import PainelSecao from "./PainelSecao";
import { REFERENCIA_DOADOR, pesoMinimo } from "../../regras/doacao";
import { MAXIMO_FOTOS } from "../../regras/fotos";

// O que aparece embaixo do carrossel quando o cartão de cadastrar está no
// centro dele: no mesmo desenho do cartão completo de um animal (o cabeçalho
// vermelho e os painéis), o que o cadastro pede e o ideal para doar, para a
// pessoa chegar preparada. O botão do cabeçalho abre o cadastro.

const O_QUE_PREENCHER = [
  { icone: "pets", texto: "Nome, espécie e sexo" },
  { icone: "content_cut", texto: "Raça (ou SRD) e se é castrado" },
  { icone: "cake", texto: "Data de nascimento ou idade aproximada" },
  { icone: "monitor_weight", texto: "Peso" },
  { icone: "photo_camera", texto: `Até ${MAXIMO_FOTOS} fotos, se quiser` },
];

const { CAO, GATO } = REFERENCIA_DOADOR;

// Uma célula da faixa de critérios, como a faixa de dados do animal.
function Criterio({ rotulo, valor }) {
  return (
    <div className="bg-[#fdecee] px-4 py-3.5 min-w-0">
      <p className="text-xs font-semibold text-[#5b403f]">{rotulo}</p>
      <p className="mt-0.5 text-xl font-extrabold tracking-tight tabular-nums text-[#1a1c1c]">
        {valor}
      </p>
    </div>
  );
}

function PainelNovoAnimal({ onCadastrar }) {
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);

  return (
    <article
      aria-label="Cadastrar um novo animal"
      className="bg-white rounded-2xl border border-[#eadede] overflow-hidden"
    >
      <header className="bg-[#9e0a24] text-white px-5 py-4 md:px-8 md:py-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h3 className="font-extrabold text-[1.75rem] leading-none tracking-tight">
            Novo animal
          </h3>
          <p className="mt-2 text-sm text-white/85">
            Depois de cadastrado, ele aparece na busca para quem precisa de um
            doador.
          </p>
        </div>
        <Botao variante="tonal" icone="add" onClick={onCadastrar}>
          Cadastrar animal
        </Botao>
      </header>

      <div className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PainelSecao titulo="O que você vai preencher" nivel="h4">
          <ul className="flex flex-col gap-3">
            {O_QUE_PREENCHER.map((item) => (
              <li
                key={item.texto}
                className="flex items-center gap-3 text-sm text-[#1a1c1c]"
              >
                <span
                  aria-hidden="true"
                  className="w-8 h-8 shrink-0 rounded-lg bg-[#fdecee] text-[#9e0a24] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.icone}
                  </span>
                </span>
                {item.texto}
              </li>
            ))}
          </ul>
        </PainelSecao>

        <PainelSecao
          titulo="O ideal para doar"
          nivel="h4"
          ajuda={
            <BotaoAjuda
              rotulo="Como funcionam os critérios de doação?"
              onClick={() => setExplicacaoAberta(true)}
              claro
            />
          }
        >
          {/* As divisões são o fundo branco nos vãos de 2px, como na faixa
              de dados do animal. */}
          <div className="grid grid-cols-2 gap-[2px] bg-white rounded-xl overflow-hidden">
            <Criterio rotulo="Cães" valor={`${pesoMinimo(CAO)} ou mais`} />
            <Criterio rotulo="Gatos" valor={`${pesoMinimo(GATO)} ou mais`} />
            <div className="col-span-2">
              <Criterio
                rotulo="Idade ideal"
                valor={`${CAO.idadeMin} a ${CAO.idadeMax} anos`}
              />
            </div>
          </div>
          <p className="text-xs text-[#5b403f] leading-relaxed">
            <strong className="font-semibold text-[#1a1c1c]">
              Seu pet não atende a tudo isso? Cadastre mesmo assim.
            </strong>{" "}
            Em uma emergência, ele ainda pode ser chamado para doar e ajudar a
            salvar uma vida. Quanto mais critérios atende, maior a chance. O
            veterinário avalia o caso e explica os riscos, e a decisão de doar é
            sua.
          </p>
        </PainelSecao>
      </div>

      {explicacaoAberta && (
        <ModalCriteriosDoacao onFechar={() => setExplicacaoAberta(false)} />
      )}
    </article>
  );
}

export default PainelNovoAnimal;
