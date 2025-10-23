'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '../../../lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import userService  from '../../../lib/user-service'
import { friendsService } from '../../../lib/friends-service'
import { UserProfile, FriendRequest } from '../../../types/user'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Users, UserPlus, Mail, Check, X, UserX, Search, Copy, AlertCircle, Loader2, Sparkles, Share2, Trophy, Calendar, MessageCircle, Crown } from 'lucide-react'
import { cn } from '../../../lib/utils'

// --- Typy i interfejsy ---
interface StatCardProps {
  icon: React.ComponentType<any>;
  value: number | string;
  label: string;
  gradient: string;
  suffix?: string;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  count?: number;
  mobileLabel: string;
}

interface FriendsListProps {
  friends: any[];
  onRemoveFriend: (friendId: string, friendName: string) => void;
  actionLoading: string | null;
  onSearchClick: () => void;
}

interface RequestsListProps {
  requests: any[];
  onAcceptRequest: (requestId: string, friendName?: string) => void;
  onRejectRequest: (requestId: string) => void;
  actionLoading: string | null;
}

interface SearchTabProps {
  searchName: string;
  setSearchName: (name: string) => void;
  searchResults: any[];
  searchLoading: boolean;
  searchError: string | null;
  userProfile: any;
  onSendRequest: (userId: string, userName: string) => void;
  actionLoading: string | null;
  onCopyDisplayName: () => void;
  onShareProfile: () => void;
}

interface FriendsComparisonProps {
  friends: any[];
  userProfile: any;
}

interface QuickMessageProps {
  friends: any[];
  onSendMessage: (friendId: string, message: string) => void;
}

interface SuggestedFriendsProps {
  suggestions: any[];
  onSendRequest: (userId: string, userName: string) => void;
  actionLoading: string | null;
}

interface InviteLinkHandlerProps {
  user: User;
}

// --- Komponenty pomocnicze ---
function StatCard({ icon: Icon, value, label, gradient, suffix }: StatCardProps) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl hover:shadow-2xl transition-all duration-300 group hover:scale-105">
      <CardContent className="p-4 lg:p-6 text-center">
        <div 
          className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg" 
          style={{ background: gradient }}
        >
          <Icon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
        </div>
        <div className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">
          {value}{suffix}
        </div>
        <div className="text-gray-600 text-sm lg:text-base">{label}</div>
      </CardContent>
    </Card>
  )
}

