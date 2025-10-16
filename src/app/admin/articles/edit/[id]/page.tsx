// src/app/admin/articles/edit/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useArticles } from '@/hooks/useArticles'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import Header from '@/components/layout/header'

const CATEGORIES = [
  'Stres', 'Lęki', 'Matura', 'Nauka', 'Relacje', 'Samopoczucie',
  'Sen', 'Motywacja', 'Prokrastynacja', 'Wsparcie'
]

export default function EditArticlePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { articles, updateArticle } = useArticles('admin', user?.uid)

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Stres')
  const [readTime, setReadTime] = useState(5)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>(undefined)

  // Załaduj artykuł
  useEffect(() => {
    if (!id || typeof id !== 'string') return
    const article = articles.find(a => a.id === id)
    if (article) {
      setTitle(article.title)
      setExcerpt(article.excerpt)
      setContent(article.content)
      setCategory(article.category)
      setReadTime(article.readTime)
      setStatus(article.status)
      setIsFeatured(article.isFeatured)
      setOriginalImageUrl(article.imageUrl)
      if (article.imageUrl) {
        setCoverPreview(article.imageUrl)
      }
    }
  }, [id, articles])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || typeof id !== 'string' || !user) return

    setIsSubmitting(true)
    try {
      await updateArticle(
        id,
        {
          title,
          excerpt,
          content,
          category,
          readTime,
          status,
          isFeatured,
        },
        coverImage || undefined,
        originalImageUrl
      )
      alert('✅ Artykuł został zaktualizowany!')
      router.push('/admin/articles')
    } catch (err) {
      alert('❌ Błąd: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet', 'ordered',
    'blockquote', 'code-block',
    'link', 'image',
    'color', 'background'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anuluj
        </Button>
        <h1 className="text-lg font-medium">Edytuj artykuł</h1>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </Button>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold outline-none"
              placeholder="Tytuł artykułu"
            />
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full text-lg text-gray-600 outline-none"
              rows={2}
              placeholder="Krótki opis artykułu"
            />
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactQuill
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                className="h-[600px]"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Okładka artykułu
              </label>
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Podgląd okładki"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              ) : (
                <div className="text-gray-400">Brak okładki</div>
              )}
              <div
                onClick={() => document.getElementById('cover-input')?.click()}
                className="mt-2 text-sm text-blue-600 cursor-pointer"
              >
                Zmień zdjęcie
              </div>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Czas czytania (min)
              </label>
              <input
                type="number"
                min="1"
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="draft">Szkic</option>
                <option value="published">Opublikowany</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="featured" className="text-sm text-gray-700">
                Wyróżniony
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}