import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Ajuda from "../components/Ajuda";
import Botao from "../components/Botao";
import BotaoAjuda from "../components/BotaoAjuda";
import Selecao from "../components/Selecao";
import ModalComoFuncionaValidacao from "../components/ComoFuncionaValidacao";
import ModalComoFuncionaContato from "../components/ComoFuncionaContato";
import ModalPedirLiberacao from "../components/ModalPedirLiberacao";
import FaixaAcessoContatos from "../components/FaixaAcessoContatos";
import { useSessao } from "../util/sessao";
import {
  useAcessoContatos,
  acessoDe,
  pedirLiberacao,
  VETERINARIOS,
  HOSPITAIS,
} from "../util/acessoContatos";
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
    tutor: "Lucas Silva Delgado",
    tutorCodigo: "T7X9K2",
    foto: dog2,
    especie: "cao",
    raca: "Golden Retriever",
    idade: 4,
    tipo: "DEA 1.1+",
    peso: 32,
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    tipo: null,
    peso: 16,
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    tipo: null,
    peso: 30,
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    tipo: null,
    peso: 4.8,
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    cidade: "Viçosa - MG",
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
    tipo: null,
    peso: 3.9,
    cidade: "Teixeiras - MG",
    bairro: "Centro",
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

// Cidades e bairros saem dos próprios doadores: a lista acompanha os lugares
// onde o UFVet já tem gente cadastrada.
const ordenadoBR = (lista) => [...lista].sort((a, b) => a.localeCompare(b, "pt-BR"));

const CIDADES = ordenadoBR([...new Set(DOADORES_MOCK.map((d) => d.cidade))]);

const bairrosDe = (cidade) =>
  ordenadoBR([
    ...new Set(
      DOADORES_MOCK.filter((d) => d.cidade === cidade).map((d) => d.bairro),
    ),
  ]);

const POR_PAGINA = 6;

const numeroBR = (n) => n.toLocaleString("pt-BR");

