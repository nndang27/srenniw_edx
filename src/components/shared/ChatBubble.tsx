import type { ChatMessage } from '@/types'
import { formatTime } from '@/lib/utils'

interface Props {
  message: ChatMessage
  currentUserId: string
}

export default function ChatBubble({ message, currentUserId }: Props) {
  const isOwn = message.sender_id === currentUserId

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && (
          <span className="text-xs text-[#999] px-1 capitalize">{message.sender_role}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? 'bg-[#446dd5] text-white rounded-br-sm'
              : 'bg-[#f7f8fc] text-[#333] rounded-bl-sm border border-[#eeeeee]'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-[#bbb] px-1">{formatTime(message.created_at)}</span>
      </div>
    </div>
  )
}
