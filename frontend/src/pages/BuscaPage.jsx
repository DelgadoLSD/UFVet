import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import dog2 from "../assets/dogs/dog2_0-image.jpg";
import dog3 from "../assets/dogs/dog3_0-image.jpg";
import dog4 from "../assets/dogs/dog4_0-image.jpg";
import dog5 from "../assets/dogs/dog5_0-image.jpg";
import dog6 from "../assets/dogs/dog6_0-image.jpg";
import cat1 from "../assets/cats/cat1_0-image.jpg";
import cat2 from "../assets/cats/cat2_0-image.jpg";
import cat3 from "../assets/cats/cat3_0-image.jpg";
import cat4 from "../assets/cats/cat4_0-image.jpg";
import cat5 from "../assets/cats/cat5_0-image.jpg";
import cat6 from "../assets/cats/cat6_0-image.jpg";

const DOADORES_MOCK = [
  {
    id: 1,
    codigo: "A1B2C3",
    nome: "Thor",
    tutor: "Lucas Delgado",
    tutorCodigo: "T7X9K2",
    foto: dog2,
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
    codigo: "D4E5F6",
    nome: "Luna",
    tutor: "Marina Souza",
    tutorCodigo: "T3M8P1",
    foto: dog3,
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
    codigo: "G7H8I9",
    nome: "Max",
    tutor: "Pedro Alves",
    tutorCodigo: "T5K2W7",
    foto: dog4,
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
    codigo: "J1K2L3",
    nome: "Barão",
    tutor: "Ana Ferreira",
    tutorCodigo: "T9R4B6",
    foto: dog5,
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
    codigo: "M4N5O6",
    nome: "Rex",
    tutor: "Carlos Lima",
    tutorCodigo: "T2P7X3",
    foto: dog6,
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
    codigo: "P7Q8R9",
    nome: "Bolt",
    tutor: "Julia Castro",
    tutorCodigo: "T6W1M4",
    foto: null,
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
    id: 7,
    codigo: "S1T2U3",
    nome: "Mia",
    tutor: "Rafael Gomes",
    tutorCodigo: "T8B3K9",
    foto: cat1,
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
    id: 8,
    codigo: "V4W5X6",
    nome: "Simba",
    tutor: "Beatriz Rocha",
    tutorCodigo: "T1X6P2",
    foto: cat2,
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
    id: 9,
    codigo: "Y7Z8A9",
    nome: "Nala",
    tutor: "Thiago Martins",
    tutorCodigo: "T4M9R5",
    foto: cat3,
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
    id: 10,
    codigo: "B1C2D3",
    nome: "Gizmo",
    tutor: "Fernanda Dias",
    tutorCodigo: "T7K4W8",
    foto: cat4,
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
  {
    id: 11,
    codigo: "E4F5G6",
    nome: "Frajola",
    tutor: "Bruno Teixeira",
    tutorCodigo: "T2R8M1",
    foto: cat5,
    especie: "gato",
    raca: "SRD",
    idade: 3,
    tipo: "Tipo A",
    peso: 4.5,
    distancia: 4.7,
    bairro: "Centro",
    status: "disponivel",
    validado: true,
  },
  {
    id: 12,
    codigo: "H7I8J9",
    nome: "Amora",
    tutor: "Camila Nunes",
    tutorCodigo: "T5W2K6",
    foto: cat6,
    especie: "gato",
    raca: "Siamês",
    idade: 4,
    tipo: "Tipo B",
    peso: 3.9,
    distancia: 9.2,
    bairro: "Belvedere",
    status: "disponivel",
    validado: false,
  },
];

const TIPOS_SANGUINEOS = {
  cao: ["DEA 1.1 Universal", "DEA 1.1+", "DEA 1.1-", "DEA 4", "DEA 7"],
  gato: ["Tipo A", "Tipo B", "Tipo AB"],
};

const PESO_MIN = { cao: 10, gato: 2 };
const PESO_MAX = { cao: 60, gato: 10 };

function DonorCard({ doador, onClick, mostrarDistancia }) {
  const disponivel = doador.status === "disponivel";

  return (
    <div
      className={`bg-white border border-[#e4bebc] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${!disponivel ? "opacity-80 grayscale-[0.2]" : ""}`}
    >
      <div className="p-5 flex gap-4">
        {/* Foto — tamanho fixo */}
        <div className="w-48 h-52 shrink-0 rounded-xl overflow-hidden border border-[#e4bebc]">
          {doador.foto ? (
            <img
              src={doador.foto}
              alt={doador.nome}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-[#faf0f0] flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[#c9a5a5] text-4xl">
                photo_camera
              </span>
            </div>
          )}
        </div>

        {/* Dados — altura fixa igual à da foto, distribuídos uniformemente */}
        <div className="flex-1 min-w-0 h-52 flex flex-col justify-between py-0.5">
          {/* Nome + código */}
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#1a1c1c] leading-none truncate">
              {doador.nome}
            </h3>
            <span className="text-xs font-bold text-[#8e001b] bg-[#faf0f0] px-2 py-0.5 rounded-lg shrink-0">
              #{doador.codigo}
            </span>
          </div>

          {/* Raça e idade */}
          <p className="text-[#5f5e5e] text-sm truncate">
            {doador.raca} • {doador.idade} anos
          </p>

          {/* Badge de validação */}
          {doador.validado ? (
            <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              Validado clinicamente
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px]">
                schedule
              </span>
              Pendente de validação
            </span>
          )}

          {/* Tutor + código */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#5f5e5e] text-[15px] shrink-0">
              person
            </span>
            <span className="font-semibold text-[#1a1c1c] text-sm truncate">
              {doador.tutor}
            </span>
            <span className="text-xs font-bold text-[#8e001b] bg-[#faf0f0] px-2 py-0.5 rounded-lg shrink-0">
              #{doador.tutorCodigo}
            </span>
          </div>

          {/* Localização */}
          <div className="flex items-center gap-1.5 text-sm text-[#5f5e5e] truncate">
            <span className="material-symbols-outlined text-[15px] shrink-0">
              location_on
            </span>
            {doador.bairro}
            {mostrarDistancia && doador.distancia
              ? ` • ${doador.distancia} km`
              : ""}
          </div>

          {/* Tipo sanguíneo + peso */}
          <div className="flex items-center gap-3">
            <span className="bg-[#8e001b] text-white text-sm font-extrabold px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
              {doador.tipo}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-[#5f5e5e] shrink-0">
              <span className="material-symbols-outlined text-[15px]">
                monitor_weight
              </span>
              <span className="font-semibold text-[#1a1c1c]">
                {doador.peso}kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-auto px-5 py-3 border-t border-[#e4bebc] flex items-center justify-between bg-[#f3f3f3]">
        {disponivel ? (
          <span className="text-green-600 text-sm font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-600" /> Disponível
          </span>
        ) : (
          <span className="text-[#5f5e5e] text-sm font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> Ocupado
          </span>
        )}
        <button
          onClick={() => disponivel && onClick(doador.id)}
          disabled={!disponivel}
          className={`rounded-full text-sm font-bold px-7 py-2 transition-all ${disponivel ? "bg-[#8e001b] text-white hover:brightness-110 active:scale-95" : "bg-[#5f5e5e] text-white cursor-not-allowed"}`}
        >
          {disponivel ? "Ver Perfil" : "Indisponível"}
        </button>
      </div>
    </div>
  );
}

function BuscaPage() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [apenasValidados, setApenasValidados] = useState(true);
  const [especie, setEspecie] = useState("cao");
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [pesoMax, setPesoMax] = useState(60);
  const [distanciaMax, setDistanciaMax] = useState("");
  const [ordenar, setOrdenar] = useState("validados");
  const [visiveis, setVisiveis] = useState(4);
  const [localReferencia, setLocalReferencia] = useState("");

  const handleVerPerfil = (id) => navigate(`/tutor/${id}`);

  const toggleTipo = (tipo) => {
    setTiposSelecionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  };

  const limparFiltros = () => {
    setBusca("");
    setApenasValidados(false);
    setEspecie("cao");
    setTiposSelecionados([]);
    setPesoMax(60);
    setDistanciaMax("");
    setLocalReferencia("");
    setVisiveis(4);
  };

  const handleEspecieChange = (novaEspecie) => {
    setEspecie(novaEspecie);
    setTiposSelecionados([]);
    setPesoMax(PESO_MAX[novaEspecie]);
    setVisiveis(4);
  };

  const termoBusca = busca.trim().toLowerCase().replace("#", "");

  const doadoresFiltrados = DOADORES_MOCK.filter((d) => d.especie === especie)
    .filter((d) => !apenasValidados || d.validado)
    .filter(
      (d) =>
        tiposSelecionados.length === 0 || tiposSelecionados.includes(d.tipo),
    )
    .filter((d) => d.peso <= pesoMax)
    .filter((d) => {
      if (!termoBusca) return true;
      return (
        d.nome.toLowerCase().includes(termoBusca) ||
        d.tutor.toLowerCase().includes(termoBusca) ||
        d.codigo.toLowerCase().includes(termoBusca) ||
        d.tutorCodigo.toLowerCase().includes(termoBusca) ||
        d.bairro.toLowerCase().includes(termoBusca)
      );
    })
    .filter(
      (d) =>
        !localReferencia ||
        !distanciaMax ||
        d.distancia <= Number(distanciaMax),
    )
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
        {/* Sidebar */}
        <aside className="w-full md:w-1/3 flex flex-col gap-6">
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

            <div className="flex items-center justify-between p-3 bg-[#ffdad8]/30 rounded-lg mb-8 border border-[#8e001b]/20">
              <label
                className="text-sm font-semibold text-[#1a1c1c] flex items-center gap-2 cursor-pointer"
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
              <button
                id="verified-toggle"
                onClick={() => setApenasValidados(!apenasValidados)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${apenasValidados ? "bg-[#8e001b]" : "bg-[#d0d0d0]"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${apenasValidados ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

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

            <div>
              <h3 className="text-sm font-semibold mb-3">
                Local de referência
              </h3>
              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-[#8f6f6e]">
                    my_location
                  </span>
                </span>
                <select
                  value={localReferencia}
                  onChange={(e) => setLocalReferencia(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-[#e4bebc] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] appearance-none cursor-pointer"
                >
                  <option value="">Selecione um local...</option>
                  <option value="hv-ufv">Hospital Veterinário UFV</option>
                  <option value="atual">Minha localização atual</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="material-symbols-outlined text-[#8f6f6e]">
                    expand_more
                  </span>
                </span>
              </div>

              <h3 className="text-sm font-semibold mb-3">
                Distância máxima (km)
              </h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span
                    className={`material-symbols-outlined text-[18px] ${localReferencia ? "text-[#8f6f6e]" : "text-[#d0d0d0]"}`}
                  >
                    distance
                  </span>
                </span>
                <input
                  type="number"
                  placeholder={
                    localReferencia ? "Ex: 10" : "Selecione um local primeiro"
                  }
                  min="0"
                  value={distanciaMax}
                  disabled={!localReferencia}
                  onChange={(e) => setDistanciaMax(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] ${localReferencia ? "bg-white border-[#e4bebc]" : "bg-[#f5f5f5] border-[#e8e8e8] text-[#b0b0b0] cursor-not-allowed"}`}
                />
              </div>
              {!localReferencia && (
                <p className="text-[10px] text-[#8f6f6e] mt-2 leading-relaxed">
                  Escolha um local de referência para calcular as distâncias.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e4bebc] p-5 rounded-xl shadow-sm">
            <h3 className="text-sm font-bold text-[#1a1c1c] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8e001b] text-[18px]">
                info
              </span>
              O que significam os selos?
            </h3>
            <div className="space-y-3">
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
                <p className="text-sm text-[#5f5e5e] leading-snug text-justify">
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
                <p className="text-sm text-[#5f5e5e] leading-snug text-justify">
                  O cadastro foi feito pelo tutor, mas ainda não passou por
                  revisão veterinária. A triagem completa será necessária no
                  momento da doação.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Área de resultados */}
        <section className="w-full md:w-2/3 flex flex-col gap-6">
          {/* Barra de pesquisa */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="material-symbols-outlined text-[#8f6f6e]">
                search
              </span>
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setVisiveis(4);
              }}
              placeholder="Buscar por nome do animal, tutor, código (#) ou bairro..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e4bebc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] shadow-sm"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <span className="material-symbols-outlined text-[#8f6f6e] hover:text-[#8e001b]">
                  close
                </span>
              </button>
            )}
          </div>

          {/* Cabeçalho de resultados */}
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
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${ordenar === op.val ? "bg-[#8e001b] text-white border-[#8e001b]" : "bg-white text-[#5f5e5e] border-[#e4bebc] hover:border-[#8e001b] hover:text-[#8e001b]"}`}
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
                Nenhum pet corresponde aos filtros ou à busca. Tente ampliar os
                critérios.
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {doadoresFiltrados.slice(0, visiveis).map((doador) => (
                  <DonorCard
                    key={doador.id}
                    doador={doador}
                    onClick={handleVerPerfil}
                    mostrarDistancia={!!localReferencia}
                  />
                ))}
              </div>

              {visiveis < doadoresFiltrados.length && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setVisiveis((prev) => prev + 4)}
                    className="flex items-center gap-2 px-12 py-3 bg-[#8e001b] text-white font-bold rounded-full hover:brightness-110 active:scale-95 transition-all text-sm shadow-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      expand_more
                    </span>
                    Carregar mais{" "}
                    {Math.min(4, doadoresFiltrados.length - visiveis)} de{" "}
                    {doadoresFiltrados.length - visiveis}
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
