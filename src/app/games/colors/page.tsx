'use client'

import { ColorMatchingGame } from '@/components/games/ColorMatchingGame'
import Header from '@/components/layout/header'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { XPService, XPSource } from '@/lib/xp-service'

export default function ColorsGamePage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr)
    })
    return () => unsubscribe()
  }, [])

  // 🎁 CALLBACK PO UKOŃCZENIU GRY - różne XP dla różnych poziomów
  const handleGameComplete = async (difficulty: 'zen' | 'chill' | 'flow') => {
    if (!user) return

    try {
      console.log(`🎨 Ukończono grę w trybie: ${difficulty}`)
      
      // Wybierz odpowiednie źródło XP w zależności od poziomu
      let xpSource: XPSource
      switch (difficulty) {
        case 'zen':
          xpSource = XPSource.COLOR_HARMONY_ZEN
          break
        case 'chill':
          xpSource = XPSource.COLOR_HARMONY_CHILL
          break
        case 'flow':
          xpSource = XPSource.COLOR_HARMONY_FLOW
          break
        default:
          xpSource = XPSource.COLOR_HARMONY
      }

      const xpResult = await XPService.awardGameXP(
        user.uid,
        'colorHarmony',
        difficulty
      )

      if (xpResult.success) {
        console.log(`✅ Przyznano ${xpResult.xpAwarded} XP za grę w kolory (${difficulty})!`)
      }
    } catch (error) {
      console.error('❌ Błąd przyznawania XP:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <span className="text-2xl text-white">🎨</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Harmonia Kolorów
              </h1>
              <p className="text-gray-600 text-sm">
                Relaksujące dopasowywanie kolorów • <span className="text-purple-600 font-semibold">1-5 XP</span>
              </p>
            </div>
          </div>
        </motion.div>

        <ColorMatchingGame onComplete={handleGameComplete} />
        
        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="font-semibold text-purple-900 mb-3 text-lg">🎯 Cel Gry</h3>
            <ul className="text-purple-800 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Znajdź pary takich samych kolorów</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Rozwijaj pamięć wzrokową</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Ćwicz koncentrację i uważność</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Odkrywaj piękno kolorów</span>
              </li>
            </ul>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="font-semibold text-pink-900 mb-3 text-lg">💡 Tryby Gry</h3>
            <ul className="text-pink-800 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span><strong>Zen</strong> - Relaks bez limitu czasu (+1 XP)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span><strong>Chill</strong> - Lekkie wyzwanie (+3 XP)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span><strong>Flow</strong> - Trudne wyzwanie (+5 XP)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Szybsze ukończenie = więcej punktów!</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🌈 Korzyści z gry w kolory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Pamięć Wzrokowa</h4>
              <p className="text-gray-600 text-sm">Poprawa zapamiętywania i przypominania</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Koncentracja</h4>
              <p className="text-gray-600 text-sm">Lepsze skupienie i uwaga na szczegółach</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">😌</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Relaks</h4>
              <p className="text-gray-600 text-sm">Terapeutyczny efekt pracy z kolorami</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
