import HeaderAuthPremium from "../../components/auth/HeaderAuth.tsx";
import LoginForm from "../../components/auth/LoginForm.tsx";
import TestimonialCard from "../../components/auth/TestimonialCard.tsx";
import "../../styles/auth.css";


function Login() {
  return (
    <main className="w-full min-h-screen flex overflow-hidden bg-off-white">
      {/* Left Section */}
      <section className="w-full lg:w-[40%] min-h-screen flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-white relative overflow-y-auto">
        <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-clinical-gray/50 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex-shrink-0">
          <HeaderAuthPremium />
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center py-6">
          <LoginForm />
        </div>

        <div className="relative z-10 flex-shrink-0 text-center pt-6">
          <p className="text-slate-400 text-xs font-medium tracking-wide">
            Ambiente restrito.
            <a
              className="text-navy-deep font-bold border-b border-navy-deep/20 hover:border-navy-deep transition-all ml-1"
              href="/cadastro"
            >
              Solicitar Convite
            </a>
          </p>
        </div>
      </section>

      {/* Right Section */}
      <section className="hidden lg:block lg:w-[60%] min-h-screen relative overflow-hidden bg-clinical-gray">
        <div className="absolute inset-0">
          <img
            alt="Medical AI Concept"
            className="w-full h-full object-cover opacity-60 scale-110 mix-blend-multiply"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_nJs45zxHYT-OUbAvFdCB2IhRPbP_P4E4Su1DuCaB9dJvM3waJ7_hgrkAVFyXdDOLoPEJpAV6f9rx6lanpMgD8L4nTWgCT3ls-OdcFueFhmcQCVM0osqnrOc4iu6s-L1J2ocplK0w2oCOVH0enof2fbcmV54idpClB_XBhZ1KeObLTvXZgDGPg4O565z4PFxVOaSu8pBGzQlbvmtNGmewEa8gVpaU5CID3IZL-UxK6tFsSopuesaJr22uSQdVww8c4mYfQGnk9isi"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-clinical-gray via-clinical-gray/40 to-white/20"></div>
        </div>

        <TestimonialCard
          name="Dr. Arnaldo Silva"
          role="Corpo Clínico Sênior"
          quote="A excelência diagnóstica traduzida em uma interface purista e eficiente."
          avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuDD1YlOSD0AiicI0vZEqxRlZvh5fhFsp-h5aAJaL2SwLwfNxPa_rNG4HjHCWj21I2hKRfRv0WNnxqukBi42snA9y5LUQcsRRpJrAEmtfX6NlQCTtzdMhccnu8-EPLknKtBMO0BHAGy-D8IM5GvXq-dDHjvebCM2G7xYvCvrHCE3KMXnL-H8sLoGNocvFNx1_gqE-PAwdMNRSGCxQQEHhWgYdCyXT2vHkHyOII_c98ByjE4kJNq1x5yAjy4A1S01qMzh0lLxDUKgIDC7"
          position="top-right"
        />

        <TestimonialCard
          name="Dra. Maria Souza"
          role="Diretoria de Inovação"
          quote="Segurança e clareza. Hipócrates.ai é o novo padrão ouro na medicina assistida."
          avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuAEGA4lyb61Gq6cgwoE-x2K907cyhbVsiGv-tv8sap5ZUAN8cfoxcaYJ8Qaw2wKnMafDaugfpCHqEAuNHajmCWF3VWWhpRuZPpDMglAcorcblNAChtEL4NgCzoFSpXeezZK33WdBmQ8qzZJH1F4XoxWfUNnXpVL_VFDVVYcejoTwdUQA3r70DGcVjsZ4ITldESemLM5yF1NJXCUg_77nNA6_7nhnC9DKU3N60Lul-wqCuWRuE_egTn-Lr8XJisk0mVoyhsiZnrqJvij"
          position="bottom-left"
        />

        <div className="absolute bottom-12 right-12 text-right z-20">
          <div className="text-slate-400 text-[10px] tracking-[0.5em] uppercase mb-3 font-bold">
            Elite Clinical AI
          </div>
          <div className="text-navy-deep text-3xl font-extralight tracking-tighter leading-tight">
            Padrão <span className="font-black">Hospitalar</span>
            <br />
            <span className="text-slate-400 italic text-2xl">
              Minimalismo Digital
            </span>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      </section>
    </main>
  );
}

export default Login;
