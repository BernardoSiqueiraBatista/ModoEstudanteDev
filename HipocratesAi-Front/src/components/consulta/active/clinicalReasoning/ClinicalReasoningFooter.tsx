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
    <footer className="p-4 space-y-3 bg-white/80 border-t border-gray-100">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction(action.response)}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="relative group">
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          className="w-full px-4 py-3 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all bg-gray-50 border border-gray-200"
          placeholder="Digite sua dúvida clínica..."
        />
        <button
          onClick={onSendMessage}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center pt-1">
        <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase">
          Hipócrates.ai Precision
        </span>
      </div>
    </footer>
  );
}
