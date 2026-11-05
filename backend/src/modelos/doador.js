import { enderecoDaFoto } from "../armazenamento.js";
import { banco } from "../banco.js";
import {
  deDataDoBanco,
  hojeISO,
  subtrairAnos,
  subtrairDias,
} from "../datas.js";
import {
  CRITERIOS_DOACAO,
  DOADORES_POR_PAGINA,
  IDEAL_DO_DOADOR,
  INTERVALO_RECUPERACAO_DIAS,
} from "../validacao.js";

// Model (do MVC) da busca de doadores (F16 a F18): quem aparece, em que
// ordem e o que de cada um sai da API. A busca é pública (NF16.4): nada do
// que sai daqui identifica o tutor além do código e do bairro, e o contato
// nunca vem junto.

// Quem aparece: todo animal que o tutor deixou disponível (F11). É só o tutor
// quem tira um animal da busca. Peso, idade e uma doação recente mudam a ordem,
// mas não escondem ninguém: fora do ideal, ele ainda pode doar, se o
// veterinário avaliar e o tutor decidir.
const DISPONIVEL = { disponivel: true };

// Os pontos em que o animal está fora do ideal da espécie. A idade é em anos
// completos, como o site mostra: 8 anos e 11 meses ainda é 8. No 90º dia depois
// da coleta, o intervalo já está cumprido (F13).
function pontosForaDoIdeal(animal, hoje) {
  const ideal = IDEAL_DO_DOADOR[animal.especie];
  const nascimento = deDataDoBanco(animal.dataNascimento);
  const ultimaColeta = animal.doacoes[0];
  return [
    Number(animal.pesoKg) < ideal.pesoMin,
    nascimento > subtrairAnos(hoje, ideal.idadeMin) ||
      nascimento <= subtrairAnos(hoje, ideal.idadeMax + 1),
    !!ultimaColeta &&
      deDataDoBanco(ultimaColeta.dataColeta) >
        subtrairDias(hoje, INTERVALO_RECUPERACAO_DIAS),
  ].filter(Boolean).length;
}

// O texto da busca procura no nome, na raça, no código do animal e no bairro
// do tutor, sem diferenciar maiúsculas. O "#" é ignorado, para quem cola o
// código como ele aparece no cartão; "SRD" acha os animais sem raça
// definida, que no banco ficam com a raça vazia.
function casaComTexto(busca) {
  const termo = (busca ?? "").replaceAll("#", "").trim();
  if (!termo) return {};
  const parecido = { contains: termo, mode: "insensitive" };
  return {
    OR: [
      { nome: parecido },
      { raca: parecido },
      { codigo: { contains: termo.toUpperCase() } },
      { tutor: { bairro: parecido } },
      ...(termo.toLowerCase() === "srd" ? [{ raca: null }] : []),
    ],
  };
}

// Validado, para a busca, é ter uma validação que vale hoje sem nenhuma
// pendência: a mais recente, ainda no prazo de um ano e com os cinco
// critérios atendidos. Se o tutor mudou o peso ou o nascimento depois dela
// (F21), o critério de peso e idade perdeu o efeito, e ela deixa de contar.
function estaValidado(validacao, hoje) {
  if (!validacao || validacao.invalidadaEm) return false;
  if (deDataDoBanco(validacao.validaAte) < hoje) return false;
  return CRITERIOS_DOACAO.every((criterio) =>
    validacao.criterios.some((c) => c.criterio === criterio && c.atendido),
  );
}

const porNome = new Intl.Collator("pt-BR", { sensitivity: "base" });

// Empate em qualquer ordem: pelo nome e, no fim, pelo código, para a mesma
// busca sempre vir na mesma sequência e as páginas não repetirem ninguém.
const desempatar = (a, b) =>
  porNome.compare(a.animal.nome, b.animal.nome) ||
  (a.animal.codigo < b.animal.codigo ? -1 : 1);

// A ordem padrão é a preferência: quem atende a mais critérios vem antes e,
// entre iguais, quem já foi validado.
const ORDENAR = {
  ideal: (a, b) =>
    a.pontosFora - b.pontosFora || b.validado - a.validado || desempatar(a, b),
  validados: (a, b) =>
    b.validado - a.validado || a.pontosFora - b.pontosFora || desempatar(a, b),
  peso: (a, b) =>
    Number(b.animal.pesoKg) - Number(a.animal.pesoKg) || desempatar(a, b),
  nome: desempatar,
};

