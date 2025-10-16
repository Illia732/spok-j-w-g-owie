// src/app/admin/articles/page.tsx
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useArticles } from '@/hooks/useArticles'; // ZMIENIŁEM NA useArticles
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArticleForm } from '@/components/Admin/ArticleForm';
import { ArticleList } from '@/components/articles/article-list';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function AdminArticlesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { articles, loading: articlesLoading } = useArticles('admin', user?.uid); // DODAŁEM HOOK

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/articles');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Ładowanie...</div>;
  }

  const handleArticleRead = (articleId: string) => {
    // Możesz dodać logikę śledzenia przeczytania artykułu
    console.log('Article read:', articleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Panel Administratora
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formularz dodawania */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <ArticleForm />
            </CardContent>
          </Card>

          {/* Lista artykułów - TERAZ Z POPRAWNYMI PROPSAMI */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <ArticleList 
                articles={articles}
                loading={articlesLoading}
                user={user ? {uid: user.uid, role: user.role || 'user'} : null}
                onArticleRead={handleArticleRead}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}