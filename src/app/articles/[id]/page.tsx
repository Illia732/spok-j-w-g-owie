// src/app/articles/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BookOpen, Clock, Eye, Calendar } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/header'
import { useAuth } from '@/components/providers/auth-provider'

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  const { user } = useAuth()

  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return

      try {
        const docRef = doc(db, 'articles', articleId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          
          // ✅ POPRAWIONE: Admin widzi wszystko, user tylko published
          if (data.status === 'published' || user?.role === 'admin') {
            setArticle({ id: docSnap.id, ...data })
            
            // Zwiększ licznik wyświetleń (tylko dla opublikowanych)
            if (data.status === 'published') {
              await updateDoc(docRef, {
                views: increment(1)
              })
            }
          } else {
            setError('Artykuł nie jest jeszcze opublikowany.')
          }
        } else {
          setError('Artykuł nie został znaleziony.')
        }
      } catch (err) {
        console.error('Błąd ładowania artykułu:', err)
        setError('Nie udało się załadować artykułu.')
      } finally {
        setLoading(false)
      }
    }

    if (user !== undefined) { // Czekaj aż user się załaduje
      fetchArticle()
    }
  }, [articleId, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie artykułu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nie znaleziono artykułu</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/articles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do listy
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do artykułów
        </Button>

        {/* Status badge dla admina */}
        {user?.role === 'admin' && article.status !== 'published' && (
          <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm font-medium">
            🚧 Tryb podglądu: Ten artykuł ma status "{article.status}" i nie jest widoczny dla zwykłych użytkowników.
          </div>
        )}

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {article.category}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{article.createdAt?.toDate().toLocaleDateString('pl-PL')}</span>
              </div>
              {user?.role === 'admin' && (
                <>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    article.status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {article.status === 'published' ? 'Opublikowany' : 'Szkic'}
                  </span>
                </>
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">{article.title}</CardTitle>
            <p className="text-gray-600 mt-2 text-lg">{article.excerpt}</p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none mb-6">
              <div
                className="article-content text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: article.content || '' }}
              />
            </div>

            {/* XP info - tylko dla opublikowanych artykułów */}
            {article.status === 'published' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center mb-6">
                <div className="inline-flex items-center gap-2 text-green-700 font-medium">
                  <BookOpen className="h-5 w-5" />
                  Za przeczytanie tego artykułu otrzymujesz <strong>10 XP</strong>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.readTime} min czytania
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views || 0} wyświetleń
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}