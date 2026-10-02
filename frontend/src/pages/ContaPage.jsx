import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import CampoBairro from "../components/CampoBairro";
import CampoCidade from "../components/CampoCidade";
import Avatar from "../components/Avatar";
import FormularioSenha from "./conta/FormularioSenha";
import ModalEncerrarConta from "./conta/ModalEncerrarConta";
import { useSessao, atualizarConta } from "../servicos/sessao";
import { LIMITES } from "../regras/limites";
import { ehVeterinario, rotuloPapel } from "../util/texto";

// Página "Sua conta": dados pessoais, foto, senha e encerramento da conta.
//
// Os dados do animal são editados no cartão dele, em modal. A conta tem
// página própria porque encerrar uma conta pede espaço para dizer o que se
// perde, e isso não cabe num modal aberto por engano.

// Campos que a pessoa pode mudar por aqui. CPF e CRMV ficam de fora (ver
// DadoFixo).
const CAMPOS_EDITAVEIS = [
  "nomeCompleto",
  "email",
  "telefone",
  "cidade",
  "bairro",
  "hospital",
];

// Cartão branco de uma seção da página, com rodapé opcional para os botões.
function Secao({ titulo, texto, children, rodape }) {
  return (
    <section className="bg-white rounded-2xl border border-[#eadede] shadow-[0_1px_2px_rgba(26,28,28,0.04)] overflow-hidden">
      <div className="px-6 md:px-8 pt-6 pb-5">
        <h2 className="text-lg font-bold text-[#1a1c1c]">{titulo}</h2>
        {texto && (
          <p className="text-sm text-[#5f5e5e] mt-1 leading-relaxed max-w-prose">
            {texto}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {rodape && (
        <div className="border-t border-[#f0e6e6] bg-[#fcfafa] px-6 md:px-8 py-4">
          {rodape}
        </div>
      )}
    </section>
  );
}

// Dado que a pessoa não muda sozinha: fica visível, com o motivo ao lado, em
// vez de virar um campo desabilitado que parece defeito.
function DadoFixo({ rotulo, valor, motivo }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px] text-[#b9a9a9] mt-0.5 shrink-0"
      >
        lock
      </span>
      <div className="min-w-0">
        <p className="text-sm text-[#1a1c1c]">
          <span className="font-semibold">{rotulo}</span> {valor}
        </p>
        <p className="text-xs text-[#5f5e5e] mt-0.5">{motivo}</p>
      </div>
    </div>
  );
}

// Confirmação verde depois de salvar.
function AvisoSalvo({ children }) {
  return (
    <p className="text-sm text-[#1a7f4b] flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[18px]"
      >
        check_circle
      </span>
      {children}
    </p>
  );
}

function ContaPage() {
  const usuario = useSessao();
  const navegar = useNavigate();
  const entradaFoto = useRef(null);

  const [form, setForm] = useState(() =>
    Object.fromEntries(CAMPOS_EDITAVEIS.map((c) => [c, usuario[c] || ""])),
  );
  // URL temporária da foto escolhida, até salvar.
  const [foto, setFoto] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  const ehVet = ehVeterinario(usuario);
  const alterado =
    !!foto || CAMPOS_EDITAVEIS.some((c) => form[c] !== (usuario[c] || ""));
  // Trocar de cidade apaga o bairro: só dá para salvar depois de escolher o
  // novo.
  const localizacaoCompleta = !!form.cidade && !!form.bairro;

  const mudar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setSalvo(false);
  };

  const escolherFoto = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setFoto(URL.createObjectURL(arquivo));
    setSalvo(false);
  };

  // Sem API, salvar atualiza a conta simulada (vale até recarregar a página).
  // O nome curto do topo passa a ser o nome completo digitado.
  const salvar = (e) => {
    e.preventDefault();
    const dados = { ...form, nome: form.nomeCompleto };
    if (foto) {
      dados.foto = foto;
      dados.fotoPosicao = "center top";
      dados.fotoZoom = 1;
    }
    atualizarConta(dados);
    setFoto(null);
    setSalvo(true);
  };

  return (
    <>
      <Header />

      {encerrando && (
        <ModalEncerrarConta
          usuario={usuario}
          onFechar={() => setEncerrando(false)}
          onEncerrar={() => navegar("/")}
        />
      )}

      <main className="pb-20 px-5 md:px-16 max-w-[820px] mx-auto pt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1c]">
            Sua conta
          </h1>
          <p className="text-sm text-[#5f5e5e] mt-1">
            {rotuloPapel(usuario)} · código #{usuario.codigo}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <form onSubmit={salvar}>
            <Secao
              titulo="Seus dados"
              texto="É por aqui que um veterinário ou um tutor com liberação entra em contato quando precisa de um doador."
              rodape={
                <div className="flex items-center gap-4 flex-wrap">
                  <Botao
                    type="submit"
                    disabled={!alterado || !localizacaoCompleta}
                  >
                    Salvar alterações
                  </Botao>
                  {alterado && !localizacaoCompleta && (
                    <p className="text-sm text-[#5f5e5e]">
                      Escolha a cidade e o bairro para salvar.
                    </p>
                  )}
                  {salvo && <AvisoSalvo>Alterações salvas</AvisoSalvo>}
                </div>
              }
            >
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#f0e6e6]">
                <Avatar
                  pessoa={{ ...usuario, foto: foto || usuario.foto }}
                  tamanho="w-20 h-20"
                  fundo="bg-[#b7102a]"
                  formato="rounded-2xl"
                  textoIniciais="text-xl"
                />
                <div>
                  <Botao
                    variante="secundario"
                    icone="photo_camera"
                    onClick={() => entradaFoto.current.click()}
                  >
                    Trocar foto
                  </Botao>
                  <input
                    ref={entradaFoto}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={escolherFoto}
                  />
                  <p className="text-xs text-[#5f5e5e] mt-2">
                    Quem recebe seu contato vê essa foto.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <Campo
                  id="nome"
                  rotulo="Nome completo"
                  autoComplete="name"
                  maxLength={LIMITES.nomeCompleto}
                  value={form.nomeCompleto}
                  onChange={(e) => mudar("nomeCompleto", e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Campo
                    id="email"
                    rotulo="E-mail"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => mudar("email", e.target.value)}
                  />
                  <Campo
                    id="telefone"
                    rotulo="Telefone"
                    type="tel"
                    autoComplete="tel"
                    value={form.telefone}
                    onChange={(e) => mudar("telefone", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <CampoCidade
                    valor={form.cidade}
                    onEscolher={(cidade) => {
                      if (cidade === form.cidade) return;
                      mudar("cidade", cidade);
                      mudar("bairro", "");
                    }}
                  />
                  <CampoBairro
                    cidade={form.cidade}
                    valor={form.bairro}
                    onEscolher={(bairro) => mudar("bairro", bairro)}
                  />
                </div>
                {ehVet && (
                  <Campo
                    id="hospital"
                    rotulo="Local de atuação"
                    value={form.hospital}
                    onChange={(e) => mudar("hospital", e.target.value)}
                  />
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-[#f0e6e6] divide-y divide-[#f6f0f0]">
                <DadoFixo
                  rotulo="CPF"
                  valor={usuario.cpf}
                  motivo="Identifica você nos registros de doação e por isso não muda por aqui."
                />
                {ehVet && (
                  <DadoFixo
                    rotulo="CRMV"
                    valor={usuario.crmv}
                    motivo="Sua assinatura nas validações. Para trocar, o suporte confirma o registro no conselho."
                  />
                )}
              </div>
            </Secao>
          </form>

          <Secao
            titulo="Senha"
            texto="Sua senha é o que impede outra pessoa de responder por você e pelos seus animais."
          >
            {trocandoSenha ? (
              <FormularioSenha
                onSalvar={() => {
                  setTrocandoSenha(false);
                  setSenhaSalva(true);
                }}
                onCancelar={() => setTrocandoSenha(false)}
              />
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <Botao
                  variante="secundario"
                  icone="key"
                  onClick={() => {
                    setTrocandoSenha(true);
                    setSenhaSalva(false);
                  }}
                >
                  Alterar senha
                </Botao>
                {senhaSalva && <AvisoSalvo>Senha alterada</AvisoSalvo>}
              </div>
            )}
          </Secao>

          {/* Único bloco escuro da página: é o que não tem volta. */}
          <section className="bg-[#1a1a1a] rounded-2xl px-6 md:px-8 py-7">
            <h2 className="text-lg font-bold text-white">Encerrar conta</h2>
            <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-prose">
              Seus dados e o cadastro dos seus animais são apagados do UFVet.
              Não dá para desfazer.
            </p>
            <Botao
              variante="contornoClaro"
              className="mt-5"
              onClick={() => setEncerrando(true)}
            >
              Encerrar minha conta
            </Botao>
          </section>
        </div>
      </main>
    </>
  );
}

export default ContaPage;
