'use client'

import { BreathingExercise } from '@/components/games/BreathingExercise'
import Header from '@/components/layout/header'
import { motion } from 'framer-motion'

export default function BreathingGamePage() {
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
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
              <span className="text-2xl text-white">🌬️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Ćwiczenie Oddechowe
              </h1>
              <p className="text-gray-600 text-sm">
                Technika 4-7-8-4 dla głębokiego relaksu i spokoju umysłu
              </p>
            </div>
          </div>
        </motion.div>

        <BreathingExercise />
        
        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">💡 Jak korzystać?</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Znajdź wygodną pozycję</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Zamknij oczy i skup się na oddechu</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Podążaj za wskazówkami wizualnymi</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Powtarzaj cykle przez 5-10 minut</span>
              </li>
            </ul>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="font-semibold text-green-900 mb-3 text-lg">🎯 Kiedy używać?</h3>
            <ul className="text-green-800 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Rano dla lepszego rozpoczęcia dnia</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>W przerwie pracy na reset umysłu</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Wieczorem dla lepszego snu</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>W każdej chwili gdy potrzebujesz spokoju</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🌟 Korzyści z regularnej praktyki</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">😌</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Redukcja stresu</h4>
              <p className="text-gray-600 text-sm">Obniżenie poziomu kortyzolu i napięcia</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">💤</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Lepszy sen</h4>
              <p className="text-gray-600 text-sm">Poprawa jakości i głębokości snu</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Koncentracja</h4>
              <p className="text-gray-600 text-sm">Lepsze skupienie i klarowność umysłu</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}