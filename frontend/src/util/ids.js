// Id provisório para o que é criado no navegador enquanto o site não está
// ligado à API (uma liberação, um pedido, uma doação registrada). Só precisa
// ser único durante a visita, e o prefixo evita colidir com os ids numéricos
// dos dados de exemplo. Na integração, o id passa a vir do banco (uuid).
//
// Não usa a hora atual: duas coisas criadas no mesmo milissegundo ganhariam o
// mesmo id.
let ultimo = 0;

export const idProvisorio = () => `novo-${++ultimo}`;
