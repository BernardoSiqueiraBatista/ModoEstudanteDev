import React from 'react';

interface StartConsultationButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
}

export default function StartConsultationButton({
  onClick,
  isLoading = false,
}: StartConsultationButtonProps) {
  return (
    <div className="pt-5 w-full overflow-visible">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl font-semibold tracking-wide text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        type="button"
      >
        <span className="material-symbols-outlined text-lg">
          {isLoading ? 'hourglass_empty' : 'play_arrow'}
        </span>
        {isLoading ? 'INICIANDO...' : 'INICIAR CONSULTA'}
      </button>
      
      <div className="flex flex-col items-center gap-1 mt-4">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">encrypted</span>
          Ambiente Seguro & Criptografado
        </p>
      </div>
    </div>
  );
}