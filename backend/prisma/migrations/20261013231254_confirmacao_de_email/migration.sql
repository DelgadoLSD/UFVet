-- O e-mail passa a ser confirmado: a conta só entra no site depois que a
-- pessoa abre o link que o UFVet manda para ele. A tabela link_email guarda
-- os links mandados (o de confirmar o e-mail e o de criar senha nova), com a
-- impressão digital do código, nunca o código.
--
-- As contas que já existem contam como confirmadas: elas já usavam o site, e
-- trancá-las agora deixaria as pessoas de fora.

-- CreateEnum
CREATE TYPE "finalidade_link" AS ENUM ('CONFIRMAR_EMAIL', 'NOVA_SENHA');

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN "email_confirmado_em" TIMESTAMPTZ(3);
UPDATE "usuario" SET "email_confirmado_em" = "criado_em";

-- CreateTable
CREATE TABLE "link_email" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "finalidade" "finalidade_link" NOT NULL,
    "codigo_indice" CHAR(64) NOT NULL,
    "email_cifrado" TEXT,
    "email_indice" CHAR(64),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "usado_em" TIMESTAMPTZ(3),

    CONSTRAINT "link_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "link_email_codigo_indice_key" ON "link_email"("codigo_indice");

-- CreateIndex
CREATE INDEX "link_email_usuario_id_finalidade_idx" ON "link_email"("usuario_id", "finalidade");

-- AddForeignKey
ALTER TABLE "link_email" ADD CONSTRAINT "link_email_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

