'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { XPService, XPSource } from '@/lib/xp-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BookOpen, Clock, Eye, Calendar, Sparkles, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [showXPReward, setShowXPReward] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(0)
  const [alreadyRead, setAlreadyRead] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return

      try {
        const docRef = doc(db, 'articles', articleId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          
          // ✅ Admin widzi wszystko, user tylko published
          if (data.status === 'published' || user?.role === 'admin') {
            setArticle({ id: docSnap.id, ...data })
            
            // Zwiększ licznik wyświetleń (tylko dla opublikowanych)
            if (data.status === 'published') {
              await updateDoc(docRef, {
                views: increment(1)
              })

              // 🎁 PRZYZNAJ XP ZA PRZECZYTANIE ARTYKUŁU
              if (user?.uid) {
                const xpResult = await XPService.awardArticleXP(user.uid, articleId)
                
                if (xpResult.success) {
                  console.log(`✅ Przyznano ${xpResult.xpAwarded} XP za artykuł!`)
                  setXpAwarded(xpResult.xpAwarded)
                  setShowXPReward(true)
                  setAlreadyRead(false)
                } else if (xpResult.message?.includes('już przeczytany')) {
                  console.log('📖 Artykuł już przeczytany - brak XP')
                  setAlreadyRead(true)
                }
              }
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

    if (user !== undefined) {
      fetchArticle()
    }
  }, [articleId, user])

  // 🎁 XP REWARD MODAL
  const XPRewardModal = () => (
    <AnimatePresence>
      {showXPReward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowXPReward(false)}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.6 }}
                className="inline-block mb-4 sm:mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-50" />
                  <Gift className="h-16 w-16 sm:h-24 sm:w-24 text-green-500 relative" />
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2 sm:mb-3"
              >
                Gratulacje! 🎉
              </motion.h2>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl text-white font-bold text-xl sm:text-2xl shadow-xl mb-4 sm:mb-6"
              >
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6" />
                <span>+{xpAwarded} XP</span>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg font-medium"
              >
                Za przeczytanie artykułu!
              </motion.p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowXPReward(false)}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl sm:rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl text-base sm:text-lg"
              >
                Super! 📚
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Ładowanie artykułu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-4 sm:p-6 text-center">
          <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Nie znaleziono artykułu</h2>
          <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">{error}</p>
          <Button onClick={() => router.push('/articles')} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Wróć do listy
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Wróć do artykułów
          </Button>

          {/* Status badge dla admina */}
          {user?.role === 'admin' && article.status !== 'published' && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-xs sm:text-sm font-medium">
              🚧 Tryb podglądu: Ten artykuł ma status "{article.status}" i nie jest widoczny dla zwykłych użytkowników.
            </div>
          )}

          {/* Already read info */}
          {alreadyRead && article.status === 'published' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs sm:text-sm font-medium text-center"
            >
              📖 Ten artykuł został już przez Ciebie przeczytany. XP przyznajemy tylko za pierwsze przeczytanie.
            </motion.div>
          )}

          <Card className="border-0 shadow-lg sm:shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {article.category}
                </span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{article.createdAt?.toDate().toLocaleDateString('pl-PL')}</span>
                </div>
                {user?.role === 'admin' && (
                  <>
                    <span className="hidden sm:inline">•</span>
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
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                {article.title}
              </CardTitle>
              <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg leading-relaxed">
                {article.excerpt}
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-4 sm:mb-6">
                <div
                  className="article-content text-gray-800 leading-relaxed text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: article.content || '' }}
                />
              </div>

              {/* XP info - tylko dla opublikowanych artykułów */}
              {article.status === 'published' && !alreadyRead && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl text-center mb-4 sm:mb-6 shadow-sm"
                >
                  <div className="inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-green-700 font-semibold text-sm sm:text-base lg:text-lg">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                    <span className="text-center sm:text-left">
                      Za przeczytanie tego artykułu otrzymałeś{' '}
                      <strong className="text-green-800">+10 XP</strong>
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3 sm:pt-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  {article.readTime} min czytania
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  {article.views || 0} wyświetleń
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <XPRewardModal />
    </>
  )
}