import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ─── Seções internas como componentes menores ───────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black">
      <img
        src="https://i.postimg.cc/cJHksc3m/cachorrinsalsicha.jpg"
        className="absolute right-0 top-0 h-full w-2/3 object-contain object-right"
        alt="Hero"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0" />
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px] relative z-10">
        <div className="max-w-2xl text-left">
          <h1 className="text-5xl md:text-7xl mb-8 leading-[1.05] font-extrabold tracking-tighter text-white">
            Seu pet pode <br />
            <span className="text-[#b7102a] italic">salvar uma vida!</span>
          </h1>
          <p className="text-lg md:text-xl mb-12 max-w-xl leading-relaxed text-white">
            Conectamos tutores de animais que precisam de transfusão a doadores
            voluntários em uma rede de solidariedade técnica e segura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/buscar"
              className="bg-[#b7102a] text-white px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#8e001b] transition-all text-center"
            >
              Preciso de um doador
            </Link>
            <Link
              to="/cadastrar"
              className="px-10 py-5 rounded-full font-bold text-sm uppercase tracking-widest border border-white bg-white text-black hover:scale-105 transition-all text-center"
            >
              Quero cadastrar meu animal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="py-40 bg-[#1a1a1a] text-white overflow-hidden">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px]">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-[#b7102a] font-bold tracking-[0.3em] uppercase text-[10px] mb-6 block">
              A Missão
            </span>
            <h2 className="text-5xl md:text-6xl mb-10 font-extrabold tracking-tighter">
              Por que existimos?
            </h2>
            <div className="space-y-8 text-gray-400 text-lg leading-relaxed">
              <p>
                O BloodPet é um projeto de software desenvolvido no curso de
                Ciência da Computação da UFV para enfrentar um problema real da
                medicina veterinária brasileira: a maioria dos hospitais
                veterinários do país não possui banco de sangue físico próprio e
                opera no modelo de doação estritamente sob demanda.
              </p>
              <p>
                Quando um animal precisa de transfusão de urgência, a busca por
                um doador compatível ocorre hoje de forma improvisada — grupos
                de WhatsApp, stories no Instagram e publicações em redes
                sociais.
              </p>
              <p className="text-white font-bold">
                O BloodPet centraliza essa busca e garante que os dados dos
                doadores sejam validados por médicos veterinários antes da
                emergência chegar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-12 bg-[#262626] border border-white/10 rounded-3xl hover:border-[#b7102a]/50 transition-all">
              <div className="text-7xl font-extrabold text-[#b7102a] mb-4 tracking-tighter">
                160M
              </div>
              <p className="font-bold uppercase text-[10px] tracking-[0.2em] text-white">
                Animais de estimação no Brasil
              </p>
              <p className="text-[9px] text-gray-500 mt-2">ABINPET, 2025</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-10 bg-[#262626] border border-white/10 rounded-3xl">
                <div className="text-4xl font-extrabold text-[#b7102a] mb-2 tracking-tighter">
                  70 mil+
                </div>
                <p className="font-bold uppercase text-[9px] tracking-[0.1em] text-white">
                  Estabelecimentos veterinários no Brasil
                </p>
                <p className="text-[8px] text-gray-500 mt-2">
                  PANORAMA PETVET, 2025
                </p>
              </div>
              <div className="p-10 bg-[#262626] border border-white/10 rounded-3xl">
                <div className="text-4xl font-extrabold text-[#b7102a] mb-2 tracking-tighter">
                  R$1.000+
                </div>
                <p className="font-bold uppercase text-[9px] tracking-[0.1em] text-white">
                  Custo médio de uma bolsa em clínica particular
                </p>
                <p className="text-[8px] text-gray-500 mt-2">
                  METRÓPOLES, 2022
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TransparencySection() {
  return (
    <section className="py-40 bg-white">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px]">
        <div className="max-w-3xl mb-24">
          <h2 className="text-5xl md:text-6xl mb-6 font-extrabold tracking-tighter">
            Transparência Total
          </h2>
          <p className="text-gray-500 text-xl max-w-xl">
            Entenda as responsabilidades e benefícios de cada lado desta rede de
            apoio.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-12 rounded-[2.5rem] border border-black/8 hover:bg-white hover:shadow-2xl hover:border-[#b7102a] transition-all group">
            <div className="w-16 h-16 bg-[#b7102a] rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white text-4xl">
                favorite
              </span>
            </div>
            <h3 className="text-4xl mb-2 font-extrabold tracking-tighter">
              Sou Doador
            </h3>
            <p className="text-white bg-[#1a1a1a] inline-block px-3 py-1 rounded font-bold tracking-widest text-[10px] mb-10 uppercase">
              Custo Zero
            </p>
            <ul className="space-y-6 font-medium text-gray-600">
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b7102a]">
                  verified
                </span>
                <span>
                  Exames de sangue completos gratuitos (Hemograma, PCR,
                  Sorologia).
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b7102a]">
                  verified
                </span>
                <span>Cadastro em banco de dados prioritário.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b7102a]">
                  verified
                </span>
                <span>Orgulho de salvar até 4 vidas com uma única doação.</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1a1a1a] p-12 rounded-[2.5rem] border border-white/10 hover:border-[#b7102a] hover:shadow-2xl transition-all group">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-[#b7102a] transition-colors group-hover:scale-110">
              <span className="material-symbols-outlined text-white text-4xl">
                medical_services
              </span>
            </div>
            <h3 className="text-4xl text-white mb-2 font-extrabold tracking-tighter">
              Sou Receptor
            </h3>
            <p className="text-gray-400 font-bold tracking-widest text-[10px] mb-10 uppercase">
              Responsabilidades
            </p>
            <ul className="space-y-6 font-medium text-gray-400">
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b7102a]">
                  payments
                </span>
                <span>Pagamento dos insumos de coleta (bolsa, agulhas).</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b7102a]">
                  directions_car
                </span>
                <span>
                  Custos de deslocamento do animal doador (se necessário).
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b7102a]">
                  verified_user
                </span>
                <span>
                  Garantia de que o procedimento ocorra em ambiente hospitalar.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CriteriaSection() {
  const [species, setSpecies] = useState("dog");

  const dogCriteria = [
    { icon: "calendar_month", title: "Idade", desc: "Entre 1 e 8 anos" },
    { icon: "monitor_weight", title: "Peso", desc: "Acima de 25kg" },
    {
      icon: "vaccines",
      title: "Saúde",
      desc: "Vacinação e Vermifugação em dia",
    },
    {
      icon: "female",
      title: "Restrição",
      desc: "Fêmeas não podem estar no cio ou gestantes",
    },
  ];

  const catCriteria = [
    { icon: "calendar_month", title: "Idade", desc: "Entre 1 e 7 anos" },
    { icon: "monitor_weight", title: "Peso", desc: "Acima de 4,5kg" },
    {
      icon: "pets",
      title: "Tipo Físico",
      desc: "Preferencialmente gatos sem acesso à rua",
    },
    {
      icon: "health_and_safety",
      title: "Testagem",
      desc: "Negativo para FIV e FeLV",
    },
  ];

  const criteria = species === "dog" ? dogCriteria : catCriteria;

  return (
    <section className="py-40 bg-[#b7102a] text-white">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px]">
        <h2 className="text-5xl text-center mb-16 font-extrabold tracking-tighter">
          Meu pet pode doar?
        </h2>

        <div className="flex justify-center mb-16">
          <div className="bg-white/10 p-2 rounded-full flex gap-1 border border-white/10">
            <button
              onClick={() => setSpecies("dog")}
              className={`px-12 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all ${
                species === "dog"
                  ? "bg-white text-[#b7102a]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Cães
            </button>
            <button
              onClick={() => setSpecies("cat")}
              className={`px-12 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all ${
                species === "cat"
                  ? "bg-white text-[#b7102a]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Gatos
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {criteria.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-6 p-10 bg-white/10 rounded-3xl border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#b7102a] shrink-0">
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <div>
                <div className="font-bold text-lg tracking-tight">
                  {item.title}
                </div>
                <div className="text-white/80 text-sm">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MythsSection() {
  const myths = [
    {
      title: "O animal fica fraco?",
      text: "Pelo contrário. O volume é reposto em horas e o pet não sente indisposição. É como uma coleta de exame de rotina.",
    },
    {
      title: "É um processo doloroso?",
      text: "O pet pode sentir apenas a picada da agulha. Em casos de animais mais agitados, usamos sedação leve e segura.",
    },
    {
      title: "Transmite doenças?",
      text: "Impossível. Todo o material é descartável e o animal doador é rigorosamente testado antes do procedimento.",
    },
  ];

  return (
    <section className="py-40 bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px]">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl mb-6 font-extrabold tracking-tighter">
            Mitos e Verdades
          </h2>
          <p className="text-gray-500 text-xl max-w-xl mx-auto">
            Não deixe o medo impedir seu pet de ser um herói.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {myths.map((myth) => (
            <div
              key={myth.title}
              className="p-12 bg-[#262626] border border-white/10 rounded-3xl hover:border-[#b7102a]/30 transition-all"
            >
              <span className="inline-block px-3 py-1 bg-[#b7102a] text-white text-[9px] font-black rounded mb-8 uppercase tracking-widest">
                Mito
              </span>
              <h3 className="text-3xl mb-6 leading-tight font-extrabold tracking-tighter">
                {myth.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{myth.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcedureSection() {
  const steps = [
    {
      n: 1,
      title: "Triagem Clínica",
      desc: "Avaliação rápida dos sinais vitais e histórico.",
    },
    {
      n: 2,
      title: "Posicionamento",
      desc: "O pet é acomodado de forma confortável na maca.",
    },
    {
      n: 3,
      title: "Coleta (15 min)",
      desc: "Procedimento rápido e monitorado por especialistas.",
    },
    {
      n: 4,
      title: "Recuperação",
      desc: "Lanche especial e 15 min de descanso antes da alta.",
    },
  ];

  return (
    <section className="py-40 bg-white">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px]">
        <h2 className="text-5xl text-center mb-24 font-extrabold tracking-tighter">
          Como funciona o dia D?
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div
              key={step.n}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl mb-8 shadow-xl bg-[#b7102a] text-white hover:scale-110 transition-transform">
                {step.n}
              </div>
              <h4 className="font-bold text-xl mb-4 tracking-tight">
                {step.title}
              </h4>
              <p className="text-gray-500 leading-relaxed text-sm">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-40 bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-5 md:px-8 max-w-[1200px] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl mb-10 font-extrabold tracking-tighter">
            Pronto para transformar seu pet em um herói?
          </h2>
          <p className="text-gray-500 text-xl mb-16 max-w-2xl mx-auto">
            O cadastro leva menos de 3 minutos e pode garantir anos de vida para
            outro animal.
          </p>
          <Link
            to="/cadastrar"
            className="inline-block bg-[#b7102a] text-white px-16 py-7 rounded-full text-2xl hover:bg-white hover:text-[#b7102a] shadow-2xl transition-all hover:scale-105 font-bold"
          >
            Cadastrar meu Animal Agora
          </Link>
          <div className="mt-20 flex items-center justify-center gap-6 opacity-30">
            <span className="h-[1px] w-20 bg-white" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
              Apoio: Departamento de Veterinária UFV
            </p>
            <span className="h-[1px] w-20 bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Componente principal da página ─────────────────────────────────────────

import { useState } from "react";

function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <MissionSection />
        <TransparencySection />
        <CriteriaSection />
        <MythsSection />
        <ProcedureSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;
