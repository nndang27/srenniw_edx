'use client'
import { useEffect, useState } from 'react'
import { useApi } from '@/lib/api'
import { useChat } from '@/lib/websocket'
import { useUser } from '@clerk/nextjs'
import ChatWindow from '@/components/shared/ChatWindow'
import type { ChatRoom } from '@/types'

export default function ParentChatPage() {
  const api = useApi()
  const { user } = useUser()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const { messages, connected, isTyping, sendMessage, sendTyping } = useChat(selectedRoom)

  useEffect(() => {
    api.getChatRooms('parent')
      .then(data => {
        setRooms(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0) setSelectedRoom((data[0] as any).id || data[0].room_id)
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-[calc(100vh-160px)]">
      <aside className="w-64 border-r border-[#eeeeee] flex flex-col bg-white">
        <div className="p-4 border-b border-[#eeeeee]">
          <h2 className="font-semibold text-sm text-[#333]">Teacher Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 mx-3 my-2 rounded-xl bg-[#f7f8fc] animate-pulse" />
            ))
          ) : rooms.length === 0 ? (
            <p className="text-sm text-[#999] p-4">No conversations yet. Your teacher will start a chat.</p>
          ) : (
            rooms.map((room: any) => (
              <button
                key={room.id || room.room_id}
                onClick={() => setSelectedRoom(room.id || room.room_id)}
                className={`w-full text-left px-4 py-3 hover:bg-[#f7f8fc] transition-colors border-b border-[#eeeeee] ${
                  selectedRoom === (room.id || room.room_id) ? 'bg-[#eef2ff] border-l-2 border-l-[#446dd5]' : ''
                }`}
              >
                <p className="text-sm font-medium text-[#333]">Your Teacher</p>
                {room.last_message && (
                  <p className="text-xs text-[#999] truncate">{room.last_message}</p>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 bg-white">
        {selectedRoom ? (
          <ChatWindow
            messages={messages}
            onSend={sendMessage}
            onTyping={sendTyping}
            currentUserId={user?.id || ''}
            connected={connected}
            isTyping={isTyping}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#999]">
            No conversation selected
          </div>
        )}
      </div>
    </div>
  )
}
