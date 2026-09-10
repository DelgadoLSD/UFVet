import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// ─── Dados mockados (substituídos pela API no Sprint 3) ──────────────────────
const DOADORES_MOCK = [
  {
    id: 1,
    nome: "Thor",
    raca: "Golden Retriever",
    idade: 4,
    tipo: "DEA 1.1+",
    peso: 32,
    distancia: 2.4,
    status: "disponivel",
    validado: true,
  },
  {
    id: 2,
    nome: "Luna",
    raca: "Labrador",
    idade: 3,
    tipo: "DEA 4",
    peso: 28,
    distancia: 5.8,
    status: "disponivel",
    validado: true,
  },
  {
    id: 3,
    nome: "Max",
    raca: "Beagle",
    idade: 5,
    tipo: "DEA 7",
    peso: 16,
    distancia: 8.1,
    status: "indisponivel",
    validado: false,
  },
  {
    id: 4,
    nome: "Barão",
    raca: "Bernese",
    idade: 6,
    tipo: "DEA 1.1 Universal",
    peso: 45,
    distancia: 1.2,
    status: "disponivel",
    validado: true,
  },
  {
    id: 5,
    nome: "Rex",
    raca: "Pastor Alemão",
    idade: 2,
    tipo: "DEA 1.1-",
    peso: 38,
    distancia: 12.4,
    status: "disponivel",
    validado: true,
  },
  {
    id: 6,
    nome: "Maya",
    raca: "Border Collie",
    idade: 3,
    tipo: "DEA 1.1+",
    peso: 22,
    distancia: 0.8,
    status: "disponivel",
    validado: true,
  },
];

const TIPOS_SANGUINEOS = [
  "DEA 1.1 Universal",
  "DEA 1.1+",
  "DEA 1.1-",
  "DEA 4",
  "DEA 7",
];

// ─── Avatar genérico enquanto não há foto do tutor ───────────────────────────
function AvatarPet({ nome }) {
  return (
    <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-[#ffdad8] flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-[#8e001b] text-4xl">
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
            <AvatarPet nome={doador.nome} />
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
              <span className="flex items-center gap-1 bg-gray-100 text-gray-500 px-3 py-0.5 rounded-full text-xs font-semibold">
                Pendente
              </span>
            )}
            <span className="text-[#5f5e5e] text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">
                location_on
              </span>
              {doador.distancia} km
            </span>
          </div>
        </div>

        {/* Nome e raça */}
        <div>
          <h3 className="text-xl font-bold text-[#1a1c1c]">{doador.nome}</h3>
          <p className="text-[#5f5e5e] text-sm">
            {doador.raca} • {doador.idade} anos
          </p>
        </div>

        {/* Tags clínicas */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center h-10 px-3 rounded-xl bg-[#ffdad8] border border-[#ffb3b1] shrink-0">
            <span className="text-[9px] uppercase font-bold text-[#8e001b] opacity-70 mr-2">
              Tipo
            </span>
            <span className="text-sm font-semibold text-[#8e001b] whitespace-nowrap">
              {doador.tipo}
            </span>
          </div>
          <div className="flex items-center h-10 px-3 rounded-xl bg-[#f3f3f3] border border-[#e4bebc] flex-1">
            <span className="text-[9px] uppercase font-bold text-[#5f5e5e] mr-2">
              Peso
            </span>
            <span className="text-sm font-semibold text-[#1a1c1c]">
              {doador.peso}kg
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé do card */}
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
          className={`rounded-full text-sm font-bold px-8 py-2.5 transition-all ${
            disponivel
              ? "bg-[#8e001b] text-white hover:brightness-110 active:scale-95"
              : "bg-[#5f5e5e] text-white cursor-not-allowed"
          }`}
        >
          {disponivel ? "Ver Perfil" : "Indisponível"}
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function BuscaPage() {
  const navigate = useNavigate();

  const [apenasValidados, setApenasValidados] = useState(true);
  const [especie, setEspecie] = useState("cao");
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [ordenar, setOrdenar] = useState("validados");

  const toggleTipo = (tipo) => {
    setTiposSelecionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  };

  const limparFiltros = () => {
    setApenasValidados(false);
    setEspecie("cao");
    setTiposSelecionados([]);
  };

  // Filtragem local (substituída por query params na API futuramente)
  const doadoresFiltrados = DOADORES_MOCK.filter(
    (d) => !apenasValidados || d.validado,
  )
    .filter(
      (d) =>
        tiposSelecionados.length === 0 || tiposSelecionados.includes(d.tipo),
    )
    .sort((a, b) => {
      if (ordenar === "validados") return b.validado - a.validado;
      if (ordenar === "proximos") return a.distancia - b.distancia;
      if (ordenar === "peso") return b.peso - a.peso;
      return 0;
    });

  const handleVerPerfil = (id) => {
    navigate(`/tutor/${id}`);
  };

  return (
    <>
      <Header />
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
                    onClick={() => setEspecie(item.val)}
                    className={`flex-1 py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                      especie === item.val
                        ? "bg-[#8e001b] text-white border-[#8e001b]"
                        : "border-[#8f6f6e] hover:bg-gray-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      pets
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo Sanguíneo */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3">Tipo Sanguíneo</h3>
              <div className="flex flex-wrap gap-2">
                {TIPOS_SANGUINEOS.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => toggleTipo(tipo)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      tiposSelecionados.includes(tipo)
                        ? "bg-[#8e001b] text-white"
                        : "bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#8e001b] hover:text-white"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Peso */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Peso (kg)</h3>
                <span className="text-xs text-[#5f5e5e]">15kg - 45kg</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                defaultValue="25"
                className="w-full h-2 bg-[#e2e2e2] rounded-lg appearance-none cursor-pointer accent-[#8e001b]"
              />
            </div>

            {/* Hospital */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3">
                Hospital de Referência
              </h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-[#8f6f6e]">
                    local_hospital
                  </span>
                </span>
                <select className="w-full pl-9 pr-4 py-2 bg-white border border-[#e4bebc] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] appearance-none">
                  <option value="">Selecione o local...</option>
                  <option value="ufv">Hospital Veterinário UFV</option>
                  <option value="vetvida">Clínica Vet Vida</option>
                  <option value="mundoanimal">Hospital Mundo Animal</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="material-symbols-outlined text-[#8f6f6e]">
                    expand_more
                  </span>
                </span>
              </div>
            </div>

            {/* Distância */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Distância (km)</h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-[#8f6f6e]">
                    distance
                  </span>
                </span>
                <input
                  type="number"
                  placeholder="Ex: 50"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#e4bebc] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b]"
                />
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
                Mostrando {doadoresFiltrados.length} heróis disponíveis para
                doação
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-[#e4bebc] px-3 py-1.5 rounded-lg">
              <span className="text-sm text-[#5f5e5e]">Ordenar por:</span>
              <select
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-[#8e001b] focus:ring-0 cursor-pointer"
              >
                <option value="validados">Validados primeiro</option>
                <option value="proximos">Mais próximos</option>
                <option value="peso">Peso maior</option>
              </select>
            </div>
          </div>

          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doadoresFiltrados.map((doador) => (
              <DonorCard
                key={doador.id}
                doador={doador}
                onClick={handleVerPerfil}
              />
            ))}
          </div>

          {/* Carregar mais */}
          <div className="flex justify-center mt-6">
            <button className="flex items-center gap-2 px-16 py-4 border-2 border-[#8e001b] text-[#8e001b] font-semibold rounded-full hover:bg-[#8e001b] hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined">expand_more</span>
              Carregar mais heróis
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default BuscaPage;
