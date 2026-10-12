-- CreateEnum
CREATE TYPE "tipo_arquivo" AS ENUM ('FOTO', 'EXAME');

-- CreateTable
CREATE TABLE "arquivo" (
    "nome" VARCHAR(64) NOT NULL,
    "tipo" "tipo_arquivo" NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("nome")
);
