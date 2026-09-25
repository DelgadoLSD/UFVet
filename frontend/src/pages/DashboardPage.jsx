import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Modal from "../components/Modal";
import Ajuda from "../components/Ajuda";
import Botao from "../components/Botao";
import CodigoCopiavel from "../components/CodigoCopiavel";
import ModalComoFuncionaValidacao from "../components/ComoFuncionaValidacao";
import ModalComoFuncionaContato from "../components/ComoFuncionaContato";
import BlocoContato from "../components/BlocoContato";
import BotaoAjuda from "../components/BotaoAjuda";
import PainelAcessoContatos from "../components/PainelAcessoContatos";
import ModalLiberarAcesso from "../components/ModalLiberarAcesso";
import ModalPedirLiberacao from "../components/ModalPedirLiberacao";
import ModalExcluirAnimal from "../components/ModalExcluirAnimal";
import ModalDoacoes from "../components/ModalDoacoes";
import ModalHistoricoValidacao from "../components/ModalHistoricoValidacao";
import {
  TUTORES_CADASTRADOS,
  VETERINARIOS,
  HOSPITAIS,
  pedidosPara,
  useAcessoContatos,
  liberacoesAtivas,
  liberacoesDe,
  acessoDe,
  liberarAcesso,
  renovarAcesso,
  encerrarAcesso,
  pedirLiberacao,
  recusarPedido,
} from "../util/acessoContatos";
import { useSessao, perfilVisitado } from "../util/sessao";
import dog1 from "../assets/dogs/dog1_0-image.jpg";
import dog1_1 from "../assets/dogs/dog1_1-image.jpg";
import dog1_2 from "../assets/dogs/dog1_2-image.jpg";
import cat1 from "../assets/cats/cat1_0-image.jpg";
import hemogramaImg from "../assets/documents/hemograma.png";
import sorologiaImg from "../assets/documents/sorologia.png";
import carteiraVacinacaoImg from "../assets/documents/carteira_vacinacao.jpg";
import dog7 from "../assets/dogs/dogs7_0-image.jpg";
import dog4 from "../assets/dogs/dog4_0-image.jpg";
import cat7 from "../assets/cats/cat7_0-image.jpg";

// O usuário logado é sempre este veterinário neste mock. "Ver perfil" a
// partir da busca sempre leva a um tutor de exemplo (Beatriz) — ver
// DashboardPage, onde a rota decide qual dos dois exibir.
const nomeProfissional = ({ nome, genero }) =>
  `${genero === "F" ? "Dra." : "Dr."} ${nome}`;

const primeiroNome = (nome) => nome.split(" ")[0];

// "12 Fev 2025" → "fev/2025"
const mesAno = (data) => {
  const [, mes, ano] = data.split(" ");
  return `${mes.toLowerCase()}/${ano}`;
};

// ─── Critérios de doação ──────────────────────────────────────────────────────
// Baseados na Nota Técnica nº 3 (2024) da ABVHMT — Associação Brasileira
// Veterinária de Hematologia e Medicina Transfusional. Confirmar com a equipe
// do Hospital Veterinário antes de ir para produção.
const REFERENCIA_DOADOR = {
  cao: {
    pesoMin: 25,
    idadeMin: 1,
    idadeMax: 8,
    intervaloDias: 90,
    sorologias: "Babesia, Ehrlichia, Anaplasma e Leishmania",
  },
  gato: {
    pesoMin: 4,
    idadeMin: 1,
    idadeMax: 8,
    intervaloDias: 90,
    sorologias: "FeLV, FIV e Mycoplasma",
  },
};

// A validação veterinária é um checklist do que importa para doar sangue — o
// restante do histórico clínico do animal vive no sistema do hospital.
const CRITERIOS_DOACAO = [
  {
    key: "tipagem",
    curto: "Tipagem",
    label: "Tipagem sanguínea confirmada",
    descricao: () => "O exame de tipagem foi feito e o tipo está registrado.",
  },
  {
    key: "pesoIdade",
    curto: "Peso e idade",
    label: "Peso e idade dentro dos critérios",
    descricao: (ref) =>
      `Mínimo de ${ref.pesoMin} kg e idade entre ${ref.idadeMin} e ${ref.idadeMax} anos.`,
  },
  {
    key: "vacinacao",
    curto: "Vacinação",
    label: "Vacinação e vermifugação em dia",
    descricao: () => "Vacinas e vermífugo dentro da validade.",
  },
  {
    key: "sorologias",
    curto: "Sorologias",
    label: "Sorologias negativas",
    descricao: (ref) => `Negativo para ${ref.sorologias}.`,
  },
  {
    key: "semTransfusao",
    curto: "Sem transfusão",
    label: "Nunca recebeu transfusão",
    descricao: () => "Animais já transfundidos não são aceitos como doadores.",
  },
];

// Só o veterinário escolhe entre estes, ao assinar a tipagem. Não existe
// "não sei": o campo fica vazio até o exame dizer.
const TIPOS_SANGUINEOS = {
  cao: ["DEA 1.1 Universal", "DEA 1.1+", "DEA 1.1-", "DEA 4", "DEA 7"],
  gato: ["Tipo A", "Tipo B", "Tipo AB"],
};

const TIPOS_UNIVERSAIS = ["DEA 1.1-", "DEA 1.1 Universal"];

const VALIDADE_DIAS = 365;

const chaveEspecie = (especie) => (especie === "Gato" ? "gato" : "cao");

const textoCastracao = ({ sexo, castrado }) => {
  const final = sexo === "Fêmea" ? "a" : "o";
  return castrado ? `Castrad${final}` : `Não castrad${final}`;
};

const hoje = () => new Date().toLocaleDateString("pt-BR");

