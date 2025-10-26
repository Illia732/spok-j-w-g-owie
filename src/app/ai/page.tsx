'use client'

import { useState, useRef, useEffect } from 'react'
import Header from '@/components/layout/header'
import { Send, Sparkles, Bot, User, Zap, Heart, Moon, Brain, Clock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Auto-focus textarea
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error(`Błąd: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Błąd czatu:', error)
      
      // Error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę. 😔',
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    autoResizeTextarea()
  }, [inputMessage])

  const suggestions = [
    {
      icon: Brain,
      text: 'Jak radzić sobie ze stresem?',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Heart,
      text: 'Ćwiczenia mindfulness',
      gradient: 'from-green-500 to-blue-500'
    },
    {
      icon: Moon,
      text: 'Techniki relaksacyjne',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      text: 'Jak poprawić koncentrację?',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="pt-4 pb-6 sm:pt-6 sm:pb-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Enhanced Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-block mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-bounce" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      Asystent Spokoju
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm mt-1">
                      Twój osobisty przewodnik po mindfulness
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chat Container */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/20 overflow-hidden">
            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="h-80 sm:h-96 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-white to-slate-50/50"
            >
              {messages.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="relative inline-block mb-4 sm:mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                      <Bot className="h-8 w-8 sm:h-12 sm:w-12 text-white mx-auto" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                    Witaj w przestrzeni spokoju! 🌿
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                    Jestem tutaj, aby pomóc Ci w podróży do wewnętrznej równowagi. 
                    Zapytaj mnie o wszystko, co związane z mindfulness i dobrym samopoczuciem.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 sm:gap-3 group",
                      message.isUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg border",
                      message.isUser 
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200" 
                        : "bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-200"
                    )}>
                      {message.isUser ? (
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={cn(
                      "max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg border backdrop-blur-sm",
                      "transition-all duration-300 transform group-hover:scale-[1.02]",
                      message.isUser
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md border-blue-200"
                        : "bg-white text-gray-800 rounded-bl-md border-gray-200/50 shadow-md"
                    )}>
                      <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className={cn(
                        "text-xs mt-1 sm:mt-2 flex items-center gap-1",
                        message.isUser ? "text-blue-100" : "text-gray-500"
                      )}>
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          message.isUser ? "bg-blue-200" : "bg-gray-400"
                        )} />
                        {message.timestamp.toLocaleTimeString('pl-PL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Enhanced Loading Indicator */}
              {isLoading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-xl sm:rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-lg border border-gray-200/50">
                    <div className="flex space-x-2 items-center">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 ml-2">Piszę odpowiedź...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input Area */}
            <div className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
                <div className="flex-1 relative w-full">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Zadaj pytanie dotyczące mindfulness, relaksacji lub zdrowia psychicznego..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    ⏎ Enter aby wysłać
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className={cn(
                    "px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg border w-full sm:w-auto min-w-[120px]",
                    "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white",
                    "hover:shadow-xl active:scale-95 flex items-center gap-2 justify-center"
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Wysyłanie...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="text-sm">Wyślij</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Enhanced Quick Suggestions */}
          <div className="mt-6 sm:mt-8">
            <h3 className="text-center text-gray-600 font-medium mb-3 sm:mb-4 flex items-center justify-center gap-2 text-sm sm:text-base">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              Szybkie sugestie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(suggestion.text)}
                  disabled={isLoading}
                  className={cn(
                    "group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-300 hover:scale-105",
                    "bg-white border border-gray-200 shadow-sm hover:shadow-md",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  )}
                >
                  <div className="relative z-10">
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r mb-2 sm:mb-3 flex items-center justify-center",
                      suggestion.gradient
                    )}>
                      <suggestion.icon className="w-3 h-3 sm:w-4 sm:w-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-800 group-hover:text-gray-900 leading-tight">
                      {suggestion.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Wsparcie 24/7</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Zawsze dostępny asystent gotowy pomóc</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Personalizacja</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Dopasowane do Twoich potrzeb rozmowy</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Moon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Prywatność</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Twoje rozmowy są bezpieczne i poufne</p>
            </div>
          </div>

          {/* Limit Information */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Clock className="w-3 h-3 sm:w-4 sm:w-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-amber-800">
                Informacja o dostępie
              </h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3 text-amber-700">
              <p className="text-xs sm:text-sm leading-relaxed">
                <strong>Asystent AI ma tymczasowe ograniczenie dostępu</strong> ze względu na wysokie koszty utrzymania.
              </p>
              
              <div className="bg-amber-100/50 rounded-lg p-2 sm:p-3 border border-amber-300/50">
                <p className="text-xs sm:text-sm font-medium">
                  🕛 <strong>Limit zostanie zresetowany każdego dnia o 00:00</strong>
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-3 sm:p-4 border border-amber-200 mt-3 sm:mt-4">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                  <span className="text-xs sm:text-sm font-semibold text-amber-800">
                    Podoba Ci się ta funkcja?
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-700 mb-2 sm:mb-3">
                  Chcesz, żeby asystent AI był bardziej dostępny?
                </p>
                <a 
                  href="mailto:unfoggo@gmail.com?subject=Wsparcie dla Asystenta AI&body=Chcę wesprzeć rozwój Asystenta AI i zwiększenie jego dostępności!"
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:scale-105 shadow-md"
                >
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  Napisz do nas!
                </a>
                <p className="text-xs text-amber-600 mt-1 sm:mt-2">
                  unfoggo@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}