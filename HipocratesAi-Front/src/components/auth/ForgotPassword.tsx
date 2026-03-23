import { useState } from 'react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendCode = () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, insira seu e-mail.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Simulação de envio de código
    setTimeout(() => {
      setIsLoading(false);
      setMessage({
        type: 'success',
        text: `Código de verificação enviado para ${email}. Verifique sua caixa de entrada.`,
      });
      setStep('code');
    }, 1500);
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      setMessage({ type: 'error', text: 'Por favor, insira o código de verificação.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Simulação de verificação (aceita qualquer código de 6 dígitos para demonstração)
    setTimeout(() => {
      setIsLoading(false);
      if (verificationCode.length === 6) {
        setMessage({ type: 'success', text: 'Código verificado com sucesso!' });
        setStep('newPassword');
      } else {
        setMessage({ type: 'error', text: 'Código inválido. Digite um código de 6 dígitos.' });
      }
    }, 1500);
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Por favor, preencha ambos os campos de senha.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Simulação de reset de senha
    setTimeout(() => {
      setIsLoading(false);
      setMessage({
        type: 'success',
        text: 'Senha redefinida com sucesso! Você pode fazer login com sua nova senha.',
      });

      // Fecha o modal após 3 segundos
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    }, 1500);
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-lg border border-solid border-[#dce0e5] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-solid border-[#dce0e5]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <span className="material-icon text-primary">key</span>
            </div>
            <div>
              <h2 className="text-title text-heading-3">Recuperação de Senha</h2>
              <p className="text-subtitle text-body-xs">
                {step === 'email' && 'Digite seu e-mail cadastrado'}
                {step === 'code' && 'Verifique seu e-mail e digite o código'}
                {step === 'newPassword' && 'Crie uma nova senha'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="material-icon text-subtitle">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {['email', 'code', 'newPassword'].map((s, index) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full mb-2
                  ${
                    step === s
                      ? 'bg-primary text-white'
                      : index < ['email', 'code', 'newPassword'].indexOf(step)
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-subtitle'
                  }`}
                >
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>
                <span className="text-body-xs text-center capitalize">
                  {s === 'email' ? 'E-mail' : s === 'code' ? 'Código' : 'Nova Senha'}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="text-label text-label-sm block mb-2">E-mail Profissional</label>
                <div className="relative">
                  <span className="material-icon absolute left-3 top-1/2 -translate-y-1/2 text-subtitle">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-solid border-[#dce0e5] bg-surface text-title focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="seu.email@hospital.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white rounded-[10px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-icon animate-spin">refresh</span>
                    Enviando código...
                  </span>
                ) : (
                  'Enviar Código de Verificação'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Verification Code */}
          {step === 'code' && (
            <div className="space-y-4">
              <div>
                <label className="text-label text-label-sm block mb-2">Código de Verificação</label>
                <div className="relative">
                  <span className="material-icon absolute left-3 top-1/2 -translate-y-1/2 text-subtitle">
                    password
                  </span>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-solid border-[#dce0e5] bg-surface text-title focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Digite o código de 6 dígitos"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-subtitle text-body-xs mt-2">
                  Enviamos um código de 6 dígitos para {email}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('email')}
                  disabled={isLoading}
                  className="flex-1 py-3 border border-solid border-[#dce0e5] text-title rounded-[10px] font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-[10px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Verificando...' : 'Verificar Código'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <div className="space-y-4">
              <div>
                <label className="text-label text-label-sm block mb-2">Nova Senha</label>
                <div className="relative">
                  <span className="material-icon absolute left-3 top-1/2 -translate-y-1/2 text-subtitle">
                    lock
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-solid border-[#dce0e5] bg-surface text-title focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="text-label text-label-sm block mb-2">Confirmar Nova Senha</label>
                <div className="relative">
                  <span className="material-icon absolute left-3 top-1/2 -translate-y-1/2 text-subtitle">
                    lock_reset
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-solid border-[#dce0e5] bg-surface text-title focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Digite a senha novamente"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('code')}
                  disabled={isLoading}
                  className="flex-1 py-3 border border-solid border-[#dce0e5] text-title rounded-[10px] font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-[10px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-[10px] ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-solid border-green-200'
                  : 'bg-red-50 text-red-700 border border-solid border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-icon">
                  {message.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span className="text-body-sm">{message.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-solid border-[#dce0e5]">
          <div className="flex items-center justify-between">
            <span className="text-subtitle text-body-xs">
              Precisa de ajuda?{' '}
              <a href="#" className="text-primary hover:underline">
                Contate o suporte
              </a>
            </span>
            <button
              onClick={handleClose}
              className="text-subtitle text-body-xs hover:text-title transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
