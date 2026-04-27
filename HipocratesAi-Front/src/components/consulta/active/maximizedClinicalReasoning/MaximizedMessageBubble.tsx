import React from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface MaximizedMessageBubbleProps {
  message: Message;
}

export default function MaximizedMessageBubble({ message }: MaximizedMessageBubbleProps) {
  const isAI = message.sender === 'ai';
  
  return (
    <div className={`flex items-start gap-4 ${!isAI ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isAI ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
      }`}>
        <span className="material-symbols-outlined text-sm">
          {isAI ? 'psychology' : 'person'}
        </span>
      </div>
      
      {/* Mensagem */}
      <div className={`flex-1 ${!isAI ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-[80%] px-6 py-4 rounded-2xl ${
          isAI
            ? 'bg-gray-100 border border-gray-200 text-gray-800'
            : 'bg-gray-800 text-white'
        }`}>
          <p className="text-sm leading-relaxed">
            {message.text}
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          {isAI ? 'Assistente Clínico' : 'Dr. Hipócrates'} • 
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}