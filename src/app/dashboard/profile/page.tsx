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
  Camera,
  Copy,
  Check,
  FileText,
  Shield,
  Bell,
  Moon,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Save
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
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    publicProfile: true
  })
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

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
      setIsEditing(false)
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
                Ustawienia Konta
              </h1>
              <p className="text-gray-600 text-sm">
                Zarządzaj swoim profilem i ustawieniami
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar nawigacji */}
          <Card className="lg:w-64 border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                    activeTab === 'profile' 
                      ? "bg-blue-500 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <User className="h-4 w-4" />
                  Profil
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                    activeTab === 'settings' 
                      ? "bg-blue-500 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Bell className="h-4 w-4" />
                  Powiadomienia
                </button>
                
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                    activeTab === 'privacy' 
                      ? "bg-blue-500 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Prywatność
                </button>
                
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                    activeTab === 'appearance' 
                      ? "bg-blue-500 text-white shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Moon className="h-4 w-4" />
                  Wygląd
                </button>

                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Wyloguj się
                  </button>
                </div>
              </nav>
            </CardContent>
          </Card>

          {/* Główna zawartość */}
          <div className="flex-1 space-y-6">
            
            {/* Profil */}
            {activeTab === 'profile' && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informacje Profilowe
                  </CardTitle>
                  <CardDescription>
                    Zarządzaj swoimi podstawowymi danymi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4">
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
                    </div>
                    
                    {uploading && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploadowanie zdjęcia...
                      </div>
                    )}
                  </div>

                  {/* Formularz edycji */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nazwa wyświetlana
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={editForm.displayName}
                          onChange={(e) => setEditForm(prev => ({...prev, displayName: e.target.value}))}
                          placeholder="Twoja nazwa użytkownika"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={copyDisplayName}
                          className="whitespace-nowrap"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Opis bio
                      </label>
                      <Input
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                        placeholder="Krótki opis o sobie..."
                      />
                    </div>

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
                              ? new Date(userProfile.createdAt).toLocaleDateString('pl-PL')
                              : 'Niedawno'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Zapisz zmiany
                      </Button>
                    </div>
                  </div>

                  {userProfile?.role === 'admin' && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Konto administratorskie</h3>
                          <p className="text-purple-100 text-sm">
                            Masz pełny dostęp do panelu administracyjnego
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ustawienia powiadomień */}
            {activeTab === 'settings' && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-green-600" />
                    Ustawienia Powiadomień
                  </CardTitle>
                  <CardDescription>
                    Kontroluj jak i kiedy otrzymujesz powiadomienia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900">Powiadomienia email</h4>
                        <p className="text-gray-600 text-sm">
                          Otrzymuj powiadomienia na swój adres email
                        </p>
                      </div>
                      <Button
                        variant={settings.emailNotifications ? "primary" : "outline"}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          emailNotifications: !prev.emailNotifications
                        }))}
                      >
                        {settings.emailNotifications ? 'Włączone' : 'Wyłączone'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900">Powiadomienia push</h4>
                        <p className="text-gray-600 text-sm">
                          Otrzymuj powiadomienia w przeglądarce
                        </p>
                      </div>
                      <Button
                        variant={settings.pushNotifications ? "primary" : "outline"}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          pushNotifications: !prev.pushNotifications
                        }))}
                      >
                        {settings.pushNotifications ? 'Włączone' : 'Wyłączone'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prywatność */}
            {activeTab === 'privacy' && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Ustawienia Prywatności
                  </CardTitle>
                  <CardDescription>
                    Kontroluj kto może zobaczyć Twój profil i dane
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900">Publiczny profil</h4>
                        <p className="text-gray-600 text-sm">
                          Pozwól innym użytkownikom znaleźć Twój profil
                        </p>
                      </div>
                      <Button
                        variant={settings.publicProfile ? "primary" : "outline"}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          publicProfile: !prev.publicProfile
                        }))}
                      >
                        {settings.publicProfile ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-2" />
                        )}
                        {settings.publicProfile ? 'Publiczny' : 'Prywatny'}
                      </Button>
                    </div>
                  </div>

                  {/* Niebezpieczna strefa */}
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-red-600 mb-4">Niebezpieczna strefa</h4>
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl bg-red-50">
                      <div>
                        <h4 className="font-semibold text-red-900">Usuń konto</h4>
                        <p className="text-red-700 text-sm">
                          Trwale usuń swoje konto i wszystkie dane
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        className='bg-red-600 hover:bg-red-700 text-white'
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Usuń konto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wygląd */}
            {activeTab === 'appearance' && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-indigo-600" />
                    Ustawienia Wyglądu
                  </CardTitle>
                  <CardDescription>
                    Dostosuj wygląd aplikacji do swoich preferencji
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-gray-900">Tryb ciemny</h4>
                        <p className="text-gray-600 text-sm">
                          Włącz ciemny motyw interfejsu
                        </p>
                      </div>
                      <Button
                        variant={settings.darkMode ? "primary" : "outline"}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          darkMode: !prev.darkMode
                        }))}
                      >
                        {settings.darkMode ? 'Włączony' : 'Wyłączony'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}