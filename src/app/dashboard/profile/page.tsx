// src/app/dashboard/profile/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import userService from '@/lib/user-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Edit, 
  Mail, 
  Calendar, 
  Users,
  UserPlus,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  BarChart3,
  Camera,
  Copy,
  Check,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { UserProfile } from '@/types/user'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: ''
  })
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [stats, setStats] = useState({
    streak: 0,
    moodEntries: 0,
    consistency: 0,
    friends: 0
  })
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr)
      if (usr) {
        // Subskrybuj zmiany profilu
        const userRef = doc(db, 'users', usr.uid)
        const unsub = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = { uid: docSnap.id, ...docSnap.data() } as UserProfile
            setUserProfile(data)
            setEditForm({
              displayName: data.displayName || '',
              bio: data.bio || ''
            })
            
            // Pobierz prawdziwe statystyki
            const userStats = await userService.getUserStats(usr.uid)
            setStats(userStats)
            
            // Pobierz znajomych
            const userFriends = await userService.getFriends(usr.uid)
            setFriends(userFriends)
            setStats(prev => ({ ...prev, friends: userFriends.length }))
          }
          setLoading(false)
        })
        return () => unsub()
      } else {
        setUserProfile(null)
        setFriends([])
        setStats({
          streak: 0,
          moodEntries: 0,
          consistency: 0,
          friends: 0
        })
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      await userService.updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        bio: editForm.bio
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Błąd aktualizacji profilu:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || ''
    })
    setIsEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      alert('Proszę wybrać plik obrazu')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest zbyt duży. Maksymalny rozmiar to 5MB.')
      return
    }

    setUploading(true)
    try {
      await userService.uploadAvatar(user.uid, file)
    } catch (error) {
      console.error('Błąd uploadu avatara:', error)
      alert('Wystąpił błąd podczas uploadu zdjęcia')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const copyDisplayName = async () => {
    if (userProfile?.displayName) {
      await navigator.clipboard.writeText(userProfile.displayName)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie profilu...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nie jesteś zalogowany</h2>
          <p className="text-gray-600 mb-4">Zaloguj się, aby zobaczyć swój profil</p>
          <Link href="/auth/login">
            <Button>Zaloguj się</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        
        {/* Header strony */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Twój Profil
              </h1>
              <p className="text-gray-600 text-sm">
                Zarządzaj swoimi danymi i osiągnięciami
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Karta profilu */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-blue-600" />
                  Informacje podstawowe
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Anuluj' : 'Edytuj'}
                </Button>
              </div>
              <CardDescription>
                Zarządzaj podstawowymi danymi konta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Avatar i główne info */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    {userProfile?.avatarUrl ? (
                      <img 
                        src={userProfile.avatarUrl} 
                        alt="Twój avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Przycisk zmiany zdjęcia */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editForm.displayName}
                        onChange={(e) => setEditForm(prev => ({...prev, displayName: e.target.value}))}
                        placeholder="Twoja nazwa użytkownika"
                        className="text-xl font-bold text-center md:text-left"
                      />
                      <Input
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                        placeholder="Krótki opis o sobie..."
                        className="text-gray-600"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {userProfile?.displayName || user.email}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {userProfile?.bio || 'Dodaj krótki opis o sobie...'}
                      </p>
                      
                      {/* Nazwa użytkownika do kopiowania */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                          Nazwa: {userProfile?.displayName || 'Brak nazwy'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyDisplayName}
                          className="h-8 w-8 p-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Dołączył: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pl-PL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Niedawno'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Akcje edycji */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Zapisz zmiany
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 border-gray-300"
                  >
                    Anuluj
                  </Button>
                </div>
              )}

              {/* Upload progress */}
              {uploading && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Uploadowanie zdjęcia...
                  </div>
                </div>
              )}

              {/* Informacje konta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Data rejestracji
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-medium text-gray-900">
                      {userProfile?.createdAt
                        ? new Date(userProfile.createdAt).toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Niedawno'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 🔒 BADGE ADMINISTRATORSKI */}
              {userProfile?.role === 'admin' && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Konto administratorskie</h3>
                      <p className="text-purple-100 text-sm">
                        Masz pełny dostęp do panelu administracyjnego i zarządzania treścią.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statystyki i osiągnięcia */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Twoje Osiągnięcia
              </CardTitle>
              <CardDescription>
                Śledź swoje postępy w aplikacji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats.streak}</div>
                  <div className="text-sm text-blue-700">Dni streak</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats.moodEntries}</div>
                  <div className="text-sm text-green-700">Wpisy nastroju</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{stats.consistency}%</div>
                  <div className="text-sm text-purple-700">Konsystencja</div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{stats.friends}</div>
                  <div className="text-sm text-orange-700">Znajomych</div>
                </div>
              </div>

              {/* Szybkie akcje pod statystykami */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
                <Link href="/mood" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 py-3 border-gray-200 hover:border-purple-300 hover:bg-purple-50">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Dodaj nastrój
                  </Button>
                </Link>
                
                <Link href="/ai" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 py-3 border-gray-200 hover:border-blue-300 hover:bg-blue-50">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Porozmawiaj z AI
                  </Button>
                </Link>
                
                <Link href="/dashboard/friends" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 py-3 border-gray-200 hover:border-orange-300 hover:bg-orange-50">
                    <UserPlus className="h-4 w-4 text-orange-600" />
                    Dodaj znajomego
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Sekcja Znajomi - Podgląd */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Twoi Znajomi
              </CardTitle>
              <CardDescription>
                Twoja sieć wsparcia - {friends.length} znajomych
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                  <div>
                    <h4 className="font-semibold text-gray-900">Wsparcie społeczności</h4>
                    <p className="text-gray-600 text-sm">
                      Razem łatwiej dbać o dobre samopoczucie
                    </p>
                  </div>
                  <Link href="/dashboard/friends">
                    <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                      <Users className="h-4 w-4 mr-2" />
                      Zarządzaj
                    </Button>
                  </Link>
                </div>
                
                {/* Mini lista znajomych */}
                {friends.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {friends.slice(0, 4).map(friend => (
                      <div key={friend.uid} className="flex flex-col items-center text-center p-4 border border-gray-100 rounded-xl bg-white/50 hover:bg-white transition-colors group">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          {friend.avatarUrl ? (
                            <img 
                              src={friend.avatarUrl} 
                              alt={friend.displayName}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            friend.displayName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm truncate w-full">
                          {friend.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {friend.email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          🔥 {friend.streak || 0} dni
                        </div>
                      </div>
                    ))}
                    {friends.length > 4 && (
                      <Link href="/dashboard/friends" className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-600 font-semibold text-sm mb-3">
                          +{friends.length - 4}
                        </div>
                        <div className="font-medium text-gray-900 text-sm">
                          Zobacz więcej
                        </div>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Brak znajomych</p>
                    <p className="text-gray-500 text-sm mt-1 mb-4">
                      Dodaj znajomych, aby wspólnie dbać o samopoczucie
                    </p>
                    <Link href="/dashboard/friends">
                      <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Dodaj znajomych
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}