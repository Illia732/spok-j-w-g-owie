'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import userService from '@/lib/user-service'
import { UserProfile, FriendRequest } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Check, 
  X, 
  UserX, 
  Search,
  Copy,
  AlertCircle,
  Loader2,
  Sparkles,
  Share2,
  Trophy,
  Calendar,
  Crown,
  Gift,
  Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Prosty debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function FriendsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [requests, setRequests] = useState<(FriendRequest & { fromUserProfile?: UserProfile })[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [searchName, setSearchName] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // 🎁 STANY DLA REFERALI
  const [referralLink, setReferralLink] = useState('')
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)

  // 🔒 OCHRONA PRZED DUPLIKATAMI
  const processingRef = useRef<Set<string>>(new Set())

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string, currentUserId: string) => {
      if (searchTerm.length < 2) {
        setSearchResults([])
        setSearchError('')
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)
      setSearchError('')
      
      try {
        console.log(`🔍 Szukam: "${searchTerm}"`)
        const results = await userService.findUsersByName(searchTerm, currentUserId)
        console.log(`✅ Znaleziono ${results.length} wyników`)
        setSearchResults(results)
        
        if (results.length === 0 && searchTerm.length >= 2) {
          setSearchError(`Nie znaleziono użytkowników zawierających "${searchTerm}"`)
        }
      } catch (error) {
        console.error('❌ Błąd wyszukiwania:', error)
        setSearchError('Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 600),
    []
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr)
      if (!usr) {
        setLoading(false)
        return
      }
      
      await loadUserProfile(usr.uid)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user && searchName.trim()) {
      setSearchLoading(true)
      debouncedSearch(searchName, user.uid)
    } else {
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
    }
  }, [searchName, user, debouncedSearch])

  const loadUserProfile = async (uid: string) => {
    try {
      const profile = await userService.getUserProfile(uid)
      setUserProfile(profile)
      
      if (profile) {
        await loadFriends(profile.uid)
        await loadRequests(profile.uid)
      }
    } catch (error) {
      console.error('Błąd ładowania profilu:', error)
      setMessage('❌ Błąd ładowania profilu')
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async (userId: string) => {
    try {
      const userFriends = await userService.getFriends(userId)
      setFriends(userFriends)
    } catch (error) {
      console.error('Błąd ładowania znajomych:', error)
      setFriends([])
    }
  }

  const loadRequests = async (userId: string) => {
    try {
      const userRequests = await userService.getFriendRequests(userId)
      setRequests(userRequests)
    } catch (error) {
      console.error('Błąd ładowania zaproszeń:', error)
      setRequests([])
    }
  }

  // 🎁 GENEROWANIE LINKU REFERALNEGO
  const generateReferralLink = async () => {
    if (!userProfile?.uid) return

    setGeneratingLink(true)
    try {
      const result = await userService.generateReferralLink(userProfile.uid, true)
      
      if (result.success && result.referralLink) {
        setReferralLink(result.referralLink)
        setShowReferralModal(true)
        setMessage('✅ Link zaproszeniowy gotowy!')
      } else {
        setMessage(result.message || '❌ Nie udało się wygenerować linku')
      }
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'Nie udało się wygenerować linku'))
    } finally {
      setGeneratingLink(false)
    }
  }

  // 🎁 KOPIOWANIE LINKU REFERALNEGO
  const copyReferralLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink)
      setMessage('📋 Link skopiowany! Wyślij go znajomym.')
      setShowReferralModal(false)
    }
  }

  const handleSendRequest = async (toUserId: string, toUserName: string) => {
    if (!userProfile?.uid) return

    const key = `send-${toUserId}`
    if (processingRef.current.has(key)) {
      console.log('⏳ Już wysyłam zaproszenie...')
      return
    }

    processingRef.current.add(key)
    setActionLoading(key)
    
    try {
      await userService.sendFriendRequest(userProfile.uid, toUserId)
      setMessage(`✅ Zaproszenie wysłane do ${toUserName}!`)
      setSearchResults(prev => prev.filter(u => u.uid !== toUserId))
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'Nie udało się wysłać zaproszenia'))
    } finally {
      setActionLoading(null)
      setTimeout(() => {
        processingRef.current.delete(key)
      }, 1000)
    }
  }

  const handleAcceptRequest = async (requestId: string, fromUserName: string) => {
    if (!userProfile?.uid) return

    const key = `accept-${requestId}`
    if (processingRef.current.has(key)) {
      console.log('⏳ Już akceptuję zaproszenie...')
      return
    }

    processingRef.current.add(key)
    setActionLoading(key)
    
    try {
      await userService.acceptFriendRequest(requestId, userProfile.uid)
      setMessage(`✅ Zaakceptowano zaproszenie od ${fromUserName}!`)
      await loadRequests(userProfile.uid)
      await loadFriends(userProfile.uid)
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'Nie udało się zaakceptować zaproszenia'))
    } finally {
      setActionLoading(null)
      setTimeout(() => {
        processingRef.current.delete(key)
      }, 1000)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    const key = `reject-${requestId}`
    if (processingRef.current.has(key)) {
      console.log('⏳ Już odrzucam zaproszenie...')
      return
    }

    processingRef.current.add(key)
    setActionLoading(key)
    
    try {
      await userService.rejectFriendRequest(requestId)
      setMessage('📭 Zaproszenie odrzucone')
      if (userProfile?.uid) {
        await loadRequests(userProfile.uid)
      }
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'Nie udało się odrzucić zaproszenia'))
    } finally {
      setActionLoading(null)
      setTimeout(() => {
        processingRef.current.delete(key)
      }, 1000)
    }
  }

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!userProfile?.uid || !confirm(`Czy na pewno chcesz usunąć ${friendName} ze znajomych?`)) return
    
    const key = `remove-${friendId}`
    if (processingRef.current.has(key)) {
      console.log('⏳ Już usuwam znajomego...')
      return
    }

    processingRef.current.add(key)
    setActionLoading(key)
    
    try {
      await userService.removeFriend(userProfile.uid, friendId)
      setMessage(`👋 Usunięto ${friendName} ze znajomych`)
      await loadFriends(userProfile.uid)
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'Nie udało się usunąć znajomego'))
    } finally {
      setActionLoading(null)
      setTimeout(() => {
        processingRef.current.delete(key)
      }, 1000)
    }
  }

  const copyDisplayName = async () => {
    if (userProfile?.displayName) {
      await navigator.clipboard.writeText(userProfile.displayName)
      setMessage('📋 Nazwa skopiowana! Podziel się nią ze znajomymi.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const shareProfile = async () => {
    if (userProfile?.displayName) {
      const shareText = `Dołącz do mnie w Spokój w Głowie! Moja nazwa użytkownika: ${userProfile.displayName}`
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Spokój w Głowie',
            text: shareText,
            url: window.location.origin
          })
        } catch (error) {
          // User cancelled share
        }
      } else {
        await navigator.clipboard.writeText(shareText)
        setMessage('📋 Zaproszenie skopiowane! Wyślij je znajomym.')
      }
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl blur-lg opacity-30 animate-pulse"></div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Ładowanie znajomych</h2>
          <p className="text-gray-600 text-sm sm:text-base">Przygotowujemy Twoją społeczność...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl sm:shadow-2xl">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Nie jesteś zalogowany</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            Dołącz do społeczności i razem dbajcie o dobre samopoczucie
          </p>
          <Link href="/auth/login">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              Zaloguj się
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 sm:-top-20 -right-10 sm:-right-20 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200 rounded-full blur-2xl sm:blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-10 sm:-bottom-20 -left-10 sm:-left-20 w-64 sm:w-96 h-64 sm:h-96 bg-purple-200 rounded-full blur-2xl sm:blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-40 sm:w-64 h-40 sm:h-64 bg-pink-200 rounded-full blur-2xl sm:blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* NAGŁÓWEK */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl sm:shadow-2xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  Twoja Społeczność
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
                  {userProfile?.displayName ? `Witaj, ${userProfile.displayName}!` : 'Ładowanie...'}
                </p>
              </div>
            </div>
          </div>

          {/* PRZYCISKI AKCJI */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-6 sm:mb-8 lg:mb-12">
            <Button
              onClick={generateReferralLink}
              disabled={generatingLink}
              className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {generatingLink ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
              ) : (
                <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              )}
              Zaproś z bonusem XP
            </Button>
            
            <Button
              onClick={shareProfile}
              variant="outline"
              className="rounded-xl sm:rounded-2xl border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Udostępnij
            </Button>
          </div>

          {/* STATYSTYKI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
            <StatCard 
              icon={Users}
              value={friends.length}
              label="Znajomi"
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard 
              icon={Mail}
              value={requests.length}
              label="Zaproszenia"
              gradient="from-orange-500 to-red-500"
            />
            <StatCard 
              icon={Trophy}
              value={friends.reduce((acc, friend) => acc + (friend.streak || 0), 0)}
              label="Łączny streak"
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard 
              icon={Crown}
              value={Math.round(friends.reduce((acc, friend) => acc + (friend.consistency || 0), 0) / Math.max(friends.length, 1))}
              label="Śr. konsystencja"
              gradient="from-purple-500 to-pink-500"
              suffix="%"
            />
          </div>

          {/* TABY */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-3xl overflow-hidden">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
                  <TabButton
                    active={activeTab === 'friends'}
                    onClick={() => setActiveTab('friends')}
                    icon={Users}
                    label="Znajomi"
                    count={friends.length}
                  />
                  <TabButton
                    active={activeTab === 'requests'}
                    onClick={() => setActiveTab('requests')}
                    icon={Mail}
                    label="Zaproszenia"
                    count={requests.length}
                  />
                  <TabButton
                    active={activeTab === 'search'}
                    onClick={() => setActiveTab('search')}
                    icon={Search}
                    label="Szukaj"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WIADOMOŚCI */}
          {message && (
            <div className={cn(
              "mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-medium border flex items-center gap-2 sm:gap-3 animate-in fade-in duration-300 shadow-lg backdrop-blur-sm",
              getMessageClass(message)
            )}>
              {getMessageIcon(message)}
              <span className="flex-1">{message.replace(/[✅❌📭👋📋]/g, '').trim()}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessage('')}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-white/20"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}

          {/* TREŚĆ TABÓW */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {activeTab === 'friends' && (
              <FriendsList 
                friends={friends}
                onRemoveFriend={handleRemoveFriend}
                actionLoading={actionLoading}
                onSearchClick={() => setActiveTab('search')}
              />
            )}

            {activeTab === 'requests' && (
              <RequestsList 
                requests={requests}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
                actionLoading={actionLoading}
              />
            )}

            {activeTab === 'search' && (
              <SearchTab 
                searchName={searchName}
                setSearchName={setSearchName}
                searchResults={searchResults}
                searchLoading={searchLoading}
                searchError={searchError}
                userProfile={userProfile}
                onSendRequest={handleSendRequest}
                actionLoading={actionLoading}
                onCopyDisplayName={copyDisplayName}
                onShareProfile={shareProfile}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODAL REFERALNY */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Link zaproszeniowy gotowy!
              </h3>
              
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
                Wyślij ten link znajomym. Oboje dostaniecie bonusowe XP po dołączeniu!
              </p>

              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="text-xs text-gray-500 mb-1 sm:mb-2">Twój link:</p>
                <div className="flex items-center gap-2">
                  <Link2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-800 truncate flex-1">
                    {referralLink}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowReferralModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 text-xs sm:text-sm"
                >
                  Anuluj
                </Button>
                <Button
                  onClick={copyReferralLink}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-xs sm:text-sm"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Kopiuj
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// KOMPONENT STATCARD
function StatCard({ icon: Icon, value, label, gradient, suffix = '' }: any) {
  return (
    <Card className="border-0 shadow-lg sm:shadow-xl bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl sm:rounded-2xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r ${gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-lg`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1">{value}{suffix}</div>
        <div className="text-gray-600 text-xs sm:text-sm lg:text-base">{label}</div>
      </CardContent>
    </Card>
  )
}

// KOMPONENT TABBUTTON
function TabButton({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 flex-1 min-h-[44px]",
        active
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
          : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
      )}
    >
      <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
      <span className="whitespace-nowrap">{label}</span>
      {count > 0 && (
        <span className={cn(
          "text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[20px]",
          active ? "bg-white/20" : "bg-blue-100 text-blue-600"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

// FUNKCJE POMOCNICZE
function getMessageClass(message: string) {
  if (message.includes('✅')) return "bg-green-50 border-green-200 text-green-700"
  if (message.includes('❌')) return "bg-red-50 border-red-200 text-red-700"
  if (message.includes('📭')) return "bg-blue-50 border-blue-200 text-blue-700"
  if (message.includes('👋')) return "bg-orange-50 border-orange-200 text-orange-700"
  if (message.includes('📋')) return "bg-purple-50 border-purple-200 text-purple-700"
  return "bg-gray-50 border-gray-200 text-gray-700"
}

function getMessageIcon(message: string) {
  if (message.includes('✅')) return <Check className="h-4 w-4 sm:h-5 sm:w-5" />
  if (message.includes('❌')) return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
  if (message.includes('📭')) return <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
  if (message.includes('👋')) return <UserX className="h-4 w-4 sm:h-5 sm:w-5" />
  if (message.includes('📋')) return <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
  return <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
}

// KOMPONENT FRIENDSLIST
function FriendsList({ friends, onRemoveFriend, actionLoading, onSearchClick }: any) {
  if (friends.length === 0) {
    return (
      <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardContent className="text-center py-12 sm:py-16 lg:py-24">
          <div className="relative inline-block mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl sm:blur-2xl opacity-20"></div>
            <Users className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300 mx-auto relative" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Brak znajomych</h3>
          <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base lg:text-lg">
            Dołącz do społeczności i wspólnie dbajcie o swoje samopoczucie
          </p>
          <Button 
            onClick={onSearchClick}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
            Znajdź pierwszego znajomego
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {friends.map((friend: UserProfile) => (
        <Card key={friend.uid} className="border-0 shadow-lg sm:shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 group hover:scale-105 rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl lg:text-3xl shadow-lg sm:shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  {friend.avatarUrl ? (
                    <img 
                      src={friend.avatarUrl} 
                      alt={friend.displayName}
                      className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
                    />
                  ) : (
                    friend.displayName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl xl:text-2xl mb-1 sm:mb-2 line-clamp-1">
                {friend.displayName}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-3 sm:mb-4 line-clamp-1">
                {friend.email}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full mb-4 sm:mb-6">
                <div className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    <div className="font-bold text-blue-600 text-sm sm:text-base lg:text-lg xl:text-xl">{friend.streak || 0}</div>
                  </div>
                  <div className="text-xs text-blue-600">dni streak</div>
                </div>
                <div className="text-center p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl border border-green-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <div className="font-bold text-green-600 text-sm sm:text-base lg:text-lg xl:text-xl">{friend.consistency || 0}%</div>
                  </div>
                  <div className="text-xs text-green-600">konsystencja</div>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-300 rounded-lg sm:rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-xs sm:text-sm"
                  onClick={() => window.open(`mailto:${friend.email}`, '_blank')}
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Email</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveFriend(friend.uid, friend.displayName || 'tego znajomego')}
                  disabled={actionLoading === `remove-${friend.uid}`}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm"
                >
                  {actionLoading === `remove-${friend.uid}` ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// KOMPONENT REQUESTSLIST
function RequestsList({ requests, onAcceptRequest, onRejectRequest, actionLoading }: any) {
  if (requests.length === 0) {
    return (
      <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardContent className="text-center py-12 sm:py-16 lg:py-24">
          <div className="relative inline-block mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-xl sm:blur-2xl opacity-20"></div>
            <Mail className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300 mx-auto relative" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Brak oczekujących zaproszeń</h3>
          <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base lg:text-lg">
            Nowe zaproszenia do grona znajomych pojawią się tutaj
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {requests.map((request: any) => (
        <Card key={request.id} className="border-0 shadow-lg sm:shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 group hover:scale-105 rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl blur-md opacity-50"></div>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl lg:text-2xl shadow-lg">
                  {request.fromUserProfile?.avatarUrl ? (
                    <img 
                      src={request.fromUserProfile.avatarUrl} 
                      alt={request.fromUserProfile.displayName}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                    />
                  ) : (
                    request.fromUserProfile?.displayName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg xl:text-xl mb-1 line-clamp-1">
                  {request.fromUserProfile?.displayName || 'Nieznany użytkownik'}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-1 sm:mb-2">
                  Chce zostać Twoim znajomym
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {request.fromUserProfile?.email}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => onAcceptRequest(request.id, request.fromUserProfile?.displayName || 'użytkownika')}
                disabled={actionLoading === `accept-${request.id}`}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-xs sm:text-sm"
                size="sm"
              >
                {actionLoading === `accept-${request.id}` ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Zaakceptuj
              </Button>
              <Button
                variant="outline"
                onClick={() => onRejectRequest(request.id)}
                disabled={actionLoading === `reject-${request.id}`}
                className="flex-1 border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm"
                size="sm"
              >
                {actionLoading === `reject-${request.id}` ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                ) : (
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                Odrzuć
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// KOMPONENT SEARCHTAB
function SearchTab({
  searchName,
  setSearchName,
  searchResults,
  searchLoading,
  searchError,
  userProfile,
  onSendRequest,
  actionLoading,
  onCopyDisplayName,
  onShareProfile
}: any) {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div>
              <div>Znajdź znajomych</div>
              <CardDescription className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                Wpisz imię, nazwisko lub email użytkownika, którego chcesz znaleźć
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="np. Anna, jan@email.com, Kowalski..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="text-sm sm:text-base lg:text-lg px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-gray-200/60 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm shadow-lg"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  onClick={onCopyDisplayName}
                  disabled={!userProfile?.displayName}
                  variant="outline"
                  className="border-gray-300 hover:border-purple-300 hover:bg-purple-50 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Kopiuj</span>
                </Button>
                <Button 
                  onClick={onShareProfile}
                  disabled={!userProfile?.displayName}
                  variant="outline"
                  className="border-gray-300 hover:border-blue-300 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Udostępnij</span>
                </Button>
              </div>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">
              Wpisz co najmniej 2 znaki. Twoja nazwa: <strong className="text-blue-600">{userProfile?.displayName}</strong>
            </p>
          </div>

          {searchError && (
            <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200/60 rounded-xl sm:rounded-2xl text-red-700 text-sm sm:text-base lg:text-lg flex items-center gap-2 sm:gap-3 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {searchLoading && (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
              <div className="relative mb-3 sm:mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-blue-500 relative" />
              </div>
              <span className="text-gray-600 text-sm sm:text-base lg:text-lg">Szukam użytkowników w bazie...</span>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl xl:text-2xl flex items-center gap-2 sm:gap-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-500" />
                Znaleziono {searchResults.length} użytkowników:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {searchResults.map((foundUser: UserProfile) => (
                  <Card key={foundUser.uid} className="border-2 border-green-200/60 bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 group hover:scale-105">
                    <CardContent className="p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl blur-md opacity-50"></div>
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl lg:text-2xl shadow-lg">
                            {foundUser.avatarUrl ? (
                              <img 
                                src={foundUser.avatarUrl} 
                                alt={foundUser.displayName}
                                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                              />
                            ) : (
                              foundUser.displayName?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg xl:text-xl mb-1 line-clamp-1">
                            {foundUser.displayName}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm lg:text-base line-clamp-1">
                            {foundUser.email}
                          </p>
                          {foundUser.bio && (
                            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2">{foundUser.bio}</p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => onSendRequest(foundUser.uid, foundUser.displayName || 'użytkownika')}
                        disabled={actionLoading === `send-${foundUser.uid}`}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl lg:rounded-2xl py-2 sm:py-3 text-xs sm:text-sm lg:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        {actionLoading === `send-${foundUser.uid}` ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 animate-spin mr-1 sm:mr-2" />
                        ) : (
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                        )}
                        Wyślij zaproszenie
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!searchResults.length && !searchError && !searchLoading && searchName.length < 2 && (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-blue-200/60 backdrop-blur-sm">
              <h4 className="font-bold text-blue-900 text-sm sm:text-base lg:text-lg xl:text-xl mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500" />
                Jak to działa?
              </h4>
              <p className="text-blue-700 text-xs sm:text-sm lg:text-base mb-3 sm:mb-4">
                Wyszukiwanie przeszukuje bazę Firebase po:
              </p>
              <ul className="text-blue-700 text-xs sm:text-sm space-y-1 sm:space-y-2 lg:space-y-3 mb-3 sm:mb-4">
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                  <strong>Imieniu</strong> (Anna, Jan, Maria)
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                  <strong>Nazwisku</strong> (Kowalska, Nowak)
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                  <strong>Emailu</strong> (anna@email.com)
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                  <strong>Nazwie użytkownika</strong> (AnnaKowalska)
                </li>
              </ul>
              <div className="p-3 bg-white/50 rounded-lg sm:rounded-xl border border-blue-200">
                <p className="text-blue-600 text-xs sm:text-sm lg:text-base">
                  <strong>Przykład:</strong> Wyszukaj "eli" aby znaleźć "Elia", "Eliot", "Marcelina"
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}