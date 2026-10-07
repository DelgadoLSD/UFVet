import { PREENCHA } from "../../regras/conta";
import { CRITERIOS_DOACAO } from "../../regras/doacao";
import { hojeISO, idadeEmAnos, somarAnos } from "../../util/datas";

// O formulário de cadastro e edição do animal (ModalAnimal.jsx): o que ele
// mostra, o que confere antes de enviar e o que manda para a API. Fica fora
// da tela para os testes conferirem as regras sem abrir o navegador.
//
// As mensagens e os limites são os mesmos da API (backend/src/validacao.js).

// Limites que nenhum cão ou gato passa: pegam erro de digitação ("320" no
// lugar de "32,0"), não decidem quem pode doar.
export const PESO_MAXIMO = 150;
export const IDADE_MAXIMA = 30;

export const FORM_VAZIO = {
  nome: "",
  especie: "CAO",
  raca: "",
  racaSRD: false,
  sexo: "",
  castrado: "",
  idadeConhecida: true,
  dataNascimento: "",
  idadeEstimada: "",
  peso: "",
};

// O animal como o formulário mostra. Com a data de nascimento aproximada, o
// formulário abre na idade estimada e não mostra a data, que é só uma conta
// (NF12.2).
export function formularioDoAnimal(animal) {
  const aproximada = !!animal.nascimentoAproximado;
  return {
    ...FORM_VAZIO,
    nome: animal.nome,
    especie: animal.especie,
    raca: animal.raca ?? "",
    racaSRD: !animal.raca,
    sexo: animal.sexo,
    castrado: animal.castrado ? "sim" : "nao",
    idadeConhecida: !aproximada,
    dataNascimento: aproximada ? "" : animal.dataNascimento,
    idadeEstimada: aproximada ? String(idadeEmAnos(animal.dataNascimento)) : "",
    peso: String(animal.pesoKg),
  };
}

// "4,5" -> 4.5; vazio vira NaN, que nenhuma conferência aceita.
const numero = (texto) =>
  String(texto).trim() === ""
    ? NaN
    : Number(String(texto).trim().replace(",", "."));

// O que falta ou está errado, com as chaves dos campos da API, para as
// mensagens da API caírem no mesmo lugar.
export function errosDoFormulario(form) {
  const erros = {};
  if (!form.nome.trim()) erros.nome = PREENCHA;
  if (!form.sexo) erros.sexo = "Escolha macho ou fêmea.";
  if (!form.castrado) erros.castrado = "Responda se é castrado.";

  if (form.idadeConhecida) {
    if (!form.dataNascimento) {
      erros.dataNascimento = "Informe a data de nascimento.";
    } else if (form.dataNascimento > hojeISO()) {
      erros.dataNascimento =
        "A data de nascimento não pode ser depois de hoje.";
    } else if (form.dataNascimento < somarAnos(hojeISO(), -IDADE_MAXIMA)) {
      erros.dataNascimento = `Confira a data: mais de ${IDADE_MAXIMA} anos atrás.`;
    }
  } else {
    const anos = numero(form.idadeEstimada);
    if (!Number.isInteger(anos) || anos < 0 || anos > IDADE_MAXIMA) {
      erros.idadeAproximada = `Informe a idade em anos, de 0 a ${IDADE_MAXIMA}.`;
    }
  }

  const peso = numero(form.peso);
  if (!(peso >= 0.1)) erros.pesoKg = "Informe o peso em kg.";
  else if (peso > PESO_MAXIMO) {
    erros.pesoKg = `Confira o peso: mais de ${PESO_MAXIMO} kg.`;
  }
  return erros;
}

// O pedido para a API. No cadastro vai tudo; na edição, só o que mudou. A
// idade estimada, por exemplo, só volta para a API se mudar: reenviar
// "5 anos" recalcularia a data a partir de hoje, e a estimativa deixaria de
// envelhecer junto com o animal.
export function pedidoDoFormulario(form, animal) {
  const completo = {
    nome: form.nome.trim(),
    especie: form.especie,
    raca: form.racaSRD ? null : form.raca.trim() || null,
    sexo: form.sexo,
    castrado: form.castrado === "sim",
    pesoKg: numero(form.peso),
  };
  const nascimento = form.idadeConhecida
    ? { dataNascimento: form.dataNascimento }
    : { idadeAproximada: numero(form.idadeEstimada) };
  if (!animal) return { ...completo, ...nascimento };

  const antes = formularioDoAnimal(animal);
  const mudou = (...campos) => campos.some((c) => form[c] !== antes[c]);
  const pedido = {};
  if (mudou("nome")) pedido.nome = completo.nome;
  if (mudou("especie")) pedido.especie = completo.especie;
  if (mudou("raca", "racaSRD")) pedido.raca = completo.raca;
  if (mudou("sexo")) pedido.sexo = completo.sexo;
  if (mudou("castrado")) pedido.castrado = completo.castrado;
  if (mudou("peso")) pedido.pesoKg = completo.pesoKg;
  if (mudou("idadeConhecida", "dataNascimento", "idadeEstimada")) {
    Object.assign(pedido, nascimento);
  }
  return pedido;
}

// Dados que o veterinário assinou: mudar um deles derruba o critério que ele
// confirmou, porque a conferência foi feita sobre o valor antigo. Peso muda
// de verdade ao longo da vida, e a data de nascimento pode ter sido digitada
// errada; nos dois casos o tutor corrige e a validação volta para a fila. No
// banco, são os motivos EDICAO_PESO e EDICAO_NASCIMENTO da invalidação (F21).
const CRITERIO_POR_CAMPO = {
  peso: "PESO_IDADE",
  idadeConhecida: "PESO_IDADE",
  dataNascimento: "PESO_IDADE",
  idadeEstimada: "PESO_IDADE",
};

// Os critérios validados que salvar o formulário desfaz (NF9.1).
export function criteriosAfetados(form, animal) {
  if (!animal?.validacao) return [];
  const antes = formularioDoAnimal(animal);
  const chaves = new Set(
    Object.entries(CRITERIO_POR_CAMPO)
      .filter(([campo]) => form[campo] !== antes[campo])
      .map(([, criterio]) => criterio),
  );
  return CRITERIOS_DOACAO.filter(
    (c) => chaves.has(c.chave) && animal.validacao.criterios[c.chave],
  );
}
