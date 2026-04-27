import React, { useEffect, useRef } from 'react';
import MaximizedMessageBubble from './MaximizedMessageBubble';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface MaximizedMessageListProps {
  messages: Message[];
}

export default function MaximizedMessageList({ messages }: MaximizedMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((message) => (
          <MaximizedMessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}