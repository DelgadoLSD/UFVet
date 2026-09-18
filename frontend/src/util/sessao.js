import { useSyncExternalStore } from "react";
import homemFoto from "../assets/people/man1_0-image.jpg";
import mulherFoto from "../assets/people/women1_0-image.jpg";
import outroHomemFoto from "../assets/people/man2_0-image.jpg";

// Enquanto não há login, o site simula duas contas. A troca serve para
// mostrar o mesmo site pelos dois lados: o veterinário, que vê os contatos
// livremente, e a tutora, que só vê com liberação.
export const CONTAS = [
  {
    codigo: "V7H4M2",
    nome: "Victor Hugo",
    nomeCompleto: "Victor Hugo Martins",
    cpf: "084.512.336-70",
    email: "victor.hugo@ufv.br",
    telefone: "(31) 99204-7715",
    crmv: "78120-MG",
    hospital: "Hospital Veterinário UFV",
    cep: "36570-000",
    cidade: "Viçosa - MG",
    bairro: "Centro",
    membroDesde: "12 Fev 2025",
    role: "vet",
    papel: "Veterinário",
    genero: "M",
    validacoesRealizadas: 27,
    foto: homemFoto,
    // Rosto fica mais abaixo no quadro e a foto foi tirada de longe — sem
    // posição e zoom próprios o recorte mostra só a sala.
    fotoPosicao: "center 28%",
    fotoZoom: 1.7,
  },
  {
    codigo: "T3M8P1",
    nome: "Marina Souza",
    nomeCompleto: "Marina Souza Andrade",
    cpf: "129.447.806-55",
    email: "marina.souza@gmail.com",
    telefone: "(31) 98871-4402",
    cep: "36570-120",
    cidade: "Viçosa - MG",
    bairro: "Ramos",
    membroDesde: "08 Mar 2026",
    role: "tutor",
    papel: "Tutora",
    genero: "F",
    foto: mulherFoto,
    fotoPosicao: "center top",
  },
];

// Tutor visitado quando quem está logado é a tutora: sem ele, ela só veria o
// próprio perfil e o contato bloqueado nunca apareceria.
export const OUTRO_TUTOR = {
  codigo: "T7X9K2",
  nome: "Lucas Delgado",
  nomeCompleto: "Lucas Silva Delgado",
  email: "lucas.delgado@gmail.com",
  telefone: "(31) 99715-2280",
  cep: "36570-250",
  cidade: "Viçosa - MG",
  bairro: "Silvestre",
  membroDesde: "20 Jan 2026",
  role: "tutor",
  papel: "Tutor",
  genero: "M",
  foto: outroHomemFoto,
  fotoPosicao: "center 25%",
};

let conta = CONTAS[0];
const ouvintes = new Set();

const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};

export function useSessao() {
  return useSyncExternalStore(assinar, () => conta);
}

const avisarTodos = () => ouvintes.forEach((aviso) => aviso());

export function trocarConta(codigo) {
  const escolhida = CONTAS.find((c) => c.codigo === codigo);
  if (!escolhida || escolhida === conta) return;
  conta = escolhida;
  avisarTodos();
}

// Edição do próprio cadastro. Sem back-end, o dado novo vale só nesta sessão —
// mas vale em todo o site: o card do perfil e o menu do topo leem daqui.
export function atualizarConta(dados) {
  const atualizada = { ...conta, ...dados };
  CONTAS[CONTAS.indexOf(conta)] = atualizada;
  conta = atualizada;
  avisarTodos();
}

export const contaAtual = () => conta;

// Perfil aberto em /tutor/:id. Um veterinário visita a tutora; uma tutora
// visita outro tutor, que é quando o contato bloqueado aparece.
export const perfilVisitado = (usuario) =>
  usuario.role === "vet" ? CONTAS[1] : OUTRO_TUTOR;
