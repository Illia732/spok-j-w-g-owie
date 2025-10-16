// src/components/friends/RealFirebaseSearch.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, Users, X, Sparkles, Loader2 } from 'lucide-react'
import { firebaseSearchService, type SearchableUser } from '@/lib/firebase-search-service'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function RealFirebaseSearch() {
  const { user: authUser } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchableUser[]>([])
  const [allUsers, setAllUsers] = useState<SearchableUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchMethod, setSearchMethod] = useState<'firebase' | 'client'>('firebase')
  const inputRef = useRef<HTMLInputElement>(null)

  // Załaduj wszystkich użytkowników przy starcie
  useEffect(() => {
    if (authUser?.uid) {
      loadAllUsers()
    }
  }, [authUser?.uid])

  const loadAllUsers = async () => {
    if (!authUser?.uid) return
    const users = await firebaseSearchService.getAllUsers(authUser.uid)
    setAllUsers(users)
  }

  const handleSearch = async (searchQuery: string) => {
    if (!authUser?.uid) return
    
    setQuery(searchQuery)
    
    if (searchQuery.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setIsLoading(true)

    try {
      let searchResults: SearchableUser[] = []
      
      if (searchMethod === 'firebase') {
        // Prawdziwe wyszukiwanie Firebase
        searchResults = await firebaseSearchService.searchUsers(searchQuery, authUser.uid)
      } else {
        // Wyszukiwanie po stronie klienta (fallback)
        searchResults = allUsers.filter(user =>
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10)
      }
      
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      // Fallback do wyszukiwania po stronie klienta
      const clientResults = allUsers.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
      setResults(clientResults)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = async (friendId: string) => {
    if (!authUser?.uid) return
    
    try {
      // Tutaj dodaj logikę dodawania znajomego do Firestore
      console.log('Dodaję znajomego:', friendId)
      
      // Tymczasowo usuń z wyników
      setResults(prev => prev.filter(user => user.uid !== friendId))
      
      // Pokazuj sukces
      setTimeout(() => {
        console.log('✅ Znajomy dodany pomyślnie!')
      }, 500)
      
    } catch (error) {
      console.error('Error adding friend:', error)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsSearching(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-6">
      {/* Tryb wyszukiwania */}
      <div className="flex gap-2">
        <Button
          variant={searchMethod === 'firebase' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSearchMethod('firebase')}
          className="text-xs"
        >
          🔥 Firebase Search
        </Button>
        <Button
          variant={searchMethod === 'client' ? 'primary' : 'outline'} 
          size="sm"
          onClick={() => setSearchMethod('client')}
          className="text-xs"
        >
          💻 Client Search
        </Button>
      </div>

      {/* Wyszukiwarka */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            searchMethod === 'firebase' 
              ? "Wyszukaj w Firebase po imieniu, nazwisku, email..."
              : "Wyszukaj lokalnie po imieniu, nazwisku, email..."
          }
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-xl border-slate-300 focus:border-blue-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status wyszukiwania */}
      {isSearching && (
        <div className="text-sm text-slate-600 flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wyszukiwanie w {searchMethod === 'firebase' ? 'Firebase...' : 'lokalnej bazie...'}
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Znaleziono {results.length} wyników
            </>
          )}
        </div>
      )}

      {/* Wyniki wyszukiwania */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  Wyniki wyszukiwania
                  <span className="text-sm font-normal text-slate-500">
                    ({searchMethod === 'firebase' ? 'Firebase' : 'Lokalne'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.length > 0 ? (
                  results.map((user) => (
                    <UserResult 
                      key={user.uid} 
                      user={user} 
                      onAddFriend={handleAddFriend}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wyszukiwanie...
                      </div>
                    ) : query.length >= 2 ? (
                      <div>Nie znaleziono użytkowników</div>
                    ) : (
                      <div>Wpisz co najmniej 2 znaki</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wszyscy użytkownicy (jeśli nie wyszukujemy) */}
      {!isSearching && allUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Wszyscy użytkownicy ({allUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allUsers.slice(0, 5).map((user) => (
              <UserResult 
                key={user.uid} 
                user={user} 
                onAddFriend={handleAddFriend}
              />
            ))}
            {allUsers.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Pokaż więcej ({allUsers.length - 5})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Komponent pojedynczego użytkownika
function UserResult({ user, onAddFriend }: { user: SearchableUser, onAddFriend: (id: string) => void }) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)
    await onAddFriend(user.uid)
    setIsAdding(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
          {user.firstName?.[0] || user.displayName?.[0] || 'U'}
        </div>
        <div>
          <div className="font-semibold text-slate-800">
            {user.displayName}
          </div>
          <div className="text-sm text-slate-600">
            {user.email}
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Poziom {user.level}
            </span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              Streak {user.streak} dni
            </span>
            {user.currentMood && (
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                user.currentMood > 70 ? "bg-green-100 text-green-700" :
                user.currentMood > 40 ? "bg-blue-100 text-blue-700" :
                "bg-red-100 text-red-700"
              )}>
                Nastrój {user.currentMood}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      <Button
        onClick={handleAdd}
        disabled={isAdding}
        size="sm"
        className="bg-green-500 hover:bg-green-600"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-1" />
            Dodaj
          </>
        )}
      </Button>
    </motion.div>
  )
}