import React from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface ClinicalReasoningMessageBubbleProps {
  message: Message;
}

export default function ClinicalReasoningMessageBubble({
  message,
}: ClinicalReasoningMessageBubbleProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm leading-relaxed text-gray-600 font-light">{message.text}</p>
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
        {message.sender === 'ai' ? 'Assistente Clínico' : 'Dr. Hipócrates'}
      </span>
    </div>
  );
}
