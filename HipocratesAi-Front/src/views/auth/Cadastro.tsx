import "../../styles/auth.css";
import HeaderAuthPremium from "../../components/auth/HeaderAuth";
import SignupForm from "../../components/auth/SignUpForm";

function Cadastro() {
  return (
    <main className="w-full h-screen flex overflow-hidden">
      <section className="w-full lg:w-[40%] h-screen p-6 sm:p-8 bg-white flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <HeaderAuthPremium />
        </div>

        <div className="flex-1 py-4 px-1 flex items-center justify-center">
          <SignupForm />
        </div>
      </section>

      <section className="hidden lg:flex lg:w-[60%] h-screen hero-gradient relative items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <svg className="w-[120%] h-[120%] text-slate-300/30" viewBox="0 0 800 800">
            <circle
              cx="400"
              cy="400"
              fill="none"
              r="300"
              stroke="currentColor"
              strokeDasharray="10 5"
              strokeWidth="0.5"
            />
            <circle
              cx="400"
              cy="400"
              fill="none"
              r="250"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M400 100 Q 600 400 400 700 Q 200 400 400 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <path
              d="M100 400 Q 400 600 700 400 Q 400 200 100 400"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <img
            alt="Conceito Visual Hipócrates.ai"
            className="w-full h-auto mix-blend-multiply opacity-70 grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtxdcSE3BWSm0YfpVUI-_vMS-mhZ0tR3JyjDA5TNxuaEBqnlEBRGbk4R8q5Czqc_RSb9LI7HVE11pApTuMSMS8gUvH2lJbqNcCfIwIHWxu9FmthKWkdFeQSh3bqmID5BlqZKVBe29iExc63wzCBmbuTDU9ni4BMgU6Z9ucJzae_Sc997-a9J_tmdICVDnCxx6Qo7NCOMAJ0QQ0V53E7YMuYFJHdWzOPoe8kyzu_DWJV6PNcEAPjurBpHZsljFe75tX-CUudC0uxdPk"
          />

          <div className="absolute -top-8 -right-4 w-64 bubble-glass-light p-5 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
                <img
                  alt="Dr Silva"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoSJrXlWJpShIJKUGW9dVwoDzKcY7wTaJ7SoHFt7A7GJ42JIa68ChfTyQ__W8cq0mvuOZcbxEvVlvdfOoQZdunBrrraK0L3qM5rSM_nexWN72fp2Gc57IO-tzcu2-Z0_ldn-fTWj6WzA0BZVXg8Dbi4HUuQ9qjfsmhoeBQcUE8TlhJnp0lnKNeLKw7AQIT0_weg_WtduK4ohMBH1s82lHhrSNWXM46ITKsH1PgmRZvJg6R_q_pfLMw2Fnk8_dKTYYlzAtit1eZQsPI"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Dr. Arnaldo Silva</p>
                <p className="text-[8px] uppercase tracking-tighter text-slate-500">
                  Corpo Clínico Sênior
                </p>
              </div>
            </div>
            <p className="text-xs italic text-slate-600 leading-relaxed font-light">
              "A excelência diagnóstica traduzida em uma interface purista e eficiente."
            </p>
          </div>

          <div className="absolute -bottom-8 -left-4 w-72 bubble-glass-light p-5 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
                <img
                  alt="Dra Souza"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAI3RglGhpGRWC9q8hMX-FMG15BUt1d-pCg3wrBX6P4-uSY3QAVS342jApRRvXVMA7wJSIc3guuaHLb9narf3rZvKRXOkVD79kLFY40bjAV1kJfqDf5TR1gXoFeLvM6EuRJmBONgxy3I8shyi0FiCJd9dJaPBWsvOA6POWpuykjRVRYHzQvm0C3UTRjhq2ikUvgJ3e-U14JjrZ2AmlvsbHuebo168KG62y5eAHYAUbmTluKJMHNHu7gRpblvfB7ck42NVhNf5nZaA69"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Dra. Maria Souza</p>
                <p className="text-[8px] uppercase tracking-tighter text-slate-500">
                  Diretoria de Inovação
                </p>
              </div>
            </div>
            <p className="text-xs italic text-slate-600 leading-relaxed font-light">
              "Segurança e clareza. Hipócrates.ai é o novo padrão ouro na medicina assistida."
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-[9px] font-bold tracking-[0.4em] text-slate-400 uppercase mb-1">
            Elite Clinical AI
          </p>
          <h2 className="text-3xl font-light text-slate-400">
            Padrão <span className="font-bold text-slate-800">Hospitalar</span>
          </h2>
          <p className="text-2xl font-extralight text-slate-300 italic tracking-tight">
            Minimalismo Digital
          </p>
        </div>
      </section>
    </main>
  );
}

export default Cadastro;
