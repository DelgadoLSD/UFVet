import { useSyncExternalStore } from "react";
import { daquiAHoras, horasAtras, expirou } from "./tempo";
import mulherFoto from "../assets/people/women1_0-image.jpg";
import homemFoto from "../assets/people/man2_0-image.jpg";
import vetFoto from "../assets/people/man1_0-image.jpg";

// Estado do acesso aos contatos enquanto não há back-end. Fica fora dos
// componentes para que liberações e pedidos sobrevivam à navegação entre
// páginas — é o que permite pedir de uma tela e ver o resultado em outra.

export const TUTORES_CADASTRADOS = [
  {
    codigo: "T3M8P1",
    nome: "Marina Souza Andrade",
    cidade: "Viçosa - MG",
    animais: "Zeus (cão) e Luna (gato)",
    membroDesde: "mar/2026",
    foto: mulherFoto,
    fotoPosicao: "center top",
  },
  {
    codigo: "T7X9K2",
    nome: "Lucas Silva Delgado",
    cidade: "Viçosa - MG",
    animais: "Thor (cão)",
    membroDesde: "jan/2026",
    foto: homemFoto,
    fotoPosicao: "center 25%",
  },
  {
    codigo: "T5K2W7",
    nome: "Pedro Alves",
    cidade: "Viçosa - MG",
    animais: "Max (cão)",
    membroDesde: "set/2025",
  },
  {
    codigo: "T5W2K6",
    nome: "Camila Nunes",
    cidade: "Teixeiras - MG",
    animais: "Amora (gato)",
    membroDesde: "jun/2026",
  },
];

export const acharTutor = (codigo) =>
  TUTORES_CADASTRADOS.find((t) => t.codigo === codigo);

// O site atende vários locais, então a escolha começa pelo hospital: a lista
// de veterinários de um lugar não se mistura com a de outro.
export const HOSPITAIS = [
  { id: "hv-ufv", nome: "Hospital Veterinário UFV", cidade: "Viçosa - MG" },
  { id: "clinica-vida", nome: "Clínica Vida Animal", cidade: "Viçosa - MG" },
];

// O pedido de liberação vai para um veterinário, não para todo mundo. O tutor
// escolhe pelo código, do mesmo jeito que o veterinário libera pelo código do
// tutor.
//
// Cada veterinário pertence a um local só. Quem tem clínica própria não é um
// caso à parte: a clínica entra como mais um local na lista acima, e ele
// aponta para ela. O que fica de fora é o mesmo profissional atuando em dois
// lugares ao mesmo tempo, que exigiria tabela de associação sem resolver
// nenhum problema real do escopo.
export const VETERINARIOS = [
  {
    codigo: "V7H4M2",
    nome: "Victor Hugo Martins",
    genero: "M",
    crmv: "78120-MG",
    hospitalId: "hv-ufv",
    hospital: "Hospital Veterinário UFV",
    foto: vetFoto,
    fotoPosicao: "center 28%",
    fotoZoom: 1.7,
  },
  {
    codigo: "V2C8D5",
    nome: "Camila Duarte",
    genero: "F",
    crmv: "45210-MG",
    hospitalId: "hv-ufv",
    hospital: "Hospital Veterinário UFV",
  },
  {
    codigo: "V9P3R7",
    nome: "Paulo Rezende",
    genero: "M",
    crmv: "88214-MG",
    hospitalId: "hv-ufv",
    hospital: "Hospital Veterinário UFV",
  },
  {
    codigo: "V4T1B8",
    nome: "Beatriz Tavares",
    genero: "F",
    crmv: "51903-MG",
    hospitalId: "clinica-vida",
    hospital: "Clínica Vida Animal",
  },
  {
    codigo: "V6M5N3",
    nome: "Murilo Nogueira",
    genero: "M",
    crmv: "63771-MG",
    hospitalId: "clinica-vida",
    hospital: "Clínica Vida Animal",
  },
];

export const veterinariosDe = (hospitalId) =>
  VETERINARIOS.filter((v) => v.hospitalId === hospitalId);

export const acharVeterinario = (codigo) =>
  VETERINARIOS.find((v) => v.codigo === codigo);

// Cada veterinário vê apenas o que foi endereçado a ele.
export const pedidosPara = (codigo, { pedidos }) =>
  pedidos.filter((p) => p.para.codigo === codigo);

