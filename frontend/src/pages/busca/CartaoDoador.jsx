import { Link } from "react-router-dom";
import Ajuda from "../../components/Ajuda";
import { enderecoDoAnimal } from "../perfil/animalEscolhido";
import { nomeRaca, partesDoTipo } from "../../regras/doacao";
import { idadeEmAnos } from "../../util/datas";
import { formatarPeso } from "../../util/texto";

// Cartão de um doador nos resultados da busca, no desenho do cartão do animal
// no perfil, em tamanho menor: o cabeçalho vermelho com o nome e a raça, a
// foto emoldurada, sem nada por cima, e a faixa de dados em células
// encostadas: tipo sanguíneo, peso e idade, e embaixo, numa linha inteira, a
// validação. O cartão inteiro leva ao perfil do tutor, já aberto neste
// animal. Cada parte tem altura
// fixa (o texto longo é cortado), para as linhas dos cartões lado a lado
// ficarem alinhadas. Todo doador da busca pode doar agora: o pausado pelo
// tutor e o que está se recuperando de uma coleta nem aparecem.

const SITUACAO_VALIDACAO = {
  validado: {
    titulo: "Validado por veterinário",
    icone: "verified",
    explicacao:
      "Um veterinário já conferiu os exames e os critérios de doação. No hospital, basta uma checagem rápida, e a coleta pode acontecer no mesmo dia.",
  },
  naoValidado: {
    titulo: "Ainda não validado",
    icone: "schedule",
    explicacao:
      "Pode doar normalmente, mas os exames ainda não foram conferidos por um veterinário. O hospital faz esses exames antes da coleta, e os resultados levam alguns dias.",
  },
};

