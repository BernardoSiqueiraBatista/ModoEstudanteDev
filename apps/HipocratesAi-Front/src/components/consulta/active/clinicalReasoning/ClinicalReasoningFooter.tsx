import React from 'react';

interface ClinicalReasoningFooterProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onQuickAction: (action: string) => void;
}

const quickActions = [
  {
    label: 'Resumir quadro',
    response: 'Resumindo o quadro clínico: paciente apresenta sintomas sugestivos de...',
  },
  {
    label: 'Verificar contraindicações',
    response: 'Verificando contraindicações: não foram identificadas contraindicações absolutas...',
  },
  {
    label: 'Sugestões de conduta',
    response:
      'Sugestões de conduta: 1. Monitorização pressórica; 2. Exames complementares; 3. Acompanhamento ambulatorial...',
  },
];

export default function ClinicalReasoningFooter({
  inputValue,
  onInputChange,
  onSendMessage,
  onKeyPress,
  onQuickAction,
}: ClinicalReasoningFooterProps) {
  return (
    <footer className="p-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction(action.response)}
            className="glass-pill px-3.5 py-2 rounded-full text-[11px] font-medium text-slate-700"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="glass-input-container relative rounded-2xl overflow-hidden">
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          className="w-full bg-transparent px-5 py-4 pr-12 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          placeholder="Digite sua dúvida clínica..."
        />
        <button
          onClick={onSendMessage}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors flex items-center"
        >
          <span className="material-symbols-outlined !text-[18px]">arrow_upward</span>
        </button>
      </div>
    </footer>
  );
}
