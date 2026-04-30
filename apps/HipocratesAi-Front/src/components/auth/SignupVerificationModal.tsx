import React, { useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface SignupVerificationModalProps {
  isOpen: boolean;
  email: string;
  doctorData: {
    fullName: string;
    phone: string;
    specialty: string;
    crmNumber: string;
    crmState: string;
  } | null;
  onVerified: () => void;
  onClose?: () => void;
}

export default function SignupVerificationModal({
  isOpen,
  email,
  doctorData,
  onVerified,
  onClose,
}: SignupVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const token = useMemo(() => digits.join(''), [digits]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1);

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Email inválido.');
      return;
    }

    if (!/^\d{8}$/.test(token)) {
      setErrorMsg('O código deve ter 8 dígitos.');
      return;
    }

    if (!doctorData) {
      setErrorMsg('Dados do médico não encontrados.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'signup',
      });

      if (error) throw error;
      if (!data.user?.id && !data.session?.user?.id) {
        throw new Error('Usuário não encontrado após a verificação.');
      }

      const userId = data.user?.id ?? data.session?.user?.id;
      if (!userId) {
        throw new Error('Usuário inválido.');
      }

      const crmValue =
        doctorData.crmNumber && doctorData.crmState
          ? `${doctorData.crmNumber}/${doctorData.crmState}`
          : doctorData.crmNumber || null;

      const { error: upsertError } = await supabase
        .schema('app')
        .from('doctors')
        .upsert(
          {
            id: userId,
            full_name: doctorData.fullName,
            phone: doctorData.phone || null,
            specialty: doctorData.specialty || null,
            crm: crmValue,
            email: cleanEmail,
          },
          { onConflict: 'id' }
        );

      if (upsertError) throw upsertError;

      onVerified();
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Email inválido.');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) throw error;

      setInfoMsg('Código reenviado com sucesso.');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Erro ao reenviar o código.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />
      <main className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-[2.5rem] p-10 md:p-12 text-center flex flex-col items-center bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
              <svg
                fill="none"
                height="28"
                viewBox="0 0 24 24"
                width="28"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L12 22M2 12L22 12"
                  stroke="#000000"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                ></path>
                <circle cx="12" cy="12" r="5" stroke="#000000" strokeWidth="2.5"></circle>
              </svg>
            </div>
          </div>

          <section className="mb-10">
            <h1 className="text-2xl font-light text-slate-800 tracking-tight mb-3">
              Verificação de Segurança
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-normal px-4">
              Insira o código de 8 dígitos enviado para o seu e-mail.
            </p>
          </section>

          <form onSubmit={handleVerify} className="w-full">
            <div className="flex justify-between gap-1 mb-10" id="otp-inputs">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => {
                    inputRefs.current[index] = el;
                  }}
                  className="w-9 h-14 text-center text-xl font-medium text-slate-700 rounded-xl bg-white/50 border border-slate-200/60 focus:outline-none focus:border-black focus:bg-white"
                  maxLength={1}
                  type="text"
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  inputMode="numeric"
                />
              ))}
            </div>

            {errorMsg ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}

            {infoMsg ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {infoMsg}
              </div>
            ) : null}

            <div className="space-y-6">
              <button
                className="w-full py-4 rounded-2xl text-white font-medium text-sm tracking-wide bg-black hover:opacity-90 disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>

              <div className="flex items-center justify-center gap-4">
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Reenviando...' : 'Reenviar código'}
                </button>

                {onClose ? (
                  <button
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    type="button"
                    onClick={onClose}
                  >
                    Fechar
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>

        <footer className="mt-8 text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">
            Hipócrates.ai © 2024
          </span>
        </footer>
      </main>
    </div>
  );
}
