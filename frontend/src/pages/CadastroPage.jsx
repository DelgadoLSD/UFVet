import { useState } from "react";
import { Link } from "react-router-dom";
import Botao from "../components/Botao";
import Campo from "../components/Campo";
import LayoutAutenticacao, {
  BotaoGoogle,
} from "../components/LayoutAutenticacao";
// Foto de Nikolett Emmert (Unsplash, uso livre)
import fotoGatoPreto from "../assets/auth/gato-preto.jpg";

// Título e explicação de cada etapa. A etapa 4 (registro profissional) só
// existe para veterinários.
const ETAPAS = {
  1: { titulo: "Como você vai usar o UFVet?" },
  2: { titulo: "Seus dados" },
  3: {
    titulo: "Contato e endereço",
    texto: "Para que quem precisa de um doador consiga falar com você.",
  },
  4: {
    titulo: "Registro profissional",
    texto: "Seu CRMV aparece nas validações que você assinar.",
  },
  5: { titulo: "Senha e termos" },
};

const PERFIS = [
  {
    valor: "tutor",
    icone: "pets",
    titulo: "Sou tutor",
    texto: "Quero cadastrar meus animais como doadores ou buscar um doador.",
  },
  {
    valor: "vet",
    icone: "stethoscope",
    titulo: "Sou veterinário",
    texto: "Quero conferir e validar os dados dos doadores.",
  },
];

const CLASSE_SELECT =
  "w-full h-12 pl-4 pr-10 bg-white border border-[#dccfcf] rounded-xl text-base text-[#1a1c1c] shadow-[0_1px_2px_rgba(26,28,28,0.04)] transition-colors hover:border-[#c9b6b6] focus:outline-none focus:border-[#b7102a] focus:ring-4 focus:ring-[#b7102a]/10";

