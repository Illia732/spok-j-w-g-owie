'use client'

import ParticleCollectorGame from '@/components/games/ParticleCollectorGame'
import Header from '@/components/layout/header'
import { motion } from 'framer-motion'
import { Zap, Target, Crown, Star, Move } from 'lucide-react'

export default function ParticlesGamePage() {
  const features = [
    {
      icon: Move,
      title: "Intuicyjna Kontrola",
      description: "Poruszaj kursorem, aby kontrolować swoją cząstkę. Proste, ale wciągające!",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Cel Gry", 
      description: "Zbieraj kolorowe cząstki, rośnij i zdobywaj jak najwięcej punktów",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Crown,
      title: "System Punktowy",
      description: "Zwykłe cząstki = 1 punkt, Bonusowe = 3 punkty, Specjalne = 5 punktów",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Star,
      title: "Progresja",
      description: "Im większy się stajesz, tym więcej punktów zdobywasz. Pokonaj swój rekord!",
      color: "from-orange-500 to-red-500"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-purple-50/5">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-2xl mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent">
                Quantum Particles
              </h1>
              <p className="text-gray-600 text-sm">
                Prosta, ale wciągająca gra w stylu agar.io. Zbieraj cząstki i rośnij!
              </p>
            </div>
          </div>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Hipnotyzująca gra, w której poruszasz kolorową kulą i zbierasz mniejsze cząstki. 
            Im więcej zbierasz, tym większy się stajesz! Proste zasady, nieskończona zabawa.
          </p>
        </motion.div>

        {/* Main Game Component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-16"
        >
          <ParticleCollectorGame />
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            🎯 Dlaczego ta gra jest wciągająca?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    y: -5
                  }}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Game Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">
            💡 Porady dla Gracza
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-semibold mb-2">🎯 Celuj w Bonusy</div>
              <p className="text-purple-100">Żółte i pomarańczowe cząstki dają więcej punktów!</p>
            </div>
            <div>
              <div className="font-semibold mb-2">⚡ Bądź Cierpliwy</div>
              <p className="text-purple-100">Im większy się stajesz, tym łatwiej zbierać cząstki</p>
            </div>
            <div>
              <div className="font-semibold mb-2">🏆 Pokonaj Rekord</div>
              <p className="text-purple-100">Każda gra to nowa szansa na pobicie rekordu!</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}