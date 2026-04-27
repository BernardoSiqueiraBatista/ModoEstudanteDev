import React from 'react';

interface MaximizedInputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading?: boolean;
}

export default function MaximizedInputArea({
  inputValue,
  onInputChange,
  onSendMessage,
  onKeyPress,
  isLoading = false,
}: MaximizedInputAreaProps) {
  return (
    <footer className="flex-shrink-0 px-6 py-6 bg-white/50 border-t border-gray-200">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-4 text-gray-700 placeholder:text-gray-400 font-light disabled:opacity-50 outline-none"
            placeholder="Digite sua dúvida clínica..."
          />
          <button
            onClick={onSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="size-10 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">
              {isLoading ? 'hourglass_empty' : 'arrow_upward'}
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}