import { useState } from "react";
import { Link } from "react-router-dom";
import heroPet from "../assets/cadastro-image.png";

const TOTAL_STEPS = 5;

function GoogleIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GoogleButton() {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="h-[1px] flex-1 bg-neutral-200" />
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          ou entre com
        </span>
        <div className="h-[1px] flex-1 bg-neutral-200" />
      </div>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold hover:bg-neutral-800 transition-all text-sm rounded-full py-3"
      >
        <GoogleIcon />
        Cadastrar com Google
      </button>
    </>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function Step1({ onSelect }) {
  return (
    <div className="space-y-4">
      <p className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[14px] text-center">
        Como você deseja usar o UFVet?
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect("tutor")}
          className="group bg-white border border-[#8e001b]/10 hover:border-[#8e001b] rounded-2xl p-5 cursor-pointer transition-all active:scale-[0.98] shadow-sm flex flex-col items-center text-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-[#ffdad8] flex items-center justify-center text-[#8e001b] group-hover:bg-[#8e001b] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">pets</span>
          </div>
          <div>
            <p className="font-bold text-[#1a1c1c] uppercase text-sm leading-tight">
              Sou Tutor
            </p>
            <p className="text-[10px] text-[#5b403f] mt-1">
              Quero cadastrar pets ou buscar doadores.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("vet")}
          className="group bg-white border border-[#8e001b]/10 hover:border-[#8e001b] rounded-2xl p-5 cursor-pointer transition-all active:scale-[0.98] shadow-sm flex flex-col items-center text-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-[#ffdad8] flex items-center justify-center text-[#8e001b] group-hover:bg-[#8e001b] group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-2xl">
              medical_services
            </span>
          </div>
          <div>
            <p className="font-bold text-[#1a1c1c] uppercase text-sm leading-tight">
              Sou Veterinário
            </p>
            <p className="text-[10px] text-[#5b403f] mt-1">
              Quero validar clinicamente os doadores.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

function Step2({ data, onChange }) {
  return (
    <div className="space-y-4">
      {[
        {
          id: "name",
          label: "Nome completo",
          placeholder: "Ex: João Silva",
          type: "text",
        },
        {
          id: "cpf",
          label: "CPF",
          placeholder: "000.000.000-00",
          type: "text",
        },
        {
          id: "email",
          label: "E-mail",
          placeholder: "seu@email.com",
          type: "email",
        },
      ].map((field) => (
        <div key={field.id} className="space-y-1">
          <label
            className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
            htmlFor={field.id}
          >
            {field.label}
          </label>
          <input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={data[field.id] || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="w-full px-5 bg-white border text-base py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
          />
        </div>
      ))}
    </div>
  );
}

function Step3({ data, onChange }) {
  return (
    <div className="space-y-4">
      {[
        {
          id: "phone",
          label: "Telefone",
          placeholder: "(00) 00000-0000",
          type: "tel",
        },
        { id: "cep", label: "CEP", placeholder: "00000-000", type: "text" },
      ].map((field) => (
        <div key={field.id} className="space-y-1">
          <label
            className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
            htmlFor={field.id}
          >
            {field.label}
          </label>
          <input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={data[field.id] || ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="w-full px-5 bg-white border text-base py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: "city", label: "Cidade", placeholder: "Ex: Viçosa" },
          { id: "neighborhood", label: "Bairro", placeholder: "Ex: Centro" },
        ].map((field) => (
          <div key={field.id} className="space-y-1">
            <label
              className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
              htmlFor={field.id}
            >
              {field.label}
            </label>
            <input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={data[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full px-5 bg-white border text-base py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-1">
          <label
            className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
            htmlFor="crmv"
          >
            Número do CRMV
          </label>
          <input
            id="crmv"
            type="text"
            placeholder="00000"
            value={data.crmv || ""}
            onChange={(e) => onChange("crmv", e.target.value)}
            className="w-full px-5 bg-white border text-base py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
          />
        </div>
        <div className="space-y-1">
          <label
            className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
            htmlFor="uf_crmv"
          >
            UF
          </label>
          <select
            id="uf_crmv"
            value={data.uf_crmv || "MG"}
            onChange={(e) => onChange("uf_crmv", e.target.value)}
            className="w-full px-5 bg-white border text-base py-2 border-[#8e001b]/10 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
          >
            {["MG", "SP", "RJ", "ES", "BA", "PR", "RS", "SC"].map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label
          className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
          htmlFor="workplace"
        >
          Local de Atuação
        </label>
        <input
          id="workplace"
          type="text"
          placeholder="Nome da Clínica ou Hospital"
          value={data.workplace || ""}
          onChange={(e) => onChange("workplace", e.target.value)}
          className="w-full px-5 bg-white border text-base py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
        />
      </div>
    </div>
  );
}

function Step5({ data, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label
          className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
          htmlFor="password"
        >
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="8+ caracteres"
            value={data.password || ""}
            onChange={(e) => onChange("password", e.target.value)}
            className="w-full px-5 bg-white border text-base pr-12 py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-lg hover:text-[#8e001b] transition-colors"
          >
            {showPassword ? "visibility_off" : "visibility"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label
          className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[10px]"
          htmlFor="confirm_password"
        >
          Confirmar Senha
        </label>
        <div className="relative">
          <input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirmar Senha"
            value={data.confirm_password || ""}
            onChange={(e) => onChange("confirm_password", e.target.value)}
            className="w-full px-5 bg-white border text-base pr-12 py-2 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-lg hover:text-[#8e001b] transition-colors"
          >
            {showConfirm ? "visibility_off" : "visibility"}
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex gap-3 items-start">
          <input
            id="terms"
            type="checkbox"
            checked={data.terms || false}
            onChange={(e) => onChange("terms", e.target.checked)}
            className="rounded border-gray-300 text-[#8e001b] w-4 h-4 cursor-pointer mt-0.5"
          />
          <label
            className="text-[11px] text-[#636262] leading-snug"
            htmlFor="terms"
          >
            Li e aceito os{" "}
            <a href="#" className="text-[#8e001b] font-bold hover:underline">
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a href="#" className="text-[#8e001b] font-bold hover:underline">
              Política de Privacidade
            </a>
            .
          </label>
        </div>
        <div className="flex gap-3 items-start">
          <input
            id="awareness"
            type="checkbox"
            checked={data.awareness || false}
            onChange={(e) => onChange("awareness", e.target.checked)}
            className="rounded border-gray-300 text-[#8e001b] w-4 h-4 cursor-pointer mt-0.5"
          />
          <label
            className="text-[11px] text-[#636262] leading-snug"
            htmlFor="awareness"
          >
            Estou ciente de que a doação é gratuita e assumo a responsabilidade
            financeira sobre os insumos hospitalares caso meu animal seja o
            receptor.
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function CadastroPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({});

  // Atualiza um campo do formulário sem perder os outros
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleContinue = () => {
    if (step === 3) {
      // Veterinário tem um step a mais
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados do formulário:", { role, ...formData });
    alert("Cadastro enviado! (integração com back-end em breve)");
  };

  // Dots de progresso — step 4 só existe pra vet, então ajusta a contagem visual
  const visualStep = step === 5 && role === "tutor" ? 4 : step;

  <div className="fixed top-4 left-6 z-50">
    <Link
      to="/"
      className="font-extrabold text-2xl tracking-tighter flex items-center"
    >
      <span className="text-[#1a1c1c]">UF</span>
      <span className="text-[#b7102a]">Vet</span>
    </Link>
  </div>;

  return (
    <main className="w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Coluna esquerda — imagem + value props */}
      <section className="hidden md:flex md:w-1/2 bg-black relative overflow-hidden p-12 flex-col justify-end items-center">
        <img
          src={heroPet}
          className="absolute inset-0 h-full w-full object-cover object-center"
          alt="Pet doador"
        />
        {/* Gradiente de baixo pra cima */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#b7102a]/80 via-transparent to-[#b7102a]/20 mix-blend-multiply" />
        {/* Gradiente de cima pra baixo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#b7102a] via-[#b7102a]/40 to-transparent h-[50%] mix-blend-multiply" />
        <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-white max-w-lg p-8 mb-4 w-full">
          <div className="grid grid-cols-1 gap-6">
            {[
              {
                title: "Emergências Rápidas",
                desc: "Encontre doadores compatíveis em segundos quando cada minuto conta.",
              },
              {
                title: "Doadores Voluntários",
                desc: "Cadastre seus animais e ajude a salvar vidas de outros pets na sua região.",
              },
              {
                title: "Rede Validada",
                desc: "Dados conferidos por médicos veterinários para total segurança.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 items-center">
                <span className="material-symbols-outlined text-[#8e001b] bg-white p-1 rounded-full text-lg shadow-lg shrink-0">
                  done
                </span>
                <div>
                  <p className="font-bold text-lg uppercase tracking-tight">
                    {item.title}
                  </p>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coluna direita — wizard */}
      <section className="w-full md:w-1/2 bg-[#FFF8F7] flex flex-col items-center h-full overflow-y-auto">
        <div className="w-full max-w-[440px] h-full flex flex-col px-6 md:px-0">
          {/* Cabeçalho fixo */}
          <div className="text-center shrink-0 pt-8">
            <h2 className="text-[#1a1c1c] font-extrabold uppercase leading-none tracking-tighter text-3xl md:text-5xl">
              CRIE SUA CONTA E
            </h2>
            <h2 className="text-[#8e001b] font-extrabold uppercase leading-none tracking-tighter text-5xl md:text-7xl whitespace-nowrap">
              SALVE VIDAS
            </h2>

            {/* Dots de progresso */}
            <div className="flex justify-center gap-3 mt-4">
              {Array.from({ length: role === "vet" ? TOTAL_STEPS : 4 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      i < visualStep ? "bg-[#8e001b]" : "bg-[#dadada]"
                    }`}
                  />
                ),
              )}
            </div>
          </div>

          {/* Área do formulário */}
          <form
            className="flex-grow flex flex-col min-h-0 justify-start gap-6"
            onSubmit={handleSubmit}
          >
            <div className="flex-grow flex flex-col justify-center py-4 min-h-0">
              {step === 1 && <Step1 onSelect={handleRoleSelect} />}
              {step === 2 && <Step2 data={formData} onChange={handleChange} />}
              {step === 3 && <Step3 data={formData} onChange={handleChange} />}
              {step === 4 && <Step4 data={formData} onChange={handleChange} />}
              {step === 5 && <Step5 data={formData} onChange={handleChange} />}
            </div>

            {/* Botões de ação */}
            <div className="shrink-0 flex flex-col pb-6 mt-4 gap-y-4">
              {step > 1 && step < 5 && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full px-8 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-md text-base bg-[#8e001b] rounded-full py-3"
                >
                  Continuar
                </button>
              )}
              {step === 5 && (
                <button
                  type="submit"
                  className="w-full px-8 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-md text-base bg-[#8e001b] rounded-full py-3"
                >
                  Finalizar Cadastro
                </button>
              )}

              {step > 1 && <GoogleButton />}

              {step > 1 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs font-bold text-[#636262] hover:text-[#8e001b] uppercase tracking-wider"
                  >
                    Voltar
                  </button>
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-[#636262] text-xs font-medium">
                  Já tem uma conta?{" "}
                  <Link
                    to="/login"
                    className="text-[#8e001b] font-extrabold hover:underline ml-1"
                  >
                    Fazer login
                  </Link>
                  <span className="mx-2 text-[#636262]/50">•</span>
                  <Link
                    to="/"
                    className="text-[#8e001b] font-extrabold hover:underline ml-1"
                  >
                    Voltar ao início
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default CadastroPage;