// A validação é um dado do doador como o tipo, o peso e a idade, então fica
// na mesma faixa, numa linha inteira embaixo das células (como a linha das
// doações no cartão do perfil). Validado: linha preta, o preto das
// confirmações do site e da área do veterinário, com o selo de verificado
// cheio. Não validado: linha rosada como as outras células, com um relógio.
// Os dois diferem na claridade (preta contra rosada), no ícone e no texto, e
// não só na cor. O "?" no fim da linha explica o que a situação muda no dia
// da coleta; fica acima do link que cobre o cartão, para tocar nele abrir a
// explicação, e não o perfil.
function LinhaValidacao({ validado }) {
  const situacao = SITUACAO_VALIDACAO[validado ? "validado" : "naoValidado"];
  return (
    <div
      className={`col-span-3 h-11 px-3 flex items-center gap-2 ${
        validado ? "bg-[#1a1c1c] text-white" : "bg-[#fdecee] text-[#5f5e5e]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-[18px] shrink-0 ${
          validado ? "" : "text-[#8f6f6e]"
        }`}
        style={validado ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {situacao.icone}
      </span>
      <p
        className={`flex-1 min-w-0 truncate text-sm ${
          validado ? "font-bold" : "font-semibold"
        }`}
      >
        {situacao.titulo}
      </p>
      <Ajuda
        titulo={situacao.titulo}
        claro={validado}
        className="relative z-10"
      >
        <p>{situacao.explicacao}</p>
      </Ajuda>
    </div>
  );
}

// Uma célula da faixa de dados: o nome pequeno em cima e o valor grande
// embaixo, como na faixa do perfil. A do tipo confirmado em exame é vermelha
// (`destaque`); a do que ainda não se sabe tem o valor menor e cinza
// (`apagado`). `tamanho` é a classe do valor; `leitor`, o que o leitor de
// tela fala no lugar do texto da célula ("DEA 1.1 negativo", não "1.1−").
function Dado({ legenda, valor, tamanho, leitor, destaque, apagado }) {
  const cor = destaque
    ? "text-white"
    : apagado
      ? "text-[#5f5e5e]"
      : "text-[#1a1c1c]";
  return (
    <div
      className={`px-2.5 py-2.5 min-w-0 ${destaque ? "bg-[#9e0a24]" : "bg-[#fdecee]"}`}
    >
      {leitor && <span className="sr-only">{leitor}</span>}
      <p
        aria-hidden={leitor ? true : undefined}
        className={`text-[11px] font-semibold leading-none truncate ${
          destaque ? "text-white/80" : "text-[#5b403f]"
        }`}
      >
        {legenda}
      </p>
      <p
        aria-hidden={leitor ? true : undefined}
        className={`mt-1.5 h-6 leading-6 font-extrabold tracking-tight tabular-nums truncate ${cor} ${tamanho}`}
      >
        {valor}
      </p>
    </div>
  );
}

// A idade em duas partes, para caber na célula e ser lida de cima para
// baixo: "Idade / 5 anos", "Cerca de / 5 anos" (aproximada, NF12.1) ou
// "Menos de / 1 ano".
function partesDaIdade(anos, aproximada) {
  if (anos <= 0) return { legenda: "Menos de", valor: "1 ano" };
  return {
    legenda: aproximada ? "Cerca de" : "Idade",
    valor: `${anos} ano${anos > 1 ? "s" : ""}`,
  };
}

function CartaoDoador({ doador }) {
  const idade = partesDaIdade(
    idadeEmAnos(doador.dataNascimento),
    doador.nascimentoAproximado,
  );
  const tipo = doador.tipoSanguineo && partesDoTipo(doador.tipoSanguineo);

  return (
    <article
      aria-label={doador.nome}
      className="group relative bg-white rounded-2xl border border-[#eadede] overflow-hidden has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[#1a1c1c] has-[a:focus-visible]:ring-offset-2"
    >
      <header className="bg-[#9e0a24] text-white px-4 py-3 transition-colors group-hover:bg-[#7d0a1d]">
        {/* O link do nome cobre o cartão inteiro (o ::after, à frente da
            foto), para qualquer ponto dele abrir o perfil. */}
        <h3 className="text-xl xl:text-[1.375rem] font-extrabold leading-tight tracking-tight truncate">
          <Link
            to={enderecoDoAnimal(doador.tutorCodigo, doador.codigo)}
            className="focus-visible:outline-none after:absolute after:inset-0 after:z-[1]"
          >
            <span className="sr-only">Ver perfil de </span>
            {doador.nome}
          </Link>
        </h3>
        <p className="text-sm text-white/85 truncate">{nomeRaca(doador)}</p>
      </header>

      <div className="p-3 flex flex-col gap-3">
        <div className="relative aspect-[5/4] rounded-xl overflow-hidden bg-[#fdecee]">
          {doador.foto ? (
            <img
              src={doador.foto}
              alt={doador.nome}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#8f6f6e]">
              Sem foto ainda
            </p>
          )}
        </div>

        {/* As divisões são o fundo branco aparecendo nos vãos de 2px entre
            as células. O tipo ganha a célula mais larga; a validação, a
            linha inteira de baixo. */}
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-[2px] rounded-xl overflow-hidden">
          {tipo ? (
            <Dado
              legenda={tipo.sistema}
              valor={tipo.valor}
              tamanho={
                tipo.valor.length > 4
                  ? "text-base xl:text-lg"
                  : "text-xl xl:text-2xl"
              }
              leitor={`Tipo sanguíneo ${tipo.porExtenso}`}
              destaque
            />
          ) : (
            <Dado
              legenda="Tipo"
              valor="Sem tipagem"
              tamanho="text-sm"
              apagado
            />
          )}
          <Dado
            legenda="Peso"
            valor={formatarPeso(doador.pesoKg)}
            tamanho="text-base xl:text-lg"
          />
          <Dado
            legenda={idade.legenda}
            valor={idade.valor}
            tamanho="text-base xl:text-lg"
          />
          <LinhaValidacao validado={doador.validado} />
        </div>

        <p className="flex items-center gap-1 text-sm text-[#5b403f] min-w-0">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px] shrink-0 text-[#8f6f6e]"
          >
            location_on
          </span>
          <span className="truncate">
            {doador.bairro}, {doador.cidade}
          </span>
        </p>
      </div>
    </article>
  );
}

export default CartaoDoador;
