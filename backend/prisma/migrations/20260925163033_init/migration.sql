-- CreateEnum
CREATE TYPE "papel_usuario" AS ENUM ('TUTOR', 'VETERINARIO');

-- CreateEnum
CREATE TYPE "tratamento_profissional" AS ENUM ('DR', 'DRA');

-- CreateEnum
CREATE TYPE "especie_animal" AS ENUM ('CAO', 'GATO');

-- CreateEnum
CREATE TYPE "sexo_animal" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "tipo_documento" AS ENUM ('HEMOGRAMA', 'SOROLOGIA', 'VACINACAO');

-- CreateEnum
CREATE TYPE "criterio_doacao" AS ENUM ('TIPAGEM', 'PESO_IDADE', 'VACINACAO', 'SOROLOGIAS', 'SEM_TRANSFUSAO');

-- CreateEnum
CREATE TYPE "motivo_invalidacao" AS ENUM ('EDICAO_PESO', 'EDICAO_NASCIMENTO', 'NOVA_VALIDACAO');

-- CreateEnum
CREATE TYPE "status_pedido" AS ENUM ('PENDENTE', 'ATENDIDO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "tipo_aceite" AS ENUM ('TERMOS_DE_USO', 'CIENCIA_RESPONSABILIDADE');

-- CreateTable
CREATE TABLE "estabelecimento" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "cidade" VARCHAR(80) NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "endereco" VARCHAR(160),
    "telefone" VARCHAR(20),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estabelecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "codigo" CHAR(6) NOT NULL,
    "papel" "papel_usuario" NOT NULL,
    "nome_completo" VARCHAR(120) NOT NULL,
    "cpf_cifrado" TEXT NOT NULL,
    "cpf_indice" CHAR(64) NOT NULL,
    "email_cifrado" TEXT NOT NULL,
    "email_indice" CHAR(64) NOT NULL,
    "senha_hash" VARCHAR(72) NOT NULL,
    "telefone_cifrado" TEXT NOT NULL,
    "cidade" VARCHAR(80) NOT NULL,
    "bairro" VARCHAR(80) NOT NULL,
    "foto_url" VARCHAR(255),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinario" (
    "usuario_id" UUID NOT NULL,
    "crmv" VARCHAR(12) NOT NULL,
    "uf_crmv" CHAR(2) NOT NULL,
    "tratamento" "tratamento_profissional" NOT NULL,
    "estabelecimento_id" UUID NOT NULL,

    CONSTRAINT "veterinario_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "aceite" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo" "tipo_aceite" NOT NULL,
    "versao" VARCHAR(20) NOT NULL,
    "aceito_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aceite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal" (
    "id" UUID NOT NULL,
    "codigo" CHAR(6) NOT NULL,
    "tutor_id" UUID NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "especie" "especie_animal" NOT NULL,
    "raca" VARCHAR(60),
    "sexo" "sexo_animal" NOT NULL,
    "castrado" BOOLEAN NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "nascimento_aproximado" BOOLEAN NOT NULL DEFAULT false,
    "peso_kg" DECIMAL(5,2) NOT NULL,
    "tipo_sanguineo" VARCHAR(20),
    "tipagem_validacao_id" UUID,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_foto" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "ordem" SMALLINT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "tipo" "tipo_documento" NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_versao" (
    "id" UUID NOT NULL,
    "documento_id" UUID NOT NULL,
    "arquivo_url" VARCHAR(255) NOT NULL,
    "enviado_por_id" UUID,
    "enviado_por_nome" VARCHAR(120) NOT NULL,
    "enviado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_versao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validacao" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "veterinario_id" UUID,
    "veterinario_nome" VARCHAR(120) NOT NULL,
    "crmv" VARCHAR(12) NOT NULL,
    "uf_crmv" CHAR(2) NOT NULL,
    "realizada_em" DATE NOT NULL,
    "valida_ate" DATE NOT NULL,
    "tipo_sanguineo_confirmado" VARCHAR(20),
    "nota" TEXT,
    "invalidada_em" TIMESTAMPTZ(3),
    "invalidada_motivo" "motivo_invalidacao",
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validacao_criterio" (
    "validacao_id" UUID NOT NULL,
    "criterio" "criterio_doacao" NOT NULL,
    "atendido" BOOLEAN NOT NULL,

    CONSTRAINT "validacao_criterio_pkey" PRIMARY KEY ("validacao_id","criterio")
);

-- CreateTable
CREATE TABLE "observacao" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "autor_id" UUID,
    "autor_nome" VARCHAR(120) NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doacao" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "veterinario_id" UUID,
    "veterinario_nome" VARCHAR(120) NOT NULL,
    "crmv" VARCHAR(12) NOT NULL,
    "uf_crmv" CHAR(2) NOT NULL,
    "data_coleta" DATE NOT NULL,
    "volume_ml" SMALLINT NOT NULL,
    "nota" TEXT,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_liberacao" (
    "id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "veterinario_id" UUID NOT NULL,
    "caso" TEXT NOT NULL,
    "status" "status_pedido" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondido_em" TIMESTAMPTZ(3),

    CONSTRAINT "pedido_liberacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liberacao_contato" (
    "id" UUID NOT NULL,
    "tutor_id" UUID NOT NULL,
    "veterinario_id" UUID NOT NULL,
    "pedido_id" UUID,
    "caso" VARCHAR(160),
    "concedida_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracao_horas" SMALLINT NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "encerrada_em" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liberacao_contato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_codigo_key" ON "usuario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cpf_indice_key" ON "usuario"("cpf_indice");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_indice_key" ON "usuario"("email_indice");

-- CreateIndex
CREATE INDEX "usuario_cidade_bairro_idx" ON "usuario"("cidade", "bairro");

-- CreateIndex
CREATE UNIQUE INDEX "veterinario_crmv_uf_crmv_key" ON "veterinario"("crmv", "uf_crmv");

-- CreateIndex
CREATE UNIQUE INDEX "animal_codigo_key" ON "animal"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "animal_tipagem_validacao_id_key" ON "animal"("tipagem_validacao_id");

-- CreateIndex
CREATE INDEX "animal_tutor_id_idx" ON "animal"("tutor_id");

-- CreateIndex
CREATE INDEX "animal_especie_disponivel_idx" ON "animal"("especie", "disponivel");

-- CreateIndex
CREATE INDEX "animal_tipo_sanguineo_idx" ON "animal"("tipo_sanguineo");

-- CreateIndex
CREATE UNIQUE INDEX "animal_foto_animal_id_ordem_key" ON "animal_foto"("animal_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "documento_animal_id_tipo_key" ON "documento"("animal_id", "tipo");

-- CreateIndex
CREATE INDEX "validacao_animal_id_realizada_em_idx" ON "validacao"("animal_id", "realizada_em");

-- CreateIndex
CREATE INDEX "observacao_animal_id_criado_em_idx" ON "observacao"("animal_id", "criado_em");

-- CreateIndex
CREATE INDEX "doacao_animal_id_data_coleta_idx" ON "doacao"("animal_id", "data_coleta");

-- CreateIndex
CREATE INDEX "pedido_liberacao_veterinario_id_status_idx" ON "pedido_liberacao"("veterinario_id", "status");

-- CreateIndex
CREATE INDEX "pedido_liberacao_tutor_id_idx" ON "pedido_liberacao"("tutor_id");

-- CreateIndex
CREATE UNIQUE INDEX "liberacao_contato_pedido_id_key" ON "liberacao_contato"("pedido_id");

-- CreateIndex
CREATE INDEX "liberacao_contato_tutor_id_expira_em_idx" ON "liberacao_contato"("tutor_id", "expira_em");

-- CreateIndex
CREATE INDEX "liberacao_contato_veterinario_id_idx" ON "liberacao_contato"("veterinario_id");

-- AddForeignKey
ALTER TABLE "veterinario" ADD CONSTRAINT "veterinario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinario" ADD CONSTRAINT "veterinario_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceite" ADD CONSTRAINT "aceite_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_tipagem_validacao_id_fkey" FOREIGN KEY ("tipagem_validacao_id") REFERENCES "validacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_foto" ADD CONSTRAINT "animal_foto_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versao" ADD CONSTRAINT "documento_versao_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_versao" ADD CONSTRAINT "documento_versao_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validacao" ADD CONSTRAINT "validacao_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validacao" ADD CONSTRAINT "validacao_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validacao_criterio" ADD CONSTRAINT "validacao_criterio_validacao_id_fkey" FOREIGN KEY ("validacao_id") REFERENCES "validacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observacao" ADD CONSTRAINT "observacao_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observacao" ADD CONSTRAINT "observacao_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_liberacao" ADD CONSTRAINT "pedido_liberacao_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_liberacao" ADD CONSTRAINT "pedido_liberacao_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liberacao_contato" ADD CONSTRAINT "liberacao_contato_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liberacao_contato" ADD CONSTRAINT "liberacao_contato_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liberacao_contato" ADD CONSTRAINT "liberacao_contato_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido_liberacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
