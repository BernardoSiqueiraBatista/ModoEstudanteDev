import React from 'react';

interface ClosureFooterProps {
  onCloseConsultation: () => void;
  isClosing?: boolean;
}

export default function ClosureFooter({ onCloseConsultation, isClosing = false }: ClosureFooterProps) {
  return (
    <footer className="flex items-center justify-center pt-12">
      <button
        onClick={onCloseConsultation}
        disabled={isClosing}
        className="glass-button px-12 py-4 rounded-full text-white font-medium flex items-center gap-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-xl">done_all</span>
        {isClosing ? 'Encerrando...' : 'Encerrar Consulta'}
      </button>
    </footer>
  );
}