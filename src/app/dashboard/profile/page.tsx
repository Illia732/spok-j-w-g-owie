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
  Mail, 
  Calendar, 
  Camera,
  Copy,
  Check,
  FileText,
  LogOut,
  Trash2,
  Save,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { UserProfile } from '@/types/user'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: ''
  })
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr)
      if (usr) {
        const userRef = doc(db, 'users', usr.uid)
        const unsub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = { uid: docSnap.id, ...docSnap.data() } as UserProfile
            setUserProfile(data)
            setEditForm({
              displayName: data.displayName || '',
              bio: data.bio || ''
            })
          }
          setLoading(false)
        })
        return () => unsub()
      } else {
        setUserProfile(null)
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
    } catch (error) {
      console.error('Błąd aktualizacji profilu:', error)
    }
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

  const handleSignOut = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Błąd wylogowania:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.')) {
      try {
        await userService.deleteUserAccount(user.uid)
      } catch (error) {
        console.error('Błąd usuwania konta:', error)
      }
    }
  }

  // Funkcja formatująca datę rejestracji z Firebase Timestamp
  const getRegistrationDate = () => {
    if (!userProfile?.createdAt) return 'Niedawno'
    
    try {
      const createdAt = userProfile.createdAt;
      // Handle both Date objects and Firebase Timestamps
      const date = createdAt instanceof Date ? createdAt : createdAt.toDate();
      
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Błąd formatowania daty:', error);
      return 'Niedawno';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie profilu...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nie jesteś zalogowany</h2>
          <p className="text-gray-600 mb-6">Zaloguj się, aby zobaczyć swój profil</p>
          <Link href="/auth/login">
            <Button className="w-full">Zaloguj się</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-4 sm:py-8">
      <div className="container mx-auto max-w-2xl px-3 sm:px-4">
        
        {/* Header strony - responsywny */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ustawienia Konta
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                Zarządzaj swoim profilem
              </p>
            </div>
          </div>
        </div>

        {/* Główna karta - zoptymalizowana dla mobile */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
              <User className="h-5 w-5 text-blue-600" />
              Informacje Profilowe
            </CardTitle>
            <CardDescription className="text-center sm:text-left text-sm">
              Zarządzaj swoimi podstawowymi danymi
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            {/* Avatar - okrągły i responsywny */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg ring-4 ring-white/50">
                  {userProfile?.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt="Twój avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
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
              </div>
              
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Uploadowanie...
                </div>
              )}
            </div>

            {/* Formularz edycji - zoptymalizowany dla mobile */}
            <div className="space-y-4">
              {/* Nazwa wyświetlana */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nazwa wyświetlana
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({...prev, displayName: e.target.value}))}
                    placeholder="Twoja nazwa użytkownika"
                    className="flex-1 text-sm sm:text-base"
                  />
                  <Button
                    variant="outline"
                    onClick={copyDisplayName}
                    className="sm:w-auto w-full"
                    size="sm"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="ml-2 hidden sm:inline">
                      {copied ? 'Skopiowano!' : 'Kopiuj'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Opis bio
                </label>
                <Input
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                  placeholder="Krótki opis o sobie..."
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Informacje - grid responsywny */}
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Data rejestracji
                  </label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {getRegistrationDate()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Przycisk zapisu */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Zapisz zmiany
                </Button>
              </div>
            </div>

            {/* Panel admina */}
            {userProfile?.role === 'admin' && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Konto administratorskie</h3>
                    <p className="text-purple-100 text-xs sm:text-sm">
                      Masz pełny dostęp do panelu administracyjnego
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Akcje konta */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              
              {/* Wyloguj się */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex-1 border-gray-300"
                  size="lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj się
                </Button>
              </div>

              {/* Niebezpieczna strefa */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <h4 className="font-semibold text-red-600 text-sm">Niebezpieczna strefa</h4>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-200 rounded-xl bg-red-50">
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 text-sm sm:text-base">Usuń konto</h4>
                    <p className="text-red-700 text-xs sm:text-sm mt-1">
                      Trwale usuń swoje konto i wszystkie dane
                    </p>
                  </div>
                  <Button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Usuń konto
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}