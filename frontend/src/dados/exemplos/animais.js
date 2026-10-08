import { todosCriterios } from "../../regras/doacao";
import zeus1 from "../../assets/dogs/dog1_0-image.jpg";
import zeus2 from "../../assets/dogs/dog1_1-image.jpg";
import zeus3 from "../../assets/dogs/dog1_2-image.jpg";
import luna from "../../assets/cats/cat1_0-image.jpg";
import bela from "../../assets/dogs/dogs7_0-image.jpg";
import nina from "../../assets/cats/cat7_0-image.jpg";
import thor from "../../assets/dogs/dog4_0-image.jpg";
import hemograma from "../../assets/documents/hemograma.png";
import sorologia from "../../assets/documents/sorologia.png";
import carteiraVacinacao from "../../assets/documents/carteira_vacinacao.jpg";

// Animais de exemplo dos perfis, enquanto o site não está ligado à API.
//
// Os cinco animais cobrem os estados que as telas precisam mostrar: validação
// vencida e substituída (Zeus), nunca validado (Luna), validado (Bela e Thor)
// e com pendências (Nina).
//
// Os campos seguem as tabelas do banco: animal, doacao, validacao,
// validacao_criterio, observacao, documento e documento_versao. Datas em ISO;
// a idade não é guardada, sai de dataNascimento. Como no banco, a raça fica
// vazia (null) quando o animal é SRD.

const HV_UFV = "Hospital Veterinário UFV";

// Uma coleta registrada por um veterinário. O total de doações e a data da
// última saem desta lista: não existe contador guardado à parte que possa
// discordar dela.
let proximaDoacao = 1;
const doacao = (dataColeta, volumeMl, veterinarioNome, crmv, nota = "") => ({
  id: proximaDoacao++,
  dataColeta,
  volumeMl,
  estabelecimento: HV_UFV,
  veterinarioNome,
  crmv,
  nota,
});

const versao = (arquivoUrl, enviadoEm, enviadoPorNome) => ({
  arquivoUrl,
  enviadoEm,
  enviadoPorNome,
});

// Os três documentos de um animal, na ordem em que aparecem no perfil.
const documentos = ({ hemograma = [], sorologia = [], vacinacao = [] }) => [
  { tipo: "HEMOGRAMA", versoes: hemograma },
  { tipo: "SOROLOGIA", versoes: sorologia },
  { tipo: "VACINACAO", versoes: vacinacao },
];

const ZEUS = {
  id: 1,
  codigo: "Z7R2K4",
  nome: "Zeus",
  fotos: [zeus1, zeus2, zeus3],
  especie: "CAO",
  raca: "Golden Retriever",
  sexo: "MACHO",
  castrado: true,
  dataNascimento: "2021-08-20",
  pesoKg: 32,
  tipoSanguineo: "DEA 1.1+",
  disponivel: true,
  doacoes: [
    doacao(
      "2026-09-05",
      450,
      "Dr. Paulo Rezende",
      "88214-MG",
      "Coleta tranquila, sem necessidade de sedação.",
    ),
    doacao("2026-03-10", 450, "Dra. Camila Duarte", "45210-MG"),
    doacao("2025-10-22", 420, "Dr. Paulo Rezende", "88214-MG"),
    doacao("2025-06-18", 450, "Dr. Paulo Rezende", "88214-MG"),
    doacao("2025-02-02", 430, "Dra. Camila Duarte", "45210-MG"),
    doacao(
      "2023-10-15",
      400,
      "Dr. Paulo Rezende",
      "88214-MG",
      "Primeira doação. Agitado no início, depois se acalmou.",
    ),
  ],
  // Da mais recente para a mais antiga. A primeira já venceu (mais de um
  // ano); a segunda foi substituída quando a primeira foi feita.
  validacoes: [
    {
      criterios: todosCriterios(true),
      veterinarioNome: "Dr. Paulo Rezende",
      crmv: "88214-MG",
      realizadaEm: "2025-08-10",
      nota: "",
    },
    {
      criterios: { ...todosCriterios(true), VACINACAO: false },
      veterinarioNome: "Dra. Camila Duarte",
      crmv: "45210-MG",
      realizadaEm: "2024-07-15",
      nota: "Vacina antirrábica vencida. Renovar antes da próxima coleta.",
    },
  ],
  observacoes: [
    {
      criadoEm: "2026-09-05T14:20:00-03:00",
      autorNome: "Dr. Paulo Rezende",
      texto:
        "Dócil e muito colaborativo. Coleta tranquila, sem necessidade de sedação.",
    },
    {
      criadoEm: "2026-03-10T10:05:00-03:00",
      autorNome: "Dra. Camila Duarte",
      texto:
        "Acesso venoso fácil pela jugular; procedimento levou cerca de 10 minutos.",
    },
    {
      criadoEm: "2025-10-22T16:40:00-03:00",
      autorNome: "Dr. Paulo Rezende",
      texto: "Fica mais calmo com a presença da tutora durante a coleta.",
    },
    {
      criadoEm: "2023-10-15T09:30:00-03:00",
      autorNome: "Dr. Paulo Rezende",
      texto:
        "Primeira doação. Ficou um pouco agitado no início, mas logo se acalmou.",
    },
  ],
  documentos: documentos({
    hemograma: [
      versao(hemograma, "2025-10-10", "Beatriz dos Reis"),
      versao(hemograma, "2026-03-02", "Beatriz dos Reis"),
    ],
    vacinacao: [versao(carteiraVacinacao, "2025-10-10", "Beatriz dos Reis")],
  }),
};

