import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SignupVerificationModal from './SignupVerificationModal';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function SignupForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    specialty: '',
    email: '',
    phone: '',
    crmNumber: '',
    crmState: 'SP',
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);

    if (match) {
      return !match[2]
        ? match[1]
        : `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}${match[4] ? `-${match[4]}` : ''}`;
    }

    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);

    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }

    return value;
  };

  const brazilianStates = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ];

  const specialties = [
    'Alergia e Imunologia',
    'Anestesiologia',
    'Angiologia',
    'Cardiologia',
    'Cirurgia Geral',
    'Clínica Médica',
    'Dermatologia',
    'Endocrinologia e Metabologia',
    'Gastroenterologia',
    'Geriatria',
    'Ginecologia e Obstetrícia',
    'Infectologia',
    'Neurologia',
    'Oftalmologia',
    'Oncologia Clínica',
    'Ortopedia e Traumatologia',
    'Otorrinolaringologia',
    'Pediatria',
    'Pneumologia',
    'Psiquiatria',
    'Radiologia e Diagnóstico por Imagem',
    'Reumatologia',
    'Urologia',
    'Outra',
  ];

  const cleanEmail = formData.email.trim().toLowerCase();
  const cleanName = formData.fullName.trim();

  const doctorPayload = {
    fullName: cleanName,
    phone: formData.phone.trim(),
    specialty: formData.specialty,
    crmNumber: formData.crmNumber.trim(),
    crmState: formData.crmState,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setInfoMsg(null);

    if (!cleanName) {
      setErrorMsg('Informe seu nome.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Informe um email válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    if (!formData.specialty.trim()) {
      setErrorMsg('Informe sua especialidade.');
      return;
    }

    if (!formData.crmNumber.trim()) {
      setErrorMsg('Informe seu CRM.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Você precisa aceitar os Termos e a Política de Privacidade.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: 'doctor',
          },
        },
      });

      if (error) throw error;

      setInfoMsg('Código enviado. Verifique seu e-mail.');
      setShowVerificationModal(true);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-sm w-full">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-navy-deep tracking-tight mb-2">Criar Conta</h1>
          <p className="text-slate-400 text-sm font-light">
            Preencha os dados abaixo para acessar a plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Nome Completo
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
              placeholder="Seu nome completo"
              type="text"
              value={formData.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                CPF
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
                placeholder="000.000.000-00"
                type="text"
                value={formData.cpf}
                onChange={e => handleChange('cpf', formatCPF(e.target.value))}
                maxLength={14}
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                Data Nasc.
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 border-none focus:ring-0 transition-all text-xs"
                type="date"
                value={formData.birthDate}
                onChange={e => handleChange('birthDate', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Especialidade
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 border-none focus:ring-0 transition-all text-xs appearance-none"
              value={formData.specialty}
              onChange={e => handleChange('specialty', e.target.value)}
              disabled={loading}
            >
              <option value="">Selecione a especialidade</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              E-mail Profissional
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
              placeholder="email@instituicao.com.br"
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Telefone
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
              placeholder="(00) 00000-0000"
              type="text"
              value={formData.phone}
              onChange={e => handleChange('phone', formatPhone(e.target.value))}
              maxLength={15}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                Número do CRM
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
                placeholder="123456"
                type="text"
                value={formData.crmNumber}
                onChange={e => handleChange('crmNumber', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                Estado
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 border-none focus:ring-0 transition-all text-xs appearance-none"
                value={formData.crmState}
                onChange={e => handleChange('crmState', e.target.value)}
                disabled={loading}
              >
                {brazilianStates.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label} ({state.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                Senha
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                Confirmação
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-xl liquid-glass-input text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 transition-all text-xs"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}

          {infoMsg ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {infoMsg}
            </div>
          ) : null}

          <div className="flex items-start gap-3 pt-2">
            <input
              className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              required
              disabled={loading}
            />
            <label className="text-xs text-slate-500 leading-tight" htmlFor="terms">
              Eu li e aceito os Termos de Uso e a Política de Privacidade.
            </label>
          </div>

          <button
            className="w-full mt-4 py-3 premium-button font-bold rounded-xl text-xs uppercase tracking-[0.05em] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Criar Conta'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Já possui uma conta?{' '}
              <Link className="text-navy-deep font-bold hover:underline" to="/login">
                Fazer Login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <SignupVerificationModal
        isOpen={showVerificationModal}
        email={cleanEmail}
        doctorData={doctorPayload}
        onVerified={() => {
          setShowVerificationModal(false);
          navigate('/login', { replace: true });
        }}
        onClose={() => setShowVerificationModal(false)}
      />
    </>
  );
}

export default SignupForm;
