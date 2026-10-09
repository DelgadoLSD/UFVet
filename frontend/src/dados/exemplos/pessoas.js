import fotoVictor from "../../assets/people/man1_0-image.jpg";
import fotoBeatriz from "../../assets/people/women1_0-image.jpg";
import fotoLucas from "../../assets/people/man2_0-image.jpg";

// Pessoas e locais de exemplo, para as telas que ainda não estão ligadas à
// API (perfis visitados, liberações de contato, pedidos).
//
// Cada pessoa é escrita uma vez só; as listas exportadas no fim apontam para
// os mesmos objetos. Os campos seguem a tabela usuario do banco (papel,
// nomeCompleto, cidade no formato "Nome - UF", tratamento DR/DRA dos
// veterinários), mais dois que são só de exibição:
// - animaisResumo: o resumo "Zeus (cão) e Luna (gato)", que vai sair das
//   tabelas de animais;
// - fotoPosicao e fotoZoom: ajustam o enquadramento de cada retrato.
//
// Victor e Beatriz também existem como contas de exemplo no banco, com os
// mesmos códigos (backend/prisma/exemplos.js): quem entra com elas vê os
// animais, pedidos e liberações de exemplo destas telas.

export const HOSPITAIS = [
  { id: "hv-ufv", nome: "Hospital Veterinário UFV", cidade: "Viçosa - MG" },
  { id: "clinica-vida", nome: "Clínica Vida Animal", cidade: "Viçosa - MG" },
];

const [HV_UFV, CLINICA_VIDA] = HOSPITAIS;

// ─── Contas de exemplo ────────────────────────────────────────────────────────

const VICTOR = {
  codigo: "V7H4M2",
  papel: "VETERINARIO",
  nomeCompleto: "Victor Hugo Martins",
  tratamento: "DR",
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
  nomeCompleto: "Beatriz dos Reis",
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
  nomeCompleto: "Lucas Silva Delgado",
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
  nomeCompleto: "Pedro Alves",
  cidade: "Viçosa - MG",
  membroDesde: "2025-09-15",
  animaisResumo: "Max (cão)",
};

const CAMILA_NUNES = {
  codigo: "T5W2K6",
  papel: "TUTOR",
  nomeCompleto: "Camila Nunes",
  cidade: "Teixeiras - MG",
  membroDesde: "2026-06-03",
  animaisResumo: "Amora (gato)",
};

// ─── Outros veterinários ──────────────────────────────────────────────────────

const veterinario = (codigo, nomeCompleto, tratamento, crmv, hospital) => ({
  codigo,
  papel: "VETERINARIO",
  nomeCompleto,
  tratamento,
  crmv,
  hospitalId: hospital.id,
  hospital: hospital.nome,
});

const CAMILA_DUARTE = veterinario(
  "V2C8D5",
  "Camila Duarte",
  "DRA",
  "45210-MG",
  HV_UFV,
);
const PAULO_REZENDE = veterinario(
  "V9P3R7",
  "Paulo Rezende",
  "DR",
  "88214-MG",
  HV_UFV,
);
const BEATRIZ_TAVARES = veterinario(
  "V4T1B8",
  "Beatriz Tavares",
  "DRA",
  "51903-MG",
  CLINICA_VIDA,
);
const MURILO_NOGUEIRA = veterinario(
  "V6M5N3",
  "Murilo Nogueira",
  "DR",
  "63771-MG",
  CLINICA_VIDA,
);

// ─── Listas usadas pelo site ──────────────────────────────────────────────────

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

// Todas as pessoas de exemplo, para achar uma pelo código.
export const PESSOAS = [VICTOR, ...TUTORES, ...VETERINARIOS.slice(1)];
