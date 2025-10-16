'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { ChatInterface } from './ChatInterface'

export function ChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 z-40 p-0" 
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  )
}