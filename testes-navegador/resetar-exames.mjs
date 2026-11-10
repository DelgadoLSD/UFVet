// Apaga os exames enviados pelos roteiros (a partir de um instante), com os
// arquivos, e os documentos que ficarem sem versão. Os de exemplo, mais
// antigos, ficam.
// Uso, na pasta backend: node <este arquivo> <instante ISO>
const raiz = new URL("../backend/src/", import.meta.url);
const { banco } = await import(new URL("banco.js", raiz));
const { apagarExames } = await import(new URL("armazenamento.js", raiz));
const desde = new Date(process.argv[2]);
const versoes = await banco.documentoVersao.findMany({
  where: { enviadoEm: { gte: desde } },
  select: { id: true, arquivoId: true },
});
await banco.documentoVersao.deleteMany({
  where: { id: { in: versoes.map((v) => v.id) } },
});
await apagarExames(versoes.map((v) => v.arquivoId));
const vazios = await banco.documento.deleteMany({
  where: { versoes: { none: {} } },
});
console.log(`exames do roteiro apagados: ${versoes.length}; documentos vazios: ${vazios.count}`);
await banco.$disconnect();
