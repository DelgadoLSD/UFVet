import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import CampoBairro from "../components/CampoBairro";
import CampoCidade from "../components/CampoCidade";
import Avatar from "../components/Avatar";
import FormularioSenha from "./conta/FormularioSenha";
import ModalEncerrarConta from "./conta/ModalEncerrarConta";
import {
  conferirDisponibilidade,
  sairDeTodosOsAparelhos,
  salvarConta,
  useSessao,
} from "../servicos/sessao";
import {
  erroEmail,
  erroNome,
  erroTelefone,
  soComProblema,
} from "../regras/conta";
import { LIMITES } from "../regras/limites";
import { ehVeterinario, formatarTelefone, rotuloPapel } from "../util/texto";

// Página "Minha conta": dados pessoais (F3), senha (F4), saída dos outros
// aparelhos e encerramento da conta (F5).
//
// Os dados do animal são editados no cartão dele, em modal. A conta tem
// página própria porque encerrar uma conta pede espaço para dizer o que se
// perde, e isso não cabe num modal aberto por engano.

// Campos que a pessoa pode mudar por aqui. CPF, CRMV e o local de atuação
// do veterinário ficam de fora (ver DadoFixo).
const CAMPOS_EDITAVEIS = [
  "nomeCompleto",
  "email",
  "telefone",
  "cidade",
  "bairro",
];

const dadosDoFormulario = (usuario) =>
  Object.fromEntries(CAMPOS_EDITAVEIS.map((c) => [c, usuario[c] || ""]));

// Conferência de cada campo de texto, a mesma do cadastro.
const CONFERENCIAS = {
  nomeCompleto: erroNome,
  email: erroEmail,
  telefone: erroTelefone,
};

// O e-mail como a API compara: sem espaços nas pontas e em minúsculas.
const normalizarEmail = (email) => email.trim().toLowerCase();

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
    <p
      role="status"
      className="text-sm text-[#1a7f4b] flex items-center gap-1.5"
    >
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

// Mensagem de erro embaixo de um campo que não é um Campo (cidade, bairro).
function ErroDoCampo({ children }) {
  if (!children) return null;
  return <p className="text-xs text-red-600 mt-2">{children}</p>;
}

