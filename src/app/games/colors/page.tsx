'use client'

import { ColorMatchingGame } from '@/components/games/ColorMatchingGame'
import Header from '@/components/layout/header'
import { motion } from 'framer-motion'

export default function ColorsGamePage() {
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
                Relaksujące dopasowywanie kolorów z pięknymi wizualizacjami
              </p>
            </div>
          </div>
        </motion.div>

        <ColorMatchingGame />
        
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
                <span>Rozwijaj percepcję kolorów</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Relaksuj wzrok i umysł</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Ćwicz uważność i koncentrację</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Odkrywaj piękno kolorowych harmonii</span>
              </li>
            </ul>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="font-semibold text-pink-900 mb-3 text-lg">💡 Jak grać?</h3>
            <ul className="text-pink-800 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Dopasuj kolory do wzorca</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Używaj precyzyjnych regulacji</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Skup się na odcieniach i nasyceniu</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Ciesz się procesem, nie tylko wynikiem</span>
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
                <span className="text-white text-xl">👁️</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Wrażliwość Wzrokowa</h4>
              <p className="text-gray-600 text-sm">Poprawa percepcji kolorów i detali</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🧠</span>
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