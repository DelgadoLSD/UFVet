import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { todosCriterios } from "../src/regras/doacao";
import {
  FORM_VAZIO,
  criteriosAfetados,
  errosDoFormulario,
  formularioDoAnimal,
  pedidoDoFormulario,
} from "../src/pages/perfil/formularioAnimal";

// O formulário de cadastro e edição do animal (pages/perfil/
// formularioAnimal.js): o que ele confere e o que manda para a API. O "hoje"
// dos testes é fixo: 07/10/2026.

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});
afterEach(() => vi.useRealTimers());

// Um animal como a API devolve.
const zeus = {
  codigo: "Z7R2K4",
  nome: "Zeus",
  especie: "CAO",
  raca: "Golden Retriever",
  sexo: "MACHO",
  castrado: true,
  dataNascimento: "2021-08-20",
  nascimentoAproximado: false,
  pesoKg: 32,
};

const preenchido = {
  ...FORM_VAZIO,
  nome: " Zeus ",
  raca: "Golden Retriever",
  sexo: "MACHO",
  castrado: "sim",
  dataNascimento: "2021-08-20",
  peso: "32",
};

describe("conferência antes de enviar", () => {
  test("o formulário vazio aponta o que falta, com as mensagens da API", () => {
    expect(errosDoFormulario(FORM_VAZIO)).toEqual({
      nome: "Preencha este campo.",
      sexo: "Escolha macho ou fêmea.",
      castrado: "Responda se é castrado.",
      dataNascimento: "Informe a data de nascimento.",
      pesoKg: "Informe o peso em kg.",
    });
    expect(errosDoFormulario(preenchido)).toEqual({});
  });

  test("recusa nascimento no futuro ou há mais de 30 anos", () => {
    expect(
      errosDoFormulario({ ...preenchido, dataNascimento: "2026-10-08" })
        .dataNascimento,
    ).toBe("A data de nascimento não pode ser depois de hoje.");
    expect(
      errosDoFormulario({ ...preenchido, dataNascimento: "1996-10-06" })
        .dataNascimento,
    ).toBe("Confira a data: mais de 30 anos atrás.");
    expect(
      errosDoFormulario({ ...preenchido, dataNascimento: "2026-10-07" }),
    ).toEqual({});
  });

  test("a idade estimada é em anos inteiros, de 0 a 30", () => {
    const estimando = (idadeEstimada) =>
      errosDoFormulario({ ...preenchido, idadeConhecida: false, idadeEstimada })
        .idadeAproximada;
    const mensagem = "Informe a idade em anos, de 0 a 30.";

    expect(estimando("")).toBe(mensagem);
    expect(estimando("2,5")).toBe(mensagem);
    expect(estimando("31")).toBe(mensagem);
    expect(estimando("-1")).toBe(mensagem);
    expect(estimando("0")).toBeUndefined();
    expect(estimando("5")).toBeUndefined();
  });

  test("o peso aceita vírgula e recusa zero e valores impossíveis", () => {
    const comPeso = (peso) => errosDoFormulario({ ...preenchido, peso }).pesoKg;

    expect(comPeso("4,5")).toBeUndefined();
    expect(comPeso("0")).toBe("Informe o peso em kg.");
    expect(comPeso("abc")).toBe("Informe o peso em kg.");
    expect(comPeso("320")).toBe("Confira o peso: mais de 150 kg.");
  });
});

describe("o que vai para a API", () => {
  test("no cadastro vai tudo, já arrumado", () => {
    expect(pedidoDoFormulario({ ...preenchido, peso: "4,5" })).toEqual({
      nome: "Zeus",
      especie: "CAO",
      raca: "Golden Retriever",
      sexo: "MACHO",
      castrado: true,
      pesoKg: 4.5,
      dataNascimento: "2021-08-20",
    });
  });

  test("SRD vai sem raça, e a idade estimada vai em anos", () => {
    const pedido = pedidoDoFormulario({
      ...preenchido,
      racaSRD: true,
      idadeConhecida: false,
      idadeEstimada: "3",
    });

    expect(pedido.raca).toBeNull();
    expect(pedido.idadeAproximada).toBe(3);
    expect(pedido).not.toHaveProperty("dataNascimento");
  });

  test("na edição vai só o que mudou", () => {
    const form = { ...formularioDoAnimal(zeus), peso: "33,5" };

    expect(pedidoDoFormulario(form, zeus)).toEqual({ pesoKg: 33.5 });
    expect(pedidoDoFormulario(formularioDoAnimal(zeus), zeus)).toEqual({});
  });

  test("a idade estimada só volta para a API se mudar", () => {
    // Estimado em 5 anos há 9 meses: a data guardada é de janeiro de 2021.
    const luna = {
      ...zeus,
      dataNascimento: "2021-01-07",
      nascimentoAproximado: true,
    };
    const form = formularioDoAnimal(luna);

    // Editar o peso não reenvia "5 anos", que recalcularia a data a partir
    // de hoje e faria a estimativa parar de envelhecer.
    expect(pedidoDoFormulario({ ...form, peso: "30" }, luna)).toEqual({
      pesoKg: 30,
    });
    expect(pedidoDoFormulario({ ...form, idadeEstimada: "6" }, luna)).toEqual({
      idadeAproximada: 6,
    });
  });
});

describe("animal com a data de nascimento aproximada", () => {
  test("o formulário abre na idade estimada e não mostra a data (NF12.2)", () => {
    const form = formularioDoAnimal({
      ...zeus,
      dataNascimento: "2021-01-07",
      nascimentoAproximado: true,
    });

    expect(form.idadeConhecida).toBe(false);
    expect(form.idadeEstimada).toBe("5");
    expect(form.dataNascimento).toBe("");
  });
});

describe("aviso sobre a validação (NF9.1)", () => {
  test("mudar peso ou idade desfaz o critério de peso e idade já validado", () => {
    const validado = {
      ...zeus,
      validacao: { criterios: todosCriterios(true) },
    };
    const form = formularioDoAnimal(validado);

    expect(criteriosAfetados({ ...form, nome: "Zeus II" }, validado)).toEqual(
      [],
    );
    expect(
      criteriosAfetados({ ...form, peso: "30" }, validado).map((c) => c.chave),
    ).toEqual(["PESO_IDADE"]);
    expect(
      criteriosAfetados({ ...form, peso: "30" }, { ...zeus, validacao: null }),
    ).toEqual([]);
  });
});
