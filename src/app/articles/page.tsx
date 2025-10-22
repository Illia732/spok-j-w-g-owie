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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Artykuły
              </h1>
              <p className="text-gray-600 text-sm">
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
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-bold shadow-xl">
            <Award className="h-6 w-6" />
            Za każdy przeczytany artykuł dostajesz <span className="px-2 py-1 bg-white/20 rounded-lg">+10 XP</span>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            💡 XP przyznajemy tylko za pierwsze przeczytanie każdego artykułu
          </p>
        </motion.div>

        {/* Lista artykułów */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
            className="text-center mt-10"
          >
            <Link href="/admin/articles">
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300">
                <Shield className="h-4 w-4 mr-2" />
                Przejdź do panelu administratora
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📚 Rozwijaj się z każdym artykułem</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Wysokiej jakości treści</h4>
              <p className="text-gray-600 text-sm">Starannie wyselekcjonowane artykuły</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Zdobywaj XP</h4>
              <p className="text-gray-600 text-sm">+10 XP za każdy przeczytany artykuł</p>
            </div>
            <div className="p-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Awansuj</h4>
              <p className="text-gray-600 text-sm">Podnoś swój poziom wiedzy i XP</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
