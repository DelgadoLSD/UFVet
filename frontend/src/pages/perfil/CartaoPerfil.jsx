import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";
import Botao from "../../components/Botao";
import CodigoCopiavel from "../../components/CodigoCopiavel";
import BlocoContato from "./BlocoContato";
import PainelSecao, { CampoPainel } from "./PainelSecao";
import { mesAno } from "../../util/datas";
import { ehVeterinario, primeiroNome, rotuloPapel } from "../../util/texto";

// Cartão do topo do perfil, de tutor ou de veterinário. O nome vem com uma
// etiqueta vermelha do papel ao lado, como a etiqueta da espécie no nome dos
// animais; embaixo, os números numa faixa vermelho-clara (o principal em
// vermelho) e o contato, a localização e, para o veterinário, o registro
// profissional, cada um num painel com faixa colorida no topo. A foto fica à
// direita (a dos animais fica à esquerda, nos cartões deles) e, no celular,
// pequena, ao lado do nome.

// Um número da pessoa, numa célula da faixa. `destaque` pinta de vermelho o
// número principal (as doações, para o tutor; as validações, para o
// veterinário). No celular, cada número é uma linha, com o nome ao lado; a
// partir do tablet, ficam lado a lado, com o nome embaixo.
function Estatistica({ rotulo, valor, detalhe, destaque }) {
  return (
    <li
      className={`px-4 py-3.5 min-w-0 flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-0 ${
        destaque ? "bg-[#9e0a24] text-white" : "bg-[#fdecee] text-[#1a1c1c]"
      }`}
    >
      <span className="w-[7.5rem] shrink-0 sm:w-auto text-2xl font-extrabold leading-none tracking-tight tabular-nums">
        {valor}
      </span>
      <span className="min-w-0 flex flex-col sm:mt-1.5">
        <span className="text-sm font-semibold">{rotulo}</span>
        {detalhe && (
          <span
            className={`text-xs leading-snug mt-0.5 ${
              destaque ? "text-white/85" : "text-[#5b403f]"
            }`}
          >
            {detalhe}
          </span>
        )}
      </span>
    </li>
  );
}

// Os três números do cartão. O veterinário destaca as validações que assinou;
// o tutor, as doações dos seus animais. Sem a lista de animais (`null`,
// enquanto ela vem da API ou se não veio), os números que dependem dela
// aparecem como um traço, em vez de um zero que não é verdade.
function estatisticasDe(perfil, animais, ehProprio) {
  const doacoes = animais
    ? animais.reduce((soma, a) => soma + a.doacoes.length, 0)
    : "–";
  const membroDesde = {
    rotulo: "Membro desde",
    valor: mesAno(perfil.membroDesde),
  };

  if (ehVeterinario(perfil)) {
    return [
      {
        rotulo: "Validações",
        valor: perfil.validacoesRealizadas,
        detalhe: "de doadores na plataforma",
        destaque: true,
      },
      {
        rotulo: "Doações",
        valor: doacoes,
        detalhe: ehProprio
          ? "feitas pelos seus animais"
          : "feitas pelos animais",
      },
      membroDesde,
    ];
  }

  return [
    {
      rotulo: "Doações",
      valor: doacoes,
      detalhe: ehProprio
        ? "feitas pelos seus animais"
        : `feitas pelos animais de ${primeiroNome(perfil.nomeCompleto)}`,
      destaque: true,
    },
    {
      rotulo: animais?.length === 1 ? "Animal" : "Animais",
      valor: animais ? animais.length : "–",
      detalhe: "cadastrados como doadores",
    },
    membroDesde,
  ];
}

function CartaoPerfil({
  perfil,
  animais,
  ehProprio,
  acesso,
  meuCodigo,
  onPedirLiberacao,
  onComoFuncionaContato,
}) {
  const ehVet = ehVeterinario(perfil);

  return (
    <div className="bg-white rounded-2xl border border-[#eadede] overflow-hidden">
      <div className="p-5 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-4">
              <div className="lg:hidden shrink-0">
                <Avatar
                  pessoa={perfil}
                  tamanho="w-20 h-20"
                  fundo="bg-[#9e0a24]"
                  formato="rounded-xl"
                  textoIniciais="text-xl"
                />
              </div>
              {/* O papel fica numa etiqueta ao lado do nome, como a espécie
                  ao lado do nome dos animais. A cidade está em Localização;
                  o hospital do veterinário, em Registro profissional. */}
              <div className="flex-1 min-w-0 flex items-center gap-x-3 gap-y-2 flex-wrap">
                <h1 className="text-[1.75rem] md:text-4xl font-extrabold tracking-tight leading-[1.08] text-[#1a1c1c] [text-wrap:balance]">
                  {perfil.nomeCompleto}
                </h1>
                <span className="text-xs font-bold text-white bg-[#9e0a24] px-2.5 py-1 rounded-md">
                  {rotuloPapel(perfil)}
                </span>
              </div>
              {ehProprio && (
                <Botao
                  as={Link}
                  to="/conta"
                  variante="editar"
                  tamanho="md"
                  icone="edit"
                  aria-label="Editar seus dados"
                  title="Editar seus dados"
                />
              )}
            </div>
            <div>
              <CodigoCopiavel codigo={perfil.codigo} />
            </div>
          </div>

          {/* A mesma faixa dos dados dos animais: células vermelho-claras,
              com o fundo branco aparecendo nos vãos como divisões. */}
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] bg-white rounded-xl overflow-hidden">
            {estatisticasDe(perfil, animais, ehProprio).map((e) => (
              <Estatistica key={e.rotulo} {...e} />
            ))}
          </ul>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
              ehVet ? "xl:grid-cols-3" : ""
            }`}
          >
            <BlocoContato
              key={perfil.codigo}
              perfil={perfil}
              ehProprio={ehProprio}
              acesso={acesso}
              meuCodigo={meuCodigo}
              onPedirLiberacao={onPedirLiberacao}
              onComoFunciona={onComoFuncionaContato}
            />

            <PainelSecao titulo="Localização" nivel="h2">
              <CampoPainel rotulo="Bairro">{perfil.bairro}</CampoPainel>
              <CampoPainel rotulo="Cidade">{perfil.cidade}</CampoPainel>
            </PainelSecao>

            {ehVet && (
              <PainelSecao titulo="Registro profissional" nivel="h2">
                <CampoPainel rotulo="CRMV">{perfil.crmv}</CampoPainel>
                <CampoPainel rotulo="Hospital">{perfil.hospital}</CampoPainel>
              </PainelSecao>
            )}
          </div>
        </div>

        {/* ── Foto, no computador, à direita ── A imagem é absoluta para não
            impor a própria altura ao cartão: a coluna acompanha o que está
            ao lado. */}
        <div className="hidden lg:block relative w-64 shrink-0 min-h-[18rem] rounded-xl overflow-hidden bg-[#fdecee]">
          {perfil.foto ? (
            <img
              src={perfil.foto}
              alt={perfil.nomeCompleto}
              style={{
                objectPosition: perfil.fotoPosicao || "center top",
                transform: `scale(${perfil.fotoZoom || 1})`,
                transformOrigin: perfil.fotoPosicao || "center top",
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#8f6f6e]">
              Sem foto ainda
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartaoPerfil;
