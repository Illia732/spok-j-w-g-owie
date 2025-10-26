// src/hooks/useUser.ts - OSOBNY HOOK
import { useState, useEffect } from 'react'

export const useUser = () => {
  const [user, setUser] = useState(null)
  const [readArticles, setReadArticles] = useState(new Set())

  useEffect(() => {
    // W przyszłości: pobieranie z localStorage/API
    const savedUser = localStorage.getItem('user')
    const savedReadArticles = localStorage.getItem('readArticles')
    
    if (savedUser) setUser(JSON.parse(savedUser))
    if (savedReadArticles) setReadArticles(new Set(JSON.parse(savedReadArticles)))
  }, [])

  const addPoints = (points: number) => {
    setUser((prev: any) => {
      const updatedUser = { 
        ...prev, 
        points: (prev?.points || 0) + points 
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return updatedUser
    })
  }

  const markArticleAsRead = (articleId: string) => {
    setReadArticles(prev => {
      const updated = new Set([...prev, articleId])
      localStorage.setItem('readArticles', JSON.stringify([...updated]))
      return updated
    })
  }

  const canReadArticle = (articleId: string) => !readArticles.has(articleId)

  const readArticle = (articleId: string) => {
    if (canReadArticle(articleId)) {
      markArticleAsRead(articleId)
      addPoints(10)
      return true
    }
    return false
  }

  return {
    user,
    readArticles,
    addPoints,
    readArticle,
    canReadArticle,
    isAdmin: user?.role === 'admin'
  }
}