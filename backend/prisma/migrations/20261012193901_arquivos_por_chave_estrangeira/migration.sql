-- As fotos e os exames passam a ser ligados à tabela arquivo por chave
-- estrangeira, e não mais pelo endereço ou pelo nome do arquivo guardados
-- como texto. O arquivo ganha um id (uuid), como as outras tabelas, e o
-- formato (WEBP ou PDF), que antes vinha da extensão do nome.
--
-- Os dados que já existem são convertidos. O id é o uuid que já estava no
-- nome do arquivo ("<uuid>.webp"), então os endereços das fotos não mudam.

-- CreateEnum
CREATE TYPE "formato_arquivo" AS ENUM ('WEBP', 'PDF');

-- O id e o formato de cada arquivo, tirados do nome.
ALTER TABLE "arquivo" ADD COLUMN "id" UUID,
ADD COLUMN "formato" "formato_arquivo";
UPDATE "arquivo" SET
  "id" = left("nome", 36)::uuid,
  "formato" = (CASE WHEN "nome" LIKE '%.pdf' THEN 'PDF' ELSE 'WEBP' END)::"formato_arquivo";

-- A foto de perfil: o arquivo do endereço guardado. Um endereço sem arquivo
-- (uma foto perdida antes de os arquivos irem para o banco) vira "sem
-- foto", e o site mostra as iniciais, como já mostrava.
ALTER TABLE "usuario" ADD COLUMN "foto_id" UUID;
UPDATE "usuario" AS u SET "foto_id" = a."id"
FROM "arquivo" AS a
WHERE a."tipo" = 'FOTO' AND u."foto_url" = '/api/arquivos/' || a."nome";

-- As fotos dos animais. A foto sem arquivo sai: ela já não aparecia.
ALTER TABLE "animal_foto" ADD COLUMN "arquivo_id" UUID;
UPDATE "animal_foto" AS f SET "arquivo_id" = a."id"
FROM "arquivo" AS a
WHERE a."tipo" = 'FOTO' AND f."url" = '/api/arquivos/' || a."nome";
DELETE FROM "animal_foto" WHERE "arquivo_id" IS NULL;

-- As versões dos exames. Uma versão sem arquivo faz parte do histórico
-- clínico: em vez de apagá-la, a migração para e avisa, para alguém decidir
-- o que fazer com ela.
ALTER TABLE "documento_versao" ADD COLUMN "arquivo_id" UUID;
UPDATE "documento_versao" AS v SET "arquivo_id" = a."id"
FROM "arquivo" AS a
WHERE a."tipo" = 'EXAME' AND v."arquivo_url" = a."nome";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "documento_versao" WHERE "arquivo_id" IS NULL) THEN
    RAISE EXCEPTION 'Há versões de exame sem o arquivo guardado. Decida o que fazer com elas antes de aplicar esta migração.';
  END IF;
END $$;

-- Daqui em diante, a estrutura do schema.prisma.

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "foto_url";

-- AlterTable
ALTER TABLE "animal_foto" DROP COLUMN "url",
ALTER COLUMN "arquivo_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "documento_versao" DROP COLUMN "arquivo_url",
ALTER COLUMN "arquivo_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "arquivo" DROP CONSTRAINT "arquivo_pkey",
DROP COLUMN "nome",
ALTER COLUMN "id" SET NOT NULL,
ALTER COLUMN "formato" SET NOT NULL,
ADD CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "animal_foto_arquivo_id_key" ON "animal_foto"("arquivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "documento_versao_arquivo_id_key" ON "documento_versao"("arquivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_foto_id_key" ON "usuario"("foto_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_foto" ADD CONSTRAINT "animal_foto_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versao" ADD CONSTRAINT "documento_versao_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
