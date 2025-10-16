'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { chatService, type Conversation, type ChatMessage } from '@/lib/chat-service'
import userService from '@/lib/user-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageCircle, 
  Send, 
  Users, 
  Search,
  X,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userProfiles, setUserProfiles] = useState<Map<string, any>>(new Map())

  // Ładuj konwersacje
  useEffect(() => {
    if (!user?.uid || !isOpen) return

    const unsubscribe = chatService.subscribeToConversations(user.uid, async (convs) => {
      setConversations(convs)
      
      // Pobierz profile użytkowników
      const profiles = new Map()
      for (const conv of convs) {
        for (const participantId of conv.participants) {
          if (participantId !== user.uid && !profiles.has(participantId)) {
            const profile = await userService.getUserProfile(participantId)
            if (profile) {
              profiles.set(participantId, profile)
            }
          }
        }
      }
      setUserProfiles(profiles)
    })

    return () => unsubscribe()
  }, [user?.uid, isOpen])

  // Ładuj wiadomości gdy konwersacja aktywna
  useEffect(() => {
    if (!activeConversation || !user?.uid) return

    const unsubscribe = chatService.subscribeToMessages(activeConversation, (msgs) => {
      setMessages(msgs)
      // Oznacz jako przeczytane
      chatService.markMessagesAsRead(activeConversation, user.uid!)
    })

    return () => unsubscribe()
  }, [activeConversation, user?.uid])

  // Scroll do najnowszej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user?.uid) return

    const otherUserId = activeConversation.split('_').find(id => id !== user.uid)!
    
    setLoading(true)
    try {
      await chatService.sendMessage(activeConversation, user.uid, otherUserId, newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error)
    } finally {
      setLoading(false)
    }
  }

  const startNewConversation = async (friendId: string) => {
    if (!user?.uid) return
    
    const conversationId = await chatService.createConversation(user.uid, friendId)
    setActiveConversation(conversationId)
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(id => id !== user?.uid)!
  }

  const getParticipantName = (participantId: string) => {
    const profile = userProfiles.get(participantId)
    return profile?.displayName || 'Nieznany użytkownik'
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Wiadomości</span>
          {conversations.some(conv => conv.unreadCount > 0) && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Lista konwersacji */}
        {!activeConversation ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <Input
                placeholder="Szukaj konwersacji..."
                className="w-full"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Brak konwersacji</p>
                  <p className="text-sm">Rozpocznij czat z znajomym!</p>
                </div>
              ) : (
                conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    userProfiles={userProfiles}
                    currentUserId={user?.uid!}
                    isActive={activeConversation === conversation.id}
                    onClick={() => setActiveConversation(conversation.id)}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          /* Czat */
          <div className="flex-1 flex flex-col">
            {/* Header czatu */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveConversation(null)}
                className="text-gray-600"
              >
                ←
              </Button>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {getParticipantName(getOtherParticipant(
                    conversations.find(c => c.id === activeConversation)!
                  ))}
                </div>
              </div>
            </div>

            {/* Wiadomości */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.uid}
                  senderName={getParticipantName(message.senderId)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input wiadomości */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Napisz wiadomość..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || loading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationItem({ conversation, userProfiles, currentUserId, isActive, onClick }: any) {
  const otherUserId = conversation.participants.find((id: string) => id !== currentUserId)!
  const profile = userProfiles.get(otherUserId)
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
        isActive && "bg-blue-50 border-blue-200"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {profile?.displayName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">
            {profile?.displayName || 'Nieznany użytkownik'}
          </div>
          <div className="text-sm text-gray-600 truncate">
            {conversation.lastMessage || 'Brak wiadomości'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {conversation.lastMessageTime.toLocaleTimeString('pl-PL', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isOwn, senderName }: any) {
  return (
    <div className={cn(
      "flex",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
        isOwn 
          ? "bg-blue-500 text-white rounded-br-none" 
          : "bg-gray-100 text-gray-900 rounded-bl-none"
      )}>
        {!isOwn && (
          <div className="text-xs font-medium text-blue-600 mb-1">
            {senderName}
          </div>
        )}
        <div className="text-sm">{message.content}</div>
        <div className={cn(
          "text-xs mt-1",
          isOwn ? "text-blue-100" : "text-gray-500"
        )}>
          {message.timestamp.toLocaleTimeString('pl-PL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  )
}