-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "sessoes_validas_desde" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "convite_veterinario" (
    "id" UUID NOT NULL,
    "codigo_indice" CHAR(64) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "crmv" VARCHAR(12) NOT NULL,
    "uf_crmv" CHAR(2) NOT NULL,
    "estabelecimento_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "usado_em" TIMESTAMPTZ(3),
    "usado_por_id" UUID,

    CONSTRAINT "convite_veterinario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convite_veterinario_codigo_indice_key" ON "convite_veterinario"("codigo_indice");

-- CreateIndex
CREATE INDEX "convite_veterinario_crmv_uf_crmv_idx" ON "convite_veterinario"("crmv", "uf_crmv");

-- AddForeignKey
ALTER TABLE "convite_veterinario" ADD CONSTRAINT "convite_veterinario_estabelecimento_id_fkey" FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convite_veterinario" ADD CONSTRAINT "convite_veterinario_usado_por_id_fkey" FOREIGN KEY ("usado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
