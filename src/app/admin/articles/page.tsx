// src/app/admin/articles/page.tsx - ZOPTYMALIZOWANA WERSJA
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useArticles } from '@/hooks/useArticles'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, Eye, FileText, Shield, Search, Plus, Edit, Trash2, Users, TrendingUp, Filter } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/header'

export default function AdminArticlesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { articles, loading: articlesLoading, deleteArticle } = useArticles(
    'admin',
    user?.uid
  )

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/articles')
    }
  }, [user, authLoading, router])

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    drafts: articles.filter(a => a.status === 'draft').length,
    featured: articles.filter(a => a.isFeatured).length
  }

  if (authLoading || articlesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie panelu administratora...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md mx-4">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Brak dostępu</h2>
          <p className="text-gray-600 mb-4">Nie masz uprawnień administratora.</p>
          <Button onClick={() => router.push('/articles')}>Wróć do artykułów</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Header />
      
      <div className="py-6 lg:py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          
          {/* Header - ZOPTYMALIZOWANY */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Panel Administratora
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">
                Zarządzaj artykułami i treściami
              </p>
            </div>
            <Link href="/admin/articles/new" className="w-full lg:w-auto">
              <Button className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 lg:px-6 py-3 flex items-center justify-center gap-2 text-sm lg:text-base">
                <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="whitespace-nowrap">Nowy Artykuł</span>
              </Button>
            </Link>
          </div>

          {/* Statystyki - ZOPTYMALIZOWANE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <StatCard 
              title="Wszystkie" 
              value={stats.total} 
              icon={<BookOpen className="h-4 w-4 lg:h-6 lg:w-6" />} 
              color="from-blue-500 to-cyan-500" 
              isMobile={isMobile}
            />
            <StatCard 
              title="Opublikowane" 
              value={stats.published} 
              icon={<Eye className="h-4 w-4 lg:h-6 lg:w-6" />} 
              color="from-green-500 to-emerald-500" 
              isMobile={isMobile}
            />
            <StatCard 
              title="Szkice" 
              value={stats.drafts} 
              icon={<FileText className="h-4 w-4 lg:h-6 lg:w-6" />} 
              color="from-amber-500 to-orange-500" 
              isMobile={isMobile}
            />
            <StatCard 
              title="Wyróżnione" 
              value={stats.featured} 
              icon={<TrendingUp className="h-4 w-4 lg:h-6 lg:w-6" />} 
              color="from-purple-500 to-pink-500" 
              isMobile={isMobile}
            />
          </div>

          {/* Filtry i wyszukiwanie - ZOPTYMALIZOWANE */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col gap-4">
                {/* Wyszukiwanie */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Szukaj artykułów..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  />
                </div>
                
                {/* Filtry - ZOPTYMALIZOWANE DLA MOBILE */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Filter className="h-4 w-4" />
                    <span>Status:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'published', 'draft'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors flex-1 sm:flex-none min-w-[80px] ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'all' ? 'Wszystkie' : 
                         status === 'published' ? 'Opublikowane' : 'Szkice'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista artykułów - ZOPTYMALIZOWANA */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg lg:text-xl font-bold text-gray-900">
                Artykuły ({filteredArticles.length})
              </CardTitle>
              <CardDescription className="text-sm lg:text-base">
                Zarządzaj wszystkimi artykułami w systemie
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8 lg:py-12">
                  <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'Brak pasujących artykułów' : 'Brak artykułów'}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm lg:text-base">
                    {searchTerm ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Utwórz pierwszy artykuł'}
                  </p>
                  {!searchTerm && (
                    <Link href="/admin/articles/new">
                      <Button className="bg-green-600 hover:bg-green-700 text-sm lg:text-base">
                        <Plus className="h-4 w-4 mr-2" />
                        Utwórz artykuł
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {filteredArticles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      onDelete={async () => {
                        if (confirm(`Czy na pewno chcesz usunąć artykuł "${article.title}"?`)) {
                          try {
                            await deleteArticle(article.id)
                          } catch (error) {
                            alert('Błąd podczas usuwania artykułu')
                          }
                        }
                      }}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ZOPTYMALIZOWANE KOMPONENTY POMOCNICZE
function StatCard({ title, value, icon, color, isMobile }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
  isMobile: boolean;
}) {
  return (
    <Card className={`bg-gradient-to-r ${color} text-white border-0 shadow-lg`}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/90 text-xs lg:text-sm font-medium mb-1">{title}</p>
            <p className="text-xl lg:text-2xl font-bold">{value}</p>
          </div>
          <div className="text-white/90">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ArticleRow({ article, onDelete, isMobile }: { 
  article: any; 
  onDelete: () => void; 
  isMobile: boolean;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white transition-colors gap-3 lg:gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-2 lg:mb-2">
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">
            {article.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              article.status === 'published' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {article.status === 'published' ? 'Opublikowany' : 'Szkic'}
            </span>
            {article.isFeatured && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                Wyróżniony
              </span>
            )}
          </div>
        </div>
        <div className="text-xs lg:text-sm text-gray-600 flex flex-col lg:flex-row lg:flex-wrap gap-2 lg:gap-4">
          <span>Kategoria: {article.category}</span>
          <span>Wyświetlenia: {article.views || 0}</span>
          <span>Czas: {article.readTime} min</span>
          {!isMobile && (
            <span>
              Utworzono: {article.createdAt?.toDate().toLocaleDateString('pl-PL')}
            </span>
          )}
        </div>
        {isMobile && (
          <div className="text-xs text-gray-500 mt-2">
            Utworzono: {article.createdAt?.toDate().toLocaleDateString('pl-PL')}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 lg:ml-4 self-end lg:self-auto">
        <Link href={`/admin/articles/edit/${article.id}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
            <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
            {isMobile ? 'Edytuj' : 'Edytuj'}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
        >
          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
          {isMobile ? 'Usuń' : 'Usuń'}
        </Button>
      </div>
    </div>
  )
}