// src/app/admin/articles/page.tsx - POPRAWIONA WERSJA
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useArticles } from '@/hooks/useArticles'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BookOpen, Eye, FileText, Shield, Search, Plus, Edit, Trash2, Users, 
  TrendingUp, Filter, Ban, Unlock, Mail, Calendar, User, Crown, Zap,
  Activity, Target, Star
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { blockService } from '@/lib/block-service'
import userService, { UserProfile } from '@/lib/user-service'

export default function AdminArticlesPage() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'articles' | 'users'>('articles')

  // Stan dla zarządzania użytkownikami
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersStats, setUsersStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    admins: 0
  })
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    isBlocked: 'all',
    search: ''
  })
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [blockForm, setBlockForm] = useState({
    reason: '',
    duration: '7',
    isPermanent: false
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { articles, loading: articlesLoading, deleteArticle } = useArticles(
    'admin',
    currentUser?.uid
  )

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/articles')
    }
  }, [currentUser, authLoading, router])

  // Załaduj użytkowników gdy przełączysz się na zakładkę
  useEffect(() => {
    if (activeTab === 'users') {
      loadAllUsers()
      loadUsersStats()
    }
  }, [activeTab])

  const loadAllUsers = async () => {
    setUsersLoading(true)
    try {
      const users = await userService.getAllUsers()
      setAllUsers(users)
    } catch (error) {
      console.error('Błąd ładowania użytkowników:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const loadUsersStats = async () => {
    try {
      const stats = await userService.getUsersStats()
      setUsersStats(stats)
    } catch (error) {
      console.error('Błąd ładowania statystyk:', error)
    }
  }

  const handleBlockUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🟡 === ROZPOCZĘCIE BLOKOWANIA ===')
    console.log('Selected User:', selectedUser)
    console.log('Current User:', currentUser)
    console.log('Block Form:', blockForm)

    if (!selectedUser || !currentUser) {
      console.error('❌ BRAK DANYCH: selectedUser lub currentUser jest null')
      alert('Błąd: Brak danych użytkownika')
      return
    }

    // Walidacja formularza
    if (!blockForm.reason.trim()) {
      console.error('❌ BRAK POWODU: Pole reason jest puste')
      alert('Proszę podać powód blokady')
      return
    }

    try {
      const blockData = {
        userId: selectedUser.uid,
        email: selectedUser.email,
        displayName: selectedUser.displayName || selectedUser.email,
        reason: blockForm.reason,
        isPermanent: blockForm.isPermanent,
        days: blockForm.isPermanent ? 0 : parseInt(blockForm.duration)
      }

      console.log('🟡 Dane do blokady:', blockData)
      console.log('🟡 Wywołanie blockService.blockUser...')
      
      await blockService.blockUser(blockData, currentUser)
      
      console.log('✅ === BLOKOWANIE ZAKOŃCZONE SUKCESEM ===')
      
      alert('Użytkownik został zablokowany pomyślnie')
      setShowBlockForm(false)
      setSelectedUser(null)
      setBlockForm({ reason: '', duration: '7', isPermanent: false })
      
      // Odśwież listę użytkowników
      await loadAllUsers()
      
    } catch (error) {
      console.error('❌ === BŁĄD BLOKOWANIA ===', error)
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd'
      alert('Błąd podczas blokowania użytkownika: ' + errorMessage)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    if (confirm('Czy na pewno chcesz odblokować tego użytkownika?')) {
      try {
        await blockService.unblockUser(userId)
        alert('Użytkownik został odblokowany')
        loadAllUsers()
      } catch (error) {
        console.error('Błąd odblokowania użytkownika:', error)
        alert('Błąd podczas odblokowania użytkownika')
      }
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (confirm(`Czy na pewno chcesz zmienić rolę użytkownika na ${newRole}?`)) {
      try {
        await userService.changeUserRole(userId, newRole)
        alert('Rola użytkownika została zmieniona')
        loadAllUsers()
      } catch (error) {
        console.error('Błąd zmiany roli:', error)
        alert('Błąd podczas zmiany roli użytkownika')
      }
    }
  }

  // Funkcja testowa do debugowania
  const testBlockFirstUser = async () => {
    console.log('🧪 === TEST BLOKOWANIA ===')
    
    if (allUsers.length === 0) {
      console.error('❌ BRAK UŻYTKOWNIKÓW DO TESTOWANIA')
      alert('Brak użytkowników do testowania')
      return
    }

    const testUser = allUsers[0]
    console.log('🧪 Testowy użytkownik:', testUser)

    try {
      const blockData = {
        userId: testUser.uid,
        email: testUser.email,
        displayName: testUser.displayName || testUser.email,
        reason: 'TEST: Blokada testowa z debugowania',
        isPermanent: false,
        days: 1
      }
      
      console.log('🧪 Dane testowe:', blockData)
      console.log('🧪 Wywołanie blockService.blockUser...')
      
      await blockService.blockUser(blockData, currentUser!)
      
      console.log('✅ TEST ZAKOŃCZONY SUKCESEM!')
      alert('Test blokowania zakończony sukcesem!')
      
      await loadAllUsers()
      
    } catch (error) {
      console.error('❌ TEST ZAKOŃCZONY BŁĘDEM:', error)
      alert('Test blokowania zakończony błędem: ' + error)
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = userFilters.search === '' || 
      user.email.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(userFilters.search.toLowerCase())
    
    const matchesRole = userFilters.role === 'all' || user.role === userFilters.role
    const matchesBlocked = userFilters.isBlocked === 'all' || 
      (userFilters.isBlocked === 'blocked' ? user.isBlocked : !user.isBlocked)
    
    return matchesSearch && matchesRole && matchesBlocked
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

  if (!currentUser || currentUser.role !== 'admin') {
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
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Panel Administratora
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">
                Zarządzaj artykułami i użytkownikami
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {activeTab === 'articles' && (
                <Link href="/admin/articles/new" className="w-full lg:w-auto">
                  <Button className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 lg:px-6 py-3 flex items-center justify-center gap-2 text-sm lg:text-base">
                    <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="whitespace-nowrap">Nowy Artykuł</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Zakładki */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('articles')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Artykuły
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Zarządzanie Użytkownikami
            </button>
          </div>

          {activeTab === 'articles' ? (
            <ArticlesTab 
              articles={filteredArticles}
              stats={stats}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              isMobile={isMobile}
              deleteArticle={deleteArticle}
            />
          ) : (
            <UsersTab 
              users={filteredUsers}
              usersLoading={usersLoading}
              usersStats={usersStats}
              userFilters={userFilters}
              setUserFilters={setUserFilters}
              showBlockForm={showBlockForm}
              setShowBlockForm={setShowBlockForm}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              blockForm={blockForm}
              setBlockForm={setBlockForm}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              onChangeRole={handleChangeRole}
              currentUser={currentUser}
              onTestBlock={testBlockFirstUser}
              allUsers={allUsers}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// KOMPONENT ZAKŁADKI ARTYKUŁÓW
function ArticlesTab({ 
  articles, stats, searchTerm, setSearchTerm, statusFilter, setStatusFilter, isMobile, deleteArticle 
}: any) {
  return (
    <>
      {/* Statystyki artykułów */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <StatCard 
          title="Wszystkie" 
          value={stats.total} 
          icon={<BookOpen className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-blue-500 to-cyan-500" 
        />
        <StatCard 
          title="Opublikowane" 
          value={stats.published} 
          icon={<Eye className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-green-500 to-emerald-500" 
        />
        <StatCard 
          title="Szkice" 
          value={stats.drafts} 
          icon={<FileText className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-amber-500 to-orange-500" 
        />
        <StatCard 
          title="Wyróżnione" 
          value={stats.featured} 
          icon={<TrendingUp className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-purple-500 to-pink-500" 
        />
      </div>

      {/* Filtry i wyszukiwanie */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col gap-4">
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

      {/* Lista artykułów */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg lg:text-xl font-bold text-gray-900">
            Artykuły ({articles.length})
          </CardTitle>
          <CardDescription className="text-sm lg:text-base">
            Zarządzaj wszystkimi artykułami w systemie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
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
              {articles.map((article: any) => (
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
    </>
  )
}

// KOMPONENT ZAKŁADKI UŻYTKOWNIKÓW
function UsersTab({
  users, usersLoading, usersStats, userFilters, setUserFilters, showBlockForm, setShowBlockForm,
  selectedUser, setSelectedUser, blockForm, setBlockForm, onBlockUser, onUnblockUser, onChangeRole, 
  currentUser, onTestBlock, allUsers
}: any) {
  return (
    <div className="space-y-6">
      
      {/* PANEL DEBUGOWANIA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-blue-800">🧪 Panel Debugowania Blokowania</h3>
              <p className="text-blue-600 text-sm">Użyj tych przycisków do testowania funkcji blokowania</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={onTestBlock}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                disabled={usersLoading || allUsers.length === 0}
              >
                🧪 Testuj blokowanie (pierwszy użytkownik)
              </Button>
              
              <Button 
                onClick={() => console.log('📊 Aktualni użytkownicy:', allUsers)}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                📊 Loguj użytkowników
              </Button>

              <Button 
                onClick={() => {
                  if (allUsers.length > 0) {
                    console.log('🔍 Struktura pierwszego użytkownika:', allUsers[0])
                  }
                }}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                🔍 Debuguj strukturę
              </Button>
            </div>

            <div className="text-xs text-blue-600">
              <p>Liczba użytkowników: {allUsers.length}</p>
              <p>Status ładowania: {usersLoading ? 'Ładowanie...' : 'Gotowe'}</p>
              <p>Wybrany użytkownik: {selectedUser ? selectedUser.email : 'Brak'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statystyki użytkowników */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Wszyscy Użytkownicy" 
          value={usersStats.totalUsers} 
          icon={<Users className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-blue-500 to-cyan-500" 
        />
        <StatCard 
          title="Aktywni Dziś" 
          value={usersStats.activeToday} 
          icon={<Activity className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-green-500 to-emerald-500" 
        />
        <StatCard 
          title="Nowi w Tygodniu" 
          value={usersStats.newThisWeek} 
          icon={<Zap className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-amber-500 to-orange-500" 
        />
        <StatCard 
          title="Administratorzy" 
          value={usersStats.admins} 
          icon={<Crown className="h-4 w-4 lg:h-6 lg:w-6" />} 
          color="from-purple-500 to-pink-500" 
        />
      </div>

      {/* Formularz blokowania */}
      {showBlockForm && selectedUser && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser.firstName?.charAt(0) || selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-semibold">Blokowanie użytkownika</h3>
                <p className="text-sm text-gray-600">{selectedUser.displayName || 'Brak nazwy'} • {selectedUser.email}</p>
              </div>
            </div>

            <form onSubmit={onBlockUser} className="space-y-4">
              <div>
                <Label htmlFor="reason">Powód blokady *</Label>
                <Textarea
                  id="reason"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})}
                  required
                  placeholder="Opisz powód blokady..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Czas trwania (dni) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={blockForm.duration}
                    onChange={(e) => setBlockForm({...blockForm, duration: e.target.value})}
                    disabled={blockForm.isPermanent}
                    min="1"
                    max="365"
                    required={!blockForm.isPermanent}
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPermanent"
                    checked={blockForm.isPermanent}
                    onChange={(e) => setBlockForm({...blockForm, isPermanent: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isPermanent">Blokada permanentna</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => console.log('🟡 Kliknięto przycisk Zablokuj w formularzu')}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Zablokuj użytkownika
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBlockForm(false)
                    setSelectedUser(null)
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtry użytkowników */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Szukaj użytkowników</Label>
              <Input
                id="search"
                placeholder="Email, imię, nazwisko..."
                value={userFilters.search}
                onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rola</Label>
              <select
                id="role"
                value={userFilters.role}
                onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie role</option>
                <option value="user">Użytkownicy</option>
                <option value="admin">Administratorzy</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="status">Status blokady</Label>
              <select
                id="status"
                value={userFilters.isBlocked}
                onChange={(e) => setUserFilters({...userFilters, isBlocked: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Wszystkie</option>
                <option value="active">Aktywni</option>
                <option value="blocked">Zablokowani</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista użytkowników */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg lg:text-xl font-bold text-gray-900">
            Użytkownicy ({users.length})
          </CardTitle>
          <CardDescription className="text-sm lg:text-base">
            Zarządzaj wszystkimi użytkownikami systemu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Ładowanie użytkowników...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {userFilters.search ? 'Brak pasujących użytkowników' : 'Brak użytkowników'}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: UserProfile) => (
                <UserRow
                  key={user.uid}
                  user={user}
                  onBlock={() => {
                    console.log('🟡 Kliknięto przycisk Blokuj dla:', user.email)
                    setSelectedUser(user)
                    setShowBlockForm(true)
                  }}
                  onUnblock={() => onUnblockUser(user.uid)}
                  onChangeRole={onChangeRole}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// KOMPONENT WIERSZA UŻYTKOWNIKA - POPRAWIONY
function UserRow({ user, onBlock, onUnblock, onChangeRole, currentUser }: any) {
  // USUNIĘTO: const userStats = userService.getUserStats(user.uid) - to powodowało błędy
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName || user.email}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              user.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          {user.role === 'admin' && (
            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
              <Crown className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Informacje o użytkowniku */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {user.displayName || user.email}
            </h3>
            <div className="flex gap-1">
              {user.role === 'admin' && (
                <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                  Admin
                </Badge>
              )}
              {user.isBlocked && (
                <Badge variant="destructive" className="text-xs">
                  Zablokowany
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Dołączył: {user.createdAt?.toLocaleDateString('pl-PL') || 'Nieznana data'}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Poziom {user.level || 1} • {user.xp || 0} XP
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Passa: {user.streak || 0} dni
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Konsystencja: {user.consistency || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Akcje */}
      <div className="flex items-center gap-2">
        {user.role === 'user' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeRole(user.uid, 'admin')}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
            disabled={user.uid === currentUser.uid}
          >
            <Crown className="h-3 w-3 mr-1" />
            Nadaj admina
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeRole(user.uid, 'user')}
            className="text-gray-600 border-gray-200 hover:bg-gray-50"
            disabled={user.uid === currentUser.uid}
          >
            <User className="h-3 w-3 mr-1" />
            Odbierz admina
          </Button>
        )}
        
        {user.isBlocked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onUnblock}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <Unlock className="h-3 w-3 mr-1" />
            Odblokuj
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onBlock}
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={user.uid === currentUser.uid}
          >
            <Ban className="h-3 w-3 mr-1" />
            Zablokuj
          </Button>
        )}
      </div>
    </div>
  )
}

// POZOSTAŁE KOMPONENTY POMOCNICZE
function StatCard({ title, value, icon, color }: any) {
  return (
    <Card className={`bg-gradient-to-r ${color} text-white border-0 shadow-lg`}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/90 text-xs lg:text-sm font-medium mb-1">{title}</p>
            <p className="text-xl lg:text-2xl font-bold">{value}</p>
          </div>
          <div className="text-white/90">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ArticleRow({ article, onDelete, isMobile }: any) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white transition-colors gap-3 lg:gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-2">
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
            <span>Utworzono: {article.createdAt?.toDate().toLocaleDateString('pl-PL')}</span>
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
            Edytuj
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
        >
          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
          Usuń
        </Button>
      </div>
    </div>
  )
}