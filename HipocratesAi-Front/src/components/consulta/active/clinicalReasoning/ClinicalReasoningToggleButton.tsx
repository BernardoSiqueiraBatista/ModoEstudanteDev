import React from 'react';

interface ClinicalReasoningToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function ClinicalReasoningToggleButton({
  isOpen,
  onClick,
}: ClinicalReasoningToggleButtonProps) {
  // Quando o popup está aberto (expandido ou minimizado), o botão flutuante não aparece
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:shadow-xl hover:scale-105 active:scale-95 border border-gray-200 text-gray-500 hover:text-blue-500"
    >
      <svg
        fill="none"
        height="22"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        width="22"
      >
        <path d="M9 3C7.5 3 6 4.5 6 7C4 7 3 8.5 3 10.5C3 13 5 14 7 14C7 16 8.5 17 10 17C12 17 13 15.5 13 13.5C13 11 11 10 11 10C11 10 13 9 13 7C13 4.5 11 3 9 3Z" />

        <path d="M15 3C16.5 3 18 4.5 18 7C20 7 21 8.5 21 10.5C21 13 19 14 17 14C17 16 15.5 17 14 17C12 17 11 15.5 11 13.5C11 11 13 10 13 10C13 10 11 9 11 7C11 4.5 13 3 15 3Z" />

        <path d="M12 10V17" />
        <path d="M10 15C10 15 11 16.5 12 17C13 16.5 14 15 14 15" />
      </svg>
    </button>
  );
}