const agora = () => {
  const d = new Date();
  return {
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
};

const paraData = (dataBR) => {
  const [dia, mes, ano] = dataBR.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
};

const diasDesde = (dataBR) =>
  Math.floor((new Date() - paraData(dataBR)) / 86400000);

const umAnoApos = (dataBR) => {
  const [dia, mes, ano] = dataBR.split("/");
  return `${dia}/${mes}/${Number(ano) + 1}`;
};

// Idade derivada da data de nascimento — nunca fica desatualizada
function idadeEmAnos(nascimentoISO) {
  const nascimento = new Date(`${nascimentoISO}T00:00:00`);
  const hojeData = new Date();
  let anos = hojeData.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hojeData.getMonth() < nascimento.getMonth() ||
    (hojeData.getMonth() === nascimento.getMonth() &&
      hojeData.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return anos;
}

const textoIdade = (anos) =>
  anos <= 0 ? "Menos de 1 ano" : `${anos} ano${anos > 1 ? "s" : ""}`;

const formatarPeso = (kg) => `${kg.toLocaleString("pt-BR")} kg`;

function situacaoRecuperacao(ultimaDoacao, ref) {
  if (!ultimaDoacao) return { apto: true };
  const liberada = paraData(ultimaDoacao);
  liberada.setDate(liberada.getDate() + ref.intervaloDias);
  return {
    apto: new Date() >= liberada,
    liberadaEm: liberada.toLocaleDateString("pt-BR"),
  };
}

function statusValidacao(validacao) {
  if (!validacao) return "pendente";
  if (diasDesde(validacao.em) > VALIDADE_DIAS) return "vencida";
  const completa = CRITERIOS_DOACAO.every((c) => validacao.criterios[c.key]);
  return completa ? "validado" : "pendencias";
}

const todosCriterios = (valor) =>
  Object.fromEntries(CRITERIOS_DOACAO.map((c) => [c.key, valor]));

const versaoDoc = (arquivo, data, enviadoPor) => ({ arquivo, data, enviadoPor });

// Uma coleta registrada por um veterinário. O total de doações e a data da
// última saem daqui — não existe contador guardado à parte que possa
// discordar da lista.
let sequenciaDoacao = 0;
const doacao = (data, volumeMl, hospital, veterinario, crmv, nota = "") => ({
  id: ++sequenciaDoacao,
  data,
  volumeMl,
  hospital,
  veterinario,
  crmv,
  nota,
});

const HV_UFV = "Hospital Veterinário UFV";

const dataUltimaDoacao = (doacoes) => doacoes[0]?.data || null;

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Os quatro animais cobrem os quatro estados de validação: vencida (Zeus),
// nunca validado (Luna), validado (Bela) e com pendências (Nina).
const ANIMAIS_MOCK = [
  {
    id: 1,
    codigo: "Z7R2K4",
    nome: "Zeus",
    fotos: [dog1, dog1_1, dog1_2],
    especie: "Cão",
    raca: "Golden Retriever",
    sexo: "Macho",
    castrado: true,
    nascimento: "2021-08-20",
    peso: 32,
    tipo: "DEA 1.1+",
    doacoes: [
      doacao("05/09/2026", 450, HV_UFV, "Dr. Paulo Rezende", "88214-MG",
        "Coleta tranquila, sem necessidade de sedação."),
      doacao("10/03/2026", 450, HV_UFV, "Dra. Camila Duarte", "45210-MG"),
      doacao("22/10/2025", 420, HV_UFV, "Dr. Paulo Rezende", "88214-MG"),
      doacao("18/06/2025", 450, HV_UFV, "Dr. Paulo Rezende", "88214-MG"),
      doacao("02/02/2025", 430, HV_UFV, "Dra. Camila Duarte", "45210-MG"),
      doacao("15/10/2023", 400, HV_UFV, "Dr. Paulo Rezende", "88214-MG",
        "Primeira doação. Agitado no início, depois se acalmou."),
    ],
    disponivel: true,
    // Duas validações: a mais recente já venceu (mais de um ano), e antes
    // dela existe uma mais antiga — foi substituída quando esta foi feita.
    validacoes: [
      {
        criterios: todosCriterios(true),
        por: "Dr. Paulo Rezende",
        crmv: "88214-MG",
        em: "10/08/2025",
        nota: "",
      },
      {
        criterios: { ...todosCriterios(true), vacinacao: false },
        por: "Dra. Camila Duarte",
        crmv: "45210-MG",
        em: "15/07/2024",
        nota: "Vacina antirrábica vencida. Renovar antes da próxima coleta.",
      },
    ],
    observacoes: [
      {
        data: "05/09/2026",
        hora: "14:20",
        autor: "Dr. Paulo Rezende",
        texto:
          "Dócil e muito colaborativo. Coleta tranquila, sem necessidade de sedação.",
      },
      {
        data: "10/03/2026",
        hora: "10:05",
        autor: "Dra. Camila Duarte",
        texto:
          "Acesso venoso fácil pela jugular; procedimento levou cerca de 10 minutos.",
      },
      {
        data: "22/10/2025",
        hora: "16:40",
        autor: "Dr. Paulo Rezende",
        texto: "Fica mais calmo com a presença da tutora durante a coleta.",
      },
      {
        data: "15/10/2023",
        hora: "09:30",
        autor: "Dr. Paulo Rezende",
        texto: "Primeira doação. Ficou um pouco agitado no início, mas logo se acalmou.",
      },
    ],
    documentos: [
      {
        nome: "Hemograma completo",
        versoes: [
          versaoDoc(hemogramaImg, "10/10/2025", "Beatriz dos Reis"),
          versaoDoc(hemogramaImg, "02/03/2026", "Beatriz dos Reis"),
        ],
      },
      { nome: "Sorologias", versoes: [] },
      {
        nome: "Carteira de vacinação",
        versoes: [versaoDoc(carteiraVacinacaoImg, "10/10/2025", "Beatriz dos Reis")],
      },
    ],
  },
  {
    id: 2,
    codigo: "L4N8C1",
    nome: "Luna",
    fotos: [cat1],
    especie: "Gato",
    raca: "SRD",
    sexo: "Fêmea",
    castrado: true,
    nascimento: "2024-06-10",
    peso: 4.5,
    tipo: null,
    doacoes: [],
    disponivel: false,
    validacoes: [],
    observacoes: [],
    documentos: [
      { nome: "Hemograma completo", versoes: [] },
      {
        nome: "Sorologias",
        versoes: [versaoDoc(sorologiaImg, "01/03/2026", "Beatriz dos Reis")],
      },
      { nome: "Carteira de vacinação", versoes: [] },
    ],
  },
];

// Doador de outro tutor, aberto quando quem está logado é a tutora.
const ANIMAIS_OUTRO_TUTOR = [
  {
    id: 5,
    codigo: "T4H9R2",
    nome: "Thor",
    fotos: [dog4],
    especie: "Cão",
    raca: "Border Collie",
    sexo: "Macho",
    castrado: true,
    nascimento: "2022-04-12",
    peso: 29,
    tipo: "DEA 1.1-",
    doacoes: [
      doacao("12/06/2026", 420, HV_UFV, "Dra. Camila Duarte", "45210-MG",
        "Chegou agitado, mas se acalmou com o tutor por perto."),
      doacao("05/01/2026", 400, HV_UFV, "Dra. Camila Duarte", "45210-MG"),
    ],
    disponivel: true,
    validacoes: [
      {
        criterios: todosCriterios(true),
        por: "Dra. Camila Duarte",
        crmv: "45210-MG",
        em: "18/06/2026",
        nota: "",
      },
    ],
    observacoes: [
      {
        data: "12/06/2026",
        hora: "09:30",
        autor: "Dra. Camila Duarte",
        texto:
          "Chegou agitado, mas se acalmou com o tutor por perto durante toda a coleta.",
      },
    ],
    documentos: [
      { nome: "Hemograma", versoes: [] },
      { nome: "Sorologia", versoes: [] },
      { nome: "Carteira de vacinação", versoes: [] },
    ],
  },
];

const ANIMAIS_MOCK_VET = [
  {
    id: 3,
    codigo: "B3L6D9",
    nome: "Bela",
    fotos: [dog7],
    especie: "Cão",
    raca: "Labrador",
    sexo: "Fêmea",
    castrado: true,
    nascimento: "2023-05-10",
    peso: 28,
    tipo: "DEA 1.1-",
    doacoes: [
      doacao("10/06/2026", 440, HV_UFV, "Dra. Camila Duarte", "45210-MG",
        "Bastante tranquila; já doou três vezes sem intercorrências."),
      doacao("28/12/2025", 440, HV_UFV, "Dr. Victor Hugo", "78120-MG"),
      doacao("14/08/2025", 430, HV_UFV, "Dr. Victor Hugo", "78120-MG"),
    ],
    disponivel: true,
    validacoes: [
      {
        criterios: todosCriterios(true),
        por: "Dra. Camila Duarte",
        crmv: "45210-MG",
        em: "20/08/2026",
        nota: "",
      },
    ],
    observacoes: [
      {
        data: "10/06/2026",
        hora: "11:10",
        autor: "Dra. Camila Duarte",
        texto:
          "Bastante tranquila durante a coleta; já doou 3 vezes sem intercorrências.",
      },
    ],
    documentos: [
      {
        nome: "Hemograma completo",
        versoes: [versaoDoc(hemogramaImg, "20/08/2026", "Victor Hugo")],
      },
      {
        nome: "Sorologias",
        versoes: [versaoDoc(sorologiaImg, "20/08/2026", "Victor Hugo")],
      },
      {
        nome: "Carteira de vacinação",
        versoes: [versaoDoc(carteiraVacinacaoImg, "20/08/2026", "Victor Hugo")],
      },
    ],
  },
  {
    id: 4,
    codigo: "N9P2F5",
    nome: "Nina",
    fotos: [cat7],
    especie: "Gato",
    raca: "Persa",
    sexo: "Fêmea",
    castrado: false,
    nascimento: "2022-02-14",
    peso: 3.8,
    tipo: "Tipo B",
    doacoes: [],
    disponivel: false,
    validacoes: [
      {
        criterios: {
          tipagem: true,
          pesoIdade: false,
          vacinacao: true,
          sorologias: false,
          semTransfusao: true,
        },
        por: "Dra. Camila Duarte",
        crmv: "45210-MG",
        em: "05/09/2026",
        nota: "Peso abaixo do mínimo para gatas doadoras e sorologia de FeLV/FIV ainda não apresentada.",
      },
    ],
    observacoes: [
      {
        data: "05/09/2026",
        hora: "15:40",
        autor: "Dra. Camila Duarte",
        texto:
          "Receosa no manuseio; recomenda-se ambiente silencioso e contenção leve.",
      },
    ],
    documentos: [
      {
        nome: "Hemograma completo",
        versoes: [versaoDoc(hemogramaImg, "28/08/2026", "Victor Hugo")],
      },
      { nome: "Sorologias", versoes: [] },
      {
        nome: "Carteira de vacinação",
        versoes: [versaoDoc(carteiraVacinacaoImg, "05/09/2026", "Victor Hugo")],
      },
    ],
  },
];

const OBSERVACOES_VISIVEIS = 3;

// ─── Carrossel de fotos do animal ─────────────────────────────────────────────
function CarrosselFotos({ fotos, nome }) {
  const [atual, setAtual] = useState(0);
  const temFotos = fotos && fotos.length > 0;
  const temVarias = temFotos && fotos.length > 1;

  const anterior = () =>
    setAtual((prev) => (prev - 1 + fotos.length) % fotos.length);
  const proxima = () => setAtual((prev) => (prev + 1) % fotos.length);

  if (!temFotos) {
    return (
      <div className="w-full h-56 lg:h-full min-h-[240px] bg-[#faf0f0] border-2 border-dashed border-[#e4bebc] flex flex-col items-center justify-center gap-2 rounded-2xl">
        <span className="material-symbols-outlined text-[#c9a5a5] text-5xl">
          photo_camera
        </span>
        <span className="text-[#c9a5a5] text-xs font-semibold">
          Sem foto ainda
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 lg:h-full min-h-[240px] rounded-2xl overflow-hidden border border-[#eadede] group">
      {fotos.map((foto, i) => (
        <img
          key={i}
          src={foto}
          alt={`${nome} — foto ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
            i === atual ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {temVarias && (
        <>
          <button
            onClick={anterior}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/60"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_left
            </span>
          </button>
          <button
            onClick={proxima}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-black/60"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_right
            </span>
          </button>

          <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {atual + 1}/{fotos.length}
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setAtual(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === atual ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Controle segmentado (escolha entre poucas opções) ─────────────────────────
function Segmentado({ opcoes, valor, onEscolher }) {
  return (
    <div className="flex p-1 bg-white border border-[#e2d6d6] rounded-xl gap-1">
      {opcoes.map((op) => (
        <button
          key={String(op.val)}
          type="button"
          onClick={() => onEscolher(op.val)}
          aria-pressed={valor === op.val}
          className={`flex-1 h-9 px-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] ${
            valor === op.val
              ? "bg-[#b7102a] text-white"
              : "text-[#5f5e5e] hover:text-[#1a1c1c]"
          }`}
        >
          {op.icone}
          {op.label}
        </button>
      ))}
    </div>
  );
}

// ─── Cadastro e edição de animal ──────────────────────────────────────────────
// Só o que o tutor sabe e o que importa para doação. Os critérios clínicos
// (sorologias, vacinação, transfusão) são conferidos pelo veterinário.
// O mesmo formulário cadastra e edita: são os mesmos campos, e manter um só
// evita que as duas telas se afastem com o tempo.
//
// O tipo sanguíneo não está aqui de propósito. É resultado de exame, e um
// palpite de tutor exibido com a mesma cara de um dado conferido engana tanto
// quem procura doador quanto o veterinário que dá a validação por feita.

const FORM_VAZIO = {
  nome: "",
  especie: "cao",
  raca: "",
  racaSRD: false,
  sexo: "",
  castrado: "",
  idadeConhecida: true,
  dataNascimento: "",
  idadeEstimada: "",
  peso: "",
};

const formularioDoAnimal = (animal) => ({
  ...FORM_VAZIO,
  nome: animal.nome,
  especie: chaveEspecie(animal.especie),
  raca: animal.raca === "SRD" ? "" : animal.raca,
  racaSRD: animal.raca === "SRD",
  sexo: animal.sexo,
  castrado: animal.castrado ? "sim" : "nao",
  dataNascimento: animal.nascimento,
  peso: String(animal.peso),
});

// Dados que o veterinário assinou: mudar um deles derruba o critério que ele
// confirmou, porque a conferência foi feita sobre o valor antigo. Peso muda de
// verdade ao longo da vida, e a data de nascimento pode ter sido digitada
// errada — nos dois casos o tutor corrige e a validação volta para a fila.
const CRITERIO_POR_CAMPO = {
  peso: "pesoIdade",
  dataNascimento: "pesoIdade",
};

function criteriosAfetados(form, animal) {
  if (!animal?.validacao) return [];
  const original = formularioDoAnimal(animal);
  const chaves = new Set(
    Object.entries(CRITERIO_POR_CAMPO)
      .filter(([campo]) => form[campo] !== original[campo])
      .map(([, criterio]) => criterio),
  );
  return CRITERIOS_DOACAO.filter(
    (c) => chaves.has(c.key) && animal.validacao.criterios[c.key],
  );
}

function ModalAnimal({ animal, onClose }) {
  const editando = !!animal;
  const [form, setForm] = useState(() =>
    editando ? formularioDoAnimal(animal) : FORM_VAZIO,
  );
  const [fotos, setFotos] = useState(() =>
    (animal?.fotos || []).map((preview) => ({ preview, existente: true })),
  );

  const ref = REFERENCIA_DOADOR[form.especie];
  const afetados = criteriosAfetados(form, animal);
  // Tipo sanguíneo não muda ao longo da vida: depois que o exame de tipagem
  // confirma, o valor é resultado de laboratório assinado por um veterinário,
  // e o tutor deixa de poder sobrescrever. É o dado mais perigoso do sistema
  // para ficar aberto — quem discorda pede revisão ao veterinário.
  const tipagemConfirmada = !!animal?.validacao?.criterios.tipagem;

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFotos = (e) => {
    const arquivos = Array.from(e.target.files);
    const permitidos = arquivos.slice(0, 5 - fotos.length);
    const novas = permitidos.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFotos((prev) => [...prev, ...novas]);
  };

  // Foto que já estava no perfil não tem URL temporária para liberar.
  const removerFoto = (index) => {
    setFotos((prev) => {
      if (!prev[index].existente) URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      editando
        ? "Alterações salvas! (integração com back-end em breve)"
        : "Animal cadastrado! (integração com back-end em breve)",
    );
    fotos.forEach((f) => !f.existente && URL.revokeObjectURL(f.preview));
    onClose();
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-white border border-[#e4bebc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8e001b] focus:border-[#8e001b] placeholder:text-gray-400";
  const rotuloClass = "text-sm font-semibold text-[#1a1c1c]";
  const labelClass = `block mb-1.5 ${rotuloClass}`;

  return (
    <Modal
      titulo={editando ? `Editar ${animal.nome}` : "Cadastrar novo animal"}
      subtitulo={
        editando
          ? "O que mudar aqui aparece na busca na hora"
          : "Dados básicos para o perfil de doador"
      }
      largura="max-w-2xl"
      onClose={onClose}
      rodape={
        <div className="flex flex-col gap-3">
          {/* O aviso fica colado no botão porque é sobre o que salvar provoca:
              no meio do formulário ele passa despercebido. */}
          {afetados.length > 0 && (
            <div className="flex items-start gap-2 bg-[#fdecee] border border-[#b7102a]/25 rounded-lg px-3 py-2.5">
              <span className="material-symbols-outlined text-[#8e001b] text-[18px] shrink-0">
                release_alert
              </span>
              <p className="text-xs text-[#5b403f] leading-relaxed">
                Salvar desfaz a validação de{" "}
                <strong className="font-semibold text-[#8e001b]">
                  {afetados.map((c) => c.label.toLowerCase()).join(" e ")}
                </strong>
                , assinada por {animal.validacao.por} em {animal.validacao.em}.
                Um veterinário precisa conferir de novo.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Botao variante="secundario" onClick={onClose}>
              Cancelar
            </Botao>
            <Botao
              type="submit"
              form="form-cadastro-animal"
              icone={editando ? undefined : "add"}
            >
              {editando ? "Salvar alterações" : "Cadastrar animal"}
            </Botao>
          </div>
        </div>
      }
    >
      <form
        id="form-cadastro-animal"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {!editando && (
          <div className="flex gap-3 bg-[#faf0f0] border border-[#e4bebc] rounded-xl p-4">
            <span className="material-symbols-outlined text-[#8e001b] text-[22px] shrink-0">
              verified_user
            </span>
            <p className="text-xs text-[#5b403f] leading-relaxed">
              Seu animal já pode aparecer como doador logo após o cadastro. O
              tipo sanguíneo não é pedido aqui: ele sai do exame de tipagem, e
              quem registra é o veterinário. Envie os exames depois no perfil —
              com eles, um veterinário <strong>valida</strong> os critérios de
              doação e o hospital não precisa refazer tudo no dia da coleta.
            </p>
          </div>
        )}

        <div>
          <label className={labelClass}>Nome do animal *</label>
          <input
            type="text"
            placeholder="Ex: Thor, Luna, Bolinha..."
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Espécie *</label>
            <Segmentado
              opcoes={[
                { val: "cao", label: "Cão" },
                { val: "gato", label: "Gato" },
              ]}
              valor={form.especie}
              onEscolher={(val) => {
                handleChange("especie", val);
                handleChange("tipoSanguineo", "");
              }}
            />
          </div>

          <div>
            <label className={labelClass}>Sexo *</label>
            <Segmentado
              opcoes={[
                { val: "Macho", label: "Macho" },
                { val: "Fêmea", label: "Fêmea" },
              ]}
              valor={form.sexo}
              onEscolher={(val) => handleChange("sexo", val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Raça</label>
            <input
              type="text"
              placeholder={
                form.racaSRD ? "SRD (Sem Raça Definida)" : "Ex: Labrador..."
              }
              value={form.racaSRD ? "SRD" : form.raca}
              onChange={(e) => handleChange("raca", e.target.value)}
              disabled={form.racaSRD}
              className={`${inputClass} ${form.racaSRD ? "bg-[#f3f3f3] text-[#5f5e5e]" : ""}`}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.racaSRD}
                onChange={(e) => {
                  handleChange("racaSRD", e.target.checked);
                  handleChange("raca", "");
                }}
                className="w-4 h-4 rounded accent-[#8e001b]"
              />
              <span className="text-xs text-[#5f5e5e] font-medium">
                SRD / Não sei a raça
              </span>
            </label>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={rotuloClass}>Castrado(a)?</span>
              <Ajuda titulo="Por que perguntamos?">
                <p>
                  A castração não é obrigatória para doar. Mas fêmeas não
                  castradas não podem doar durante o cio, a gestação e a
                  amamentação.
                </p>
                <p>
                  Depois da cirurgia de castração, é preciso esperar 30 dias
                  antes de doar.
                </p>
              </Ajuda>
            </div>
            <Segmentado
              opcoes={[
                { val: "sim", label: "Sim" },
                { val: "nao", label: "Não" },
              ]}
              valor={form.castrado}
              onEscolher={(val) => handleChange("castrado", val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Idade</label>
            <div className="mb-2">
              <Segmentado
                opcoes={[
                  { val: true, label: "Data de nascimento" },
                  { val: false, label: "Estimar" },
                ]}
                valor={form.idadeConhecida}
                onEscolher={(val) => handleChange("idadeConhecida", val)}
              />
            </div>
            {form.idadeConhecida ? (
              <input
                type="date"
                value={form.dataNascimento}
                onChange={(e) => handleChange("dataNascimento", e.target.value)}
                className={inputClass}
              />
            ) : (
              <input
                type="text"
                placeholder="Ex: cerca de 3 anos"
                value={form.idadeEstimada}
                onChange={(e) => handleChange("idadeEstimada", e.target.value)}
                className={inputClass}
              />
            )}
            <p className="text-[11px] text-[#5f5e5e] mt-1.5">
              Doadores têm entre {ref.idadeMin} e {ref.idadeMax} anos.
            </p>
          </div>

          <div>
            <label className={labelClass}>Peso (kg)</label>
            <div className="h-11 mb-2" aria-hidden="true" />
            <input
              type="number"
              placeholder={`Ex: ${form.especie === "cao" ? "30" : "4,5"}`}
              min="0"
              step="0.1"
              value={form.peso}
              onChange={(e) => handleChange("peso", e.target.value)}
              className={inputClass}
            />
            <p className="text-[11px] text-[#5f5e5e] mt-1.5">
              Peso mínimo para doar: {ref.pesoMin} kg.
            </p>
          </div>
        </div>

        {/* Só leitura, nos dois estados: quem preenche esse campo é o
            veterinário, no momento em que assina a tipagem. */}
        {editando && (
          <div>
            <span className={labelClass}>Tipo sanguíneo</span>
            <div className="flex items-start gap-3 bg-[#faf6f6] border border-[#eadede] rounded-xl p-4">
              <span className="material-symbols-outlined text-[20px] text-[#8f6f6e] shrink-0">
                {tipagemConfirmada ? "lock" : "labs"}
              </span>
              <div>
                <p className="text-sm font-bold text-[#1a1c1c]">
                  {tipagemConfirmada ? animal.tipo : "Ainda não tipado"}
                </p>
                <p className="text-xs text-[#5f5e5e] leading-relaxed mt-1">
                  {tipagemConfirmada
                    ? `Confirmado no exame de tipagem por ${animal.validacao.por} em ${animal.validacao.em}. Se algo não confere, peça ao veterinário para revisar a validação.`
                    : `O tipo sanguíneo vem do exame de tipagem e quem registra é o veterinário. Enviar os exames de ${animal.nome} no perfil é o que faz esse campo ser preenchido.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>
            Fotos do animal
            <span className="ml-2 text-[#5f5e5e] normal-case font-normal tracking-normal">
              ({fotos.length}/5)
            </span>
          </label>

          {fotos.length > 0 ? (
            <div className="flex gap-3 flex-wrap">
              {fotos.map((foto, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#e4bebc] group"
                >
                  <img
                    src={foto.preview}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {i === 0 && (
                    <div className="absolute top-1 left-1 bg-[#8e001b] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      Principal
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removerFoto(i)}
                    aria-label={`Remover foto ${i + 1}`}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-white text-xl">
                      delete
                    </span>
                  </button>
                </div>
              ))}

              {fotos.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#e4bebc] flex items-center justify-center cursor-pointer hover:border-[#8e001b] hover:bg-[#faf0f0] transition-all">
                  <span className="material-symbols-outlined text-[#c9a5a5] text-2xl">
                    add_photo_alternate
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFotos}
                  />
                </label>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#e4bebc] rounded-xl cursor-pointer hover:border-[#8e001b] hover:bg-[#faf0f0] transition-all">
              <span className="material-symbols-outlined text-[#c9a5a5] text-4xl mb-2">
                photo_camera
              </span>
              <span className="text-sm font-semibold text-[#5f5e5e]">
                Clique para adicionar fotos
              </span>
              <span className="text-xs text-[#c9a5a5] mt-1">
                JPG, PNG — até 5 fotos. A primeira é a principal.
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFotos}
              />
            </label>
          )}
        </div>
      </form>
    </Modal>
  );
}

// ─── Validação veterinária ────────────────────────────────────────────────────
// A explicação diz o que o status muda na prática, no dia da coleta — é isso
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

const ACAO_VALIDACAO = {
  pendente: { texto: "Validar doador", variante: "primario" },
  vencida: { texto: "Renovar validação", variante: "primario" },
  pendencias: { texto: "Revisar validação", variante: "secundario" },
  validado: { texto: "Revisar validação", variante: "secundario" },
};

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
    <div className={`border rounded-xl p-5 flex flex-col gap-4 ${estilo.caixa}`}>
      {/* Botão fixo no canto superior direito: o texto ao lado encolhe e
          quebra linha, mas nunca empurra o botão para baixo */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${estilo.circulo}`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {estilo.icone}
            </span>
          </span>
          <div className="min-w-0">
            <p className={`flex items-center gap-2 font-bold text-sm ${estilo.cor}`}>
              {estilo.titulo}
              <BotaoAjuda
                rotulo="Como funciona a validação?"
                onClick={() => setExplicacaoAberta(true)}
              />
            </p>
            {validacao && (
              <div className="text-xs text-[#5f5e5e] mt-0.5 space-y-0.5">
              <p>
                {validacao.por}, CRMV {validacao.crmv}
              </p>
              <p>
                Em {validacao.em},{" "}
                {status === "vencida" ? "venceu em" : "válida até"}{" "}
                {umAnoApos(validacao.em)}
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
        {CRITERIOS_DOACAO.map((c) => {
          const atendido = validacao?.criterios[c.key];
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
            <li key={c.key} className="flex items-center gap-2 text-sm">
              <span className={`material-symbols-outlined text-[18px] ${cor}`}>
                {icone}
              </span>
              <span
                className={
                  validacao && !atendido ? "text-amber-900" : "text-[#1a1c1c]"
                }
              >
                {c.label}
              </span>
            </li>
          );
        })}
      </ul>

      {validacao?.nota && (
        <p className="text-xs text-[#5b403f] bg-white/70 border border-[#f0e6e6] rounded-lg px-3 py-2 leading-relaxed">
          <strong className="text-[#1a1c1c]">Nota do veterinário:</strong>{" "}
          {validacao.nota}
        </p>
      )}

      {ehDono && !podeValidar && status !== "validado" && (
        <p className="flex items-start gap-2 text-xs text-[#5b403f] bg-white/70 border border-[#f0e6e6] rounded-lg px-3 py-2 leading-relaxed">
          <span className="material-symbols-outlined text-[16px] text-[#8e001b] shrink-0">
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
          onClose={() => setExplicacaoAberta(false)}
        />
      )}
    </div>
  );
}

function ModalValidacao({ animal, validacao, onSalvar, onClose }) {
  const usuario = useSessao();
  const ref = REFERENCIA_DOADOR[chaveEspecie(animal.especie)];
  // Validação vencida começa zerada: renovar exige reconferir, não só confirmar
  const aproveitarAnterior = statusValidacao(validacao) !== "vencida";
  const [criterios, setCriterios] = useState(() =>
    aproveitarAnterior && validacao
      ? { ...validacao.criterios }
      : todosCriterios(false),
  );
  const [nota, setNota] = useState(
    aproveitarAnterior && validacao ? validacao.nota : "",
  );
  // O perfil só ganha tipo sanguíneo aqui: marcar a tipagem obriga a dizer
  // qual foi o resultado, e é esse valor que passa a aparecer na busca.
  const [tipo, setTipo] = useState(animal.tipo);
  const tiposDaEspecie = TIPOS_SANGUINEOS[chaveEspecie(animal.especie)];

  const marcados = CRITERIOS_DOACAO.filter((c) => criterios[c.key]).length;
  const completa = marcados === CRITERIOS_DOACAO.length;
  // Tipagem conferida sem dizer o resultado deixaria o perfil com um selo e
  // nenhum tipo — é o contrário do que a validação serve para resolver.
  const faltaTipo = criterios.tipagem && !tipo;

  const alternar = (key) =>
    setCriterios((prev) => ({ ...prev, [key]: !prev[key] }));

  const salvar = () =>
    onSalvar({
      criterios,
      // Sem tipagem conferida, o tipo continua sendo o que o tutor declarou.
      tipo: criterios.tipagem ? tipo : animal.tipo,
      nota: nota.trim(),
      por: nomeProfissional(usuario),
      crmv: usuario.crmv,
      em: hoje(),
    });

  return (
    <Modal
      titulo={`Validar doador — ${animal.nome}`}
      subtitulo={[
        animal.especie,
        animal.tipo || "sem tipagem",
        formatarPeso(animal.peso),
        textoIdade(idadeEmAnos(animal.nascimento)),
      ].join(", ")}
      onClose={onClose}
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
            <Botao variante="secundario" onClick={onClose}>
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
          {CRITERIOS_DOACAO.map((c) => {
            const marcado = criterios[c.key];
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => alternar(c.key)}
                className={`flex items-start gap-3 text-left rounded-xl border p-3 transition-colors ${
                  marcado
                    ? "border-emerald-300 bg-emerald-50/60"
                    : "border-[#e4bebc] hover:border-[#8e001b]/50"
                }`}
              >
                <span
                  className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    marcado
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-[#c9a5a5] bg-white"
                  }`}
                >
                  {marcado && (
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#1a1c1c]">
                    {c.label}
                  </span>
                  <span className="block text-xs text-[#5f5e5e] mt-0.5">
                    {c.descricao(ref)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {criterios.tipagem && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
            <p className="text-sm font-semibold text-[#1a1c1c]">
              Qual tipo o exame mostrou?
            </p>
            <p className="text-xs text-[#5f5e5e] mt-0.5">
              {animal.tipo
                ? `Hoje o perfil mostra ${animal.tipo}. O que você marcar aqui passa a valer.`
                : `${animal.nome} ainda não tem tipo registrado. É você quem assina esse dado.`}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {tiposDaEspecie.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
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
              tipo !== animal.tipo && (
                <p className="text-xs text-[#8e001b] font-semibold mt-3">
                  O perfil passa a mostrar {tipo}, com sua assinatura.
                </p>
              )
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-[#1a1c1c] mb-1.5">
            Nota (opcional)
          </label>
          <textarea
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

// ─── Observações para a coleta ────────────────────────────────────────────────
function ItemObservacao({ item }) {
  return (
    <div className="border-l-2 border-[#e4bebc] pl-4 py-0.5">
      <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
        <span className="font-semibold text-[#1a1c1c]">{item.autor}</span>
        <span className="text-[#5f5e5e]">
          {item.data} às {item.hora}
        </span>
      </p>
      <p className="text-sm text-[#1a1c1c] mt-0.5 leading-relaxed">
        {item.texto}
      </p>
    </div>
  );
}

function SecaoObservacoes({ animal, observacoes, podeAdicionar, onAdicionar }) {
  const [adicionando, setAdicionando] = useState(false);
  const [texto, setTexto] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const cancelar = () => {
    setAdicionando(false);
    setTexto("");
  };

  const salvar = () => {
    if (!texto.trim()) return;
    onAdicionar(texto.trim());
    cancelar();
  };

  return (
    <section className="border border-[#f0e6e6] bg-[#fafafa] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-1.5 text-base font-bold text-[#1a1c1c]">
            Observações para a coleta
            <Ajuda titulo="Observações para a coleta">
              <p>
                Anotações de veterinários sobre como o animal se comportou em
                coletas anteriores — por exemplo, se é calmo ou se precisa de
                mais cuidado.
              </p>
              <p>
                Elas ajudam a equipe a preparar uma coleta tranquila para o
                doador.
              </p>
            </Ajuda>
          </h4>
          <p className="text-xs text-[#5f5e5e] mt-1">
            Temperamento e comportamento em coletas anteriores
          </p>
        </div>
        {podeAdicionar && !adicionando && (
          <Botao
            variante="secundario"
            tamanho="sm"
            icone="add"
            onClick={() => setAdicionando(true)}
          >
            Adicionar
          </Botao>
        )}
      </div>

      {adicionando && (
        <div className="bg-white border border-[#e4bebc] rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#8e001b]/30">
          <textarea
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder="Ex.: dócil, coleta tranquila sem necessidade de contenção."
            className="w-full bg-white text-gray-900 [color-scheme:light] text-sm resize-none focus:outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Botao variante="fantasma" tamanho="sm" onClick={cancelar}>
              Cancelar
            </Botao>
            <Botao tamanho="sm" onClick={salvar} disabled={!texto.trim()}>
              Salvar
            </Botao>
          </div>
        </div>
      )}

      {observacoes.length > 0 ? (
        <div className="space-y-3">
          {observacoes.slice(0, OBSERVACOES_VISIVEIS).map((item, i) => (
            <ItemObservacao key={i} item={item} />
          ))}
        </div>
      ) : (
        !adicionando && (
          <p className="text-sm text-[#5f5e5e] italic">
            Nenhuma observação registrada ainda.
          </p>
        )
      )}

      {observacoes.length > OBSERVACOES_VISIVEIS && (
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-1.5 text-[#8e001b] font-semibold text-xs hover:underline underline-offset-2 w-fit mt-auto"
        >
          <span className="material-symbols-outlined text-[16px]">
            unfold_more
          </span>
          Ver todas ({observacoes.length - OBSERVACOES_VISIVEIS} mais)
        </button>
      )}

      {modalAberto && (
        <Modal
          titulo={`Observações para a coleta — ${animal.nome}`}
          subtitulo={`${observacoes.length} registros`}
          onClose={() => setModalAberto(false)}
        >
          <div className="space-y-4">
            {observacoes.map((item, i) => (
              <ItemObservacao key={i} item={item} />
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

// ─── Exames e documentos ──────────────────────────────────────────────────────
function ModalDocumento({ nomeDocumento, versoes, onClose }) {
  const [indice, setIndice] = useState(versoes.length - 1);
  const versao = versoes[indice];
  const temVarias = versoes.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
        <div className="border-b border-[#e4bebc] px-8 py-5 flex items-center justify-between rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#1a1c1c]">{nomeDocumento}</h2>
            <p className="text-xs text-[#5f5e5e] mt-0.5">
              {versoes.length} {versoes.length === 1 ? "versão enviada" : "versões enviadas"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-[#f3f3f3] flex items-center justify-center hover:bg-[#e4bebc] transition-colors"
          >
            <span className="material-symbols-outlined text-[#5f5e5e] text-xl">
              close
            </span>
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1a1c1c]">
                {versao.data}
              </span>
              {temVarias && indice === versoes.length - 1 && (
                <span className="text-[11px] font-semibold text-[#8e001b] bg-[#faf0f0] px-2 py-0.5 rounded-full">
                  Mais recente
                </span>
              )}
              <span className="text-xs text-[#5f5e5e]">
                Enviado por {versao.enviadoPor}
              </span>
            </div>
            <Botao
              as="a"
              href={versao.arquivo}
              target="_blank"
              rel="noreferrer"
              variante="secundario"
              tamanho="sm"
              icone="open_in_new"
            >
              Abrir em nova aba
            </Botao>
          </div>

          <div className="w-full rounded-xl border border-[#e4bebc] bg-[#2a2a2a] overflow-auto max-h-[65vh]">
            <img
              src={versao.arquivo}
              alt={`${nomeDocumento} — ${versao.data}`}
              className="w-full h-auto"
            />
          </div>

          {temVarias && (
            <div>
              <p className="text-sm font-semibold text-[#1a1c1c] mb-3">
                Versões enviadas
              </p>
              <div className="space-y-2">
                {versoes
                  .map((v, i) => ({ ...v, i }))
                  .reverse()
                  .map((v) => (
                    <button
                      key={v.i}
                      onClick={() => setIndice(v.i)}
                      className={`w-full flex items-center justify-between gap-3 text-left px-4 py-2.5 rounded-xl border transition-colors ${
                        v.i === indice
                          ? "border-[#8e001b] bg-[#faf0f0]"
                          : "border-[#e4bebc] hover:border-[#8e001b]/50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-[#1a1c1c]">
                        {v.data}
                        {v.i === versoes.length - 1 && " (mais recente)"}
                      </span>
                      <span className="text-[11px] text-[#5f5e5e]">
                        Enviado por {v.enviadoPor}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SecaoDocumentos({ documentos, podeEnviar, onEnviar }) {
  const [aberto, setAberto] = useState(null);
  const documentoAberto = documentos.find((d) => d.nome === aberto);

  return (
    <section className="border border-[#f0e6e6] bg-[#fafafa] rounded-xl p-5 flex flex-col gap-4">
      <div>
        <h4 className="flex items-center gap-1.5 text-base font-bold text-[#1a1c1c]">
          Exames e documentos
          <Ajuda titulo="Por que enviar documentos?">
            <p>
              Com exames recentes e a carteira de vacinação em mãos, um
              veterinário consegue validar o animal sem pedir que os exames
              sejam refeitos.
            </p>
            <p>
              Sem eles, o hospital pode precisar repetir esses exames antes da
              coleta — o que leva mais tempo e pode ter custo.
            </p>
          </Ajuda>
        </h4>
        <p className="text-xs text-[#5f5e5e] mt-1">
          Evitam que exames sejam refeitos no hospital
        </p>
      </div>

      <ul className="divide-y divide-[#f0e6e6] bg-white border border-[#f0e6e6] rounded-xl">
        {documentos.map((doc) => {
          const ultima = doc.versoes.at(-1);
          const qtd = doc.versoes.length;
          return (
            <li key={doc.nome} className="flex items-center gap-2 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1c1c] truncate">
                  {doc.nome}
                </p>
                <p
                  className={`text-xs mt-0.5 ${ultima ? "text-[#5f5e5e]" : "text-[#c9a5a5] italic"}`}
                >
                  {ultima
                    ? `Enviado em ${ultima.data}${qtd > 1 ? `, ${qtd} versões` : ""}`
                    : "Não enviado"}
                </p>
              </div>

              {/* Colunas de ação com largura fixa: cada botão cai sempre no
                  mesmo lugar, tenha o documento sido enviado ou não */}
              <div className="w-[4.5rem] flex justify-end">
                {ultima && (
                  <Botao
                    variante="fantasma"
                    tamanho="sm"
                    onClick={() => setAberto(doc.nome)}
                  >
                    Abrir
                  </Botao>
                )}
              </div>

              {podeEnviar && (
                <div className="w-[6.75rem] flex justify-end">
                  <Botao
                    as="label"
                    variante={ultima ? "secundario" : "primario"}
                    tamanho="sm"
                    icone="upload"
                  >
                    {ultima ? "Atualizar" : "Enviar"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        onEnviar(doc.nome, e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </Botao>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {documentoAberto && (
        <ModalDocumento
          nomeDocumento={documentoAberto.nome}
          versoes={documentoAberto.versoes}
          onClose={() => setAberto(null)}
        />
      )}
    </section>
  );
}

// ─── Card do animal ───────────────────────────────────────────────────────────
// O "?" fica no canto inferior direito, fora da linha do rótulo: assim o
// texto centraliza sozinho e o botão nunca colide com rótulos longos.
// `acao` ocupa o mesmo canto do "?" e substitui a ajuda: onde há um histórico
// para abrir, a explicação vai junto com os dados, dentro dele.
function DadoDoador({ label, valor, detalhe, alerta, destaque, ajuda, acao }) {
  return (
    <div
      className={`relative rounded-xl border px-3 pt-3 pb-5 flex flex-col items-center justify-center text-center gap-1 ${
        destaque
          ? "bg-[#8e001b] border-[#8e001b]"
          : "bg-[#fafafa] border-[#f0e6e6]"
      }`}
    >
      {acao ? (
        <button
          type="button"
          onClick={acao.onClick}
          aria-label={acao.rotulo}
          title={acao.rotulo}
          className="group absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a] focus-visible:ring-offset-1"
        >
          <span className="w-[17px] h-[17px] rounded-full bg-[#8e001b]/10 text-[#8e001b] flex items-center justify-center transition-colors group-hover:bg-[#8e001b] group-hover:text-white">
            <span className="material-symbols-outlined text-[12px]">
              {acao.icone}
            </span>
          </span>
        </button>
      ) : (
        ajuda && (
          <Ajuda
            titulo={ajuda.titulo}
            claro={destaque}
            className="absolute bottom-1.5 right-1.5"
          >
            {ajuda.texto}
          </Ajuda>
        )
      )}
      <span
        className={`text-xs font-semibold ${
          destaque ? "text-white/80" : "text-[#5f5e5e]"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-extrabold leading-tight ${
          destaque ? "text-white text-2xl" : "text-[#1a1c1c] text-lg"
        }`}
      >
        {valor}
      </span>
      {detalhe && (
        <span
          className={`text-[10px] font-semibold leading-snug ${
            alerta
              ? "text-amber-700"
              : destaque
                ? "text-white/80"
                : "text-[#5f5e5e]"
          }`}
        >
          {detalhe}
        </span>
      )}
    </div>
  );
}

function AjudaDisponibilidade({ animal, ehDono, disponivel, recuperacao }) {
  const femeaNaoCastrada = animal.sexo === "Fêmea" && !animal.castrado;

  if (ehDono) {
    return (
      <Ajuda titulo="Disponibilidade para doação">
        <p>
          Clique na etiqueta para mudar. Vai viajar ou {animal.nome} não pode
          doar por um tempo? Marque como indisponível: outros tutores vão saber
          que ele não está disponível agora, e seu contato deixa de aparecer
          para pedidos de doação até você reativar.
        </p>
        {femeaNaoCastrada && (
          <p>
            Como {animal.nome} não é castrada, deixe-a indisponível durante o
            cio, a gestação e a amamentação.
          </p>
        )}
        {!recuperacao.apto && (
          <p>
            Depois de uma doação, o corpo precisa de cerca de 3 meses para se
            recuperar — por isso a etiqueta mostra até quando.
          </p>
        )}
      </Ajuda>
    );
  }

  return (
    <Ajuda titulo="Disponibilidade para doação">
      {!disponivel ? (
        <p>
          O tutor pausou as doações por um tempo — por exemplo, durante uma
          viagem. Enquanto isso, o contato dele não aparece para pedidos de
          doação. Vale conferir de novo mais tarde.
        </p>
      ) : !recuperacao.apto ? (
        <p>
          {animal.nome} doou recentemente e precisa de cerca de 3 meses para se
          recuperar antes da próxima doação.
        </p>
      ) : (
        <p>
          O tutor informou que {animal.nome} pode doar agora e está disponível
          para ser contatado.
        </p>
      )}
    </Ajuda>
  );
}

function AnimalCard({ animal, isProprioTutor, isVet, nomeTutor }) {
  const usuario = useSessao();
  const [disponivel, setDisponivel] = useState(animal.disponivel);
  // O histórico é a fonte de verdade; "validacao" é sempre a mais recente
  // dele. Uma validação assinada nunca é editada — revisar cria uma entrada
  // nova, prependada aqui, e a anterior continua no histórico, substituída.
  const [historicoValidacoes, setHistoricoValidacoes] = useState(
    () => animal.validacoes ?? [],
  );
  const validacao = historicoValidacoes[0] ?? null;
  const [modalHistoricoValidacao, setModalHistoricoValidacao] = useState(false);
  // O tipo sai do cadastro do tutor, mas quem confirma a tipagem é o
  // veterinário — e o valor do exame é o que vale daí em diante.
  const [tipo, setTipo] = useState(animal.tipo);
  const [doacoes, setDoacoes] = useState(animal.doacoes);
  const [modalDoacoes, setModalDoacoes] = useState(false);
  const [observacoes, setObservacoes] = useState(animal.observacoes);
  const [documentos, setDocumentos] = useState(animal.documentos);
  const [modalValidacaoAberto, setModalValidacaoAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Quem é veterinário continua veterinário nos próprios animais: pode ser
  // ele mesmo quem valida e quem acompanha a coleta.
  const podeAtuarComoVet = isVet;

  const animalAtual = { ...animal, tipo, validacao, doacoes };
  const ref = REFERENCIA_DOADOR[chaveEspecie(animal.especie)];
  const anos = idadeEmAnos(animal.nascimento);
  const pesoOk = animal.peso >= ref.pesoMin;
  const idadeOk = anos >= ref.idadeMin && anos <= ref.idadeMax;
  // A recuperação conta a partir da coleta mais recente registrada: registrar
  // uma doação nova já muda a etiqueta do animal.
  const ultimaDoacao = dataUltimaDoacao(doacoes);
  const recuperacao = situacaoRecuperacao(ultimaDoacao, ref);

  // A etiqueta fala só de disponibilidade; o que a validação muda na prática
  // está explicado no painel de validação, logo abaixo.
  const disponibilidade = !disponivel
    ? {
        texto: "Indisponível no momento",
        classe: "bg-[#eeeeee] text-[#5f5e5e]",
        ponto: "bg-gray-400",
      }
    : !recuperacao.apto
      ? {
          texto: `Em recuperação até ${recuperacao.liberadaEm}`,
          classe: "bg-sky-50 text-sky-800",
          ponto: "bg-sky-500",
        }
      : {
          texto: "Disponível para doação",
          classe: "bg-emerald-50 text-emerald-700",
          ponto: "bg-emerald-500 animate-pulse",
        };

  const adicionarObservacao = (texto) => {
    const { data, hora } = agora();
    setObservacoes((prev) => [
      { data, hora, autor: nomeProfissional(usuario), texto },
      ...prev,
    ]);
  };

  const enviarDocumento = (nome, file) => {
    if (!file) return;
    const versao = versaoDoc(URL.createObjectURL(file), hoje(), nomeTutor);
    setDocumentos((prev) =>
      prev.map((d) =>
        d.nome === nome ? { ...d, versoes: [...d.versoes, versao] } : d,
      ),
    );
  };

  const pilulaDisponibilidade = (
    <>
      <span className={`w-2 h-2 rounded-full ${disponibilidade.ponto}`} />
      {disponibilidade.texto}
    </>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#eadede] shadow-[0_1px_2px_rgba(26,28,28,0.04)] overflow-hidden">
      {/* ── Cabeçalho ── */}
      <div className="px-8 py-5 flex justify-between items-center gap-4 flex-wrap border-b border-[#eadede]">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-extrabold text-2xl text-[#8e001b] leading-none">
              {animal.nome}
            </h3>
            <span className="text-xs font-semibold text-[#5b403f] bg-[#f3eeee] px-2.5 py-1 rounded-md">
              {animal.especie}
            </span>
            <div className="flex items-center gap-1.5">
              {isProprioTutor ? (
                <button
                  onClick={() => setDisponivel(!disponivel)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all hover:brightness-95 active:scale-95 ${disponibilidade.classe}`}
                >
                  {pilulaDisponibilidade}
                  <span className="material-symbols-outlined text-[14px] opacity-60">
                    swap_horiz
                  </span>
                </button>
              ) : (
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${disponibilidade.classe}`}
                >
                  {pilulaDisponibilidade}
                </span>
              )}
              <AjudaDisponibilidade
                animal={animal}
                ehDono={isProprioTutor}
                disponivel={disponivel}
                recuperacao={recuperacao}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm text-[#5f5e5e]">
              {animal.raca}, {animal.sexo.toLowerCase()},{" "}
              {textoCastracao(animal).toLowerCase()}
            </p>
            <CodigoCopiavel codigo={animal.codigo} />
          </div>
        </div>

        {isProprioTutor && (
          <div className="flex items-center gap-2">
            <Botao
              variante="editar"
              tamanho="md"
              icone="edit"
              aria-label={`Editar ${animal.nome}`}
              title="Editar"
              onClick={() => setEditando(true)}
            />
            <Botao
              variante="perigo"
              tamanho="md"
              icone="delete"
              aria-label={`Excluir ${animal.nome}`}
              title="Excluir"
              onClick={() => setExcluindo(true)}
            />
          </div>
        )}
      </div>

      {/* ── Corpo ── */}
      <div className="p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 shrink-0">
            <CarrosselFotos fotos={animal.fotos} nome={animal.nome} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* O destaque vermelho é do tipo confirmado em exame. Sem
                  confirmação o azulejo fica igual aos outros: assim ninguém
                  lê um palpite como se fosse resultado. */}
              <DadoDoador
                destaque={!!tipo}
                label="Tipo sanguíneo"
                valor={tipo || "A confirmar"}
                detalhe={
                  !tipo
                    ? "depende do exame de tipagem"
                    : TIPOS_UNIVERSAIS.includes(tipo)
                      ? "Doador universal"
                      : null
                }
                ajuda={{
                  titulo: "Tipo sanguíneo",
                  texto: !tipo ? (
                    <>
                      <p>
                        O tipo sanguíneo de {animal.nome} ainda não foi
                        registrado. Ele vem do exame de tipagem, e quem anota no
                        perfil é o veterinário que assina a validação.
                      </p>
                      <p>
                        Até lá, o hospital faz a tipagem antes da coleta — o
                        animal pode doar do mesmo jeito.
                      </p>
                    </>
                  ) : chaveEspecie(animal.especie) === "cao" ? (
                      <>
                        <p>
                          Assim como as pessoas, cães têm tipos de sangue. O
                          mais importante é o DEA 1.1.
                        </p>
                        <p>
                          Cães DEA 1.1 negativo são chamados de doadores
                          universais, porque podem doar para a maioria dos
                          cães. O hospital sempre confirma a compatibilidade
                          antes da transfusão.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Gatos podem ter sangue do tipo A, B ou AB.</p>
                        <p>
                          Diferente dos cães, eles já nascem com defesas contra
                          o tipo que não têm — por isso o doador precisa ser
                          compatível com o gato que vai receber. O hospital
                          sempre faz esse teste antes da transfusão.
                        </p>
                      </>
                    ),
                }}
              />
              <DadoDoador
                label="Peso"
                valor={formatarPeso(animal.peso)}
                detalhe={
                  pesoOk
                    ? `mínimo: ${ref.pesoMin} kg`
                    : `abaixo do mínimo (${ref.pesoMin} kg)`
                }
                alerta={!pesoOk}
                ajuda={{
                  titulo: "Por que o peso importa?",
                  texto: (
                    <p>
                      A quantidade de sangue coletada acompanha o tamanho do
                      animal. Por isso existe um peso mínimo — {ref.pesoMin} kg
                      para {animal.especie === "Gato" ? "gatos" : "cães"} — para
                      que a doação seja segura para o próprio doador.
                    </p>
                  ),
                }}
              />
              <DadoDoador
                label="Idade"
                valor={textoIdade(anos)}
                detalhe={
                  idadeOk
                    ? `faixa ideal: ${ref.idadeMin} a ${ref.idadeMax} anos`
                    : `fora da faixa (${ref.idadeMin} a ${ref.idadeMax} anos)`
                }
                alerta={!idadeOk}
                ajuda={{
                  titulo: "Por que a idade importa?",
                  texto: (
                    <p>
                      Animais adultos, entre {ref.idadeMin} e {ref.idadeMax}{" "}
                      anos, costumam estar na melhor fase para doar e se
                      recuperam bem da coleta.
                    </p>
                  ),
                }}
              />
              <DadoDoador
                label="Doações"
                valor={doacoes.length}
                detalhe={
                  ultimaDoacao ? `última em ${ultimaDoacao}` : "ainda não doou"
                }
                acao={{
                  icone: "history",
                  rotulo: `Ver as doações de ${animal.nome}`,
                  onClick: () => setModalDoacoes(true),
                }}
              />
            </div>

            <PainelValidacao
              nomeAnimal={animal.nome}
              validacao={validacao}
              totalValidacoes={historicoValidacoes.length}
              podeValidar={podeAtuarComoVet}
              ehDono={isProprioTutor}
              onValidar={() => setModalValidacaoAberto(true)}
              onVerHistorico={() => setModalHistoricoValidacao(true)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecaoObservacoes
            animal={animal}
            observacoes={observacoes}
            podeAdicionar={podeAtuarComoVet}
            onAdicionar={adicionarObservacao}
          />
          <SecaoDocumentos
            documentos={documentos}
            podeEnviar={isProprioTutor}
            onEnviar={enviarDocumento}
          />
        </div>
      </div>

      {modalValidacaoAberto && (
        <ModalValidacao
          animal={animalAtual}
          validacao={validacao}
          onSalvar={({ tipo: tipoConfirmado, ...nova }) => {
            setHistoricoValidacoes((prev) => [nova, ...prev]);
            setTipo(tipoConfirmado);
            setModalValidacaoAberto(false);
          }}
          onClose={() => setModalValidacaoAberto(false)}
        />
      )}

      {modalHistoricoValidacao && (
        <ModalHistoricoValidacao
          animal={animal}
          criterios={CRITERIOS_DOACAO}
          itens={historicoValidacoes.map((v, i) => ({
            validacao: v,
            status: i === 0 ? statusValidacao(v) : "substituida",
          }))}
          onClose={() => setModalHistoricoValidacao(false)}
        />
      )}

      {modalDoacoes && (
        <ModalDoacoes
          animal={animal}
          doacoes={doacoes}
          podeRegistrar={podeAtuarComoVet}
          hospitais={HOSPITAIS}
          hospitalPadrao={HOSPITAIS[0].id}
          assinatura={{
            nome: nomeProfissional(usuario),
            crmv: usuario.crmv,
          }}
          onRegistrar={(nova) =>
            setDoacoes((prev) =>
              [
                {
                  ...nova,
                  id: Date.now(),
                  veterinario: nomeProfissional(usuario),
                  crmv: usuario.crmv,
                },
                ...prev,
              ].sort((a, b) => paraData(b.data) - paraData(a.data)),
            )
          }
          onClose={() => setModalDoacoes(false)}
        />
      )}

      {editando && (
        <ModalAnimal animal={animalAtual} onClose={() => setEditando(false)} />
      )}

      {excluindo && (
        <ModalExcluirAnimal
          animal={animal}
          disponivel={disponivel}
          onMarcarIndisponivel={() => {
            setDisponivel(false);
            setExcluindo(false);
          }}
          onExcluir={() => {
            setExcluindo(false);
            alert("Animal excluído! (integração com back-end em breve)");
          }}
          onClose={() => setExcluindo(false)}
        />
      )}
    </div>
  );
}

// ─── Card de perfil (tutor ou veterinário) ────────────────────────────────────
function Estatistica({ label, valor, detalhe, destaque }) {
  return (
    <div
      className={`rounded-xl border px-2 sm:px-3 py-3 flex flex-col items-center justify-center text-center gap-0.5 ${
        destaque
          ? "bg-[#8e001b] border-[#8e001b]"
          : "bg-[#fafafa] border-[#f0e6e6]"
      }`}
    >
      <span
        className={`font-extrabold leading-tight ${
          destaque ? "text-white text-2xl" : "text-[#1a1c1c] text-base sm:text-xl"
        }`}
      >
        {valor}
      </span>
      <span
        className={`text-xs font-semibold ${
          destaque ? "text-white/85" : "text-[#5f5e5e]"
        }`}
      >
        {label}
      </span>
      {detalhe && (
        <span
          className={`text-[10px] leading-snug ${destaque ? "text-white/70" : "text-[#5f5e5e]"}`}
        >
          {detalhe}
        </span>
      )}
    </div>
  );
}

function GrupoInfo({ titulo, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-[#8f6f6e] mb-2">{titulo}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function LinhaInfo({ icone, children }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-[#1a1c1c] min-w-0">
      <span className="material-symbols-outlined text-[18px] text-[#8f6f6e] shrink-0">
        {icone}
      </span>
      <span className="min-w-0 flex items-center gap-1.5 flex-wrap">
        {children}
      </span>
    </li>
  );
}

function CardPerfil({
  perfil,
  animais,
  ehProprio,
  acesso,
  meuCodigo,
  onPedirLiberacao,
  onComoFuncionaContato,
}) {
  const ehVet = perfil.role === "vet";
  const doacoes = animais.reduce((soma, a) => soma + a.doacoes.length, 0);
  const f = perfil.genero === "F";

  const descricao = ehVet
    ? `${f ? "Veterinária" : "Veterinário"} no ${perfil.hospital}`
    : `${f ? "Tutora" : "Tutor"} em ${perfil.cidade}`;

  const estatisticas = ehVet
    ? [
        {
          label: "Validações",
          valor: perfil.validacoesRealizadas,
          detalhe: "de doadores na plataforma",
          destaque: true,
        },
        {
          label: "Doações",
          valor: doacoes,
          detalhe: ehProprio ? "feitas pelos seus animais" : "feitas pelos animais",
        },
        { label: "Membro desde", valor: mesAno(perfil.membroDesde) },
      ]
    : [
        {
          label: "Doações",
          valor: doacoes,
          detalhe: ehProprio
            ? "feitas pelos seus animais"
            : `feitas pelos animais de ${primeiroNome(perfil.nome)}`,
          destaque: true,
        },
        {
          label: animais.length === 1 ? "Animal" : "Animais",
          valor: animais.length,
          detalhe: "cadastrados como doadores",
        },
        { label: "Membro desde", valor: mesAno(perfil.membroDesde) },
      ];

  return (
    <div className="bg-white rounded-2xl border border-[#eadede] shadow-[0_1px_2px_rgba(26,28,28,0.04)] overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#8e001b] to-[#b7102a]" />

      <div className="flex flex-col-reverse lg:flex-row lg:items-stretch">
        <div className="flex-1 min-w-0 p-6 lg:p-7 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#1a1c1c] leading-tight">
                {perfil.nomeCompleto}
              </h1>
              <div className="flex items-center gap-2.5 flex-wrap mt-1.5">
                <p className="text-sm text-[#5f5e5e]">{descricao}</p>
                <CodigoCopiavel codigo={perfil.codigo} />
              </div>
            </div>
            {ehProprio && (
              <Botao
                as={Link}
                to="/conta"
                variante="editar"
                tamanho="md"
                icone="edit"
                aria-label="Editar seus dados"
                title="Editar seus dados"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {estatisticas.map((e) => (
              <Estatistica key={e.label} {...e} />
            ))}
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-5 border-t border-[#f0e6e6] ${
              ehVet ? "xl:grid-cols-3" : ""
            }`}
          >
            <BlocoContato
              perfil={perfil}
              primeiroNome={primeiroNome(perfil.nome)}
              ehProprio={ehProprio}
              acesso={acesso}
              meuCodigo={meuCodigo}
              onPedirLiberacao={onPedirLiberacao}
              onComoFunciona={onComoFuncionaContato}
            />

            <GrupoInfo titulo="Localização">
              <LinhaInfo icone="location_on">
                {perfil.bairro}, {perfil.cidade}
              </LinhaInfo>
            </GrupoInfo>

            {ehVet && (
              <GrupoInfo titulo="Registro profissional">
                <LinhaInfo icone="badge">CRMV {perfil.crmv}</LinhaInfo>
                <LinhaInfo icone="local_hospital">{perfil.hospital}</LinhaInfo>
              </GrupoInfo>
            )}
          </div>
        </div>

        {/* Foto sangrando na borda direita. A imagem é absoluta para
            não impor a própria altura ao card. */}
        <div className="relative w-full h-56 lg:h-auto lg:w-64 shrink-0 bg-[#faf0f0] overflow-hidden">
          {perfil.foto ? (
            <img
              src={perfil.foto}
              alt={perfil.nome}
              style={{
                objectPosition: perfil.fotoPosicao || "center top",
                transform: `scale(${perfil.fotoZoom || 1})`,
                transformOrigin: perfil.fotoPosicao || "center top",
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 border-l border-[#eadede] flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[#c9a5a5] text-5xl">
                person
              </span>
              <span className="text-[#c9a5a5] text-xs font-semibold">
                Sem foto ainda
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
function DashboardPage() {
  // Sem :id na rota → /meu-perfil, o próprio perfil de quem está logado.
  // Com :id → /tutor/:id, o perfil de outra pessoa.
  const { id } = useParams();
  const usuario = useSessao();
  const acessoContatos = useAcessoContatos();
  const { liberacoes } = acessoContatos;
  const meusPedidos = pedidosPara(usuario.codigo, acessoContatos);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalLiberar, setModalLiberar] = useState(false);
  const [codigoParaLiberar, setCodigoParaLiberar] = useState("");
  const [modalPedido, setModalPedido] = useState(false);
  const [comoFuncionaContato, setComoFuncionaContato] = useState(false);

  const isProprioTutor = !id;
  const isVet = usuario.role === "vet";
  const perfil = isProprioTutor ? usuario : perfilVisitado(usuario);
  const animaisPerfil = isProprioTutor
    ? isVet
      ? ANIMAIS_MOCK_VET
      : ANIMAIS_MOCK
    : isVet
      ? ANIMAIS_MOCK
      : ANIMAIS_OUTRO_TUTOR;

  const ativas = liberacoesAtivas(liberacoes);
  // O painel lista só o que este veterinário liberou; a checagem de duplicata
  // no modal continua olhando todas, porque o tutor já com acesso de um colega
  // não precisa de uma segunda liberação.
  const minhasLiberacoes = liberacoesDe(usuario.codigo, ativas);
  const acesso = acessoDe(usuario, acessoContatos);

  return (
    <>
      <Header dark={true} />
      {modalAberto && <ModalAnimal onClose={() => setModalAberto(false)} />}
      {modalLiberar && (
        <ModalLiberarAcesso
          tutores={TUTORES_CADASTRADOS}
          liberacoes={ativas}
          codigoInicial={codigoParaLiberar}
          onConfirmar={(dados) => {
            liberarAcesso({
              ...dados,
              liberadoPor: nomeProfissional(usuario),
              veterinarioCodigo: usuario.codigo,
            });
            setModalLiberar(false);
          }}
          onClose={() => setModalLiberar(false)}
        />
      )}
      {modalPedido && (
        <ModalPedirLiberacao
          usuario={usuario}
          hospitais={HOSPITAIS}
          veterinarios={VETERINARIOS}
          onConfirmar={({ caso, veterinario }) => {
            pedirLiberacao({ usuario, caso, veterinario });
            setModalPedido(false);
          }}
          onClose={() => setModalPedido(false)}
        />
      )}
      {comoFuncionaContato && (
        <ModalComoFuncionaContato
          onClose={() => setComoFuncionaContato(false)}
        />
      )}

      <main className="pb-20 px-5 md:px-16 max-w-[1200px] mx-auto pt-28">
        <section className="mb-10">
          <CardPerfil
            perfil={perfil}
            animais={animaisPerfil}
            ehProprio={isProprioTutor}
            acesso={acesso}
            meuCodigo={usuario.codigo}
            onPedirLiberacao={() => setModalPedido(true)}
            onComoFuncionaContato={() => setComoFuncionaContato(true)}
          />
        </section>

        {isProprioTutor && isVet && (
          <section className="mb-10">
            <PainelAcessoContatos
              liberacoes={minhasLiberacoes}
              pedidos={meusPedidos}
              onLiberar={() => {
                setCodigoParaLiberar("");
                setModalLiberar(true);
              }}
              onLiberarPedido={(pedido) =>
                liberarAcesso({
                  tutor: { codigo: pedido.codigo, nome: pedido.nome },
                  horas: 72,
                  caso: pedido.caso,
                  liberadoPor: nomeProfissional(usuario),
                  veterinarioCodigo: usuario.codigo,
                })
              }
              onRecusarPedido={recusarPedido}
              onRenovar={renovarAcesso}
              onEncerrar={encerrarAcesso}
              onComoFunciona={() => setComoFuncionaContato(true)}
            />
          </section>
        )}

        {isVet && !isProprioTutor && (
          <div className="mb-8 bg-[#fdecee] rounded-2xl px-6 py-4 flex items-center gap-4">
            <span className="material-symbols-outlined text-[#8e001b] text-[28px]">
              medical_services
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-[#8e001b] text-sm">
                Você está acessando como veterinário
              </span>
              <span className="text-[#5b403f] text-xs leading-relaxed">
                Você pode validar os critérios de doação e registrar
                observações para a coleta. Sua assinatura (
                {nomeProfissional(usuario)}, CRMV {usuario.crmv}) fica
                visível aos tutores.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-[#1a1c1c]">
            {isProprioTutor ? "Meus animais" : `Animais de ${perfil.nome}`}
          </h2>
          <span className="text-sm text-[#5f5e5e]">
            {animaisPerfil.length}{" "}
            {animaisPerfil.length === 1 ? "animal cadastrado" : "animais cadastrados"}
          </span>
        </div>

        <section className="space-y-6">
          {animaisPerfil.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              isProprioTutor={isProprioTutor}
              isVet={isVet}
              nomeTutor={perfil.nome}
            />
          ))}
          {isProprioTutor && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full py-9 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#e2cfcf] hover:border-[#b7102a]/50 hover:bg-[#fffafa] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
            >
              <div className="w-11 h-11 rounded-full bg-[#b7102a] flex items-center justify-center text-white mb-1 transition-colors group-hover:bg-[#8e001b]">
                <span className="material-symbols-outlined text-[26px]">add</span>
              </div>
              <span className="text-sm font-semibold text-[#1a1c1c]">
                Cadastrar novo animal
              </span>
              <span className="text-xs text-[#5f5e5e]">
                Cada doador cadastrado pode ajudar a salvar uma vida
              </span>
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export default DashboardPage;
