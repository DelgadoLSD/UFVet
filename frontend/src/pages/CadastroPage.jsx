import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AvisoErro from "../components/AvisoErro";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import CampoBairro from "../components/CampoBairro";
import CampoCidade from "../components/CampoCidade";
import LayoutAutenticacao, {
  BotaoGoogle,
} from "../components/LayoutAutenticacao";
import Segmentado from "../components/Segmentado";
import { TAMANHO_MINIMO_SENHA } from "../regras/conta";
import { LIMITES } from "../regras/limites";
import {
  cadastrar,
  conferirDisponibilidade,
  consultarConvite,
  useSessao,
} from "../servicos/sessao";
import {
  cpfValido,
  formatarCpf,
  formatarTelefone,
  telefoneValido,
} from "../util/texto";
// Foto de santosh verma (Unsplash, uso livre)
import fotoGatoParede from "../assets/auth/gato-parede-vermelha.jpg";

// Criação de conta em etapas (F1). O caminho depende do papel escolhido na
// primeira:
// - tutor: papel, dados, contato e localização, senha (4 etapas);
// - veterinário: as mesmas, com o convite antes da senha (5).
//
// Cada etapa confere o básico antes de avançar. E-mail e CPF, que não podem
// se repetir, são conferidos na API assim que a pessoa sai do campo e de novo
// ao continuar. A conferência completa é da API, no fim: se ela apontar um
// problema, a página volta para a etapa do campo e mostra a mensagem embaixo
// dele.

// Título e explicação de cada etapa, pelo número dela. A etapa 4 (convite) só
// existe para veterinários.
const ETAPAS = {
  1: { titulo: "Como você vai usar o UFVet?" },
  2: { titulo: "Seus dados" },
  3: {
    titulo: "Contato e localização",
    texto:
      "Para que quem precisa de um doador consiga falar com você. Na busca, aparecem só a cidade e o bairro.",
  },
  4: {
    titulo: "Registro profissional",
    texto:
      "Use o código de convite que a direção do hospital enviou. É dele que vêm o seu CRMV e o local onde você atua.",
  },
  5: { titulo: "Senha e termos" },
};

const ULTIMA_ETAPA = 5;

// Em que etapa fica cada campo, para voltar a ela quando a API apontar um
// erro.
const ETAPA_DO_CAMPO = {
  nomeCompleto: 2,
  cpf: 2,
  email: 2,
  telefone: 3,
  cidade: 3,
  bairro: 3,
  convite: 4,
  tratamento: 4,
  senha: 5,
  aceiteTermos: 5,
  cienciaResponsabilidade: 5,
};

// Os dois papéis, com os valores do enum PapelUsuario do banco.
const PAPEIS = [
  {
    valor: "TUTOR",
    icone: "pets",
    titulo: "Sou tutor",
    texto: "Quero cadastrar meus animais como doadores ou buscar um doador.",
  },
  {
    valor: "VETERINARIO",
    icone: "stethoscope",
    titulo: "Sou veterinário",
    texto:
      "Quero validar os dados dos doadores. É preciso o convite enviado pelo hospital.",
  },
];

const OPCOES_TRATAMENTO = [
  { valor: "DR", rotulo: "Dr." },
  { valor: "DRA", rotulo: "Dra." },
];

const PREENCHA = "Preencha este campo.";

// "7k3p9x" -> "7K3P-9X": maiúsculas, sem símbolos, com o traço no meio.
function formatarConvite(texto) {
  const limpo = texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return limpo.length > 4 ? `${limpo.slice(0, 4)}-${limpo.slice(4)}` : limpo;
}

const digitos = (texto = "") => texto.replace(/\D/g, "");

