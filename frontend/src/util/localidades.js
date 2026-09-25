import { BAIRROS } from "../dados/bairros";

// Cidades e bairros escolhidos de uma lista, em vez de digitados: "Viçosa",
// "Vicosa" e "Vissosa" viram a mesma cidade, e o filtro da busca por cidade e
// bairro passa a funcionar para todo mundo.

// Cada nome é comparado de dois jeitos, porque as pessoas erram de dois jeitos:
// - pelo som: ç, ss e z viram s, e letras repetidas contam uma vez. Assim
//   "vissosa" e "visoza" acham Viçosa;
// - pela grafia sem acento: quem tira a cedilha escreve "vicosa", com c.
// Nos dois, maiúsculas, acentos e pontuação não contam. O mapa guarda de que
// letra do texto original veio cada letra da chave, para destacar na tela o
// trecho que casou.
export function normalizar(texto, peloSom = true) {
  let chave = "";
  const mapa = [];
  const minusculo = texto.toLowerCase();

  for (let i = 0; i < minusculo.length; i++) {
    let c = peloSom && minusculo[i] === "ç" ? "s" : minusculo[i];
    c = c.normalize("NFD").replace(/\p{M}/gu, "");
    if (peloSom) {
      if (c === "z") c = "s";
      else if (c === "y") c = "i";
      else if (c === "w") c = "v";
    }
    if (!/^[a-z0-9]$/.test(c)) c = " ";

    const anterior = chave[chave.length - 1];
    if (c === " " && (chave === "" || anterior === " ")) continue;
    if (peloSom && c !== " " && c === anterior) continue;
    chave += c;
    mapa.push(i);
  }

  if (chave.endsWith(" ")) {
    chave = chave.slice(0, -1);
    mapa.pop();
  }
  return { chave, mapa };
}

const formas = (texto) => [normalizar(texto, true), normalizar(texto, false)];

// Quanto menor, melhor: nome igual, depois começo do nome, começo de palavra e,
// por último, o termo em qualquer ponto. -1 quando não casa.
function nivel(chave, termo) {
  if (!termo) return -1;
  if (chave === termo) return 0;
  if (chave.startsWith(termo)) return 1;
  if (chave.includes(" " + termo)) return 2;
  if (chave.includes(termo)) return 3;
  return -1;
}

// Trecho do texto original que corresponde ao termo. Prefere o começo de uma
// palavra ("vis" em "Nova Viçosa" marca "Viç", não o meio de outra palavra).
function acharTrecho({ chave, mapa }, termo) {
  let pos = chave.startsWith(termo) ? 0 : chave.indexOf(" " + termo);
  if (pos > 0) pos += 1;
  if (pos < 0) pos = chave.indexOf(termo);
  if (pos < 0) return null;
  return [mapa[pos], mapa[pos + termo.length - 1] + 1];
}

// Compara um item com o termo nos dois jeitos e fica com o melhor resultado.
// `extras` são outras chaves aceitas (ex.: "viçosa mg"), sem destaque próprio.
function comparar(item, termos) {
  let melhor = -1;
  let trecho = null;
  for (let i = 0; i < 2; i++) {
    const termo = termos[i].chave;
    const n = nivel(item.formas[i].chave, termo);
    if (n >= 0 && (melhor < 0 || n < melhor)) {
      melhor = n;
      trecho = acharTrecho(item.formas[i], termo);
    }
    const extra = item.extras ? nivel(item.extras[i], termo) : -1;
    if (extra >= 0 && (melhor < 0 || extra < melhor)) melhor = extra;
  }
  return { nivel: melhor, trecho };
}

const ehIgual = (item, termos) =>
  [0, 1].some(
    (i) =>
      termos[i].chave &&
      (item.formas[i].chave === termos[i].chave ||
        item.extras?.[i] === termos[i].chave),
  );

// ───────────────────────────── Cidades ─────────────────────────────

// A cidade é guardada como "Nome - UF", o mesmo formato já usado no resto do
// site. Nome e UF juntos são únicos no Brasil; só o nome, não (há três Viçosas).
export const rotuloCidade = (nome, uf) => `${nome} - ${uf}`;

let municipios = null;

// As 5.571 cidades vêm da lista oficial do IBGE e só são baixadas quando alguém
// abre o campo de cidade, para não pesar no carregamento das outras páginas.
export async function carregarMunicipios() {
  if (municipios) return municipios;
  const { default: lista } = await import("../dados/municipios.json");
  municipios = lista.map(([codigo, nome, uf]) => ({
    codigo,
    nome,
    uf,
    rotulo: rotuloCidade(nome, uf),
    formas: formas(nome),
    // Para "vicosa mg" achar Viçosa - MG antes das outras Viçosas.
    extras: formas(`${nome} ${uf}`).map((f) => f.chave),
  }));
  return municipios;
}

// A cidade cujo nome (ou "nome UF") é exatamente o texto, desde que só exista
// uma. Serve para quem digita o nome inteiro e sai do campo sem clicar na lista.
export function cidadeExata(lista, texto) {
  const termos = formas(texto);
  const exatas = lista.filter((c) => ehIgual(c, termos));
  return exatas.length === 1 ? exatas[0].rotulo : null;
}

