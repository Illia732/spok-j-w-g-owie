'use client'
import MainLayout from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Target, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔥 DODAJ TEN USE EFFECT DO SPRAWDZENIA FIREBASE
  useEffect(() => {
    console.log('🔥 Firebase auth test:', auth)
    console.log('📊 Firebase db test:', db)

    // Sprawdzanie czy użytkownik jest zalogowany
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Użytkownik zalogowany:', user.email)
        setUser(user)
      } else {
        console.log('❌ Brak zalogowanego użytkownika')
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Jeśli ładujemy, pokaż prosty loader
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {/* Hero Section - DODAJ INFORMACJĘ O ZALOGOWANIU */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-500">
            {user ? `Witaj, ${user.email}!` : 'Architektura Uważności'}
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Twój spokój jest
          <span className="bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent"> naszym celem</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {user 
            ? 'Kontynuuj swoją podróż do lepszego samopoczucia' 
            : 'Dołącz do tysięcy użytkowników którzy już odkryli siłę codziennej uważności i samoobserwacji.'
          }
        </p>
        
        <div className="flex gap-4 justify-center">
          {user ? (
            <Button size="lg" className="rounded-full px-8">
              Kontynuuj praktykę
            </Button>
          ) : (
            <>
              <Button size="lg" className="rounded-full px-8">
                Rozpocznij podróż
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8">
                Dowiedz się więcej
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Reszta kodu pozostaje bez zmian */}
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card className="text-center bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">10k+</h3>
            <p className="text-gray-600">Aktywnych użytkowników</p>
          </CardContent>
        </Card>

        <Card className="text-center bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">94%</h3>
            <p className="text-gray-600">Lepsze samopoczucie</p>
          </CardContent>
        </Card>

        <Card className="text-center bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">30+</h3>
            <p className="text-gray-600">Dni retencji</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section - POKAŻ TYLKO DLA ZALOGOWANYCH */}
      {user && (
        <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md border border-gray-200/50">
          <CardHeader className="text-center">
            <CardTitle>Twój postęp</CardTitle>
            <CardDescription>
              Kontynuuj swoją podróż do lepszego samopoczucia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Poziom 5</span>
                <span className="text-gray-600">280/500 XP</span>
              </div>
              <Progress value={56} className="h-3" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Streak</span>
                <span className="text-gray-600">12 dni z rzędu</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  )
}