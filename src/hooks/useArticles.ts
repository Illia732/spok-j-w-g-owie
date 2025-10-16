// src/hooks/useArticles.ts
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

export interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  readTime: number
  status: 'draft' | 'published'
  isFeatured: boolean
  isTrending: boolean
  views: number
  createdAt: Timestamp
  updatedAt: Timestamp
  imageUrl?: string
  authorId?: string
}

export function useArticles(userRole?: string, userId?: string) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        let articlesQuery
        const articlesRef = collection(db, 'articles')

        if (userRole === 'admin') {
          // Admin widzi wszystkie artykuły
          articlesQuery = query(articlesRef, orderBy('createdAt', 'desc'))
        } else {
          // User widzi tylko opublikowane
          articlesQuery = query(
            articlesRef, 
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc')
          )
        }

        const querySnapshot = await getDocs(articlesQuery)
        const articlesData: Article[] = []
        
        querySnapshot.forEach((doc) => {
          articlesData.push({
            id: doc.id,
            ...doc.data()
          } as Article)
        })

        setArticles(articlesData)
        setError(null)
      } catch (err) {
        console.error('Błąd ładowania artykułów:', err)
        setError('Nie udało się załadować artykułów')
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [userRole])

  const addArticle = async (articleData: any, imageFile?: File) => {
    try {
      let imageUrl = ''
      
      // Tutaj możesz dodać logikę uploadu obrazka jeśli potrzebna
      if (imageFile) {
        console.log('Upload obrazka:', imageFile.name)
        // imageUrl = await uploadImage(imageFile) - do implementacji
      }

      const newArticle = {
        ...articleData,
        views: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        imageUrl,
        authorId: userId
      }

      const docRef = await addDoc(collection(db, 'articles'), newArticle)
      return docRef.id
    } catch (err) {
      console.error('Błąd dodawania artykułu:', err)
      throw new Error('Nie udało się dodać artykułu')
    }
  }

  const updateArticle = async (
    articleId: string, 
    articleData: any, 
    imageFile?: File,
    originalImageUrl?: string
  ) => {
    try {
      let imageUrl = originalImageUrl
      
      if (imageFile) {
        console.log('Aktualizacja obrazka:', imageFile.name)
        // imageUrl = await uploadImage(imageFile) - do implementacji
      }

      const updatedData = {
        ...articleData,
        updatedAt: Timestamp.now(),
        imageUrl
      }

      await updateDoc(doc(db, 'articles', articleId), updatedData)
    } catch (err) {
      console.error('Błąd aktualizacji artykułu:', err)
      throw new Error('Nie udało się zaktualizować artykułu')
    }
  }

  const deleteArticle = async (articleId: string) => {
    try {
      await deleteDoc(doc(db, 'articles', articleId))
      setArticles(prev => prev.filter(article => article.id !== articleId))
    } catch (err) {
      console.error('Błąd usuwania artykułu:', err)
      throw new Error('Nie udało się usunąć artykułu')
    }
  }

  const getArticle = async (articleId: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'articles', articleId))
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Article
      }
      return null
    } catch (err) {
      console.error('Błąd pobierania artykułu:', err)
      throw new Error('Nie udało się pobrać artykułu')
    }
  }

  return {
    articles,
    loading,
    error,
    addArticle,
    updateArticle,
    deleteArticle,
    getArticle
  }
}