// O básico de cada etapa, conferido antes de avançar.
function errosDaEtapa(etapa, dados, convite) {
  const erros = {};
  if (etapa === 2) {
    const nome = (dados.nomeCompleto ?? "").trim();
    if (!nome) erros.nomeCompleto = PREENCHA;
    else if (!nome.includes(" ")) {
      erros.nomeCompleto = "Informe o nome e o sobrenome.";
    }
    if (digitos(dados.cpf).length !== 11) {
      erros.cpf = "O CPF tem 11 números.";
    } else if (!cpfValido(dados.cpf)) {
      erros.cpf = "CPF inválido. Confira os números.";
    }
    if (!/^\S+@\S+\.\S+$/.test((dados.email ?? "").trim())) {
      erros.email = "Informe um e-mail válido.";
    }
  }
  if (etapa === 3) {
    const telefone = digitos(dados.telefone).length;
    if (telefone < 10) {
      erros.telefone = "Informe o telefone com DDD.";
    } else if (!telefoneValido(dados.telefone)) {
      erros.telefone = "Telefone inválido. Confira o DDD e o número.";
    }
    if (!dados.cidade) erros.cidade = "Escolha a cidade na lista.";
    if (!(dados.bairro ?? "").trim()) erros.bairro = PREENCHA;
  }
  if (etapa === 4) {
    if (convite.estado !== "valido") {
      erros.convite =
        convite.estado === "invalido"
          ? convite.mensagem
          : "Digite o código de convite.";
    }
    if (!dados.tratamento) erros.tratamento = "Escolha Dr. ou Dra.";
  }
  if (etapa === 5) {
    if ((dados.senha ?? "").length < TAMANHO_MINIMO_SENHA) {
      erros.senha = `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
    }
    if (dados.confirmacaoSenha !== dados.senha) {
      erros.confirmacaoSenha = "As duas senhas estão diferentes.";
    }
    if (!dados.aceiteTermos || !dados.cienciaResponsabilidade) {
      erros.aceites = "É preciso aceitar os dois itens para criar a conta.";
    }
  }
  return erros;
}

// Mensagem de erro embaixo de um campo que não é um Campo (lista, botões).
function ErroDoCampo({ children }) {
  if (!children) return null;
  return <p className="text-xs text-red-600 mt-2">{children}</p>;
}

// Etapa 1: escolher o papel já avança para a próxima.
function EtapaPapel({ onEscolher }) {
  return (
    <div className="space-y-3">
      {PAPEIS.map((papel) => (
        <button
          key={papel.valor}
          type="button"
          onClick={() => onEscolher(papel.valor)}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#eadede] text-left transition-colors hover:border-[#b7102a] hover:bg-[#fffafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
        >
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-xl bg-[#fdecee] text-[#8e001b] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#b7102a] group-hover:text-white"
          >
            <span className="material-symbols-outlined">{papel.icone}</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[#1a1c1c]">
              {papel.titulo}
            </span>
            <span className="block text-sm text-[#5f5e5e] mt-0.5 leading-snug">
              {papel.texto}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[#b9a9a9] transition-colors group-hover:text-[#8e001b]"
          >
            chevron_right
          </span>
        </button>
      ))}
    </div>
  );
}

function EtapaDados({ dados, erros, onMudar, onSair }) {
  return (
    <div className="space-y-5">
      <Campo
        id="nome-completo"
        rotulo="Nome completo"
        placeholder="Ex.: João Silva"
        autoComplete="name"
        maxLength={LIMITES.nomeCompleto}
        value={dados.nomeCompleto || ""}
        onChange={(e) => onMudar("nomeCompleto", e.target.value)}
        erro={erros.nomeCompleto}
      />
      <Campo
        id="cpf"
        rotulo="CPF"
        placeholder="000.000.000-00"
        inputMode="numeric"
        maxLength={14}
        value={dados.cpf || ""}
        onChange={(e) => onMudar("cpf", formatarCpf(e.target.value))}
        onBlur={() => onSair("cpf")}
        erro={erros.cpf}
      />
      <Campo
        id="email"
        rotulo="E-mail"
        type="email"
        placeholder="seu@email.com"
        autoComplete="email"
        value={dados.email || ""}
        onChange={(e) => onMudar("email", e.target.value)}
        onBlur={() => onSair("email")}
        erro={erros.email}
      />
    </div>
  );
}

// Cidade e bairro vêm de listas, um embaixo do outro: o bairro depende da
// cidade, e a lista aberta precisa da largura toda para nomes longos.
function EtapaContato({ dados, erros, onMudar, onSair }) {
  return (
    <div className="space-y-5">
      <Campo
        id="telefone"
        rotulo="Telefone"
        type="tel"
        placeholder="(00) 00000-0000"
        autoComplete="tel"
        maxLength={15}
        value={dados.telefone || ""}
        onChange={(e) => onMudar("telefone", formatarTelefone(e.target.value))}
        onBlur={() => onSair("telefone")}
        erro={erros.telefone}
      />
      <div>
        <CampoCidade
          valor={dados.cidade || ""}
          onEscolher={(cidade) => {
            if (cidade === dados.cidade) return;
            onMudar("cidade", cidade);
            // O bairro escolhido era da cidade anterior.
            onMudar("bairro", "");
          }}
        />
        <ErroDoCampo>{erros.cidade}</ErroDoCampo>
      </div>
      <div>
        <CampoBairro
          cidade={dados.cidade}
          valor={dados.bairro || ""}
          onEscolher={(bairro) => onMudar("bairro", bairro)}
        />
        <ErroDoCampo>{erros.bairro}</ErroDoCampo>
      </div>
    </div>
  );
}

// Só para veterinários. O convite é conferido assim que o código fica
// completo, e o cartão mostra para quem ele foi feito.
function EtapaRegistro({ dados, erros, convite, onMudar, onCodigo }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Campo
          id="convite"
          rotulo="Código de convite"
          placeholder="XXXX-XXXX"
          autoComplete="off"
          spellCheck="false"
          value={dados.convite || ""}
          onChange={(e) => onCodigo(formatarConvite(e.target.value))}
          erro={erros.convite}
        />
        {convite.estado === "conferindo" && (
          <p className="text-sm text-[#5f5e5e]">Conferindo o convite…</p>
        )}
        {convite.estado === "valido" && (
          <div className="rounded-xl border border-[#eadede] bg-white p-4 flex items-start gap-3">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[22px] text-emerald-600 shrink-0"
            >
              verified
            </span>
            <div className="min-w-0">
              <p className="font-bold text-[#1a1c1c]">
                Convite para {convite.dados.nome}
              </p>
              <p className="text-sm text-[#5f5e5e] mt-0.5 leading-snug">
                CRMV {convite.dados.crmv}-{convite.dados.ufCrmv}, no{" "}
                {convite.dados.estabelecimento}.
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1a1c1c] mb-2">
          Como você assina
        </p>
        <Segmentado
          rotulo="Como você assina"
          altura="h-10"
          opcoes={OPCOES_TRATAMENTO}
          valor={dados.tratamento}
          onEscolher={(valor) => onMudar("tratamento", valor)}
        />
        <p className="text-xs text-[#5f5e5e] mt-2">
          Aparece nas validações e nas doações que você registrar.
        </p>
        <ErroDoCampo>{erros.tratamento}</ErroDoCampo>
      </div>
    </div>
  );
}

// Caixa de seleção com o texto ao lado, clicável.
function Confirmacao({ id, checked, onChange, children }) {
  return (
    <div className="flex gap-3 items-start">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 w-5 h-5 shrink-0 rounded-md border-[#cfbcbc] text-[#b7102a] cursor-pointer focus:ring-2 focus:ring-[#b7102a]/30 focus:ring-offset-0"
      />
      <label
        htmlFor={id}
        className="text-sm text-[#5b403f] leading-snug cursor-pointer"
      >
        {children}
      </label>
    </div>
  );
}

// Os dois aceites viram registros da tabela aceite no banco (TERMOS_DE_USO e
// CIENCIA_RESPONSABILIDADE), com a versão do texto aceito (F7).
function EtapaSenha({ dados, erros, onMudar }) {
  return (
    <div className="space-y-5">
      <Campo
        id="senha"
        rotulo="Senha"
        senha
        placeholder={`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`}
        autoComplete="new-password"
        value={dados.senha || ""}
        onChange={(e) => onMudar("senha", e.target.value)}
        erro={erros.senha}
      />
      <Campo
        id="confirmacao-senha"
        rotulo="Confirmar senha"
        senha
        placeholder="Digite a senha de novo"
        autoComplete="new-password"
        value={dados.confirmacaoSenha || ""}
        onChange={(e) => onMudar("confirmacaoSenha", e.target.value)}
        erro={erros.confirmacaoSenha}
      />
      <div className="space-y-4 pt-2">
        <Confirmacao
          id="aceite-termos"
          checked={dados.aceiteTermos || false}
          onChange={(e) => onMudar("aceiteTermos", e.target.checked)}
        >
          Li e aceito os{" "}
          <a href="#" className="font-semibold text-[#8e001b] hover:underline">
            Termos de uso
          </a>{" "}
          e a{" "}
          <a href="#" className="font-semibold text-[#8e001b] hover:underline">
            Política de privacidade
          </a>
          .
        </Confirmacao>
        <Confirmacao
          id="ciencia-responsabilidade"
          checked={dados.cienciaResponsabilidade || false}
          onChange={(e) => onMudar("cienciaResponsabilidade", e.target.checked)}
        >
          Estou ciente de que a doação é gratuita e assumo a responsabilidade
          financeira sobre os insumos hospitalares caso meu animal seja o
          receptor.
        </Confirmacao>
        <ErroDoCampo>
          {erros.aceites ?? erros.aceiteTermos ?? erros.cienciaResponsabilidade}
        </ErroDoCampo>
      </div>
    </div>
  );
}

function CadastroPage() {
  const usuario = useSessao();
  const navegar = useNavigate();
  const [etapa, setEtapa] = useState(1);
  const [papel, setPapel] = useState(null);
  const [dados, setDados] = useState({});
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Situação do convite: "vazio", "conferindo", "valido" (com os dados) ou
  // "invalido" (com a mensagem da API).
  const [convite, setConvite] = useState({ estado: "vazio" });
  // O último código enviado para conferência: uma resposta atrasada de um
  // código antigo é ignorada.
  const codigoConferido = useRef("");
  // Os dados mais recentes, para descartar a resposta da conferência de um
  // e-mail ou CPF que a pessoa já mudou.
  const dadosAtuais = useRef(dados);

  const ehTutor = papel === "TUTOR";

  // Mudar um campo apaga o erro dele.
  const mudar = (campo, valor) => {
    dadosAtuais.current = { ...dadosAtuais.current, [campo]: valor };
    setDados((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, [campo]: undefined, aceites: undefined }));
  };

  const mudarConvite = async (codigo) => {
    mudar("convite", codigo);
    const completo = codigo.replace("-", "");
    codigoConferido.current = completo;
    if (completo.length < 8) {
      setConvite({ estado: "vazio" });
      return;
    }
    setConvite({ estado: "conferindo" });
    try {
      const encontrado = await consultarConvite(completo);
      if (codigoConferido.current === completo) {
        setConvite({ estado: "valido", dados: encontrado });
      }
    } catch (falha) {
      if (codigoConferido.current === completo) {
        setConvite({ estado: "invalido", mensagem: falha.message });
        setErros((prev) => ({ ...prev, convite: falha.message }));
      }
    }
  };

  // Ao sair do campo de e-mail, CPF ou telefone: se está mal escrito, avisa
  // já; e-mail e CPF certos ainda vão à API, para saber se já têm conta.
  // Campo vazio fica para o "Continuar". Falha de conexão aqui não avisa
  // nada: a conferência se repete ao continuar e no fim do cadastro.
  const sairDoCampo = async (campo) => {
    const valor = dados[campo];
    if (!valor?.trim()) return;
    const erroDeFormato = errosDaEtapa(ETAPA_DO_CAMPO[campo], dados, convite)[
      campo
    ];
    if (erroDeFormato) {
      setErros((prev) => ({ ...prev, [campo]: erroDeFormato }));
      return;
    }
    // O telefone pode se repetir entre contas; só e-mail e CPF vão à API.
    if (campo === "telefone") return;
    try {
      const repetidos = await conferirDisponibilidade({ [campo]: valor });
      if (repetidos[campo] && dadosAtuais.current[campo] === valor) {
        setErros((prev) => ({ ...prev, [campo]: repetidos[campo] }));
      }
    } catch (falha) {
      // Só o formato recusado pela API vira aviso (ver acima).
      if (falha.campos?.[campo] && dadosAtuais.current[campo] === valor) {
        setErros((prev) => ({ ...prev, [campo]: falha.campos[campo] }));
      }
    }
  };

  // Antes de sair da etapa 2, e-mail e CPF juntos. Se a API não responder, a
  // pessoa segue: o cadastro confere de novo no fim.
  const conferirRepetidos = async () => {
    setEnviando(true);
    try {
      return await conferirDisponibilidade({
        email: dados.email,
        cpf: dados.cpf,
      });
    } catch (falha) {
      return falha.campos ?? {};
    } finally {
      setEnviando(false);
    }
  };

  const escolherPapel = (escolhido) => {
    setPapel(escolhido);
    setEtapa(2);
  };

  // O tutor não tem registro profissional: da etapa 3 vai direto para a 5, e
  // volta da 5 direto para a 3.
  const avancar = () =>
    setEtapa((atual) => (atual === 3 && ehTutor ? 5 : atual + 1));
  const voltar = () => {
    setErroGeral("");
    setEtapa((atual) => (atual === 5 && ehTutor ? 3 : atual - 1));
  };

  const criarConta = async () => {
    setEnviando(true);
    setErroGeral("");
    try {
      await cadastrar({
        papel,
        nomeCompleto: dados.nomeCompleto,
        cpf: dados.cpf,
        email: dados.email,
        telefone: dados.telefone,
        cidade: dados.cidade,
        bairro: dados.bairro,
        senha: dados.senha,
        aceiteTermos: !!dados.aceiteTermos,
        cienciaResponsabilidade: !!dados.cienciaResponsabilidade,
        ...(!ehTutor && {
          convite: dados.convite,
          tratamento: dados.tratamento,
        }),
      });
      navegar("/meu-perfil", { replace: true });
    } catch (falha) {
      setEnviando(false);
      // Volta para a primeira etapa com um campo errado, se houver.
      const etapasComErro = Object.keys(falha.campos ?? {})
        .map((campo) => ETAPA_DO_CAMPO[campo])
        .filter(Boolean);
      if (etapasComErro.length > 0) {
        setErros(falha.campos);
        setEtapa(Math.min(...etapasComErro));
      } else {
        setErroGeral(falha.message);
      }
    }
  };

  // "Continuar" é o botão de envio do formulário: assim o Enter também avança
  // a etapa. Só a última etapa envia o cadastro de fato.
  const enviar = async (e) => {
    e.preventDefault();
    const problemas = errosDaEtapa(etapa, dados, convite);
    if (etapa === 2 && Object.keys(problemas).length === 0) {
      Object.assign(problemas, await conferirRepetidos());
    }
    if (Object.keys(problemas).length > 0) {
      setErros(problemas);
      return;
    }
    if (etapa < ULTIMA_ETAPA) avancar();
    else criarConta();
  };

  // Quem já tem conta e está logado não precisa criar outra.
  if (usuario && !enviando) return <Navigate to="/meu-perfil" replace />;

  // Para o tutor, a etapa 5 aparece como a 4ª (de 4). Antes de escolher o
  // papel, a contagem é a do tutor.
  const totalEtapas = papel === "VETERINARIO" ? 5 : 4;
  const etapaVisual = etapa === 5 && ehTutor ? 4 : etapa;
  const { titulo, texto } = ETAPAS[etapa];

  return (
    <LayoutAutenticacao
      foto={fotoGatoParede}
      fotoPosicao="right center"
      corFundo="#9d2d15"
      fotoAEsquerda
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-[#1a1c1c]">Criar conta</span>
        <span className="text-[#5f5e5e]">
          Etapa {etapaVisual} de {totalEtapas}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: totalEtapas }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < etapaVisual ? "bg-[#b7102a]" : "bg-[#eadede]"
            }`}
          />
        ))}
      </div>

      <h1 className="mt-10 text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
        {titulo}
      </h1>
      {texto && <p className="mt-2 text-[#5b403f] leading-relaxed">{texto}</p>}

      <form onSubmit={enviar} noValidate className="mt-8">
        {etapa === 1 && <EtapaPapel onEscolher={escolherPapel} />}
        {etapa === 2 && (
          <EtapaDados
            dados={dados}
            erros={erros}
            onMudar={mudar}
            onSair={sairDoCampo}
          />
        )}
        {etapa === 3 && (
          <EtapaContato
            dados={dados}
            erros={erros}
            onMudar={mudar}
            onSair={sairDoCampo}
          />
        )}
        {etapa === 4 && (
          <EtapaRegistro
            dados={dados}
            erros={erros}
            convite={convite}
            onMudar={mudar}
            onCodigo={mudarConvite}
          />
        )}
        {etapa === 5 && (
          <EtapaSenha dados={dados} erros={erros} onMudar={mudar} />
        )}

        {erroGeral && (
          <div className="mt-6">
            <AvisoErro>{erroGeral}</AvisoErro>
          </div>
        )}

        {etapa > 1 && (
          <div className="mt-8 flex gap-3">
            <Botao
              variante="secundario"
              tamanho="lg"
              icone="arrow_back"
              onClick={voltar}
              disabled={enviando}
            >
              Voltar
            </Botao>
            <Botao
              type="submit"
              tamanho="lg"
              className="flex-1"
              disabled={enviando}
            >
              {etapa < ULTIMA_ETAPA
                ? "Continuar"
                : enviando
                  ? "Criando a conta…"
                  : "Finalizar cadastro"}
            </Botao>
          </div>
        )}
      </form>

      {etapa === 2 && <BotaoGoogle>Cadastrar com Google</BotaoGoogle>}

      <p className="mt-10 text-sm text-[#5f5e5e]">
        Já tem uma conta?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#8e001b] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </LayoutAutenticacao>
  );
}

export default CadastroPage;
