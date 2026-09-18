import { useSyncExternalStore } from "react";
import { daquiAHoras, horasAtras, expirou } from "./tempo";
import mulherFoto from "../assets/people/women1_0-image.jpg";
import homemFoto from "../assets/people/man2_0-image.jpg";
import vetFoto from "../assets/people/man1_0-image.jpg";

// Estado do acesso aos contatos enquanto não há back-end. Fica fora dos
// componentes para que liberações, pedidos e consultas sobrevivam à navegação
// entre páginas — é o que permite ver o registro logo depois de abrir um
// contato.

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

// Cada consulta guarda os dois lados: de quem é o contato (dono) e quem
// abriu (quemViu). Assim o mesmo registro serve para as duas leituras, sem
// listas paralelas que podem discordar.
let estado = {
  liberacoes: [
    {
      id: 1,
      codigo: "T5K2W7",
      nome: "Pedro Alves",
      caso: "Max, cirurgia amanhã",
      liberadoPor: "Dr. Victor Hugo",
      horas: 24,
      expiraEm: daquiAHoras(6),
      consultas: 3,
    },
    {
      id: 2,
      codigo: "T5W2K6",
      nome: "Camila Nunes",
      caso: "Amora, transfusão",
      liberadoPor: "Dr. Victor Hugo",
      horas: 72,
      expiraEm: daquiAHoras(50),
      consultas: 0,
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
  consultas: [
    {
      id: 1,
      quando: horasAtras(5),
      dono: { codigo: "T5W2K6", nome: "Camila Nunes", papel: "Tutora" },
      quemViu: { codigo: "V7H4M2", nome: "Victor Hugo Martins", papel: "Veterinário" },
      permissao: "veterinario",
    },
    {
      id: 2,
      quando: horasAtras(30),
      dono: { codigo: "T7X9K2", nome: "Lucas Silva Delgado", papel: "Tutor" },
      quemViu: { codigo: "V7H4M2", nome: "Victor Hugo Martins", papel: "Veterinário" },
      permissao: "veterinario",
    },
    {
      id: 3,
      quando: horasAtras(20),
      dono: { codigo: "V7H4M2", nome: "Victor Hugo Martins", papel: "Veterinário" },
      quemViu: { codigo: "T5K2W7", nome: "Pedro Alves", papel: "Tutor" },
      permissao: "Dr. Paulo Rezende",
    },
    {
      id: 4,
      quando: horasAtras(52),
      dono: { codigo: "T3M8P1", nome: "Marina Souza Andrade", papel: "Tutora" },
      quemViu: { codigo: "V2C8D5", nome: "Dra. Camila Duarte", papel: "Veterinária" },
      permissao: "veterinario",
    },
    {
      id: 5,
      quando: horasAtras(96),
      dono: { codigo: "T3M8P1", nome: "Marina Souza Andrade", papel: "Tutora" },
      quemViu: { codigo: "T5K2W7", nome: "Pedro Alves", papel: "Tutor" },
      permissao: "Dra. Camila Duarte",
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

// As duas leituras do registro, sempre derivadas da mesma lista.
export const consultasFeitasPor = (codigo, { consultas }) =>
  consultas.filter((c) => c.quemViu.codigo === codigo);

export const consultasAoContatoDe = (codigo, { consultas }) =>
  consultas.filter((c) => c.dono.codigo === codigo);

export function liberarAcesso({ tutor, horas, caso, liberadoPor }) {
  definir({
    ...estado,
    liberacoes: [
      {
        id: Date.now(),
        codigo: tutor.codigo,
        nome: tutor.nome,
        caso,
        liberadoPor,
        horas,
        expiraEm: daquiAHoras(horas),
        consultas: 0,
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

// Registra a consulta e soma no contador da liberação de quem viu, para o
// veterinário acompanhar o uso do acesso que autorizou.
export function registrarConsulta({ dono, quemViu, permissao }) {
  definir({
    ...estado,
    consultas: [
      { id: Date.now(), quando: new Date().toISOString(), dono, quemViu, permissao },
      ...estado.consultas,
    ],
    liberacoes: estado.liberacoes.map((l) =>
      l.codigo === quemViu.codigo ? { ...l, consultas: l.consultas + 1 } : l,
    ),
  });
}
