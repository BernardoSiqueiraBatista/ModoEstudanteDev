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
    <div className="pt-3 w-full overflow-visible">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold tracking-wide text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-gray-900/20 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        type="button"
      >
        <span className="material-symbols-outlined text-base">
          {isLoading ? 'hourglass_empty' : 'play_arrow'}
        </span>
        {isLoading ? 'INICIANDO...' : 'INICIAR CONSULTA'}
      </button>

      <div className="flex flex-col items-center gap-1 mt-3">
        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <span className="material-symbols-outlined text-[10px]">encrypted</span>
          Ambiente Seguro & Criptografado
        </p>
      </div>
    </div>
  );
}
