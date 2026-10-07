import { banco } from "../banco.js";
import { sortearCodigoAnimal, sortearCodigoLivre } from "../codigos.js";
import { deDataDoBanco } from "../datas.js";

// Model (do MVC) dos animais: como achar um animal no banco e o que dele pode
// sair da API. A tabela em si está em prisma/schema.prisma.

// Um código público que nenhum animal usa (NF6.1).
export const codigoAnimalLivre = () =>
  sortearCodigoLivre(
    sortearCodigoAnimal,
    async (codigo) =>
      !!(await banco.animal.findUnique({
        where: { codigo },
        select: { id: true },
      })),
  );

// O animal como a API o devolve. O id interno, o dono e a validação que
// confirmou a tipagem não saem: o animal é identificado pelo código público.
// A idade não vem pronta (F12): o site a calcula da data de nascimento, e,
// quando a data é aproximada, mostra só a idade, nunca a data (NF12.2).
export function dadosDoAnimal(animal) {
  return {
    codigo: animal.codigo,
    nome: animal.nome,
    especie: animal.especie,
    raca: animal.raca,
    sexo: animal.sexo,
    castrado: animal.castrado,
    dataNascimento: deDataDoBanco(animal.dataNascimento),
    nascimentoAproximado: animal.nascimentoAproximado,
    // O banco guarda decimal(5,2), que chega como texto exato; na API, número.
    pesoKg: Number(animal.pesoKg),
    tipoSanguineo: animal.tipoSanguineo,
    disponivel: animal.disponivel,
    criadoEm: animal.criadoEm,
  };
}
