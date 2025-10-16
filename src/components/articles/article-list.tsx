// src/components/articles/article-list.tsx
import { Article } from '@/hooks/useArticles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ArticleListProps {
  articles: Article[]
  loading: boolean
  user: { uid: string; role: 'user' | 'admin' } | null
  onArticleRead: (id: string) => void
}

export function ArticleList({ articles, loading, user, onArticleRead }: ArticleListProps) {
  if (loading) {
    return <div className="text-center py-10">Ładowanie artykułów...</div>
  }

  if (articles.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Brak artykułów</h3>
          <p className="text-gray-600">
            {user?.role === 'admin'
              ? 'Dodaj pierwszy artykuł w panelu administratora.'
              : 'Wkrótce pojawią się nowe treści!'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <Card key={article.id} className="border-0 shadow-lg bg-white/90 hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-bold line-clamp-2">{article.title}</CardTitle>
            <div className="text-sm text-gray-600 mt-1">{article.category}</div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime} min</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views}</span>
            </div>
            <Link href={`/articles/${article.id}`} onClick={() => onArticleRead(article.id)}>
              <Button variant="outline" className="w-full">
                Czytaj artykuł
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}