'use client'

import { useArticles } from '@/hooks/useArticles' 
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { ArticleList } from '@/components/articles/article-list'

export default function ArticlesPage() {
  const { user: authUser } = useAuth()
  const [userData, setUserData] = useState<{
    id: string
    role: 'user' | 'admin'
  } | null>(null)

  // DODAJ HOOK useArticles
  const { articles, loading } = useArticles('user', userData?.id)

  useEffect(() => {
    if (authUser) {
      setUserData({
        id: authUser.uid,
        role: authUser.role || 'user',
      })
    } else {
      setUserData({
        id: 'guest',
        role: 'user',
      })
    }
  }, [authUser])

  const handleArticleRead = (articleId: string) => {
    // Ta funkcja zostanie rozbudowana później (np. zapis do Firestore / localStorage)
    console.log('Artykuł przeczytany:', articleId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <ArticleList 
          articles={articles} // DODAJ TEN PROP
          loading={loading} // DODAJ TEN PROP
          user={userData ? { uid: userData.id, role: userData.role} : null}
          onArticleRead={handleArticleRead}
        />
      </div>
    </div>
  )
}