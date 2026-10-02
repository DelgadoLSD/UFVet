import Ajuda from "../../components/Ajuda";
import Segmentado from "../../components/Segmentado";
import Selecao from "../../components/Selecao";
import { LIMITES_PESO } from "./filtros";
import { ESPECIES, TIPOS_SANGUINEOS } from "../../regras/doacao";

// Barra lateral de filtros da busca. Não guarda estado: recebe os filtros
// atuais e avisa a página do que mudou, por `onFiltrar({ campo: valor })`.

const OPCOES_ESPECIE = Object.entries(ESPECIES).map(([valor, e]) => ({
  valor,
  rotulo: e.rotulo,
}));

// Botão em pílula que liga e desliga (tipos sanguíneos).
function Pilula({ ativa, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativa}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${ativa ? "bg-[#8e001b] border-[#8e001b] text-white" : "bg-white border-[#e2d6d6] text-[#1a1c1c] hover:border-[#8e001b] hover:text-[#8e001b]"}`}
    >
      {children}
    </button>
  );
}

function FiltroApenasValidados({ ativo, onMudar }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#fdecee] rounded-xl mb-7">
      <div className="flex items-center gap-2">
        <label
          className="text-sm font-semibold text-[#1a1c1c] flex items-center gap-2 cursor-pointer"
          htmlFor="apenas-validados"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[18px] text-[#8e001b]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          Apenas validados
        </label>
        <Ajuda titulo="Apenas validados">
          <p>
            Mostra só doadores com exames já conferidos por um veterinário, que
            costumam ter a coleta mais rápida.
          </p>
          <p>
            Desligado, você vê todos: doadores ainda não validados também podem
            doar, com os exames feitos no hospital.
          </p>
        </Ajuda>
      </div>
      <button
        id="apenas-validados"
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onMudar(!ativo)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${ativo ? "bg-[#8e001b]" : "bg-[#d0d0d0]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${ativo ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function FiltrosBusca({ filtros, cidades, bairros, onFiltrar, onLimpar }) {
  const { especie, tipos, pesoMax, cidade, bairro } = filtros;
  const limites = LIMITES_PESO[especie];

  const alternarTipo = (tipo) =>
    onFiltrar({
      tipos: tipos.includes(tipo)
        ? tipos.filter((t) => t !== tipo)
        : [...tipos, tipo],
    });

  return (
    <aside className="w-full md:w-72 xl:w-80 shrink-0">
      <div className="bg-white border border-[#eadede] p-6 rounded-2xl md:sticky md:top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1a1c1c]">Filtros</h2>
          <button
            type="button"
            onClick={onLimpar}
            className="text-[#8e001b] text-sm font-semibold hover:underline"
          >
            Limpar
          </button>
        </div>

        <FiltroApenasValidados
          ativo={filtros.apenasValidados}
          onMudar={(apenasValidados) => onFiltrar({ apenasValidados })}
        />

        <div className="mb-7">
          <h3 className="text-sm font-semibold mb-3">Espécie</h3>
          {/* Trocar de espécie zera os tipos (são outros) e devolve o peso
              ao máximo da nova espécie. */}
          <Segmentado
            rotulo="Espécie"
            opcoes={OPCOES_ESPECIE}
            valor={especie}
            onEscolher={(nova) =>
              onFiltrar({
                especie: nova,
                tipos: [],
                pesoMax: LIMITES_PESO[nova].max,
              })
            }
          />
        </div>

        <div className="mb-7">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-sm font-semibold">Tipo sanguíneo</h3>
            <Ajuda titulo="Qual tipo escolher?">
              {especie === "CAO" ? (
                <p>
                  Selecione o tipo do cão que vai receber o sangue, se você
                  souber. Doadores DEA 1.1 negativo (DEA 1.1- e Universal) podem
                  doar para a maioria dos cães.
                </p>
              ) : (
                <p>
                  Gatos precisam receber sangue de um tipo compatível. Selecione
                  o tipo do gato que vai receber o sangue — o hospital sempre
                  confirma a compatibilidade.
                </p>
              )}
              <p>
                Filtrar por tipo esconde os doadores sem tipagem confirmada: o
                tipo deles só é conhecido depois do exame, feito no hospital.
              </p>
            </Ajuda>
          </div>
          <p className="text-[11px] text-[#5f5e5e] mb-3">
            {especie === "CAO"
              ? "Classificação DEA para cães"
              : "Classificação AB para gatos"}
          </p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_SANGUINEOS[especie].map((tipo) => (
              <Pilula
                key={tipo}
                ativa={tipos.includes(tipo)}
                onClick={() => alternarTipo(tipo)}
              >
                {tipo}
              </Pilula>
            ))}
          </div>
        </div>

        <div className="mb-7">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Peso máximo</h3>
            <span className="text-xs font-bold text-[#8e001b] bg-[#fdecee] px-2 py-0.5 rounded-full">
              até {pesoMax} kg
            </span>
          </div>
          <input
            type="range"
            aria-label="Peso máximo"
            min={limites.min}
            max={limites.max}
            value={pesoMax}
            onChange={(e) => onFiltrar({ pesoMax: Number(e.target.value) })}
            className="w-full h-2 bg-[#e2e2e2] rounded-lg appearance-none cursor-pointer accent-[#8e001b]"
          />
          <div className="flex justify-between text-[11px] text-[#5f5e5e] mt-1">
            <span>{limites.min} kg</span>
            <span>{limites.max} kg</span>
          </div>
        </div>

        {/* Onde o doador mora. Quem conhece a cidade sabe o que é perto do
            hospital melhor do que um raio em quilômetros, e ninguém precisa
            entregar o endereço exato de casa. */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Localização</h3>
          <div className="mb-3">
            <Selecao
              rotulo="Cidade"
              valor={cidade}
              onEscolher={(valor) => onFiltrar({ cidade: valor, bairro: "" })}
              placeholder="Todas as cidades"
              icone="location_city"
              opcoes={cidades.map((c) => ({
                valor: c,
                rotulo: c,
                icone: "location_city",
              }))}
            />
          </div>

          {cidade ? (
            <Selecao
              rotulo="Bairro"
              valor={bairro}
              onEscolher={(valor) => onFiltrar({ bairro: valor })}
              placeholder="Todos os bairros"
              icone="home_pin"
              opcoes={bairros.map((b) => ({
                valor: b,
                rotulo: b,
                icone: "home_pin",
              }))}
            />
          ) : (
            <p className="text-[11px] text-[#8f6f6e] leading-relaxed">
              Escolha a cidade para filtrar por bairro.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default FiltrosBusca;