// O UFVet nasce no Hospital Veterinário da UFV, então, em caso de empate,
// cidades de Minas vêm primeiro: quem digita "vi" quer Viçosa - MG antes de
// Viana - ES.
const UF_DA_CASA = "MG";

// Cidades que aparecem ao abrir o campo, antes de qualquer digitação: a região
// geográfica imediata de Viçosa (IBGE, 2017), que agrupa as cidades cujos
// moradores recorrem a Viçosa para serviços. É de onde vem quem leva um animal
// ao Hospital Veterinário. Viçosa primeiro; as demais em ordem alfabética.
const CIDADE_DA_CASA = 3171303; // Viçosa
const CIDADES_DA_REGIAO = [
  3103702, // Araponga
  3110202, // Cajuri
  3111705, // Canaã
  3116704, // Coimbra
  3124005, // Ervália
  3148301, // Paula Cândido
  3148806, // Pedra do Anta
  3152303, // Porto Firme
  3153103, // Presidente Bernardes
  3163805, // São Miguel do Anta
  3168507, // Teixeiras
];

const paraItem = (cidade, trecho = null) => ({
  id: cidade.codigo,
  rotulo: cidade.nome,
  marcador: cidade.uf,
  valor: cidade.rotulo,
  trecho,
});

// Sugestões sem digitação. Se a pessoa já escolheu uma cidade de fora da
// região, ela aparece no topo, para a escolha atual continuar à vista.
function sugestoesDeCidades(lista, valorAtual) {
  const porCodigo = new Map(lista.map((c) => [c.codigo, c]));
  const regiao = [CIDADE_DA_CASA, ...CIDADES_DA_REGIAO]
    .map((codigo) => porCodigo.get(codigo))
    .filter(Boolean);
  const atual = lista.find((c) => c.rotulo === valorAtual);
  if (atual && !regiao.includes(atual)) regiao.unshift(atual);
  return regiao.map((c) => paraItem(c));
}

export function buscarCidades(lista, texto, valorAtual = "", limite = 8) {
  const termos = formas(texto);
  if (!termos[0].chave && !termos[1].chave) {
    const itens = sugestoesDeCidades(lista, valorAtual);
    return { itens, total: itens.length, sugestoes: true };
  }

  const achadas = [];
  for (const cidade of lista) {
    const r = comparar(cidade, termos);
    if (r.nivel >= 0) achadas.push({ cidade, ...r });
  }
  achadas.sort(
    (a, b) =>
      a.nivel - b.nivel ||
      (b.cidade.uf === UF_DA_CASA) - (a.cidade.uf === UF_DA_CASA) ||
      a.cidade.nome.length - b.cidade.nome.length ||
      a.cidade.nome.localeCompare(b.cidade.nome, "pt-BR"),
  );

  return {
    itens: achadas
      .slice(0, limite)
      .map(({ cidade, trecho }) => paraItem(cidade, trecho)),
    total: achadas.length,
  };
}

// ───────────────────────────── Bairros ─────────────────────────────

const bairrosPreparados = {};

// Lista de bairros da cidade, ou null quando não há lista para ela.
export function bairrosDe(cidade) {
  if (!BAIRROS[cidade]) return null;
  bairrosPreparados[cidade] ??= BAIRROS[cidade].map((nome) => ({
    nome,
    formas: formas(nome),
  }));
  return bairrosPreparados[cidade];
}

// Nome do bairro como está na lista, se o texto for exatamente um deles
// ("centro" vira "Centro").
export function bairroExato(lista, texto) {
  const termos = formas(texto);
  return lista.find((b) => ehIgual(b, termos))?.nome ?? null;
}

// Sem nada digitado, mostra todos os bairros em ordem alfabética. Se nenhum
// bairro começa com o que a pessoa digitou, oferece usar o texto como está:
// nenhuma lista de bairros é completa, e ninguém pode ficar sem se cadastrar
// por isso. Enquanto o texto ainda for o começo de um nome ("silv"), a opção
// não aparece, para não sugerir um pedaço de palavra como bairro.
export function buscarBairros(lista, texto) {
  const termos = formas(texto);
  const escrito = texto.trim().replace(/\s+/g, " ");
  const ordemAlfabetica = (x, y) => x.nome.localeCompare(y.nome, "pt-BR");

  const achados = termos[0].chave || termos[1].chave
    ? lista
        .map((b) => ({ b, ...comparar(b, termos) }))
        .filter((r) => r.nivel >= 0)
        .sort((x, y) => x.nivel - y.nivel || ordemAlfabetica(x.b, y.b))
    : [...lista].sort(ordemAlfabetica).map((b) => ({ b, trecho: null }));

  const itens = achados.map(({ b, trecho }) => ({
    id: b.nome,
    rotulo: b.nome,
    valor: b.nome,
    trecho,
  }));

  const algumComecaAssim = achados.some((r) => r.nivel <= 1);
  if (escrito && !algumComecaAssim) {
    itens.push({ id: "__livre", rotulo: escrito, valor: escrito, livre: true });
  }
  return { itens, total: itens.length };
}
