// src/components/blocked-user-alert.tsx - POPRAWIONA WERSJA
'use client'

import { AlertTriangle, Clock, Calendar, User, MessageCircle, LogOut, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/auth-provider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function BlockedUserAlert() {
  const { blockData, logout } = useAuth()
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState('')
  const supportEmail = 'unfoggo@gmail.com' // 👈 STAŁY EMAIL KONTAKTOWY

  // Proste formatowanie daty
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'Nieznana data'
      
      let actualDate: Date
      
      if (date?.toDate) {
        actualDate = date.toDate()
      } else if (date?._seconds) {
        actualDate = new Date(date._seconds * 1000)
      } else {
        actualDate = new Date(date)
      }

      if (isNaN(actualDate.getTime())) return 'Nieprawidłowa data'

      return actualDate.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Błąd daty'
    }
  }

  // Obliczanie pozostałego czasu
  useEffect(() => {
    if (!blockData || blockData.isPermanent) {
      setTimeRemaining('Blokada permanentna')
      return
    }

    const updateTime = () => {
      try {
        const expiresAt = blockData.expiresAt?.toDate?.() || new Date(blockData.expiresAt)
        const now = new Date()
        const diffMs = expiresAt.getTime() - now.getTime()
        
        if (diffMs <= 0) {
          setTimeRemaining('Blokada wygasła')
          return
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        
        if (hours > 0) {
          setTimeRemaining(`Blokada wygaśnie za ${hours} godz. ${minutes} min`)
        } else {
          setTimeRemaining(`Blokada wygaśnie za ${minutes} minut`)
        }
      } catch {
        setTimeRemaining('Błąd obliczeń')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 30000) // Co 30 sekund
    return () => clearInterval(interval)
  }, [blockData])

  const handleLogout = async () => {
    await logout()
  }

  if (!blockData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardContent className="p-6">
          {/* Nagłówek */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-red-900 mb-2">
              Konto Zablokowane
            </h1>
            <p className="text-red-700 text-sm">
              {blockData.isPermanent 
                ? 'Twoje konto zostało permanentnie zablokowane' 
                : 'Twoje konto zostało tymczasowo zablokowane'
              }
            </p>
          </div>

          {/* Informacje o blokadzie */}
          <div className="space-y-3 mb-4">
            <InfoItem 
              icon={<MessageCircle className="h-4 w-4" />}
              title="Powód blokady"
              value={blockData.reason || 'Nie podano powodu'}
            />
            
            {/* 👇 UKRYTY EMAIL ADMINA - POKAZUJEMY STAŁY TEKST */}
            <InfoItem 
              icon={<User className="h-4 w-4" />}
              title="Zablokowane przez"
              value="Administrator Systemu" // 👈 ZAMIOST PRAWDZIWEGO EMAILA
            />
            
            <InfoItem 
              icon={<Calendar className="h-4 w-4" />}
              title="Data blokady"
              value={formatDate(blockData.blockedAt)}
            />
            
            <InfoItem 
              icon={<Clock className="h-4 w-4" />}
              title="Status"
              value={timeRemaining}
            />
          </div>

          {/* 👇 SEKCJA KONTAKTOWA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">
                  Uważasz, że to pomyłka?
                </h4>
                <p className="text-blue-700 text-sm mb-2">
                  Skontaktuj się z nami, a postaramy się pomóc:
                </p>
                <div className="flex items-center justify-between">
                  <a 
                    href={`mailto:${supportEmail}?subject=Problem z blokadą konta&body=Witam,%0D%0A%0D%0AMoje konto zostało zablokowane. Proszę o pomoc.%0D%0A%0D%0APozdrawiam`}
                    className="text-blue-600 hover:text-blue-800 underline font-medium text-sm"
                  >
                    {supportEmail}
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs"
                    onClick={() => {
                      const subject = "Problem z blokadą konta"
                      const body = "Witam,\n\nMoje konto zostało zablokowane. Proszę o pomoc.\n\nPozdrawiam"
                      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Wyślij email
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Instrukcje */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-amber-900 text-sm mb-2">Co teraz?</h4>
            <ul className="text-amber-800 text-xs space-y-1">
              <li>• Nie możesz korzystać z aplikacji {blockData.isPermanent ? '' : 'do czasu wygaśnięcia blokady'}</li>
              <li>• Wszystkie Twoje dane pozostają bezpieczne</li>
              {!blockData.isPermanent && (
                <li>• Po wygaśnięciu blokady będziesz mógł normalnie korzystać z konta</li>
              )}
              <li>• Jeśli uważasz, że to pomyłka, skontaktuj się z nami</li>
            </ul>
          </div>

          {/* Przycisk wylogowania */}
          <Button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Wyloguj się
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Komponent pomocniczy
function InfoItem({ icon, title, value }: any) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="text-red-600 mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
        <p className="text-gray-700 text-sm">{value}</p>
      </div>
    </div>
  )
}