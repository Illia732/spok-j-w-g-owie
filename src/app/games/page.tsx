'use client'

import { GameCard } from '@/components/games/GameCard'
import Header from '@/components/layout/header'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Heart } from 'lucide-react'

const games = [
  {
    id: 'breathing',
    title: 'Ćwiczenie Oddechowe',
    description: 'Technika 4-7-8 dla głębokiego relaksu i wyciszenia umysłu',
    icon: '🌬️',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    href: '/games/breathing',
    duration: '5-10 min',
    benefits: ['Redukcja stresu', 'Lepszy sen', 'Koncentracja']
  },
  {
    id: 'colors', 
    title: 'Harmonia Kolorów',
    description: 'Relaksujące dopasowywanie kolorów z pięknymi wizualizacjami',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    href: '/games/colors',
    duration: '3-5 min',
    benefits: ['Kreatywność', 'Uważność', 'Relaks wzroku']
  }
]

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Gry Relaksacyjne
              </h1>
              <p className="text-gray-600 text-sm">
                Odkryj swoją przestrzeń spokoju i odprężenia
              </p>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-4">
            Piękne, intuicyjne gry zaprojektowane aby pomóc Ci znaleźć chwilę spokoju 
            i odprężenia w codziennym życiu.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <Zap className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <div className="text-lg font-bold text-gray-900">Szybki Relaks</div>
            <div className="text-gray-600">Już 5 minut dziennie</div>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <Heart className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <div className="text-lg font-bold text-gray-900">Proste i Intuicyjne</div>
            <div className="text-gray-600">Dla każdego</div>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <Sparkles className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <div className="text-lg font-bold text-gray-900">Piękny Design</div>
            <div className="text-gray-600">Estetyka Minimalistyczna</div>
          </div>
        </motion.div>

        {/* Games Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              delay={index * 0.1}
            />
          ))}
        </motion.div>

        {/* Inspiration Section */}
        <motion.div 
          className="mt-16 p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">💫 Znajdź Swój Moment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <p className="mb-3">
                Każda z naszych gier to starannie zaprojektowane doświadczenie, 
                które pomaga oderwać się od codziennego zgiełku i znaleźć chwilę dla siebie.
              </p>
              <p>
                Niezależnie od tego czy masz 3 minuty czy 15, nasze gry pomogą Ci 
                odnaleźć wewnętrzny spokój i odświeżyć umysł.
              </p>
            </div>
            <div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Idealne na przerwę w pracy</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Wieczorny rytuał odprężenia</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Poranne wyciszenie</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Chwila relaksu w ciągu dnia</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}