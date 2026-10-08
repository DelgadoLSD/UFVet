import Ajuda from "../../components/Ajuda";
import Botao from "../../components/Botao";
import { nomeRaca } from "../../regras/doacao";
import { idadeEmAnos, textoIdade } from "../../util/datas";
import { formatarPeso } from "../../util/texto";

// Cartão de um doador nos resultados da busca.
//
// Vertical, com a foto em cima: é o formato que escaneia melhor em grade e dá
// largura total ao texto, sem cortar raça, peso ou tipo sanguíneo. Mostra só
// o que decide a escolha (tipo, porte, bairro, validação); os dados do tutor
// ficam no perfil.
function CartaoDoador({ doador, onVerPerfil }) {
  const { disponivel } = doador;
  const idade = textoIdade(idadeEmAnos(doador.dataNascimento)).toLowerCase();

  return (
    <article
      className={`bg-white border border-[#eadede] rounded-2xl overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-200 hover:border-[#dccaca] hover:shadow-[0_12px_28px_-16px_rgba(26,28,28,0.28)] ${
        disponivel ? "" : "opacity-75"
      }`}
    >
      <div className="relative aspect-[4/3] bg-[#faf0f0]">
        {doador.foto ? (
          <img
            src={doador.foto}
            alt={doador.nome}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[#c9a5a5] text-5xl"
            >
              photo_camera
            </span>
            <span className="text-[#c9a5a5] text-xs font-semibold">
              Sem foto ainda
            </span>
          </div>
        )}
        <span className="absolute bottom-2.5 left-2.5 bg-black/45 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          #{doador.codigo}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#1a1c1c] leading-tight truncate">
            {doador.nome}
          </h3>
          {/* Tipo em vermelho só quando saiu de um exame assinado. Sem
              tipagem, a etiqueta fica cinza e diz o que falta. */}
          {doador.tipoSanguineo ? (
            <span className="bg-[#9e0a24] text-white text-xs font-extrabold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
              {doador.tipoSanguineo}
            </span>
          ) : (
            <span className="bg-[#f3eeee] text-[#5f5e5e] text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
              Sem tipagem
            </span>
          )}
        </div>

        <p className="text-sm text-[#5f5e5e] truncate">
          {nomeRaca(doador)}, {idade}, {formatarPeso(doador.pesoKg)}
        </p>

        <p className="flex items-center gap-1 text-sm text-[#5f5e5e] truncate">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[16px] shrink-0"
          >
            location_on
          </span>
          {doador.bairro}, {doador.cidade}
        </p>

        {/* Status de validação acompanhado do que ele muda na prática. */}
        <div
          className={`mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-xs leading-snug ${
            doador.validado
              ? "bg-emerald-50 text-emerald-900"
              : "bg-[#f5f3f3] text-[#5b403f]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`material-symbols-outlined text-[18px] shrink-0 ${
              doador.validado ? "text-emerald-600" : "text-[#8f6f6e]"
            }`}
          >
            {doador.validado ? "verified_user" : "schedule"}
          </span>
          <span>
            <strong className="block font-semibold">
              {doador.validado ? "Validado" : "Ainda não validado"}
            </strong>
            {doador.validado
              ? "Triagem rápida no hospital"
              : "Exames antes da coleta"}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[#f0e6e6] flex items-center justify-between gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
            disponivel ? "text-emerald-700" : "text-[#5f5e5e]"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${disponivel ? "bg-emerald-500" : "bg-gray-400"}`}
          />
          {disponivel ? "Disponível" : "Indisponível"}
          {!disponivel && (
            <Ajuda titulo="Por que está indisponível?">
              <p>
                O tutor pausou as doações por um tempo — por exemplo, durante
                uma viagem, ou porque o animal doou há pouco e está se
                recuperando.
              </p>
              <p>
                Enquanto isso, o contato dele não aparece para pedidos de
                doação. Vale conferir de novo mais tarde.
              </p>
            </Ajuda>
          )}
        </span>
        <Botao
          variante={disponivel ? "primario" : "secundario"}
          tamanho="sm"
          disabled={!disponivel}
          onClick={onVerPerfil}
          className="shrink-0"
        >
          Ver perfil
        </Botao>
      </div>
    </article>
  );
}

export default CartaoDoador;
