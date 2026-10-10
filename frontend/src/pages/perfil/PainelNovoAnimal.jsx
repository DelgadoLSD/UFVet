import Botao from "../../components/Botao";
import PainelSecao from "./PainelSecao";
import { REFERENCIA_DOADOR } from "../../regras/doacao";
import { MAXIMO_FOTOS } from "../../regras/fotos";

// O que aparece embaixo do carrossel quando o cartão de cadastrar está no
// centro dele: no mesmo desenho do cartão completo de um animal (o cabeçalho
// vermelho e os painéis), o que o cadastro pede e quem pode doar, para a
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
        <Botao variante="claro" icone="add" onClick={onCadastrar}>
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

        <PainelSecao titulo="Quem pode doar" nivel="h4">
          {/* As divisões são o fundo branco nos vãos de 2px, como na faixa
              de dados do animal. */}
          <div className="grid grid-cols-2 gap-[2px] bg-white rounded-xl overflow-hidden">
            <Criterio rotulo="Cães" valor={`${CAO.pesoMin} kg ou mais`} />
            <Criterio rotulo="Gatos" valor={`${GATO.pesoMin} kg ou mais`} />
            <div className="col-span-2">
              <Criterio
                rotulo="Idade ideal"
                valor={`${CAO.idadeMin} a ${CAO.idadeMax} anos`}
              />
            </div>
          </div>
          <p className="text-xs text-[#5f5e5e] leading-relaxed">
            Dá para cadastrar mesmo fora disso: um veterinário confere os
            critérios na validação.
          </p>
        </PainelSecao>
      </div>
    </article>
  );
}

export default PainelNovoAnimal;
