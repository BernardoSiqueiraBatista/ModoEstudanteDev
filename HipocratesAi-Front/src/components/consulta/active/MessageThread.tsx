import React from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from '../../../data/ConsultationData';

interface MessageThreadProps {
  messages: Message[];
}

export default function MessageThread({ messages }: MessageThreadProps) {
  return (
    <div className="flex-1 overflow-y-auto px-20 pb-40 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-16">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            speaker={message.speaker}
            text={message.text}
            isAI={message.isAI}
          />
        ))}
      </div>
    </div>
  );
}
