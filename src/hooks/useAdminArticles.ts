// src/hooks/useAdminArticles.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
} from 'firebase/firestore';

export type Article = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  views: number;
  likes: number;
  isFeatured: boolean;
  isTrending: boolean;
  category: string;
  tags: string[];
  readTime: number;
};

export const useAdminArticles = (adminUid: string) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Nasłuchiwanie zmian w artykułach
  useEffect(() => {
    const q = query(collection(db, 'articles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Article[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        } as Article);
      });
      setArticles(list);
      setLoading(false);
    }, (error) => {
      console.error('Błąd ładowania artykułów:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dodawanie artykułu
  const addArticle = async (data: Omit<Article, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      const docRef = await addDoc(collection(db, 'articles'), {
        ...data,
        createdBy: adminUid,
        createdAt: Timestamp.now(),
        views: 0,
        likes: 0,
        isFeatured: false,
        isTrending: false,
      });
      return docRef.id;
    } catch (err) {
      console.error('Błąd dodawania artykułu:', err);
      throw err;
    }
  };

  // Aktualizacja artykułu
  const updateArticle = async (id: string, data: Partial<Article>) => {
    try {
      await updateDoc(doc(db, 'articles', id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Błąd aktualizacji artykułu:', err);
      throw err;
    }
  };

  // Usuwanie artykułu
  const deleteArticle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
    } catch (err) {
      console.error('Błąd usuwania artykułu:', err);
      throw err;
    }
  };

  return {
    articles,
    loading,
    addArticle,
    updateArticle,
    deleteArticle,
  };
};