function TabButton({ active, onClick, icon: Icon, label, count = 0, mobileLabel }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-4 lg:px-6 py-3 lg:py-4 rounded-xl text-sm lg:text-base font-medium transition-all duration-300 flex-1 min-w-0 group relative overflow-hidden",
        active
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
          : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border border-transparent hover:border-gray-200"
      )}
    >
      <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
      <span className="hidden lg:inline truncate">{label}</span>
      <span className="lg:hidden truncate">{mobileLabel}</span>
      {count > 0 && (
        <span className={cn(
          "text-xs px-2 py-1 rounded-full flex-shrink-0",
          active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

function FriendsList({ friends, onRemoveFriend, actionLoading, onSearchClick }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="text-center py-16 lg:py-24">
          <Users className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Brak znajomych</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">Dołącz do społeczności i wspólnie dbajcie o swoje samopoczucie</p>
          <Button 
            onClick={onSearchClick} 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Search className="h-5 w-5 mr-3" /> 
            Znajdź pierwszego znajomego
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
      {friends.map(friend => (
        <Card key={friend.uid} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group hover:scale-105 rounded-3xl overflow-hidden">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="relative w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-white font-bold text-2xl lg:text-3xl shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  {friend.avatarUrl
                    ? <img src={friend.avatarUrl} alt={friend.displayName} className="w-full h-full object-cover rounded-3xl" />
                    : friend.displayName?.charAt(0).toUpperCase()}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-xl lg:text-2xl mb-2 line-clamp-1">{friend.displayName}</h3>
              <p className="text-gray-600 text-sm lg:text-base mb-4 line-clamp-1">{friend.email}</p>
              <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full mb-6">
                <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div className="font-bold text-blue-600 text-lg lg:text-xl">{friend.streak || 0}</div>
                  </div>
                  <div className="text-xs text-blue-600">dni streak</div>
                </div>
                <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <div className="font-bold text-green-600 text-lg lg:text-xl">{friend.consistency || 0}</div>
                  </div>
                  <div className="text-xs text-green-600">konsystencja</div>
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" size="sm" className="flex-1 border-gray-300 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                  onClick={() => window.open(`mailto:${friend.email}`, "_blank")}>
                  <Mail className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Email</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onRemoveFriend(friend.uid, friend.displayName)}
                  disabled={actionLoading === `remove-${friend.uid}`}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-xl transition-all duration-300">
                  {actionLoading === `remove-${friend.uid}`
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <UserX className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RequestsList({ requests, onAcceptRequest, onRejectRequest, actionLoading }: RequestsListProps) {
  if (requests.length === 0) {
    return (
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="text-center py-16 lg:py-24">
          <Mail className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Brak oczekujących zaproszeń</h3>
          <p className="text-gray-600 max-w-md mx-auto text-lg">Nowe zaproszenia do grona znajomych pojawią się tutaj</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
      {requests.map(request => (
        <Card key={request.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group hover:scale-105 rounded-3xl overflow-hidden">
          <CardContent className="p-6 lg:p-8 flex items-center gap-4 lg:gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-md opacity-50"></div>
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl lg:text-2xl shadow-lg">
                {request.fromUserProfile?.avatarUrl
                  ? <img src={request.fromUserProfile.avatarUrl} alt={request.fromUserProfile.displayName} className="w-full h-full object-cover rounded-2xl" />
                  : request.fromUserProfile?.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg lg:text-xl mb-1 line-clamp-1">{request.fromUserProfile?.displayName || 'Nieznany użytkownik'}</h3>
              <p className="text-gray-600 text-sm lg:text-base mb-2">Chce zostać Twoim znajomym</p>
              <p className="text-xs lg:text-sm text-gray-500 line-clamp-1">{request.fromUserProfile?.email}</p>
              <div className="flex gap-3 mt-3">
                <Button size="sm"
                  onClick={() => onAcceptRequest(request.id, request.fromUserProfile?.displayName)}
                  disabled={actionLoading === `accept-${request.id}`}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  {actionLoading === `accept-${request.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Zaakceptuj
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => onRejectRequest(request.id)}
                  disabled={actionLoading === `reject-${request.id}`}
                  className="flex-1 border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-xl transition-all duration-300">
                  {actionLoading === `reject-${request.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  Odrzuć
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SearchTab({ searchName, setSearchName, searchResults, searchLoading, searchError, userProfile, onSendRequest, actionLoading, onCopyDisplayName, onShareProfile }: SearchTabProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-4 lg:pb-6">
          <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Search className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            Znajdź znajomych
          </CardTitle>
          <CardDescription className="text-base lg:text-lg mt-2">Wpisz imię, nazwisko lub email użytkownika, którego chcesz znaleźć.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="np. Anna, jan@email.com, Kowalski..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className="relative text-base lg:text-lg px-4 lg:px-6 py-3 lg:py-4 rounded-2xl border-2 border-gray-200/60 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm shadow-lg"
              />
            </div>
            <div className="flex gap-2 lg:gap-3">
              <Button onClick={onCopyDisplayName} disabled={!userProfile?.displayName} variant="outline" className="border-gray-300 hover:border-purple-300 hover:bg-purple-50 rounded-xl transition-all duration-300 flex items-center gap-2">
                <Copy className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">Kopiuj</span>
              </Button>
              <Button onClick={onShareProfile} disabled={!userProfile?.displayName} variant="outline" className="border-gray-300 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-300 flex items-center gap-2">
                <Share2 className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">Udostępnij</span>
              </Button>
            </div>
          </div>
          <p className="text-sm lg:text-base text-gray-600">Wpisz co najmniej 2 znaki. Twoja nazwa: <strong className="text-blue-600">{userProfile?.displayName}</strong></p>
        </CardContent>
      </Card>

      {searchError && (
        <div className="p-4 lg:p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200/60 rounded-2xl text-red-700 text-base lg:text-lg flex items-center gap-3 backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {searchLoading && (
        <div className="flex flex-col items-center justify-center py-12 lg:py-16">
          <Loader2 className="h-12 w-12 lg:h-16 lg:w-16 animate-spin text-blue-500 relative mb-4" />
          <span className="text-gray-600 text-lg lg:text-xl">Szukam użytkowników w bazie...</span>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4 lg:space-y-6">
          <h3 className="font-bold text-gray-900 text-lg lg:text-2xl flex items-center gap-3">
            <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-500" />
            Znaleziono {searchResults.length} użytkowników
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {searchResults.map(foundUser => (
              <Card key={foundUser.uid} className="border-2 border-green-200/60 bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-105">
                <CardContent className="p-4 lg:p-6 flex items-center gap-4 lg:gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl lg:text-2xl shadow-lg">
                      {foundUser.avatarUrl
                        ? <img src={foundUser.avatarUrl} alt={foundUser.displayName} className="w-full h-full object-cover rounded-2xl" />
                        : foundUser.displayName?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg lg:text-xl mb-1 line-clamp-1">{foundUser.displayName}</h3>
                    <p className="text-gray-600 text-sm lg:text-base line-clamp-1">{foundUser.email}</p>
                    <p className="text-gray-500 text-sm lg:text-base mt-2 line-clamp-2">{foundUser.bio}</p>
                    <Button
                      onClick={() => onSendRequest(foundUser.uid, foundUser.displayName)}
                      disabled={actionLoading === `send-${foundUser.uid}`}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-3 lg:py-4 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mt-3"
                    >
                      {actionLoading === `send-${foundUser.uid}` ? <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />}
                      Wyślij zaproszenie
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- NOWE KOMPONENTY ---
function FriendsComparison({ friends, userProfile }: FriendsComparisonProps) {
  const [expanded, setExpanded] = useState(false)
  
  if (!friends || friends.length === 0) return null

  const sortedFriends = [...friends].sort((a, b) => (b.consistency || 0) - (a.consistency || 0))
  const userRank = sortedFriends.findIndex(f => f.uid === userProfile?.uid) + 1 || 1

  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden mb-8 lg:mb-12">
      <CardHeader className="pb-4 lg:pb-6">
        <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
            <Trophy className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          Ranking znajomych
        </CardTitle>
        <CardDescription className="text-base lg:text-lg mt-2">
          Porównaj swoje statystyki ze znajomymi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Twoja pozycja */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
              #{userRank}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Ty</h4>
              <p className="text-gray-600 text-sm">Konsystencja: {userProfile?.consistency || 0}%</p>
            </div>
          </div>
          <Crown className="h-6 w-6 text-yellow-500" />
        </div>

        {/* Top znajomych */}
        {sortedFriends.slice(0, expanded ? sortedFriends.length : 3).map((friend, index) => (
          <div key={friend.uid} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border-2 border-gray-200/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                #{index + 1}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{friend.displayName}</h4>
                <p className="text-gray-600 text-sm">Konsystencja: {friend.consistency || 0}%</p>
              </div>
            </div>
            {index === 0 && <Crown className="h-6 w-6 text-yellow-500" />}
          </div>
        ))}

        {sortedFriends.length > 3 && (
          <Button 
            variant="outline" 
            onClick={() => setExpanded(!expanded)}
            className="w-full border-gray-300 hover:border-blue-300 rounded-xl transition-all duration-300"
          >
            {expanded ? 'Pokaż mniej' : `Pokaż wszystkich ${sortedFriends.length} znajomych`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function QuickMessage({ friends, onSendMessage }: QuickMessageProps) {
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!selectedFriend || !message.trim()) return
    
    setSending(true)
    await onSendMessage(selectedFriend.uid, message)
    setMessage('')
    setSending(false)
  }

  if (!friends || friends.length === 0) return null

  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden mb-8 lg:mb-12">
      <CardHeader className="pb-4 lg:pb-6">
        <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
            <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          Szybka wiadomość
        </CardTitle>
        <CardDescription className="text-base lg:text-lg mt-2">
          Wyślij szybką wiadomość do znajomego
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={selectedFriend?.uid || ''}
            onChange={(e) => setSelectedFriend(friends.find(f => f.uid === e.target.value))}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200/60 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm"
          >
            <option value="">Wybierz znajomego</option>
            {friends.map(friend => (
              <option key={friend.uid} value={friend.uid}>
                {friend.displayName}
              </option>
            ))}
          </select>
        </div>
        
        {selectedFriend && (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Napisz wiadomość do ${selectedFriend.displayName}...`}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200/60 focus:border-blue-500/50 bg-white/80 backdrop-blur-sm resize-none"
            />
            <Button 
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl transition-all duration-300"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
              Wyślij wiadomość
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SuggestedFriends({ suggestions, onSendRequest, actionLoading }: SuggestedFriendsProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden mb-8 lg:mb-12">
      <CardHeader className="pb-4 lg:pb-6">
        <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          Sugerowani znajomi
        </CardTitle>
        <CardDescription className="text-base lg:text-lg mt-2">
          Osoby, które możesz znać
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {suggestions.map(suggestion => (
            <Card key={suggestion.uid} className="border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4 lg:p-6 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl lg:text-2xl shadow-lg mx-auto">
                    {suggestion.avatarUrl
                      ? <img src={suggestion.avatarUrl} alt={suggestion.displayName} className="w-full h-full object-cover rounded-2xl" />
                      : suggestion.displayName?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{suggestion.displayName}</h3>
                <p className="text-gray-600 text-sm mb-3">{suggestion.email}</p>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{suggestion.bio}</p>
                <Button
                  onClick={() => onSendRequest(suggestion.uid, suggestion.displayName)}
                  disabled={actionLoading === `send-${suggestion.uid}`}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl transition-all duration-300"
                  size="sm"
                >
                  {actionLoading === `send-${suggestion.uid}` ? 
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
                    <UserPlus className="h-4 w-4 mr-2" />
                  }
                  Dodaj
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InviteLinkHandler({ user }: InviteLinkHandlerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invite = searchParams.get('invite')
  const [inviteStatus, setInviteStatus] = useState<any>(null)
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null)

  useEffect(() => {
    if (invite && user) {
      friendsService.handleInviteClick(invite, user.uid).then(response => {
        setInviteStatus(response)
      })
    }
  }, [invite, user])

  const handleAccept = async () => {
    setAcceptLoading(true)
    const result = await friendsService.acceptInvite(invite!, user.uid, user.displayName || 'Użytkownik')
    setAcceptMessage(result.message)
    setAcceptLoading(false)
  }

  if (!invite) return null
  
  if (!inviteStatus) return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span>Sprawdzanie linku zaproszenia...</span>
        </div>
      </CardContent>
    </Card>
  )
  
  if (!inviteStatus.success) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Błąd linku zaproszenia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{inviteStatus.message}</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Zaproszenie od <span className="text-blue-700">{inviteStatus.creatorName}</span></CardTitle>
        <CardDescription>
          Dołącz do znajomych z użyciem specjalnego linku!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {acceptMessage && <div className="mb-3 text-green-600">{acceptMessage}</div>}
        <Button onClick={handleAccept} disabled={acceptLoading}>
          {acceptLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
          Dołącz do znajomych
        </Button>
      </CardContent>
    </Card>
  )
}

// --- Main FriendsPage ---
export default function FriendsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('friends')
  const [friends, setFriends] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [searchName, setSearchName] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([])

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const profile = await userService.getUserProfile(user.uid)
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // Load friends and requests
  const loadFriendsData = useCallback(async () => {
    if (!user) return
    
    try {
      const [friendsList, requestsList] = await Promise.all([
        friendsService.getFriends(user.uid),
        friendsService.getFriendRequests(user.uid)
      ])
      setFriends(friendsList || [])
      setRequests(requestsList || [])
    } catch (error) {
      console.error('Error loading friends data:', error)
      setFriends([])
      setRequests([])
    }
  }, [user])

  useEffect(() => {
    loadFriendsData()
  }, [loadFriendsData])

  // Load suggested friends
  const loadSuggestedFriends = useCallback(async () => {
    if (!user) return
    try {
      const suggestions = await friendsService.getSuggestedFriends(user.uid)
      setSuggestedFriends(suggestions || [])
    } catch (error) {
      console.error('Error loading suggested friends:', error)
      setSuggestedFriends([])
    }
  }, [user])

  useEffect(() => {
    loadSuggestedFriends()
  }, [loadSuggestedFriends])

  // Debounced search
  useEffect(() => {
    if (searchName.length < 2) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!user) return
      
      setSearchLoading(true)
      setSearchError(null)
      try {
        const results = await friendsService.searchUsers(searchName, user.uid)
        setSearchResults(results || [])
      } catch (error) {
        setSearchError('Błąd podczas wyszukiwania użytkowników')
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchName, user])

  // Friend actions
  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!user) return
    
    setActionLoading(`remove-${friendId}`)
    try {
      await friendsService.removeFriend(user.uid, friendId)
      await loadFriendsData()
      await loadSuggestedFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptRequest = async (requestId: string, friendName?: string) => {
    if (!user) return
    
    setActionLoading(`accept-${requestId}`)
    try {
      await friendsService.acceptFriendRequest(requestId, user.uid)
      await loadFriendsData()
      await loadSuggestedFriends()
    } catch (error) {
      console.error('Error accepting request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(`reject-${requestId}`)
    try {
      await friendsService.rejectFriendRequest(requestId)
      await loadFriendsData()
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendRequest = async (toUserId: string, toUserName: string) => {
    if (!user || !userProfile) return
    
    setActionLoading(`send-${toUserId}`)
    try {
      await friendsService.sendFriendRequest(user.uid, userProfile.displayName, toUserId)
      setSearchName('')
      setSearchResults([])
      await loadSuggestedFriends()
    } catch (error) {
      console.error('Error sending request:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendMessage = async (friendId: string, message: string) => {
    if (!user) return
    
    try {
      // Symulacja wysłania wiadomości - możesz zastąpić rzeczywistą implementacją
      console.log(`Wysyłanie wiadomości do ${friendId}: ${message}`)
      // await friendsService.sendMessage(user.uid, friendId, message)
      alert('Wiadomość wysłana! (funkcjonalność w budowie)')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleCopyDisplayName = () => {
    if (userProfile?.displayName) {
      navigator.clipboard.writeText(userProfile.displayName)
      alert('Nazwa użytkownika skopiowana!')
    }
  }

  const handleShareProfile = () => {
    if (userProfile?.displayName) {
      const shareText = `${userProfile.displayName} - Dołącz do mnie w aplikacji wellness!`
      navigator.clipboard.writeText(shareText)
      alert('Tekst udostępniania skopiowany!')
    }
  }

  const handleInviteLink = async () => {
    if (!userProfile) return
    
    setInviteLoading(true)
    setInviteError(null)
    try {
      const url = await friendsService.generateInviteLink(userProfile.uid, userProfile.displayName)
      setInviteLink(url)
      navigator.clipboard.writeText(url)
    } catch (error) {
      setInviteError('Błąd generowania linku zaproszenia')
      console.error('Error generating invite link:', error)
    } finally {
      setInviteLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Ładowanie...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 lg:py-12 px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Invite Link Handler */}
        {user && <InviteLinkHandler user={user} />}

        {/* Header */}
        <div className="text-center mb-8 lg:mb-16">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4 lg:mb-6">
            Znajomi
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
            Razem łatwiej dbać o dobre samopoczucie. Dołącz do społeczności i wspierajcie się nawzajem!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <StatCard
            icon={Users}
            value={friends.length}
            label="Znajomi"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCard
            icon={Mail}
            value={requests.length}
            label="Oczekujące zaproszenia"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCard
            icon={Trophy}
            value={userProfile?.consistency || 0}
            label="Twoja konsystencja"
            suffix="%"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <StatCard
            icon={Calendar}
            value={userProfile?.streak || 0}
            label="Obecny streak"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>

        {/* Ranking znajomych */}
        {friends.length > 0 && (
          <FriendsComparison 
            friends={friends} 
            userProfile={userProfile} 
          />
        )}

        {/* Szybka wiadomość */}
        {friends.length > 0 && (
          <QuickMessage 
            friends={friends} 
            onSendMessage={handleSendMessage} 
          />
        )}

        {/* Sugerowani znajomi */}
        <SuggestedFriends 
          suggestions={suggestedFriends}
          onSendRequest={handleSendRequest}
          actionLoading={actionLoading}
        />

        {/* Invite Link Section */}
        {userProfile && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden mb-8 lg:mb-12">
            <CardHeader className="pb-4 lg:pb-6">
              <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <Share2 className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                Dodaj znajomego przez link
              </CardTitle>
              <CardDescription className="text-base lg:text-lg mt-2">
                Wygeneruj swój unikalny link zaproszenia i udostępnij go znajomym.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleInviteLink} 
                disabled={inviteLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                Wygeneruj link zaproszenia
              </Button>
              {inviteLink && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200/60">
                  <p className="text-green-700 text-sm lg:text-base mb-2 font-medium">
                    ✓ Link został skopiowany do schowka!
                  </p>
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="bg-white/80 border-2 border-green-200/60 rounded-xl text-sm lg:text-base"
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                  />
                </div>
              )}
              {inviteError && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200/60 rounded-2xl text-red-700 text-base lg:text-lg flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden mb-8 lg:mb-12">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
              <TabButton
                active={activeTab === 'friends'}
                onClick={() => setActiveTab('friends')}
                icon={Users}
                label="Moi znajomi"
                mobileLabel="Znajomi"
                count={friends.length}
              />
              <TabButton
                active={activeTab === 'requests'}
                onClick={() => setActiveTab('requests')}
                icon={Mail}
                label="Zaproszenia"
                mobileLabel="Zaproszenia"
                count={requests.length}
              />
              <TabButton
                active={activeTab === 'search'}
                onClick={() => setActiveTab('search')}
                icon={Search}
                label="Znajdź znajomych"
                mobileLabel="Szukaj"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
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
            onCopyDisplayName={handleCopyDisplayName}
            onShareProfile={handleShareProfile}
          />
        )}
      </div>
    </div>
  )
}