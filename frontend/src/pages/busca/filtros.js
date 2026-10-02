import { nomeRaca } from "../../regras/doacao";

// Filtros e ordenação da busca de doadores.
//
// Enquanto o site não está ligado à API, a página recebe a lista inteira e
// filtra aqui, na hora. Na integração, estes mesmos filtros passam a ir para a
// API, que devolve só os doadores que interessam.

// Faixa de peso do controle deslizante, por espécie.
export const LIMITES_PESO = {
  CAO: { min: 10, max: 60 },
  GATO: { min: 2, max: 10 },
};

export const FILTROS_INICIAIS = {
  busca: "",
  // Começa mostrando todos: doadores ainda não validados também podem doar,
  // e a ordenação padrão já coloca os validados primeiro.
  apenasValidados: false,
  especie: "CAO",
  tipos: [],
  pesoMax: LIMITES_PESO.CAO.max,
  cidade: "",
  bairro: "",
};

export const ORDENACOES = [
  {
    valor: "validados",
    rotulo: "Validados primeiro",
    comparar: (a, b) => b.validado - a.validado,
  },
  {
    valor: "peso",
    rotulo: "Maior peso",
    comparar: (a, b) => b.pesoKg - a.pesoKg,
  },
  {
    valor: "nome",
    rotulo: "Nome",
    comparar: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  },
];

// O texto da busca procura no nome, na raça, no bairro e no código. O "#" é
// ignorado, para quem cola o código como ele aparece no cartão.
function casaComBusca(doador, busca) {
  const termo = busca.trim().toLowerCase().replace("#", "");
  if (!termo) return true;
  return [doador.nome, nomeRaca(doador), doador.codigo, doador.bairro].some(
    (campo) => campo.toLowerCase().includes(termo),
  );
}

// Doadores que passam por todos os filtros, já na ordem escolhida.
export function filtrarDoadores(doadores, filtros, ordem) {
  const { comparar } = ORDENACOES.find((o) => o.valor === ordem);
  return doadores
    .filter(
      (d) =>
        d.especie === filtros.especie &&
        (!filtros.apenasValidados || d.validado) &&
        (filtros.tipos.length === 0 ||
          filtros.tipos.includes(d.tipoSanguineo)) &&
        d.pesoKg <= filtros.pesoMax &&
        casaComBusca(d, filtros.busca) &&
        (!filtros.cidade || d.cidade === filtros.cidade) &&
        (!filtros.bairro || d.bairro === filtros.bairro),
    )
    .sort(comparar);
}

const ordemAlfabetica = (lista) =>
  [...new Set(lista)].sort((a, b) => a.localeCompare(b, "pt-BR"));

// As cidades e os bairros dos filtros saem dos próprios doadores: a lista
// acompanha os lugares onde o UFVet já tem gente cadastrada.
export const cidadesDe = (doadores) =>
  ordemAlfabetica(doadores.map((d) => d.cidade));

export const bairrosDe = (doadores, cidade) =>
  ordemAlfabetica(
    doadores.filter((d) => d.cidade === cidade).map((d) => d.bairro),
  );
