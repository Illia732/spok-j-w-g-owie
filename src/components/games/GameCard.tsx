'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Clock, CheckCircle } from 'lucide-react'

interface Game {
  id: string
  title: string
  description: string
  icon: string
  color: string
  bgColor: string
  href: string
  duration: string
  benefits: string[]
}

interface GameCardProps {
  game: Game
  delay?: number
}

export const GameCard: React.FC<GameCardProps> = ({ game, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link href={game.href}>
        <div className={`
          relative rounded-3xl p-6 h-full cursor-pointer overflow-hidden
          bg-gradient-to-br ${game.bgColor} border border-gray-200/50
          transition-all duration-300 group-hover:shadow-xl group-hover:border-gray-300/50
        `}>
          
          {/* Gradient Overlay on Hover */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 
            group-hover:opacity-5 transition-opacity duration-300
          `} />
          
          {/* Icon */}
          <div className={`
            w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-2xl
            bg-gradient-to-br ${game.color} text-white shadow-lg
            transition-transform duration-300 group-hover:scale-110
          `}>
            {game.icon}
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
              {game.title}
            </h3>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              {game.description}
            </p>
            
            {/* Duration */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4" />
              <span>{game.duration}</span>
            </div>
            
            {/* Benefits */}
            <div className="space-y-2 mb-6">
              {game.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            {/* CTA */}
            <div className="flex items-center justify-between">
              <span className={`
                text-sm font-semibold bg-gradient-to-r ${game.color} bg-clip-text text-transparent
                group-hover:underline transition-all
              `}>
                Rozpocznij relaks
              </span>
              <ArrowRight className={`
                h-5 w-5 text-gray-400 transition-all duration-300 
                group-hover:text-gray-600 group-hover:translate-x-1
              `} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}