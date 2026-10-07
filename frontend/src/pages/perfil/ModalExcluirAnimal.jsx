import { useState } from "react";
import AvisoErro from "../../components/AvisoErro";
import Modal from "../../components/Modal";
import Botao from "../../components/Botao";
import { pronomeAnimal } from "../../regras/doacao";
import { excluirAnimal } from "../../servicos/animais";
import { maiuscula } from "../../util/texto";

// Confirmação de exclusão de um animal (F10). Mesma ideia do encerramento de
// conta, em escala menor: a alternativa leve primeiro, deixar indisponível
// (NF10.2), depois o que se perde (NF10.1), e o vermelho sólido só no fim.
function ModalExcluirAnimal({
  animal,
  disponivel,
  onMarcarIndisponivel,
  onExcluido,
  onFechar,
}) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  // "Ele"/"Ela" e "encontrá-lo"/"encontrá-la", conforme o sexo do animal.
  const ele = maiuscula(pronomeAnimal(animal));
  const lo = animal.sexo === "FEMEA" ? "la" : "lo";
  const perdas = [
    `${ele} sai da busca e ninguém mais consegue encontrá-${lo} como doador.`,
    animal.doacoes.length > 0 &&
      `As ${animal.doacoes.length} doações registradas saem do seu histórico.`,
    animal.validacao &&
      `Os exames enviados e a validação de ${animal.validacao.veterinarioNome} são apagados.`,
    "As observações dos veterinários sobre a coleta são apagadas.",
  ].filter(Boolean);

  const excluir = async () => {
    setExcluindo(true);
    setErro("");
    try {
      await excluirAnimal(animal.codigo);
      onExcluido();
    } catch (falha) {
      setErro(falha.message);
      setExcluindo(false);
    }
  };

  return (
    <Modal
      titulo={`Excluir ${animal.nome}`}
      subtitulo="Isso não tem volta"
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={onFechar} disabled={excluindo}>
            Cancelar
          </Botao>
          <Botao variante="perigoSolido" onClick={excluir} disabled={excluindo}>
            {excluindo ? "Excluindo…" : `Excluir ${animal.nome}`}
          </Botao>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {disponivel && (
          <div className="rounded-xl border border-[#e4bebc] bg-[#fdf7f7] p-5">
            <p className="font-bold text-[#1a1c1c]">
              Só não quer receber pedidos agora?
            </p>
            <p className="text-sm text-[#5b403f] mt-1 leading-relaxed">
              Marque {animal.nome} como indisponível. {ele} sai da busca e o
              cadastro continua aqui, com o histórico inteiro.
            </p>
            <Botao
              variante="secundario"
              tamanho="sm"
              className="mt-3"
              onClick={onMarcarIndisponivel}
              disabled={excluindo}
            >
              Marcar como indisponível
            </Botao>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {perdas.map((texto) => (
            <li key={texto} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[20px] text-[#8e001b] shrink-0"
              >
                remove_circle
              </span>
              <span className="text-sm text-[#5b403f] leading-relaxed">
                {texto}
              </span>
            </li>
          ))}
        </ul>

        <AvisoErro>{erro}</AvisoErro>
      </div>
    </Modal>
  );
}

export default ModalExcluirAnimal;
