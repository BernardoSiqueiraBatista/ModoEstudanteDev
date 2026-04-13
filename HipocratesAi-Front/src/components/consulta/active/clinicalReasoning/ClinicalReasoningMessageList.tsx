import React, { useEffect, useRef } from 'react';
import ClinicalReasoningMessageBubble from './ClinicalReasoningMessageBubble';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface ClinicalReasoningMessageListProps {
  messages: Message[];
}

export default function ClinicalReasoningMessageList({
  messages,
}: ClinicalReasoningMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-white/50"
      style={{ maxHeight: '380px', minHeight: '300px' }}
    >
      {messages.map(message => (
        <ClinicalReasoningMessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
