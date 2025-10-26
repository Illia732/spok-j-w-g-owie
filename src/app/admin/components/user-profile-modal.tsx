// src/app/admin/components/user-profile-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  Mail, 
  Calendar, 
  X, 
  Crown, 
  Target, 
  Activity, 
  Zap, 
  Trophy,
  BookOpen,
  TrendingUp,
  Ban,
  Unlock,
  Shield
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import userService from '@/lib/user-service'
import { blockService } from '@/lib/block-service'

interface UserProfileModalProps {
  user: UserProfile
  isOpen: boolean
  onClose: () => void
  currentUser: any
  onUserUpdate: () => void
}

export default function UserProfileModal({ 
  user, 
  isOpen, 
  onClose, 
  currentUser,
  onUserUpdate 
}: UserProfileModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleBlockUser = async () => {
    if (!confirm(`Czy na pewno chcesz zablokować użytkownika ${user.displayName || user.email}?`)) {
      return
    }

    setActionLoading('block')
    try {
      await blockService.blockUser({
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        reason: 'Blokada z poziomu profilu użytkownika',
        isPermanent: false,
        days: 7
      }, currentUser)
      
      onUserUpdate()
      onClose()
    } catch (error) {
      console.error('Błąd blokowania użytkownika:', error)
      alert('Błąd podczas blokowania użytkownika')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblockUser = async () => {
    if (!confirm(`Czy na pewno chcesz odblokować użytkownika ${user.displayName || user.email}?`)) {
      return
    }

    setActionLoading('unblock')
    try {
      await blockService.unblockUser(user.uid)
      onUserUpdate()
      onClose()
    } catch (error) {
      console.error('Błąd odblokowania użytkownika:', error)
      alert('Błąd podczas odblokowania użytkownika')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (newRole: 'user' | 'admin') => {
    if (!confirm(`Czy na pewno chcesz zmienić rolę użytkownika na ${newRole === 'admin' ? 'administratora' : 'użytkownika'}?`)) {
      return
    }

    setActionLoading('role')
    try {
      await userService.changeUserRole(user.uid, newRole)
      onUserUpdate()
      onClose()
    } catch (error) {
      console.error('Błąd zmiany roli:', error)
      alert('Błąd podczas zmiany roli użytkownika')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'Nieznana data'
    
    try {
      const jsDate = date instanceof Date ? date : date.toDate()
      return jsDate.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Nieznana data'
    }
  }

  const getLevelInfo = (xp: any) => {
    try {
      const safeXp = Number(xp) || 0
      const level = Math.floor(safeXp / 100) + 1
      const currentLevelXP = safeXp % 100
      const progress = Math.min((currentLevelXP / 100) * 100, 100)
      
      return { level, progress, currentLevelXP }
    } catch (error) {
      return { level: 1, progress: 0, currentLevelXP: 0 }
    }
  }

  const levelInfo = getLevelInfo(user?.xp)

  // Funkcja do uzyskania inicjału użytkownika
  const getUserInitial = () => {
    // Spróbuj najpierw z displayName
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase()
    }
    // Potem z email
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }
    // Domyślnie
    return 'U'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.displayName || user.email}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover"
                      />
                    ) : (
                      getUserInitial()
                    )}
                  </div>
                  {user.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {user.displayName || user.email}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-white/50"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                
                {/* Status i akcje */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex flex-wrap gap-2 flex-1">
                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="bg-amber-100 text-amber-800">
                      <Crown className="h-3 w-3 mr-1" />
                      {user.role === 'admin' ? 'Administrator' : 'Użytkownik'}
                    </Badge>
                    {user.isBlocked ? (
                      <Badge variant="destructive">
                        <Ban className="h-3 w-3 mr-1" />
                        Zablokowany
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Unlock className="h-3 w-3 mr-1" />
                        Aktywny
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {user.role === 'user' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeRole('admin')}
                        disabled={actionLoading === 'role' || user.uid === currentUser.uid}
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        {actionLoading === 'role' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600" />
                        ) : (
                          <Crown className="h-3 w-3 mr-1" />
                        )}
                        Nadaj admina
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeRole('user')}
                        disabled={actionLoading === 'role' || user.uid === currentUser.uid}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        {actionLoading === 'role' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        Odbierz admina
                      </Button>
                    )}
                    
                    {user.isBlocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnblockUser}
                        disabled={actionLoading === 'unblock'}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        {actionLoading === 'unblock' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600" />
                        ) : (
                          <Unlock className="h-3 w-3 mr-1" />
                        )}
                        Odblokuj
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBlockUser}
                        disabled={actionLoading === 'block' || user.uid === currentUser.uid}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {actionLoading === 'block' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600" />
                        ) : (
                          <Ban className="h-3 w-3 mr-1" />
                        )}
                        Zablokuj
                      </Button>
                    )}
                  </div>
                </div>

                {/* INFORMACJE PODSTAWOWE */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-blue-500" />
                      Informacje Podstawowe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Email */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        Email:
                      </span>
                      <span className="font-medium text-sm">{user.email}</span>
                    </div>

                    {/* Nazwa wyświetlana */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Nazwa wyświetlana:</span>
                      <span className="font-medium text-sm">{user.displayName || 'Brak'}</span>
                    </div>

                    {/* Bio */}
                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Bio:</span>
                      <span className="font-medium text-sm text-right max-w-[200px]">
                        {user.bio || 'Brak opisu'}
                      </span>
                    </div>

                    {/* Data rejestracji */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        Data rejestracji:
                      </span>
                      <span className="font-medium text-sm">{formatDate(user.createdAt)}</span>
                    </div>

                    {/* Poziom i XP */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Poziom:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-600">Lvl {levelInfo.level}</span>
                        <span className="text-xs text-gray-500">({user.xp || 0} XP)</span>
                      </div>
                    </div>

                    {/* Passa */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-500" />
                        Passa:
                      </span>
                      <span className="font-medium text-sm">{user.streak || 0} dni</span>
                    </div>

                    {/* Konsystencja */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Konsystencja:
                      </span>
                      <span className="font-medium text-sm">{user.consistency || 0}%</span>
                    </div>


                  </CardContent>
                </Card>

                {/* ID użytkownika */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-4 w-4 text-gray-500" />
                      ID Użytkownika
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-mono break-all">
                        {user.uid}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}