function ContaPage() {
  const usuario = useSessao();
  const navegar = useNavigate();

  const [form, setForm] = useState(() => dadosDoFormulario(usuario));
  // A senha atual, pedida só quando o e-mail muda.
  const [senhaParaEmail, setSenhaParaEmail] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  // A mensagem depois de salvar.
  const [salvo, setSalvo] = useState("");
  // O e-mail digitado por último: a resposta atrasada da conferência de um
  // e-mail que a pessoa já mudou é ignorada.
  const emailDigitado = useRef(form.email);

  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [erroAparelhos, setErroAparelhos] = useState("");
  const [encerrando, setEncerrando] = useState(false);

  const ehVet = ehVeterinario(usuario);
  const alterado = CAMPOS_EDITAVEIS.some((c) => form[c] !== (usuario[c] || ""));
  const trocandoEmail = normalizarEmail(form.email) !== usuario.email;
  // Trocar de cidade apaga o bairro: só dá para salvar depois de escolher o
  // novo.
  const localizacaoCompleta = !!form.cidade && !!form.bairro;

  // Mudar um campo apaga o erro dele.
  const mudar = (campo, valor) => {
    if (campo === "email") emailDigitado.current = valor;
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: undefined }));
    setErroGeral("");
    setSalvo("");
  };

  // Ao sair de um campo de texto: se está mal escrito, avisa já. Um e-mail
  // novo ainda vai à API, para saber se já é de outra conta. Falha de conexão
  // aqui não avisa nada: a API confere de novo ao salvar.
  const sairDoCampo = async (campo) => {
    const valor = form[campo];
    if (!valor.trim()) return;
    const erro = CONFERENCIAS[campo](valor);
    if (erro) {
      setErros((prev) => ({ ...prev, [campo]: erro }));
      return;
    }
    if (campo !== "email" || normalizarEmail(valor) === usuario.email) return;
    try {
      const repetidos = await conferirDisponibilidade({ email: valor });
      if (repetidos.email && emailDigitado.current === valor) {
        setErros((prev) => ({ ...prev, email: repetidos.email }));
      }
    } catch {
      // Ver acima.
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    const problemas = soComProblema({
      nomeCompleto: erroNome(form.nomeCompleto),
      email: erroEmail(form.email),
      telefone: erroTelefone(form.telefone),
      senhaAtual:
        trocandoEmail && !senhaParaEmail
          ? "Digite sua senha para trocar o e-mail."
          : undefined,
    });
    if (Object.keys(problemas).length > 0) {
      setErros(problemas);
      return;
    }

    setSalvando(true);
    setErroGeral("");
    try {
      const atualizado = await salvarConta({
        ...form,
        ...(trocandoEmail && { senhaAtual: senhaParaEmail }),
      });
      // O formulário passa a mostrar o que a API gravou (o nome sem espaços
      // sobrando, o e-mail em minúsculas).
      setForm(dadosDoFormulario(atualizado));
      emailDigitado.current = atualizado.email;
      setSenhaParaEmail("");
      setSalvo(
        trocandoEmail
          ? "Alterações salvas. Use o novo e-mail para entrar."
          : "Alterações salvas",
      );
    } catch (falha) {
      // Problema num campo aparece embaixo dele; o resto, acima do botão.
      if (falha.campos) setErros(falha.campos);
      else setErroGeral(falha.message);
    } finally {
      setSalvando(false);
    }
  };

  // Sem a sessão, a página protegida leva a pessoa para "Entrar", com o
  // aviso de que ela saiu de todos os aparelhos.
  const sairDeTodos = async () => {
    setSaindo(true);
    setErroAparelhos("");
    try {
      await sairDeTodosOsAparelhos();
    } catch (falha) {
      setErroAparelhos(falha.message);
      setSaindo(false);
    }
  };

  return (
    <>
      <Header />

      {encerrando && (
        <ModalEncerrarConta
          usuario={usuario}
          onFechar={() => setEncerrando(false)}
          onEncerrada={() => navegar("/", { replace: true })}
        />
      )}

      <main className="pb-20 px-5 md:px-16 max-w-[820px] mx-auto pt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1c]">
            Minha conta
          </h1>
          <p className="text-sm text-[#5f5e5e] mt-1">
            {rotuloPapel(usuario)} · código #{usuario.codigo}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <form onSubmit={salvar} noValidate>
            <Secao
              titulo="Seus dados"
              texto="É por aqui que um veterinário ou um tutor com liberação entra em contato quando precisa de um doador."
              rodape={
                <div className="flex items-center gap-4 flex-wrap">
                  <Botao
                    type="submit"
                    disabled={!alterado || !localizacaoCompleta || salvando}
                  >
                    {salvando ? "Salvando…" : "Salvar alterações"}
                  </Botao>
                  {alterado && !localizacaoCompleta && (
                    <p className="text-sm text-[#5f5e5e]">
                      Escolha a cidade e o bairro para salvar.
                    </p>
                  )}
                  {alterado && localizacaoCompleta && !salvando && (
                    <p className="text-sm text-[#5f5e5e] flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-[#b7102a]"
                      />
                      Alterações não salvas
                    </p>
                  )}
                  {salvo && !alterado && <AvisoSalvo>{salvo}</AvisoSalvo>}
                </div>
              }
            >
              {/* A troca de foto entra junto com o envio das fotos dos
                  animais, que usa o mesmo armazenamento de arquivos. */}
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#f0e6e6]">
                <Avatar
                  pessoa={usuario}
                  tamanho="w-20 h-20"
                  fundo="bg-[#b7102a]"
                  formato="rounded-2xl"
                  textoIniciais="text-xl"
                />
                <p className="text-sm text-[#5f5e5e] max-w-xs">
                  Quem recebe seu contato vê essa foto. A troca de foto chega em
                  breve.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <Campo
                  id="nome"
                  rotulo="Nome completo"
                  autoComplete="name"
                  maxLength={LIMITES.nomeCompleto}
                  value={form.nomeCompleto}
                  onChange={(e) => mudar("nomeCompleto", e.target.value)}
                  onBlur={() => sairDoCampo("nomeCompleto")}
                  erro={erros.nomeCompleto}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Campo
                    id="email"
                    rotulo="E-mail"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => mudar("email", e.target.value)}
                    onBlur={() => sairDoCampo("email")}
                    erro={erros.email}
                  />
                  <Campo
                    id="telefone"
                    rotulo="Telefone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={form.telefone}
                    onChange={(e) =>
                      mudar("telefone", formatarTelefone(e.target.value))
                    }
                    onBlur={() => sairDoCampo("telefone")}
                    erro={erros.telefone}
                  />
                  {/* O e-mail é o que a pessoa usa para entrar: trocá-lo pede
                      a senha, para ninguém tomar a conta num computador que
                      ficou com ela aberta. */}
                  {trocandoEmail && (
                    <div>
                      <Campo
                        id="senha-email"
                        rotulo="Senha atual"
                        senha
                        autoComplete="current-password"
                        value={senhaParaEmail}
                        onChange={(e) => {
                          setSenhaParaEmail(e.target.value);
                          setErros((prev) => ({
                            ...prev,
                            senhaAtual: undefined,
                          }));
                        }}
                        erro={erros.senhaAtual}
                        aria-describedby="senha-email-dica"
                      />
                      <p
                        id="senha-email-dica"
                        className="text-xs text-[#5f5e5e] mt-2"
                      >
                        Para trocar o e-mail com que você entra, confirme com a
                        sua senha.
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <CampoCidade
                      valor={form.cidade}
                      onEscolher={(cidade) => {
                        if (cidade === form.cidade) return;
                        mudar("cidade", cidade);
                        mudar("bairro", "");
                      }}
                    />
                    <ErroDoCampo>{erros.cidade}</ErroDoCampo>
                  </div>
                  <div>
                    <CampoBairro
                      cidade={form.cidade}
                      valor={form.bairro}
                      onEscolher={(bairro) => mudar("bairro", bairro)}
                    />
                    <ErroDoCampo>{erros.bairro}</ErroDoCampo>
                  </div>
                </div>
                <AvisoErro>{erroGeral}</AvisoErro>
              </div>

              <div className="mt-6 pt-5 border-t border-[#f0e6e6] divide-y divide-[#f6f0f0]">
                <DadoFixo
                  rotulo="CPF"
                  valor={usuario.cpf}
                  motivo="Identifica você nos registros de doação e por isso não muda por aqui."
                />
                {ehVet && (
                  <>
                    <DadoFixo
                      rotulo="CRMV"
                      valor={usuario.crmv}
                      motivo="Sua assinatura nas validações. Para trocar, o suporte confirma o registro no conselho."
                    />
                    <DadoFixo
                      rotulo="Local de atuação"
                      valor={usuario.hospital}
                      motivo="Veio do convite do hospital. Para mudar, fale com a direção do novo local."
                    />
                  </>
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
                {senhaSalva && (
                  <AvisoSalvo>
                    Senha alterada. Os outros aparelhos saíram da conta.
                  </AvisoSalvo>
                )}
              </div>
            )}
          </Secao>

          <Secao
            titulo="Esqueceu a conta aberta em outro aparelho?"
            texto="Saia da conta em todos os aparelhos de uma vez, inclusive neste. Depois, é só entrar de novo."
          >
            <div className="flex flex-col gap-4 items-start">
              <Botao
                variante="secundario"
                icone="logout"
                onClick={sairDeTodos}
                disabled={saindo}
              >
                {saindo ? "Saindo…" : "Sair de todos os aparelhos"}
              </Botao>
              <AvisoErro>{erroAparelhos}</AvisoErro>
            </div>
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
