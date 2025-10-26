'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useArticles } from '@/hooks/useArticles'
import Header from '@/components/layout/header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Shield, Award, Sparkles } from 'lucide-react'
import { ArticleList } from '@/components/articles/article-list'
import { motion } from 'framer-motion'

export default function ArticlesPage() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<{ id: string; role: 'user' | 'admin' } | null>(null)
  const { articles, loading } = useArticles(user?.role, user?.id)

  useEffect(() => {
    if (authUser) {
      setUser({ id: authUser.uid, role: authUser.role || 'user' })
    } else {
      setUser({ id: 'guest', role: 'user' })
    }
  }, [authUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Header />
      
      {/* Główna zawartość */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Nagłówek */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm sm:shadow-lg w-full max-w-md sm:max-w-none">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Artykuły
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Psychologia, nauka, relacje – rozwijaj się z nami
              </p>
            </div>
          </div>
        </motion.div>

        {/* XP Badge */}
        <motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.2 }}
  className="text-center mb-6 sm:mb-8"
>
  <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl text-white font-bold shadow-lg sm:shadow-xl text-sm sm:text-base w-full max-w-2xl mx-auto">
    <Award className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
    <span className="whitespace-nowrap">Za każdy przeczytany artykuł dostajesz</span>
    <span className="px-2 py-1 bg-white/20 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap">
      +10 XP
    </span>
  </div>
  <p className="text-gray-600 text-xs sm:text-sm mt-2 sm:mt-3">
    💡 XP przyznajemy tylko za pierwsze przeczytanie każdego artykułu
  </p>
</motion.div>

        {/* Lista artykułów */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <ArticleList
            articles={articles}
            loading={loading}
            user={user ? { uid: user.id, role: user.role } : null}
            onArticleRead={() => {}} // Nie potrzebne - XP przyznajemy w [id]/page.tsx
          />
        </motion.div>

        {/* Przycisk dla admina */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8 sm:mb-12"
          >
            <Link href="/admin/articles">
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 text-sm sm:text-base w-full max-w-xs">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Przejdź do panelu administratora
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Sekcja informacyjna */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-16 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 max-w-4xl mx-auto"
        >
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
            📚 Rozwijaj się z każdym artykułem
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div className="p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Wysokiej jakości treści
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Starannie wyselekcjonowane artykuły
              </p>
            </div>
            <div className="p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Zdobywaj XP
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                +10 XP za każdy przeczytany artykuł
              </p>
            </div>
            <div className="p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Award className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                Awansuj
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Podnoś swój poziom wiedzy i XP
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}