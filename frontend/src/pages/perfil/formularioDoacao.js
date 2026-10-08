// O formulário de registro de doação (ModalDoacoes): o que ele confere antes
// de mandar para a API, com as mesmas regras e mensagens dela. Cada problema
// aparece embaixo do próprio campo; sem esta conferência, o botão de registrar
// não fazia nada quando faltava um campo, e ninguém sabia por quê.

// O mesmo limite da API: mais que isso é erro de digitação.
export const VOLUME_MAXIMO_ML = 1000;

// `data` é o dia escolhido no calendário (ou null), `volume` o texto do campo,
// `estabelecimentoId` o local escolhido e `locais` os que a API listou. As
// chaves dos erros são os nomes dos campos na API, para os erros que ela
// devolve caírem nos mesmos lugares.
export function errosDaDoacao({ data, volume, estabelecimentoId, locais }) {
  const erros = {};
  if (!data) erros.dataColeta = "Escolha no calendário o dia da coleta.";

  const texto = String(volume).trim();
  const ml = Number(texto);
  if (!texto || ml < 1) {
    erros.volumeMl = "Informe o volume em mL.";
  } else if (!Number.isInteger(ml)) {
    erros.volumeMl = "Informe o volume em mL, sem casas decimais.";
  } else if (ml > VOLUME_MAXIMO_ML) {
    erros.volumeMl = `Confira o volume: mais de ${VOLUME_MAXIMO_ML} mL.`;
  }

  if (!locais.some((local) => local.id === estabelecimentoId)) {
    erros.estabelecimentoId = "Escolha onde a coleta foi feita.";
  }
  return erros;
}
