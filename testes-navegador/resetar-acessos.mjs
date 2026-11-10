// Devolve o acesso aos contatos ao estado dos exemplos: encerra as
// liberações ativas e recusa os pedidos pendentes das contas de exemplo; o
// `npm run db:exemplos` (rodado em seguida) recria os de exemplo.
// Uso, na pasta backend: node <este arquivo>
const { banco } = await import(new URL("../backend/src/banco.js", import.meta.url));
const tutores = await banco.usuario.findMany({ where: { codigo: { in: ["T3M8P1", "T7X9K2", "T5K2W7"] } } });
const ids = tutores.map((t) => t.id);
const l = await banco.liberacaoContato.updateMany({ where: { tutorId: { in: ids }, encerradaEm: null, expiraEm: { gt: new Date() } }, data: { encerradaEm: new Date() } });
const p = await banco.pedidoLiberacao.updateMany({ where: { tutorId: { in: ids }, status: "PENDENTE" }, data: { status: "RECUSADO", respondidoEm: new Date() } });
console.log(`liberações encerradas: ${l.count}; pedidos recusados: ${p.count}`);
await banco.$disconnect();
