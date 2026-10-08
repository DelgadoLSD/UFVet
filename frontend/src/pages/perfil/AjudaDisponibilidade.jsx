import Ajuda from "../../components/Ajuda";
import { pronomeAnimal } from "../../regras/doacao";

// O "?" ao lado da disponibilidade do animal, embaixo da foto. Para o dono,
// explica como pausar as doações; para quem visita, o que a situação quer
// dizer agora. `recuperacao` vem de situacaoRecuperacao() (regras/doacao).
// `claro` é a versão para fundos vermelhos.
function AjudaDisponibilidade({
  animal,
  ehDono,
  disponivel,
  recuperacao,
  claro = false,
}) {
  const femeaNaoCastrada = animal.sexo === "FEMEA" && !animal.castrado;

  if (ehDono) {
    return (
      <Ajuda titulo="Disponibilidade para doação" claro={claro}>
        <p>
          Use a chave embaixo da foto para mudar. Vai viajar ou {animal.nome}
          não pode doar por um tempo? Pause as doações: outros tutores vão saber
          que {pronomeAnimal(animal)} não está disponível agora, e seu contato
          deixa de aparecer para pedidos de doação até você retomar.
        </p>
        {femeaNaoCastrada && (
          <p>
            Como {animal.nome} não é castrada, deixe-a indisponível durante o
            cio, a gestação e a amamentação.
          </p>
        )}
        {!recuperacao.apto && (
          <p>
            Depois de uma doação, o corpo precisa de cerca de 3 meses para se
            recuperar — por isso a etiqueta mostra até quando.
          </p>
        )}
      </Ajuda>
    );
  }

  return (
    <Ajuda titulo="Disponibilidade para doação" claro={claro}>
      {!disponivel ? (
        <p>
          O tutor pausou as doações por um tempo — por exemplo, durante uma
          viagem. Enquanto isso, o contato dele não aparece para pedidos de
          doação. Vale conferir de novo mais tarde.
        </p>
      ) : !recuperacao.apto ? (
        <p>
          {animal.nome} doou recentemente e precisa de cerca de 3 meses para se
          recuperar antes da próxima doação.
        </p>
      ) : (
        <p>
          O tutor informou que {animal.nome} pode doar agora e está disponível
          para ser contatado.
        </p>
      )}
    </Ajuda>
  );
}

export default AjudaDisponibilidade;
