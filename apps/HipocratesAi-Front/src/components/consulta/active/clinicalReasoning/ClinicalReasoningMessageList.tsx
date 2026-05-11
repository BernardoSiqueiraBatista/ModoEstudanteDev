import { useEffect, useRef } from 'react';
import ClinicalReasoningMessageBubble, {
  type Message,
} from './ClinicalReasoningMessageBubble';

interface ClinicalReasoningMessageListProps {
  messages: Message[];
  onStreamEnd?: (id: string) => void;
}

export default function ClinicalReasoningMessageList({
  messages,
  onStreamEnd,
}: ClinicalReasoningMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 space-y-6">
      {messages.map(message => (
        <ClinicalReasoningMessageBubble
          key={message.id}
          message={message}
          onStreamEnd={onStreamEnd}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
