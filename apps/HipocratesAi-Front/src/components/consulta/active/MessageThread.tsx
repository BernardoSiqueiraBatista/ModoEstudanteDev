import MessageBubble from './MessageBubble';
import type { RedFlag } from '../../../lib/flagMatcher';

export interface Message {
  id: string;
  speaker: 'MD' | 'PT' | 'AI';
  text: string;
  isAI?: boolean;
  timestamp?: string;
}

interface MessageThreadProps {
  messages: Message[];
  flagsByTranscript?: Map<string, RedFlag[]>;
}

export default function MessageThread({ messages, flagsByTranscript }: MessageThreadProps) {
  return (
    <div className="px-20 pt-4 pb-40">
      <div className="max-w-3xl mx-auto space-y-12">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            speaker={message.speaker}
            text={message.text}
            isAI={message.isAI}
            flags={flagsByTranscript?.get(message.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
