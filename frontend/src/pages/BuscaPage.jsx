import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// ─── Dados mockados ───────────────────────────────────────────────────────────
const DOADORES_MOCK = [
  // Cães
  {
    id: 1,
    nome: "Thor",
    especie: "cao",
    raca: "Golden Retriever",
    idade: 4,
    tipo: "DEA 1.1+",
    peso: 32,
    distancia: 2.4,
    bairro: "Centro",
    status: "disponivel",
    validado: true,
  },
  {
    id: 2,
    nome: "Luna",
    especie: "cao",
    raca: "Labrador",
    idade: 3,
    tipo: "DEA 4",
    peso: 28,
    distancia: 5.8,
    bairro: "Santa Clara",
    status: "disponivel",
    validado: true,
  },
  {
    id: 3,
    nome: "Max",
    especie: "cao",
    raca: "Beagle",
    idade: 5,
    tipo: "DEA 7",
    peso: 16,
    distancia: 8.1,
    bairro: "Ramos",
    status: "indisponivel",
    validado: false,
  },
  {
    id: 4,
    nome: "Barão",
    especie: "cao",
    raca: "Bernese",
    idade: 6,
    tipo: "DEA 1.1 Universal",
    peso: 45,
    distancia: 1.2,
    bairro: "Nova Viçosa",
    status: "disponivel",
    validado: true,
  },
  {
    id: 5,
    nome: "Rex",
    especie: "cao",
    raca: "Pastor Alemão",
    idade: 2,
    tipo: "DEA 1.1-",
    peso: 38,
    distancia: 12.4,
    bairro: "Belvedere",
    status: "disponivel",
    validado: true,
  },
  {
    id: 6,
    nome: "Maya",
    especie: "cao",
    raca: "Border Collie",
    idade: 3,
    tipo: "DEA 1.1+",
    peso: 22,
    distancia: 0.8,
    bairro: "Centro",
    status: "disponivel",
    validado: true,
  },
  {
    id: 7,
    nome: "Bolt",
    especie: "cao",
    raca: "Dálmata",
    idade: 4,
    tipo: "DEA 1.1 Universal",
    peso: 30,
    distancia: 3.5,
    bairro: "Inconfidência",
    status: "disponivel",
    validado: false,
  },
  {
    id: 8,
    nome: "Hera",
    especie: "cao",
    raca: "Rottweiler",
    idade: 3,
    tipo: "DEA 1.1+",
    peso: 42,
    distancia: 6.1,
    bairro: "São Sebastião",
    status: "disponivel",
    validado: true,
  },
  // Gatos
  {
    id: 9,
    nome: "Mia",
    especie: "gato",
    raca: "SRD",
    idade: 3,
    tipo: "Tipo A",
    peso: 4.2,
    distancia: 1.5,
    bairro: "Centro",
    status: "disponivel",
    validado: true,
  },
  {
    id: 10,
    nome: "Simba",
    especie: "gato",
    raca: "Maine Coon",
    idade: 4,
    tipo: "Tipo B",
    peso: 6.1,
    distancia: 3.2,
    bairro: "Nova Viçosa",
    status: "disponivel",
    validado: true,
  },
  {
    id: 11,
    nome: "Nala",
    especie: "gato",
    raca: "Persa",
    idade: 2,
    tipo: "Tipo AB",
    peso: 4.8,
    distancia: 7.4,
    bairro: "Ramos",
    status: "indisponivel",
    validado: false,
  },
  {
    id: 12,
    nome: "Gizmo",
    especie: "gato",
    raca: "SRD",
    idade: 5,
    tipo: "Tipo A",
    peso: 5.3,
    distancia: 2.1,
    bairro: "Santa Clara",
    status: "disponivel",
    validado: true,
  },
];

const TIPOS_SANGUINEOS = {
  cao: ["DEA 1.1 Universal", "DEA 1.1+", "DEA 1.1-", "DEA 4", "DEA 7"],
  gato: ["Tipo A", "Tipo B", "Tipo AB"],
};

