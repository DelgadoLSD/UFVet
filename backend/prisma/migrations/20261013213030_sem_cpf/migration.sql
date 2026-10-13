-- O cadastro deixa de pedir o CPF. Nenhuma parte do serviço usa esse dado, e
-- conferir os dígitos não provava que o CPF era da pessoa. Pela LGPD, o que
-- o serviço não usa não deve ser guardado.
--
-- Os CPFs já gravados são apagados junto com as colunas; o índice único sai
-- com a coluna dele.

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "cpf_cifrado",
DROP COLUMN "cpf_indice";
