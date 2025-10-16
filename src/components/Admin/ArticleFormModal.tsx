// src/components/Admin/ArticleFormModal.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useArticles } from '@/hooks/useArticles'
import { Button } from '@/components/ui/button'
import { Upload, X, BookOpen } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
  'Stres', 'Lęki', 'Matura', 'Nauka', 'Relacje', 'Samopoczucie',
  'Sen', 'Motywacja', 'Prokrastynacja', 'Wsparcie'
]

interface ArticleFormModalProps {
  isOpen: boolean
  onClose: () => void
  uid: string
}

export function ArticleFormModal({ isOpen, onClose, uid }: ArticleFormModalProps) {
  const { addArticle } = useArticles('admin', uid)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Stres',
    tags: '',
    readTime: 5,
    status: 'draft' as 'draft' | 'published',
    isFeatured: false,
    isTrending: false,
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: 'Stres',
        tags: '',
        readTime: 5,
        status: 'draft',
        isFeatured: false,
        isTrending: false,
      })
      setImagePreview(null)
      setImageFile(null)
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await addArticle(formData, imageFile || undefined)
      alert('✅ Artykuł został dodany!')
      onClose()
    } catch (err) {
      console.error(err)
      alert('❌ Błąd: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Dodaj nowy artykuł
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tytuł */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tytuł artykułu *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Kategoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Opis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Krótki opis *
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                required
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Treść – PROFESJONALNY EDYTOR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treść artykułu
              </label>
              <ReactQuill
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image', 'blockquote', 'code-block'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                  ]
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet', 'ordered',
                  'link', 'image', 'blockquote', 'code-block',
                  'color', 'background'
                ]}
                className="h-96 mb-4"
              />
            </div>

            {/* Obrazek okładki */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Okładka artykułu (opcjonalnie)
              </label>
              {imagePreview ? (
                <div className="relative inline-block mt-2">
                  <img src={imagePreview} alt="Podgląd" className="w-full max-w-xs h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer mt-2"
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

            {/* Opcje */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Czas czytania (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="draft">Szkic</option>
                  <option value="published">Opublikowany</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                  Wyróżniony
                </label>
              </div>
            </div>

            {/* Przyciski */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Dodaj artykuł'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}