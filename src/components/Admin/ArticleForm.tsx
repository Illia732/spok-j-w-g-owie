// src/components/Admin/ArticleForm.tsx
'use client'

import { useState, useRef } from 'react'
import { useArticles } from '@/hooks/useArticles'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Image as ImageIcon, Upload, X } from 'lucide-react'

const CATEGORIES = [
  'Stres', 'Lęki', 'Matura', 'Nauka', 'Relacje', 'Samopoczucie',
  'Sen', 'Motywacja', 'Prokrastynacja', 'Wsparcie'
]

export function ArticleForm() {
  const { user } = useAuth()
  const { addArticle } = useArticles('admin')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Stres',
    tags: '',
    readTime: 5,
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Wybierz plik obrazu (jpg, png, itp.)')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      await addArticle(
        {
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          readTime: Number(formData.readTime),
          status: 'draft',
          isFeatured: false,
          isTrending: false,
          authorId: user.uid
        },
        imageFile || undefined
      )
      alert('✅ Artykuł został dodany!')
      // Reset formularza
      setFormData({ title: '', excerpt: '', content: '', category: 'Stres', tags: '', readTime: 5 })
      removeImage()
    } catch (err) {
      console.error(err)
      alert('❌ Błąd: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tytuł */}
      <Input
        placeholder="Tytuł artykułu"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      {/* Obrazek */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Okładka artykułu (opcjonalnie)
        </label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Podgląd okładki"
              className="w-full max-w-xs h-32 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Kliknij, aby dodać zdjęcie</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Opis */}
      <Textarea
        placeholder="Krótki opis"
        value={formData.excerpt}
        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
        required
        rows={2}
      />

      {/* Treść */}
      <Textarea
        placeholder="Treść artykułu"
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        required
        rows={10}
      />

      {/* Kategoria */}
      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        className="w-full p-3 border rounded"
      >
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Tagi */}
      <Input
        placeholder="Tagi (oddzielone przecinkami)"
        value={formData.tags}
        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
      />

      {/* Czas czytania */}
      <Input
        type="number"
        min="1"
        max="30"
        placeholder="Czas czytania (minuty)"
        value={formData.readTime}
        onChange={(e) => setFormData({ ...formData, readTime: Number(e.target.value) })}
      />

      {/* Przycisk */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Zapisywanie...' : 'Dodaj artykuł'}
      </Button>
    </form>
  )
}