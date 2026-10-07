// Registro de eventos de segurança: logins, tentativas recusadas, contas
// criadas, limites atingidos e erros inesperados. Cada evento vira uma linha
// JSON no terminal; publicada a API, a hospedagem guarda essas linhas no
// painel de logs.
//
// Nunca entram aqui senha, CPF, e-mail, telefone nem o crachá de sessão: a
// pessoa é identificada pelo id interno da conta. O endereço IP aparece só
// nos eventos de abuso (tentativas recusadas e limites), que é onde ele serve
// para alguma coisa.
//
// Durante os testes automatizados o registro fica em silêncio.
export function registrar(evento, dados = {}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(
    JSON.stringify({ momento: new Date().toISOString(), evento, ...dados }),
  );
}