// ...e apenas as liberações que ele mesmo concedeu: quem renova ou encerra é
// quem assumiu a responsabilidade por aquele acesso.
export const liberacoesDe = (codigo, liberacoes) =>
  liberacoes.filter((l) => l.veterinarioCodigo === codigo);

let estado = {
  liberacoes: [
    {
      id: 1,
      codigo: "T5K2W7",
      nome: "Pedro Alves",
      caso: "Max, cirurgia amanhã",
      liberadoPor: "Dr. Victor Hugo",
      veterinarioCodigo: "V7H4M2",
      horas: 24,
      expiraEm: daquiAHoras(6),
    },
    {
      id: 2,
      codigo: "T5W2K6",
      nome: "Camila Nunes",
      // De outra veterinária de propósito: é o caso que prova que o painel
      // mostra só o que cada um liberou.
      caso: "Amora, transfusão",
      liberadoPor: "Dra. Camila Duarte",
      veterinarioCodigo: "V2C8D5",
      horas: 72,
      expiraEm: daquiAHoras(50),
    },
  ],
  pedidos: [
    {
      id: 1,
      codigo: "T7X9K2",
      nome: "Lucas Silva Delgado",
      caso: "Thor precisa de transfusão e o hospital pediu para achar um doador",
      para: { codigo: "V7H4M2", nome: "Dr. Victor Hugo" },
      quando: horasAtras(0.6),
    },
  ],
};

const ouvintes = new Set();
const assinar = (aviso) => {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
};
const definir = (novo) => {
  estado = novo;
  ouvintes.forEach((aviso) => aviso());
};

export function useAcessoContatos() {
  return useSyncExternalStore(assinar, () => estado);
}

// Liberações vencidas somem sozinhas: ninguém precisa lembrar de encerrar.
export const liberacoesAtivas = (liberacoes) =>
  liberacoes.filter((l) => !expirou(l.expiraEm));

// Regra única de quem vê contato: veterinário vê sempre; tutor só com
// liberação ativa de um veterinário.
export function acessoDe(usuario, { liberacoes, pedidos }) {
  if (usuario.role === "vet") return { pode: true, motivo: "veterinario" };

  const liberacao = liberacoesAtivas(liberacoes).find(
    (l) => l.codigo === usuario.codigo,
  );
  if (liberacao) return { pode: true, motivo: "liberacao", liberacao };

  const pedido = pedidos.find((p) => p.codigo === usuario.codigo);
  return pedido
    ? { pode: false, motivo: "pedido-enviado", pedido }
    : { pode: false, motivo: "sem-liberacao" };
}

export function liberarAcesso({
  tutor,
  horas,
  caso,
  liberadoPor,
  veterinarioCodigo,
}) {
  definir({
    ...estado,
    liberacoes: [
      {
        id: Date.now(),
        codigo: tutor.codigo,
        nome: tutor.nome,
        caso,
        liberadoPor,
        veterinarioCodigo,
        horas,
        expiraEm: daquiAHoras(horas),
      },
      ...estado.liberacoes,
    ],
    // Um pedido pendente do mesmo tutor deixa de fazer sentido.
    pedidos: estado.pedidos.filter((p) => p.codigo !== tutor.codigo),
  });
}

export function renovarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.map((l) =>
      l.id === id ? { ...l, expiraEm: daquiAHoras(l.horas) } : l,
    ),
  });
}

export function encerrarAcesso(id) {
  definir({
    ...estado,
    liberacoes: estado.liberacoes.filter((l) => l.id !== id),
  });
}

export function pedirLiberacao({ usuario, caso, veterinario }) {
  if (estado.pedidos.some((p) => p.codigo === usuario.codigo)) return;
  definir({
    ...estado,
    pedidos: [
      {
        id: Date.now(),
        codigo: usuario.codigo,
        nome: usuario.nomeCompleto || usuario.nome,
        caso,
        para: {
          codigo: veterinario.codigo,
          nome: `${veterinario.genero === "F" ? "Dra." : "Dr."} ${veterinario.nome.split(" ")[0]}`,
        },
        quando: new Date().toISOString(),
      },
      ...estado.pedidos,
    ],
  });
}

export function recusarPedido(id) {
  definir({ ...estado, pedidos: estado.pedidos.filter((p) => p.id !== id) });
}