const PESO_MIN = { cao: 10, gato: 2 };
const PESO_MAX = { cao: 60, gato: 10 };

// ─── Avatar ───────────────────────────────────────────────────────────────────
function AvatarPet({ especie }) {
  return (
    <div
      className={`w-20 h-20 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${
        especie === "gato" ? "bg-blue-100" : "bg-[#ffdad8]"
      }`}
    >
      <span
        className={`material-symbols-outlined text-4xl ${
          especie === "gato" ? "text-blue-400" : "text-[#8e001b]"
        }`}
      >
        pets
      </span>
    </div>
  );
}

// ─── Card de doador ───────────────────────────────────────────────────────────
function DonorCard({ doador, onClick }) {
  const disponivel = doador.status === "disponivel";

  return (
    <div
      className={`bg-white border border-[#e4bebc] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${!disponivel ? "opacity-80 grayscale-[0.2]" : ""}`}
    >
      <div className="p-6 flex flex-col gap-3">
        {/* Topo: avatar + badges */}
        <div className="flex items-start justify-between">
          <div className="relative">
            <AvatarPet especie={doador.especie} />
            <div
              className={`absolute bottom-0 right-0 w-5 h-5 border-2 border-white rounded-full ${disponivel ? "bg-green-500" : "bg-gray-400"}`}
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            {doador.validado ? (
              <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                <span
                  className="material-symbols-outlined text-[13px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
                Validado
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 h-fit mt-0.5">
                <span className="material-symbols-outlined text-[11px]">
                  schedule
                </span>
                Pendente
              </span>
            )}
            {/* Localização: bairro + distância */}
            <span className="text-[#5f5e5e] text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">
                location_on
              </span>
              {doador.bairro}
              {doador.distancia ? ` • ${doador.distancia} km` : ""}
            </span>
          </div>
        </div>

        {/* Nome, raça e idade */}
        <div>
          <h3 className="text-xl font-bold text-[#1a1c1c]">{doador.nome}</h3>
          <p className="text-[#5f5e5e] text-sm">
            {doador.raca} • {doador.idade} anos
          </p>
        </div>

        {/* Tags clínicas */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#8e001b]">
            <span className="material-symbols-outlined text-[#8e001b] text-[15px]">
              bloodtype
            </span>
            <span className="text-sm font-bold text-[#8e001b] whitespace-nowrap">
              {doador.tipo}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3f3f3] border border-[#e4bebc]">
            <span className="material-symbols-outlined text-[#5f5e5e] text-[15px]">
              monitor_weight
            </span>
            <span className="text-sm font-bold text-[#1a1c1c] whitespace-nowrap">
              {doador.peso}kg
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-auto p-4 border-t border-[#e4bebc] flex items-center justify-between bg-[#f3f3f3] min-h-[72px]">
        {disponivel ? (
          <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            Disponível
          </span>
        ) : (
          <span className="text-[#5f5e5e] text-sm font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Ocupado
          </span>
        )}
        <button
          onClick={() => disponivel && onClick(doador.id)}
          disabled={!disponivel}
          className={`rounded-full text-sm font-bold px-8 py-2.5 transition-all ${disponivel ? "bg-[#8e001b] text-white hover:brightness-110 active:scale-95" : "bg-[#5f5e5e] text-white cursor-not-allowed"}`}
        >
          {disponivel ? "Ver Perfil" : "Indisponível"}
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function BuscaPage() {
  const navigate = useNavigate();

  const [apenasValidados, setApenasValidados] = useState(true);
  const [especie, setEspecie] = useState("cao");
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [pesoMax, setPesoMax] = useState(60);
  const [distanciaMax, setDistanciaMax] = useState("");
  const [ordenar, setOrdenar] = useState("validados");
  const [visiveis, setVisiveis] = useState(4);

  const handleVerPerfil = (id) => navigate(`/tutor/${id}`);

  const toggleTipo = (tipo) => {
    setTiposSelecionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  };

  const limparFiltros = () => {
    setApenasValidados(false);
    setEspecie("cao");
    setTiposSelecionados([]);
    setPesoMax(60);
    setDistanciaMax("");
    setVisiveis(4);
  };

  // Quando muda espécie, limpa tipos selecionados e reseta peso
  const handleEspecieChange = (novaEspecie) => {
    setEspecie(novaEspecie);
    setTiposSelecionados([]);
    setPesoMax(PESO_MAX[novaEspecie]);
    setVisiveis(4);
  };

  const doadoresFiltrados = DOADORES_MOCK.filter((d) => d.especie === especie)
    .filter((d) => !apenasValidados || d.validado)
    .filter(
      (d) =>
        tiposSelecionados.length === 0 || tiposSelecionados.includes(d.tipo),
    )
    .filter((d) => d.peso <= pesoMax)
    .filter((d) => !distanciaMax || d.distancia <= Number(distanciaMax))
    .sort((a, b) => {
      if (ordenar === "validados") return b.validado - a.validado;
      if (ordenar === "proximos") return a.distancia - b.distancia;
      if (ordenar === "peso") return b.peso - a.peso;
      return 0;
    });

  return (
    <>
      <Header dark={true} />
      <main className="max-w-[1536px] mx-auto flex flex-col md:flex-row gap-6 px-5 md:px-16 py-12 pt-28">
        {/* Sidebar de filtros */}
        <aside className="w-full md:w-1/4 flex flex-col gap-6">
          <div className="bg-white border border-[#e4bebc] p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#1a1c1c]">Filtros</h2>
              <button
                onClick={limparFiltros}
                className="text-[#8e001b] text-sm font-semibold hover:underline"
              >
                Limpar
              </button>
            </div>

            {/* Apenas validados */}
            <div className="flex items-center justify-between p-3 bg-[#ffdad8]/30 rounded-lg mb-8 border border-[#8e001b]/20">
              <label
                className="text-sm font-semibold text-[#1a1c1c] flex items-center gap-2"
                htmlFor="verified-toggle"
              >
                <span
                  className="material-symbols-outlined text-[18px] text-[#8e001b]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                Apenas validados
              </label>
              <input
                id="verified-toggle"
                type="checkbox"
                checked={apenasValidados}
                onChange={(e) => setApenasValidados(e.target.checked)}
                className="w-5 h-5 rounded accent-[#8e001b] cursor-pointer"
              />
            </div>

            {/* Espécie */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3">Espécie</h3>
              <div className="flex gap-2">
                {[
                  { val: "cao", label: "Cão" },
                  { val: "gato", label: "Gato" },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => handleEspecieChange(item.val)}
                    className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${especie === item.val ? "bg-[#8e001b] text-white border-[#8e001b]" : "border-[#8f6f6e] hover:bg-gray-100"}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      pets
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo Sanguíneo — muda conforme espécie */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-1">Tipo Sanguíneo</h3>
              <p className="text-[10px] text-[#5f5e5e] mb-3">
                {especie === "cao"
                  ? "Classificação DEA para cães"
                  : "Classificação AB para gatos"}
              </p>
              <div className="flex flex-wrap gap-2">
                {TIPOS_SANGUINEOS[especie].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => toggleTipo(tipo)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${tiposSelecionados.includes(tipo) ? "bg-[#8e001b] text-white" : "bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#8e001b] hover:text-white"}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Peso — slider conectado com valor dinâmico */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Peso máximo</h3>
                <span className="text-xs font-bold text-[#8e001b] bg-[#ffdad8] px-2 py-0.5 rounded-full">
                  até {pesoMax}kg
                </span>
              </div>
              <input
                type="range"
                min={PESO_MIN[especie]}
                max={PESO_MAX[especie]}
                value={pesoMax}
                onChange={(e) => setPesoMax(Number(e.target.value))}
                className="w-full h-2 bg-[#e2e2e2] rounded-lg appearance-none cursor-pointer accent-[#8e001b]"
              />
              <div className="flex justify-between text-[10px] text-[#5f5e5e] mt-1">
                <span>{PESO_MIN[especie]}kg</span>
                <span>{PESO_MAX[especie]}kg</span>
              </div>
            </div>

            {/* Distância */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Distância máxima (km)
              </h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-[#8f6f6e]">
                    distance
                  </span>
                </span>
                <input
                  type="number"
                  placeholder="Ex: 10"
                  min="0"
                  value={distanciaMax}
                  onChange={(e) => setDistanciaMax(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#e4bebc] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b]"
                />
              </div>
              {distanciaMax && (
                <p className="text-[10px] text-[#5f5e5e] mt-1">
                  Mostrando pets em até {distanciaMax}km
                </p>
              )}
            </div>
          </div>
          <div className="bg-white border border-[#e4bebc] p-5 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-[#1a1c1c] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8e001b] text-[18px]">
                info
              </span>
              O que significam os selos?
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 h-fit mt-0.5">
                  <span
                    className="material-symbols-outlined text-[11px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified_user
                  </span>
                  Validado
                </span>
                <p className="text-xs text-[#5f5e5e] leading-relaxed">
                  Os dados clínicos deste pet foram conferidos por um médico
                  veterinário cadastrado na plataforma. A triagem no hospital
                  pode ser mais ágil.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 h-fit mt-0.5">
                  <span className="material-symbols-outlined text-[11px]">
                    schedule
                  </span>
                  Pendente
                </span>
                <p className="text-xs text-[#5f5e5e] leading-relaxed">
                  O cadastro foi feito pelo tutor, mas ainda não passou por
                  revisão veterinária. A triagem completa será necessária no
                  momento da doação.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Área de resultados */}
        <section className="w-full md:w-3/4 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1c1c]">
                Doadores Encontrados
              </h1>
              <p className="text-[#5f5e5e] text-sm">
                {doadoresFiltrados.length > 0
                  ? `Mostrando ${doadoresFiltrados.length} ${doadoresFiltrados.length === 1 ? "doador disponível" : "doadores disponíveis"}`
                  : "Nenhum doador encontrado com esses filtros"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#5f5e5e] font-semibold">
                Ordenar por:
              </span>
              {[
                { val: "validados", label: "Validados primeiro" },
                { val: "proximos", label: "Mais próximos" },
                { val: "peso", label: "Maior peso" },
              ].map((op) => (
                <button
                  key={op.val}
                  onClick={() => setOrdenar(op.val)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    ordenar === op.val
                      ? "bg-[#8e001b] text-white border-[#8e001b]"
                      : "bg-white text-[#5f5e5e] border-[#e4bebc] hover:border-[#8e001b] hover:text-[#8e001b]"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid ou estado vazio */}
          {doadoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 rounded-full bg-[#ffdad8] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#8e001b] text-6xl">
                  pets
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1a1c1c] mb-2">
                Nenhum doador encontrado
              </h3>
              <p className="text-[#5f5e5e] text-sm max-w-xs leading-relaxed mb-8">
                Nenhum pet corresponde aos filtros selecionados. Tente ampliar
                sua busca.
              </p>
              <button
                onClick={limparFiltros}
                className="flex items-center gap-2 px-8 py-3 bg-[#8e001b] text-white rounded-full font-bold text-sm hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  filter_alt_off
                </span>
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doadoresFiltrados.slice(0, visiveis).map((doador) => (
                  <DonorCard
                    key={doador.id}
                    doador={doador}
                    onClick={handleVerPerfil}
                  />
                ))}
              </div>

              {visiveis < doadoresFiltrados.length && (
                <div className="flex flex-col items-center gap-2 mt-6">
                  <button
                    onClick={() => setVisiveis((prev) => prev + 4)}
                    className="flex items-center gap-2 px-16 py-4 border-2 border-[#8e001b] text-[#8e001b] font-semibold rounded-full hover:bg-[#8e001b] hover:text-white transition-all text-sm"
                  >
                    <span className="material-symbols-outlined">
                      expand_more
                    </span>
                    Carregar mais
                  </button>
                  <p className="text-xs text-[#5f5e5e]">
                    Mostrando {Math.min(visiveis, doadoresFiltrados.length)} de{" "}
                    {doadoresFiltrados.length} doadores
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default BuscaPage;