function Step1({ onSelect }) {
  return (
    <div className="space-y-3">
      {PERFIS.map((perfil) => (
        <button
          key={perfil.valor}
          type="button"
          onClick={() => onSelect(perfil.valor)}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#eadede] text-left transition-colors hover:border-[#b7102a] hover:bg-[#fffafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b7102a]"
        >
          <span className="w-12 h-12 rounded-xl bg-[#fdecee] text-[#8e001b] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#b7102a] group-hover:text-white">
            <span className="material-symbols-outlined">{perfil.icone}</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[#1a1c1c]">
              {perfil.titulo}
            </span>
            <span className="block text-sm text-[#5f5e5e] mt-0.5 leading-snug">
              {perfil.texto}
            </span>
          </span>
          <span className="material-symbols-outlined text-[#b9a9a9] transition-colors group-hover:text-[#8e001b]">
            chevron_right
          </span>
        </button>
      ))}
    </div>
  );
}

function Step2({ data, onChange }) {
  return (
    <div className="space-y-5">
      <Campo
        id="name"
        rotulo="Nome completo"
        placeholder="Ex.: João Silva"
        autoComplete="name"
        value={data.name || ""}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <Campo
        id="cpf"
        rotulo="CPF"
        placeholder="000.000.000-00"
        inputMode="numeric"
        value={data.cpf || ""}
        onChange={(e) => onChange("cpf", e.target.value)}
      />
      <Campo
        id="email"
        rotulo="E-mail"
        type="email"
        placeholder="seu@email.com"
        autoComplete="email"
        value={data.email || ""}
        onChange={(e) => onChange("email", e.target.value)}
      />
    </div>
  );
}

function Step3({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Campo
          id="phone"
          rotulo="Telefone"
          type="tel"
          placeholder="(00) 00000-0000"
          autoComplete="tel"
          value={data.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
        />
        <Campo
          id="cep"
          rotulo="CEP"
          placeholder="00000-000"
          inputMode="numeric"
          autoComplete="postal-code"
          value={data.cep || ""}
          onChange={(e) => onChange("cep", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo
          id="city"
          rotulo="Cidade"
          placeholder="Ex.: Viçosa"
          value={data.city || ""}
          onChange={(e) => onChange("city", e.target.value)}
        />
        <Campo
          id="neighborhood"
          rotulo="Bairro"
          placeholder="Ex.: Centro"
          value={data.neighborhood || ""}
          onChange={(e) => onChange("neighborhood", e.target.value)}
        />
      </div>
    </div>
  );
}

function Step4({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <Campo
          id="crmv"
          rotulo="Número do CRMV"
          placeholder="00000"
          inputMode="numeric"
          value={data.crmv || ""}
          onChange={(e) => onChange("crmv", e.target.value)}
        />
        <div>
          <label
            htmlFor="uf_crmv"
            className="block text-sm font-semibold text-[#1a1c1c] mb-2"
          >
            UF
          </label>
          <select
            id="uf_crmv"
            value={data.uf_crmv || "MG"}
            onChange={(e) => onChange("uf_crmv", e.target.value)}
            className={CLASSE_SELECT}
          >
            {["MG", "SP", "RJ", "ES", "BA", "PR", "RS", "SC"].map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Campo
        id="workplace"
        rotulo="Local de atuação"
        placeholder="Nome da clínica ou hospital"
        value={data.workplace || ""}
        onChange={(e) => onChange("workplace", e.target.value)}
      />
    </div>
  );
}

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

function Step5({ data, onChange }) {
  return (
    <div className="space-y-5">
      <Campo
        id="password"
        rotulo="Senha"
        senha
        placeholder="Pelo menos 8 caracteres"
        autoComplete="new-password"
        value={data.password || ""}
        onChange={(e) => onChange("password", e.target.value)}
      />
      <Campo
        id="confirm_password"
        rotulo="Confirmar senha"
        senha
        placeholder="Digite a senha de novo"
        autoComplete="new-password"
        value={data.confirm_password || ""}
        onChange={(e) => onChange("confirm_password", e.target.value)}
      />
      <div className="space-y-4 pt-2">
        <Confirmacao
          id="terms"
          checked={data.terms || false}
          onChange={(e) => onChange("terms", e.target.checked)}
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
          id="awareness"
          checked={data.awareness || false}
          onChange={(e) => onChange("awareness", e.target.checked)}
        >
          Estou ciente de que a doação é gratuita e assumo a responsabilidade
          financeira sobre os insumos hospitalares caso meu animal seja o
          receptor.
        </Confirmacao>
      </div>
    </div>
  );
}

function CadastroPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleContinue = () => {
    if (step === 3) {
      setStep(role === "vet" ? 4 : 5);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 5 && role === "tutor") {
      setStep(3);
    } else {
      setStep((prev) => prev - 1);
    }
  };

  // "Continuar" é o botão de envio do formulário: assim o Enter também avança
  // a etapa. Só a última etapa envia o cadastro de fato.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 5) {
      handleContinue();
      return;
    }
    console.log("Dados do formulário:", { role, ...formData });
    alert("Cadastro enviado! (integração com back-end em breve)");
  };

  const totalEtapas = role === "vet" ? 5 : 4;
  const etapaVisual = step === 5 && role === "tutor" ? 4 : step;
  const etapa = ETAPAS[step];

  return (
    <LayoutAutenticacao
      foto={fotoGatoPreto}
      fotoPosicao="center 85%"
      corFundo="#fdb0b8"
      legendaNoTopo
      fotoAEsquerda
      legenda="Leva poucos minutos e pode ajudar numa emergência."
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
        {etapa.titulo}
      </h1>
      {etapa.texto && (
        <p className="mt-2 text-[#5b403f] leading-relaxed">{etapa.texto}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-8">
        {step === 1 && <Step1 onSelect={handleRoleSelect} />}
        {step === 2 && <Step2 data={formData} onChange={handleChange} />}
        {step === 3 && <Step3 data={formData} onChange={handleChange} />}
        {step === 4 && <Step4 data={formData} onChange={handleChange} />}
        {step === 5 && <Step5 data={formData} onChange={handleChange} />}

        {step > 1 && (
          <div className="mt-8 flex gap-3">
            <Botao
              variante="secundario"
              tamanho="lg"
              icone="arrow_back"
              onClick={handleBack}
            >
              Voltar
            </Botao>
            <Botao type="submit" tamanho="lg" className="flex-1">
              {step < 5 ? "Continuar" : "Finalizar cadastro"}
            </Botao>
          </div>
        )}
      </form>

      {step === 2 && <BotaoGoogle>Cadastrar com Google</BotaoGoogle>}

      <p className="mt-10 text-sm text-[#5f5e5e]">
        Já tem uma conta?{" "}
        <Link to="/login" className="font-semibold text-[#8e001b] hover:underline">
          Entrar
        </Link>
      </p>
    </LayoutAutenticacao>
  );
}

export default CadastroPage;