// Um doador como a busca o devolve: só o que o cartão mostra. A cidade e o
// bairro são os do tutor (NF16.1), e o código dele leva ao perfil.
function dadosDoDoador({ animal, validado }) {
  return {
    codigo: animal.codigo,
    nome: animal.nome,
    especie: animal.especie,
    raca: animal.raca,
    dataNascimento: deDataDoBanco(animal.dataNascimento),
    nascimentoAproximado: animal.nascimentoAproximado,
    pesoKg: Number(animal.pesoKg),
    tipoSanguineo: animal.tipoSanguineo,
    ultimaDoacao: animal.doacoes[0]
      ? deDataDoBanco(animal.doacoes[0].dataColeta)
      : null,
    validado,
    foto: enderecoDaFoto(animal.fotos[0]?.arquivoId),
    cidade: animal.tutor.cidade,
    bairro: animal.tutor.bairro,
    tutorCodigo: animal.tutor.codigo,
  };
}

// A busca com os filtros já conferidos (esquemaBusca). Os filtros simples
// vão para o banco; a validação (que depende da data de hoje e da regra do
// F21), a ordem e a página são feitas aqui, sobre o que sobrou. Na escala do
// UFVet, uma cidade e a região, essa lista é pequena.
export async function buscarDoadores(filtros) {
  const hoje = hojeISO();
  const animais = await banco.animal.findMany({
    where: {
      especie: filtros.especie,
      ...DISPONIVEL,
      // Com filtro de tipo, só quem tem a tipagem confirmada (F18): o tipo só
      // é gravado por uma validação assinada, então quem não tem tipo fica
      // de fora sozinho.
      ...(filtros.tipos.length > 0 && {
        tipoSanguineo: { in: filtros.tipos },
      }),
      ...(filtros.cidade && {
        tutor: {
          cidade: filtros.cidade,
          ...(filtros.bairro && { bairro: filtros.bairro }),
        },
      }),
      ...casaComTexto(filtros.busca),
    },
    select: {
      codigo: true,
      nome: true,
      especie: true,
      raca: true,
      dataNascimento: true,
      nascimentoAproximado: true,
      pesoKg: true,
      tipoSanguineo: true,
      tutor: { select: { codigo: true, cidade: true, bairro: true } },
      fotos: {
        orderBy: { ordem: "asc" },
        take: 1,
        select: { arquivoId: true },
      },
      validacoes: {
        orderBy: { criadoEm: "desc" },
        take: 1,
        select: {
          validaAte: true,
          invalidadaEm: true,
          criterios: { select: { criterio: true, atendido: true } },
        },
      },
      doacoes: {
        orderBy: { dataColeta: "desc" },
        take: 1,
        select: { dataColeta: true },
      },
    },
  });

  let lista = animais.map((animal) => ({
    animal,
    validado: estaValidado(animal.validacoes[0], hoje),
    pontosFora: pontosForaDoIdeal(animal, hoje),
  }));
  if (filtros.apenasValidados) lista = lista.filter((d) => d.validado);
  lista.sort(ORDENAR[filtros.ordem]);

  const inicio = (filtros.pagina - 1) * DOADORES_POR_PAGINA;
  return {
    total: lista.length,
    doadores: lista
      .slice(inicio, inicio + DOADORES_POR_PAGINA)
      .map(dadosDoDoador),
  };
}

// As cidades e os bairros onde há doadores disponíveis da espécie, para os
// filtros de localização: a lista acompanha os lugares onde o UFVet
// já tem gente, e o bairro vem dentro da cidade (NF16.2).
export async function locaisDeDoadores(especie) {
  const lugares = await banco.usuario.findMany({
    where: {
      animais: { some: { especie, ...DISPONIVEL } },
    },
    select: { cidade: true, bairro: true },
    distinct: ["cidade", "bairro"],
  });

  const bairrosPorCidade = new Map();
  for (const { cidade, bairro } of lugares) {
    if (!bairrosPorCidade.has(cidade)) bairrosPorCidade.set(cidade, []);
    bairrosPorCidade.get(cidade).push(bairro);
  }
  return [...bairrosPorCidade]
    .map(([nome, bairros]) => ({
      nome,
      bairros: bairros.sort(porNome.compare),
    }))
    .sort((a, b) => porNome.compare(a.nome, b.nome));
}
