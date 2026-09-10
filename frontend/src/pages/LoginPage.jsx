import { useState } from "react";
import { Link } from "react-router-dom";
import heroPet from "../assets/login-image.png";

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

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ cpf: "", password: "" });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", formData);
    alert("Login enviado! (integração com back-end em breve)");
  };

  return (
    <main className="w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Coluna esquerda — formulário */}
      <section className="w-full md:w-1/2 bg-[#FFF8F7] flex flex-col items-center h-full overflow-hidden justify-between">
        <div className="w-full max-w-[440px] h-full flex flex-col px-6 md:px-0">
          <div className="text-center shrink-0 pt-16">
            <h2 className="text-[#1a1c1c] font-extrabold uppercase leading-none tracking-tighter text-3xl md:text-5xl">
              faça seu
            </h2>
            <h2 className="text-[#8e001b] font-extrabold uppercase leading-tight tracking-tighter text-5xl md:text-7xl mt-2 whitespace-nowrap">
              login
            </h2>
          </div>

          <form
            className="flex-grow flex flex-col min-h-0"
            onSubmit={handleSubmit}
          >
            <div className="flex-grow flex flex-col justify-center py-4 min-h-0">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label
                    className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[12px]"
                    htmlFor="cpf"
                  >
                    CPF
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    required
                    value={formData.cpf}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    className="w-full px-5 bg-white border text-base py-3 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    className="font-bold uppercase tracking-wide text-[#1a1c1c] text-[12px]"
                    htmlFor="password"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      required
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className="w-full px-5 bg-white border text-base pr-12 py-3 border-[#8e001b]/10 placeholder:text-neutral-400 rounded-xl focus:outline-none focus:border-[#b7102a] focus:ring-1 focus:ring-[#b7102a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5f5e5e] text-lg hover:text-[#8e001b] transition-colors"
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </button>
                  </div>
                  <div className="text-right">
                    <a
                      href="#"
                      className="text-[10px] font-bold text-[#8e001b] hover:underline"
                    >
                      Esqueceu sua senha?
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="shrink-0 flex flex-col gap-4 pb-12">
              <button
                type="submit"
                className="w-full px-8 text-white font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-md text-base bg-[#8e001b] rounded-full py-4"
              >
                Entrar
              </button>

              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-neutral-200" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  ou
                </span>
                <div className="h-[1px] flex-1 bg-neutral-200" />
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-black text-white font-semibold hover:bg-neutral-800 transition-all text-sm rounded-full py-4"
              >
                <GoogleIcon />
                Entrar com Google
              </button>

              <div className="text-center">
                <p className="text-sm font-medium text-[#5f5e5e]">
                  Não tem uma conta?{" "}
                  <Link
                    to="/cadastrar"
                    className="text-[#8e001b] font-bold hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Coluna direita — imagem */}
      <section className="hidden md:flex md:w-1/2 bg-black relative overflow-hidden p-12 flex-col justify-end items-center h-full">
        <img
          src={heroPet}
          className="absolute inset-0 h-full w-full object-cover object-center"
          alt="Pets"
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
    </main>
  );
}

export default LoginPage;
