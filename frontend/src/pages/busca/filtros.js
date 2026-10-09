// Filtros e ordenação da busca de doadores. A tela guarda os filtros que a
// pessoa escolheu; consultaDaBusca os transforma no endereço que vai para a
// API, que filtra, ordena e devolve uma página de cada vez.

// O texto da busca vai até 60 caracteres, como a API aceita.
export const TAMANHO_MAXIMO_BUSCA = 60;

export const FILTROS_INICIAIS = {
  busca: "",
  // Começa mostrando todos: doadores ainda não validados também podem doar,
  // e a ordenação padrão já coloca os validados primeiro.
  apenasValidados: false,
  especie: "CAO",
  tipos: [],
  cidade: "",
  bairro: "",
};

export const ORDENACOES = [
  { valor: "validados", rotulo: "Validados primeiro" },
  { valor: "peso", rotulo: "Maior peso" },
  { valor: "nome", rotulo: "Nome" },
];

// Os filtros da tela -> o endereço da busca na API
// ("especie=CAO&tipos=DEA+4&ordem=validados"). Só vai o que filtra de fato:
// a busca vazia não procura nada, e o bairro só vai junto com a cidade. A
// primeira página não precisa ser dita. Não há filtro de peso: esconder os
// maiores esconderia justamente quem pode doar mais; quem quer vê-los
// primeiro usa a ordem "Maior peso".
export function consultaDaBusca(filtros, ordem, pagina = 1) {
  const consulta = new URLSearchParams({ especie: filtros.especie });
  for (const tipo of filtros.tipos) consulta.append("tipos", tipo);
  if (filtros.cidade) {
    consulta.set("cidade", filtros.cidade);
    if (filtros.bairro) consulta.set("bairro", filtros.bairro);
  }
  if (filtros.apenasValidados) consulta.set("apenasValidados", "true");
  const busca = filtros.busca.trim();
  if (busca) consulta.set("busca", busca);
  consulta.set("ordem", ordem);
  if (pagina > 1) consulta.set("pagina", String(pagina));
  return consulta.toString();
}
