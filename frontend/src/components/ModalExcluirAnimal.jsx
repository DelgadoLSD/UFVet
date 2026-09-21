import Modal from "./Modal";
import Botao from "./Botao";

// Mesma ideia do encerramento de conta, em escala menor: a alternativa leve
// primeiro, depois o que se perde, e o vermelho sólido só no fim.
function ModalExcluirAnimal({
  animal,
  disponivel,
  onMarcarIndisponivel,
  onExcluir,
  onClose,
}) {
  const perdas = [
    "Ele sai da busca e ninguém mais consegue encontrá-lo como doador.",
    animal.doacoes.length > 0 &&
      `As ${animal.doacoes.length} doações registradas saem do seu histórico.`,
    animal.validacao &&
      `Os exames enviados e a validação de ${animal.validacao.por} são apagados.`,
    "As observações dos veterinários sobre a coleta são apagadas.",
  ].filter(Boolean);

  return (
    <Modal
      titulo={`Excluir ${animal.nome}`}
      subtitulo="Isso não tem volta"
      largura="max-w-lg"
      onClose={onClose}
      rodape={
        <div className="flex justify-end gap-2">
          <Botao variante="secundario" onClick={onClose}>
            Cancelar
          </Botao>
          <Botao variante="perigoSolido" onClick={onExcluir}>
            Excluir {animal.nome}
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
              Marque {animal.nome} como indisponível. Ele sai da busca e o
              cadastro continua aqui, com o histórico inteiro.
            </p>
            <Botao
              variante="secundario"
              tamanho="sm"
              className="mt-3"
              onClick={onMarcarIndisponivel}
            >
              Marcar como indisponível
            </Botao>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {perdas.map((texto) => (
            <li key={texto} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#8e001b] shrink-0">
                remove_circle
              </span>
              <span className="text-sm text-[#5b403f] leading-relaxed">
                {texto}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

export default ModalExcluirAnimal;