const LUNA = {
  id: 2,
  codigo: "L4N8C1",
  nome: "Luna",
  fotos: [luna],
  especie: "GATO",
  raca: null,
  sexo: "FEMEA",
  castrado: true,
  dataNascimento: "2024-06-10",
  pesoKg: 4.5,
  tipoSanguineo: null,
  disponivel: false,
  doacoes: [],
  validacoes: [],
  observacoes: [],
  documentos: documentos({
    sorologia: [versao(sorologia, "2026-03-01", "Beatriz dos Reis")],
  }),
};

const BELA = {
  id: 3,
  codigo: "B3L6D9",
  nome: "Bela",
  fotos: [bela],
  especie: "CAO",
  raca: "Labrador",
  sexo: "FEMEA",
  castrado: true,
  dataNascimento: "2023-05-10",
  pesoKg: 28,
  tipoSanguineo: "DEA 1.1-",
  disponivel: true,
  doacoes: [
    doacao(
      "2026-06-10",
      440,
      "Dra. Camila Duarte",
      "45210-MG",
      "Bastante tranquila; já doou três vezes sem intercorrências.",
    ),
    doacao("2025-12-28", 440, "Dr. Victor Martins", "78120-MG"),
    doacao("2025-08-14", 430, "Dr. Victor Martins", "78120-MG"),
  ],
  validacoes: [
    {
      criterios: todosCriterios(true),
      veterinarioNome: "Dra. Camila Duarte",
      crmv: "45210-MG",
      realizadaEm: "2026-08-20",
      nota: "",
    },
  ],
  observacoes: [
    {
      criadoEm: "2026-06-10T11:10:00-03:00",
      autorNome: "Dra. Camila Duarte",
      texto:
        "Bastante tranquila durante a coleta; já doou 3 vezes sem intercorrências.",
    },
  ],
  documentos: documentos({
    hemograma: [versao(hemograma, "2026-08-20", "Victor Hugo")],
    sorologia: [versao(sorologia, "2026-08-20", "Victor Hugo")],
    vacinacao: [versao(carteiraVacinacao, "2026-08-20", "Victor Hugo")],
  }),
};

const NINA = {
  id: 4,
  codigo: "N9P2F5",
  nome: "Nina",
  fotos: [nina],
  especie: "GATO",
  raca: "Persa",
  sexo: "FEMEA",
  castrado: false,
  dataNascimento: "2022-02-14",
  pesoKg: 3.8,
  tipoSanguineo: "Tipo B",
  disponivel: false,
  doacoes: [],
  validacoes: [
    {
      criterios: {
        TIPAGEM: true,
        PESO_IDADE: false,
        VACINACAO: true,
        SOROLOGIAS: false,
        SEM_TRANSFUSAO: true,
      },
      veterinarioNome: "Dra. Camila Duarte",
      crmv: "45210-MG",
      realizadaEm: "2026-09-05",
      nota: "Peso abaixo do mínimo para gatas doadoras e sorologia de FeLV/FIV ainda não apresentada.",
    },
  ],
  observacoes: [
    {
      criadoEm: "2026-09-05T15:40:00-03:00",
      autorNome: "Dra. Camila Duarte",
      texto:
        "Receosa no manuseio; recomenda-se ambiente silencioso e contenção leve.",
    },
  ],
  documentos: documentos({
    hemograma: [versao(hemograma, "2026-08-28", "Victor Hugo")],
    vacinacao: [versao(carteiraVacinacao, "2026-09-05", "Victor Hugo")],
  }),
};

const THOR = {
  id: 5,
  codigo: "T4H9R2",
  nome: "Thor",
  fotos: [thor],
  especie: "CAO",
  raca: "Border Collie",
  sexo: "MACHO",
  castrado: true,
  dataNascimento: "2022-04-12",
  pesoKg: 29,
  tipoSanguineo: "DEA 1.1-",
  disponivel: true,
  doacoes: [
    doacao(
      "2026-06-12",
      420,
      "Dra. Camila Duarte",
      "45210-MG",
      "Chegou agitado, mas se acalmou com o tutor por perto.",
    ),
    doacao("2026-01-05", 400, "Dra. Camila Duarte", "45210-MG"),
  ],
  validacoes: [
    {
      criterios: todosCriterios(true),
      veterinarioNome: "Dra. Camila Duarte",
      crmv: "45210-MG",
      realizadaEm: "2026-06-18",
      nota: "",
    },
  ],
  observacoes: [
    {
      criadoEm: "2026-06-12T09:30:00-03:00",
      autorNome: "Dra. Camila Duarte",
      texto:
        "Chegou agitado, mas se acalmou com o tutor por perto durante toda a coleta.",
    },
  ],
  documentos: documentos({}),
};

// Animais de cada tutor, pelo código público dele. O veterinário de exemplo
// também tem animais: no site, ele é tutor dos próprios doadores.
export const ANIMAIS_POR_TUTOR = {
  V7H4M2: [BELA, NINA],
  T3M8P1: [ZEUS, LUNA],
  T7X9K2: [THOR],
};
