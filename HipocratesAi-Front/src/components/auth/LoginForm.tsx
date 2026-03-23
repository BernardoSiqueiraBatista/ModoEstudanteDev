import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import ForgotPasswordModal from "./ForgotPassword";

function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Digite um e-mail válido.");
      return;
    }

    if (!password) {
      setErrorMsg("Digite sua senha.");
      return;
    }

    setLoading(true);
    try {
      const { data: existingDoctor, error: doctorError } = await supabase
        .schema("app")
        .from("doctors")
        .select("id, email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (doctorError) throw doctorError;

      if (!existingDoctor) {
        setErrorMsg("Usuário ainda não possui conta registrada.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-navy-deep mb-2 tracking-tight">
            Acesso <span className="text-gradient-navy">Elite</span>
          </h1>
          <p className="text-slate-400 text-sm font-light">
            Entre com seu e-mail e sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400 ml-1">
              Credencial Profissional
            </label>
            <input
              className="w-full px-5 py-3 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-sm"
              placeholder="Email institucional"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1 gap-3">
              <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">
                Chave de Segurança
              </label>
              <button
                type="button"
                className="text-[10px] font-semibold text-slate-400 hover:text-navy-deep transition-colors"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading}
              >
                Esqueceu a chave?
              </button>
            </div>

            <input
              className="w-full px-5 py-3 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-sm"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}

          <button
            className="w-full py-3 premium-button font-bold rounded-xl text-xs uppercase tracking-[0.05em] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Processando..." : "Entrar no Sistema"}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Ainda não possui conta?{" "}
              <Link className="text-navy-deep font-bold hover:underline" to="/cadastro">
                Criar Conta
              </Link>
            </p>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
}

export default LoginForm;