// ─── Card do doador ───────────────────────────────────────────────────────────
// Vertical, com a foto em cima: é o formato que escaneia melhor em grade e dá
// largura total ao texto, sem truncar raça, peso ou tipo sanguíneo. Mostra só
// o que decide a escolha (tipo, porte, bairro, validação); dados do tutor
// ficam no perfil.
function DonorCard({ doador, onClick }) {
  const disponivel = doador.status === "disponivel";

  return (
    <article
      className={`bg-white border border-[#eadede] rounded-2xl overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-200 hover:border-[#dccaca] hover:shadow-[0_12px_28px_-16px_rgba(26,28,28,0.28)] ${
        disponivel ? "" : "opacity-75"
      }`}
    >
      <div className="relative aspect-[4/3] bg-[#faf0f0]">
        {doador.foto ? (
          <img
            src={doador.foto}
            alt={doador.nome}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[#c9a5a5] text-5xl">
              photo_camera
            </span>
            <span className="text-[#c9a5a5] text-xs font-semibold">
              Sem foto ainda
            </span>
          </div>
        )}
        <span className="absolute bottom-2.5 left-2.5 bg-black/45 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          #{doador.codigo}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#1a1c1c] leading-tight truncate">
            {doador.nome}
          </h3>
          {/* Tipo em vermelho só quando saiu de um exame assinado. Sem
              tipagem, a etiqueta fica cinza e diz o que falta. */}
          {doador.tipo ? (
            <span className="bg-[#8e001b] text-white text-xs font-extrabold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
              {doador.tipo}
            </span>
          ) : (
            <span className="bg-[#f3eeee] text-[#5f5e5e] text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
              Sem tipagem
            </span>
          )}
        </div>

        <p className="text-sm text-[#5f5e5e] truncate">
          {doador.raca}, {doador.idade} anos, {numeroBR(doador.peso)} kg
        </p>

        <p className="flex items-center gap-1 text-sm text-[#5f5e5e] truncate">
          <span className="material-symbols-outlined text-[16px] shrink-0">
            location_on
          </span>
          {doador.bairro}, {doador.cidade}
        </p>

        {/* Status de validação acompanhado do que ele muda na prática */}
        <div
          className={`mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-xs leading-snug ${
            doador.validado
              ? "bg-emerald-50 text-emerald-900"
              : "bg-[#f5f3f3] text-[#5b403f]"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] shrink-0 ${
              doador.validado ? "text-emerald-600" : "text-[#8f6f6e]"
            }`}
          >
            {doador.validado ? "verified_user" : "schedule"}
          </span>
          <span>
            <strong className="block font-semibold">
              {doador.validado ? "Validado" : "Ainda não validado"}
            </strong>
            {doador.validado
              ? "Triagem rápida no hospital"
              : "Exames antes da coleta"}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[#f0e6e6] flex items-center justify-between gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
            disponivel ? "text-emerald-700" : "text-[#5f5e5e]"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${disponivel ? "bg-emerald-500" : "bg-gray-400"}`}
          />
          {disponivel ? "Disponível" : "Indisponível"}
          {!disponivel && (
            <Ajuda titulo="Por que está indisponível?">
              <p>
                O tutor pausou as doações por um tempo — por exemplo, durante
                uma viagem, ou porque o animal doou há pouco e está se
                recuperando.
              </p>
              <p>
                Enquanto isso, o contato dele não aparece para pedidos de
                doação. Vale conferir de novo mais tarde.
              </p>
            </Ajuda>
          )}
        </span>
        <Botao
          variante={disponivel ? "primario" : "secundario"}
          tamanho="sm"
          disabled={!disponivel}
          onClick={() => onClick(doador.id)}
          className="shrink-0"
        >
          Ver perfil
        </Botao>
      </div>
    </article>
  );
}

// ─── Faixa explicativa ────────────────────────────────────────────────────────
// Fica acima dos resultados, no momento da escolha — antes estava escondida no
// fim da barra lateral.
function LegendaValidacao({ onEntender }) {
  return (
    <div className="bg-white border border-[#eadede] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        <div className="flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">
              verified_user
            </span>
          </span>
          <p className="text-xs text-[#5b403f] leading-relaxed">
            <strong className="block text-sm font-semibold text-emerald-800">
              Validado
            </strong>
            Exames já conferidos por um veterinário. No hospital, só uma
            checagem rápida antes da coleta.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-full bg-[#8f6f6e] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">
              schedule
            </span>
          </span>
          <p className="text-xs text-[#5b403f] leading-relaxed">
            <strong className="block text-sm font-semibold text-[#1a1c1c]">
              Ainda não validado
            </strong>
            Pode doar normalmente. Os exames de triagem, inclusive a tipagem
            sanguínea, são feitos no hospital antes da coleta.
          </p>
        </div>
      </div>
      <BotaoAjuda
        rotulo="Como funciona a validação?"
        onClick={onEntender}
        className="shrink-0 self-start lg:self-auto"
      />
    </div>
  );
}

function BuscaPage() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  // Começa mostrando todos: doadores ainda não validados também podem doar,
  // e a ordenação já coloca os validados primeiro.
  const [apenasValidados, setApenasValidados] = useState(false);
  const [especie, setEspecie] = useState("cao");
  const [tiposSelecionados, setTiposSelecionados] = useState([]);
  const [pesoMax, setPesoMax] = useState(60);
  const [ordenar, setOrdenar] = useState("validados");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [explicacaoAberta, setExplicacaoAberta] = useState(false);
  const [contatoAberto, setContatoAberto] = useState(false);
  const [pedidoAberto, setPedidoAberto] = useState(false);
  const usuario = useSessao();
  const acessoContatos = useAcessoContatos();
  const acesso = acessoDe(usuario, acessoContatos);

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
    setCidade("");
    setBairro("");
    setVisiveis(POR_PAGINA);
  };

  const handleEspecieChange = (novaEspecie) => {
    setEspecie(novaEspecie);
    setTiposSelecionados([]);
    setPesoMax(PESO_MAX[novaEspecie]);
    setVisiveis(POR_PAGINA);
  };

  const bairrosDaCidade = cidade ? bairrosDe(cidade) : [];
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
        d.raca.toLowerCase().includes(termoBusca) ||
        d.codigo.toLowerCase().includes(termoBusca) ||
        d.bairro.toLowerCase().includes(termoBusca)
      );
    })
    .filter((d) => !cidade || d.cidade === cidade)
    .filter((d) => !bairro || d.bairro === bairro)
    .sort((a, b) => {
      if (ordenar === "validados") return b.validado - a.validado;
      if (ordenar === "peso") return b.peso - a.peso;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

  const restantes = doadoresFiltrados.length - visiveis;

  return (
    <>
      <Header dark={true} />
      {explicacaoAberta && (
        <ModalComoFuncionaValidacao onClose={() => setExplicacaoAberta(false)} />
      )}
      {contatoAberto && (
        <ModalComoFuncionaContato onClose={() => setContatoAberto(false)} />
      )}
      {pedidoAberto && (
        <ModalPedirLiberacao
          usuario={usuario}
          hospitais={HOSPITAIS}
          veterinarios={VETERINARIOS}
          onConfirmar={({ caso, veterinario }) => {
            pedirLiberacao({ usuario, caso, veterinario });
            setPedidoAberto(false);
          }}
          onClose={() => setPedidoAberto(false)}
        />
      )}

      <main className="max-w-[1536px] mx-auto flex flex-col md:flex-row gap-6 px-5 md:px-16 py-12 pt-28">
        {/* Filtros */}
        <aside className="w-full md:w-72 xl:w-80 shrink-0">
          <div className="bg-white border border-[#eadede] p-6 rounded-2xl md:sticky md:top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1a1c1c]">Filtros</h2>
              <button
                onClick={limparFiltros}
                className="text-[#8e001b] text-sm font-semibold hover:underline"
              >
                Limpar
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-[#fdecee] rounded-xl mb-7">
              <div className="flex items-center gap-2">
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
                <Ajuda titulo="Apenas validados">
                  <p>
                    Mostra só doadores com exames já conferidos por um
                    veterinário, que costumam ter a coleta mais rápida.
                  </p>
                  <p>
                    Desligado, você vê todos: doadores ainda não validados
                    também podem doar, com os exames feitos no hospital.
                  </p>
                </Ajuda>
              </div>
              <button
                id="verified-toggle"
                role="switch"
                aria-checked={apenasValidados}
                onClick={() => {
                  setApenasValidados(!apenasValidados);
                  setVisiveis(POR_PAGINA);
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${apenasValidados ? "bg-[#8e001b]" : "bg-[#d0d0d0]"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${apenasValidados ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            <div className="mb-7">
              <h3 className="text-sm font-semibold mb-3">Espécie</h3>
              <div className="flex p-1 bg-white border border-[#e2d6d6] rounded-xl gap-1">
                {[
                  { val: "cao", label: "Cão" },
                  { val: "gato", label: "Gato" },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => handleEspecieChange(item.val)}
                    aria-pressed={especie === item.val}
                    className={`flex-1 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                      especie === item.val
                        ? "bg-[#b7102a] text-white"
                        : "text-[#5f5e5e] hover:text-[#1a1c1c]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-7">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-semibold">Tipo sanguíneo</h3>
                <Ajuda titulo="Qual tipo escolher?">
                  {especie === "cao" ? (
                    <p>
                      Selecione o tipo do cão que vai receber o sangue, se você
                      souber. Doadores DEA 1.1 negativo (DEA 1.1- e Universal)
                      podem doar para a maioria dos cães.
                    </p>
                  ) : (
                    <p>
                      Gatos precisam receber sangue de um tipo compatível.
                      Selecione o tipo do gato que vai receber o sangue — o
                      hospital sempre confirma a compatibilidade.
                    </p>
                  )}
                  <p>
                    Filtrar por tipo esconde os doadores sem tipagem
                    confirmada: o tipo deles só é conhecido depois do exame,
                    feito no hospital.
                  </p>
                </Ajuda>
              </div>
              <p className="text-[11px] text-[#5f5e5e] mb-3">
                {especie === "cao"
                  ? "Classificação DEA para cães"
                  : "Classificação AB para gatos"}
              </p>
              <div className="flex flex-wrap gap-2">
                {TIPOS_SANGUINEOS[especie].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => toggleTipo(tipo)}
                    aria-pressed={tiposSelecionados.includes(tipo)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${tiposSelecionados.includes(tipo) ? "bg-[#8e001b] border-[#8e001b] text-white" : "bg-white border-[#e2d6d6] text-[#1a1c1c] hover:border-[#8e001b] hover:text-[#8e001b]"}`}
                  >
                    {tipo}
                  </button>
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
                min={PESO_MIN[especie]}
                max={PESO_MAX[especie]}
                value={pesoMax}
                onChange={(e) => setPesoMax(Number(e.target.value))}
                className="w-full h-2 bg-[#e2e2e2] rounded-lg appearance-none cursor-pointer accent-[#8e001b]"
              />
              <div className="flex justify-between text-[11px] text-[#5f5e5e] mt-1">
                <span>{PESO_MIN[especie]} kg</span>
                <span>{PESO_MAX[especie]} kg</span>
              </div>
            </div>

            {/* Onde o doador mora. Quem conhece a cidade sabe o que é perto
                do hospital melhor do que um raio em quilômetros — e ninguém
                precisa entregar o endereço exato de casa. */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Localização</h3>
              <div className="mb-3">
                <Selecao
                  valor={cidade}
                  onChange={(valor) => {
                    setCidade(valor);
                    setBairro("");
                    setVisiveis(POR_PAGINA);
                  }}
                  placeholder="Todas as cidades"
                  icone="location_city"
                  opcoes={CIDADES.map((c) => ({
                    valor: c,
                    rotulo: c,
                    icone: "location_city",
                  }))}
                />
              </div>

              {cidade ? (
                <Selecao
                  valor={bairro}
                  onChange={(valor) => {
                    setBairro(valor);
                    setVisiveis(POR_PAGINA);
                  }}
                  placeholder="Todos os bairros"
                  icone="home_pin"
                  opcoes={bairrosDaCidade.map((b) => ({
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

        {/* Resultados */}
        <section className="flex-1 min-w-0 flex flex-col gap-5">
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
                setVisiveis(POR_PAGINA);
              }}
              placeholder="Buscar por nome, raça, bairro ou código (#)..."
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#dccfcf] rounded-2xl text-sm shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute inset-y-0 right-0 flex items-center pr-4"
              >
                <span className="material-symbols-outlined text-[#8f6f6e] hover:text-[#8e001b]">
                  close
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1c1c]">
                Doadores encontrados
              </h1>
              <p className="text-[#5f5e5e] text-sm mt-0.5">
                {doadoresFiltrados.length > 0
                  ? `${doadoresFiltrados.length} ${doadoresFiltrados.length === 1 ? "doador" : "doadores"} com esses filtros`
                  : "Nenhum doador com esses filtros"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#5f5e5e] font-semibold">
                Ordenar por:
              </span>
              {[
                { val: "validados", label: "Validados primeiro" },
                { val: "peso", label: "Maior peso" },
                { val: "nome", label: "Nome" },
              ].map((op) => (
                <button
                  key={op.val}
                  onClick={() => setOrdenar(op.val)}
                  aria-pressed={ordenar === op.val}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${ordenar === op.val ? "bg-[#8e001b] text-white border-[#8e001b]" : "bg-white text-[#5f5e5e] border-[#e2d6d6] hover:border-[#8e001b] hover:text-[#8e001b]"}`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          <FaixaAcessoContatos
            acesso={acesso}
            onPedirLiberacao={() => setPedidoAberto(true)}
            onComoFunciona={() => setContatoAberto(true)}
          />

          <LegendaValidacao onEntender={() => setExplicacaoAberta(true)} />

          {doadoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-[#fdecee] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#8e001b] text-6xl">
                  pets
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1a1c1c] mb-2">
                Nenhum doador encontrado
              </h3>
              <p className="text-[#5f5e5e] text-sm max-w-xs leading-relaxed mb-8">
                Nenhum animal corresponde aos filtros ou à busca. Tente ampliar
                os critérios.
              </p>
              <Botao icone="filter_alt_off" onClick={limparFiltros}>
                Limpar filtros
              </Botao>
            </div>
          ) : (
            <>
              {/* auto-fill: o número de colunas se ajusta à largura disponível
                  sem que um card fique estreito demais */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
                {doadoresFiltrados.slice(0, visiveis).map((doador) => (
                  <DonorCard
                    key={doador.id}
                    doador={doador}
                    onClick={handleVerPerfil}
                  />
                ))}
              </div>

              {restantes > 0 && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Botao
                    variante="secundario"
                    icone="expand_more"
                    onClick={() => setVisiveis((prev) => prev + POR_PAGINA)}
                    className="px-6"
                  >
                    Carregar mais {Math.min(POR_PAGINA, restantes)}
                  </Botao>
                  <p className="text-xs text-[#5f5e5e]">
                    Mostrando {visiveis} de {doadoresFiltrados.length} doadores
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
