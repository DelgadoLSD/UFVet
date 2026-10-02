// Fontes citadas na página inicial.
//
// Na ordem em que aparecem na página: o número de cada fonte é a posição dela
// nesta lista, como nas notas de um texto acadêmico. Os critérios de doação
// seguem a ABVHMT e podem variar um pouco entre hospitais.
export const FONTES = [
  {
    id: "msdBanco",
    curta: "MSD Veterinary Manual",
    completa:
      "MSD Veterinary Manual. Screening of Blood Donors and Blood Banking Considerations in Dogs and Cats.",
    url: "https://www.msdvetmanual.com/circulatory-system/blood-groups-and-blood-transfusions-in-dogs-and-cats/screening-of-blood-donors-and-blood-banking-considerations-in-dogs-and-cats",
  },
  {
    id: "uel",
    curta: "Serafim et al., 2024",
    completa:
      "SERAFIM, A. P. et al. Incidência de reações transfusionais em cães em hospital veterinário universitário: estudo retrospectivo. Hematology, Transfusion and Cell Therapy, out. 2024.",
    url: "https://www.htct.com.br/en-incidencia-de-reacoes-transfusionais-em-articulo-S2531137924017553",
  },
  {
    id: "abvhmt",
    curta: "ABVHMT, 2024",
    completa:
      "ABVHMT (Associação Brasileira Veterinária de Hematologia e Medicina Transfusional). Nota Técnica nº 3: Cães e gatos doadores de sangue, requisitos e cuidados. São Paulo, fev. 2024.",
    url: "https://abvhmt.org/wp-content/uploads/2024/02/Nota-Tecnica-ABVHMT-DOADORES-REQUISITOS-E-CUIDADOS.pdf",
  },
  {
    id: "ebc",
    curta: "Radioagência Nacional, 2021",
    completa:
      "Radioagência Nacional (EBC). Saiba o que é preciso para que seu pet seja um doador de sangue. Jun. 2021.",
    url: "https://agenciabrasil.ebc.com.br/radioagencia-nacional/geral/audio/2021-06/saiba-o-que-e-preciso-para-que-seu-pet-seja-um-doador-de-sangue",
  },
  {
    id: "msdGrupos",
    curta: "MSD Veterinary Manual",
    completa: "MSD Veterinary Manual. Blood Groups in Dogs and Cats.",
    url: "https://www.msdvetmanual.com/circulatory-system/blood-groups-and-blood-transfusions-in-dogs-and-cats/blood-groups-in-dogs-and-cats",
  },
];

// Cada fonte pelo id, já com o número que aparece na página.
export const FONTE_POR_ID = Object.fromEntries(
  FONTES.map((f, i) => [f.id, { ...f, numero: i + 1 }]),
);
