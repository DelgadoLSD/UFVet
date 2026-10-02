import fotoVictor from "../../assets/people/man1_0-image.jpg";
import fotoBeatriz from "../../assets/people/women1_0-image.jpg";
import fotoLucas from "../../assets/people/man2_0-image.jpg";

// Pessoas e locais de exemplo, enquanto o site não está ligado à API.
//
// Cada pessoa é escrita uma vez só; as listas exportadas no fim (contas da
// simulação de login, tutores, veterinários) apontam para os mesmos objetos.
// Na integração, estes dados passam a vir do banco, pela API.
//
// Os campos seguem a tabela usuario do banco (papel, nomeCompleto, cidade no
// formato "Nome - UF"...), com três diferenças que ainda precisam de decisão
// antes da integração, porque o banco não guarda estes dados:
// - nome: o nome curto exibido no topo e nos cartões ("Victor Hugo");
// - genero: escolhe entre "Tutor" e "Tutora", "Dr." e "Dra." (o banco só tem o
//   tratamento DR/DRA, e só para veterinários);
// - animaisResumo: o resumo "Zeus (cão) e Luna (gato)", que viria das tabelas
//   de animais.
// Os campos de foto (fotoPosicao, fotoZoom) ajustam o enquadramento de cada
// retrato e são só de exibição.

export const HOSPITAIS = [
  { id: "hv-ufv", nome: "Hospital Veterinário UFV", cidade: "Viçosa - MG" },
  { id: "clinica-vida", nome: "Clínica Vida Animal", cidade: "Viçosa - MG" },
];

const [HV_UFV, CLINICA_VIDA] = HOSPITAIS;

// ─── Contas da simulação de login ─────────────────────────────────────────────

const VICTOR = {
  codigo: "V7H4M2",
  papel: "VETERINARIO",
  nome: "Victor Hugo",
  nomeCompleto: "Victor Hugo Martins",
  genero: "M",
  cpf: "084.512.336-70",
  email: "victor.hugo@ufv.br",
  telefone: "(31) 99204-7715",
  cidade: "Viçosa - MG",
  bairro: "Centro",
  membroDesde: "2025-02-12",
  crmv: "78120-MG",
  hospitalId: HV_UFV.id,
  hospital: HV_UFV.nome,
  validacoesRealizadas: 27,
  foto: fotoVictor,
  // O rosto fica mais abaixo no quadro e a foto foi tirada de longe: sem
  // posição e zoom próprios, o recorte mostra só a sala.
  fotoPosicao: "center 28%",
  fotoZoom: 1.7,
};

const BEATRIZ = {
  codigo: "T3M8P1",
  papel: "TUTOR",
  nome: "Beatriz dos Reis",
  nomeCompleto: "Beatriz dos Reis",
  genero: "F",
  cpf: "129.447.806-55",
  email: "beatriz.reis@gmail.com",
  telefone: "(31) 98871-4402",
  cidade: "Viçosa - MG",
  bairro: "Ramos",
  membroDesde: "2026-03-08",
  animaisResumo: "Zeus (cão) e Luna (gato)",
  foto: fotoBeatriz,
  fotoPosicao: "center 55%",
};

// ─── Outros tutores ───────────────────────────────────────────────────────────

const LUCAS = {
  codigo: "T7X9K2",
  papel: "TUTOR",
  nome: "Lucas Delgado",
  nomeCompleto: "Lucas Silva Delgado",
  genero: "M",
  email: "lucas.delgado@gmail.com",
  telefone: "(31) 99715-2280",
  cidade: "Viçosa - MG",
  bairro: "Silvestre",
  membroDesde: "2026-01-20",
  animaisResumo: "Thor (cão)",
  foto: fotoLucas,
  fotoPosicao: "center 25%",
};

const PEDRO = {
  codigo: "T5K2W7",
  papel: "TUTOR",
  nome: "Pedro Alves",
  nomeCompleto: "Pedro Alves",
  genero: "M",
  cidade: "Viçosa - MG",
  membroDesde: "2025-09-15",
  animaisResumo: "Max (cão)",
};

const CAMILA_NUNES = {
  codigo: "T5W2K6",
  papel: "TUTOR",
  nome: "Camila Nunes",
  nomeCompleto: "Camila Nunes",
  genero: "F",
  cidade: "Teixeiras - MG",
  membroDesde: "2026-06-03",
  animaisResumo: "Amora (gato)",
};

// ─── Outros veterinários ──────────────────────────────────────────────────────

const veterinario = (codigo, nome, genero, crmv, hospital) => ({
  codigo,
  papel: "VETERINARIO",
  nome,
  nomeCompleto: nome,
  genero,
  crmv,
  hospitalId: hospital.id,
  hospital: hospital.nome,
});

const CAMILA_DUARTE = veterinario(
  "V2C8D5",
  "Camila Duarte",
  "F",
  "45210-MG",
  HV_UFV,
);
const PAULO_REZENDE = veterinario(
  "V9P3R7",
  "Paulo Rezende",
  "M",
  "88214-MG",
  HV_UFV,
);
const BEATRIZ_TAVARES = veterinario(
  "V4T1B8",
  "Beatriz Tavares",
  "F",
  "51903-MG",
  CLINICA_VIDA,
);
const MURILO_NOGUEIRA = veterinario(
  "V6M5N3",
  "Murilo Nogueira",
  "M",
  "63771-MG",
  CLINICA_VIDA,
);

// ─── Listas usadas pelo site ──────────────────────────────────────────────────

// As duas contas que o menu do topo alterna: o mesmo site visto pelo
// veterinário, que vê os contatos livremente, e pela tutora, que só vê com
// liberação. A primeira é a que abre o site.
export const CONTAS = [VICTOR, BEATRIZ];

// Perfil visitado pela tutora: sem ele, ela só veria o próprio perfil, e o
// contato bloqueado nunca apareceria.
export const OUTRO_TUTOR = LUCAS;

// Tutores que um veterinário pode encontrar pelo código para liberar acesso.
export const TUTORES = [BEATRIZ, LUCAS, PEDRO, CAMILA_NUNES];

// Veterinários a quem um tutor pode pedir liberação. Cada um atua em um local
// só; quem tem clínica própria aponta para ela, como mais um local da lista.
export const VETERINARIOS = [
  VICTOR,
  CAMILA_DUARTE,
  PAULO_REZENDE,
  BEATRIZ_TAVARES,
  MURILO_NOGUEIRA,
];
