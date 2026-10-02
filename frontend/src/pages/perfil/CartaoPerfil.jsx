import { Link } from "react-router-dom";
import Botao from "../../components/Botao";
import CodigoCopiavel from "../../components/CodigoCopiavel";
import BlocoContato from "./BlocoContato";
import { mesAno } from "../../util/datas";
import { ehVeterinario, primeiroNome, rotuloPapel } from "../../util/texto";

// Cartão do topo do perfil, de tutor ou de veterinário: nome, números,
// contato, localização e, para o veterinário, o registro profissional. A foto
// fica à direita (em cima, no celular).

// Um número em destaque, com o nome embaixo. `destaque` pinta o principal de
// vermelho.
function Estatistica({ rotulo, valor, detalhe, destaque }) {
  return (
    <div
      className={`rounded-xl border px-2 sm:px-3 py-3 flex flex-col items-center justify-center text-center gap-0.5 ${
        destaque
          ? "bg-[#8e001b] border-[#8e001b]"
          : "bg-[#fafafa] border-[#f0e6e6]"
      }`}
    >
      <span
        className={`font-extrabold leading-tight ${
          destaque
            ? "text-white text-2xl"
            : "text-[#1a1c1c] text-base sm:text-xl"
        }`}
      >
        {valor}
      </span>
      <span
        className={`text-xs font-semibold ${
          destaque ? "text-white/85" : "text-[#5f5e5e]"
        }`}
      >
        {rotulo}
      </span>
      {detalhe && (
        <span
          className={`text-[10px] leading-snug ${destaque ? "text-white/70" : "text-[#5f5e5e]"}`}
        >
          {detalhe}
        </span>
      )}
    </div>
  );
}

function GrupoInfo({ titulo, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-[#8f6f6e] mb-2">{titulo}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function LinhaInfo({ icone, children }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-[#1a1c1c] min-w-0">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px] text-[#8f6f6e] shrink-0"
      >
        {icone}
      </span>
      <span className="min-w-0 flex items-center gap-1.5 flex-wrap">
        {children}
      </span>
    </li>
  );
}

// Os três números do cartão. O veterinário destaca as validações que assinou;
// o tutor, as doações dos seus animais.
function estatisticasDe(perfil, animais, ehProprio) {
  const doacoes = animais.reduce((soma, a) => soma + a.doacoes.length, 0);
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
        : `feitas pelos animais de ${primeiroNome(perfil.nome)}`,
      destaque: true,
    },
    {
      rotulo: animais.length === 1 ? "Animal" : "Animais",
      valor: animais.length,
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
  const descricao = ehVet
    ? `${rotuloPapel(perfil)} no ${perfil.hospital}`
    : `${rotuloPapel(perfil)} em ${perfil.cidade}`;

  return (
    <div className="bg-white rounded-2xl border border-[#eadede] shadow-[0_1px_2px_rgba(26,28,28,0.04)] overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#8e001b] to-[#b7102a]" />

      <div className="flex flex-col-reverse lg:flex-row lg:items-stretch">
        <div className="flex-1 min-w-0 p-6 lg:p-7 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#1a1c1c] leading-tight">
                {perfil.nomeCompleto}
              </h1>
              <div className="flex items-center gap-2.5 flex-wrap mt-1.5">
                <p className="text-sm text-[#5f5e5e]">{descricao}</p>
                <CodigoCopiavel codigo={perfil.codigo} />
              </div>
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

          <div className="grid grid-cols-3 gap-3">
            {estatisticasDe(perfil, animais, ehProprio).map((e) => (
              <Estatistica key={e.rotulo} {...e} />
            ))}
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-5 border-t border-[#f0e6e6] ${
              ehVet ? "xl:grid-cols-3" : ""
            }`}
          >
            <BlocoContato
              perfil={perfil}
              ehProprio={ehProprio}
              acesso={acesso}
              meuCodigo={meuCodigo}
              onPedirLiberacao={onPedirLiberacao}
              onComoFunciona={onComoFuncionaContato}
            />

            <GrupoInfo titulo="Localização">
              <LinhaInfo icone="location_on">
                {perfil.bairro}, {perfil.cidade}
              </LinhaInfo>
            </GrupoInfo>

            {ehVet && (
              <GrupoInfo titulo="Registro profissional">
                <LinhaInfo icone="badge">CRMV {perfil.crmv}</LinhaInfo>
                <LinhaInfo icone="local_hospital">{perfil.hospital}</LinhaInfo>
              </GrupoInfo>
            )}
          </div>
        </div>

        {/* Foto sangrando na borda direita. A imagem é absoluta para não
            impor a própria altura ao cartão. */}
        <div className="relative w-full h-56 lg:h-auto lg:w-64 shrink-0 bg-[#faf0f0] overflow-hidden">
          {perfil.foto ? (
            <img
              src={perfil.foto}
              alt={perfil.nome}
              style={{
                objectPosition: perfil.fotoPosicao || "center top",
                transform: `scale(${perfil.fotoZoom || 1})`,
                transformOrigin: perfil.fotoPosicao || "center top",
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 border-l border-[#eadede] flex flex-col items-center justify-center gap-2">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[#c9a5a5] text-5xl"
              >
                person
              </span>
              <span className="text-[#c9a5a5] text-xs font-semibold">
                Sem foto ainda
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartaoPerfil;
