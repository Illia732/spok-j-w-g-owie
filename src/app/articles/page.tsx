// src/app/articles/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useArticles } from '@/hooks/useArticles'
import Header from '@/components/layout/header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Shield, Award } from 'lucide-react'
import { ArticleList } from '@/components/articles/article-list'

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

  const handleArticleRead = (articleId: string) => {
    console.log('Artykuł przeczytany – tu będzie zapis XP:', articleId)
    // Potem: userService.updateXP(user.id, 10)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
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
        </div>

        {/* ✅ NAPIS O XP */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white font-semibold shadow-md">
            <Award className="h-5 w-5" />
            Za przeczytanie artykułu dostaniesz <strong>10 XP</strong>
          </div>
        </div>

        {/* Lista artykułów */}
        <ArticleList
          articles={articles}
          loading={loading}
          user={user ? { uid: user.id, role: user.role } : null}
          onArticleRead={handleArticleRead}
        />

        {/* ✅ PRZYCISK DLA ADMINA */}
        {user?.role === 'admin' && (
          <div className="text-center mt-10">
            <Link href="/admin/articles">
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:from-purple-600 hover:to-indigo-700">
                <Shield className="h-4 w-4 mr-2" />
                Przejdź do panelu administratora
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}