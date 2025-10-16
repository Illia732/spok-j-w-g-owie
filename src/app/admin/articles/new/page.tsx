// src/app/admin/articles/new/page.tsx - CLEAN WERSJA
'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useArticles } from '@/hooks/useArticles'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Eye, 
  Clock, 
  Tag,
  Sparkles,
  Type,
  Settings,
  Check,
  Upload,
  X,
  BookOpen,
  Users,
  Smartphone,
  Tablet,
  Monitor,
  Play,
  Share2
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/header'

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Ładowanie edytora...</p>
      </div>
    </div>
  )
})

const CATEGORIES = [
  'Stres', 'Lęki', 'Matura', 'Nauka', 'Relacje', 'Samopoczucie',
  'Sen', 'Motywacja', 'Prokrastynacja', 'Wsparcie'
]

const TAGS = [
  'mindfulness', 'edukacja', 'psychologia', 'nastolatek', 'rodzice',
  'szkoła', 'emocje', 'relaks', 'koncentracja', 'rozwoj-osobisty'
]

export default function NewArticlePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { addArticle } = useArticles('admin', user?.uid)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Stres',
    tags: [] as string[],
    readTime: 5,
    status: 'draft' as 'draft' | 'published',
    isFeatured: false,
    isTrending: false,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contentScore, setContentScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate content quality score
  useEffect(() => {
    let score = 0
    if (formData.title.length > 10) score += 25
    if (formData.excerpt.length > 50) score += 25
    if (wordCount > 300) score += 30
    if (coverPreview) score += 10
    if (selectedTags.length >= 2) score += 10
    setContentScore(Math.min(score, 100))
  }, [formData, wordCount, coverPreview, selectedTags])

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
    },
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
  ]

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
    
    const text = content.replace(/<[^>]*>/g, '')
    setWordCount(text.split(/\s+/).filter(word => word.length > 0).length)
    setCharCount(text.length)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Plik jest zbyt duży. Maksymalny rozmiar to 5MB.')
        return
      }
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const removeCover = () => {
    setCoverImage(null)
    setCoverPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const calculateReadTime = () => {
    const words = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim()) return

    setIsSubmitting(true)
    try {
      const finalData = {
        ...formData,
        tags: selectedTags,
        readTime: calculateReadTime()
      }

      await addArticle(finalData, coverImage || undefined)
      
      setTimeout(() => {
        router.push('/admin/articles')
      }, 1500)
      
    } catch (err) {
      console.error('Błąd zapisu:', err)
      alert('❌ Błąd: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPreviewWidth = () => {
    switch (previewDevice) {
      case 'mobile': return 'max-w-sm'
      case 'tablet': return 'max-w-2xl'
      case 'desktop': return 'max-w-4xl'
      default: return 'max-w-4xl'
    }
  }

  const simulateReading = () => {
    setIsPlaying(true)
    setTimeout(() => setIsPlaying(false), calculateReadTime() * 60 * 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Header />

      {/* Clean Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Wróć</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Nowy Artykuł</h1>
                  <p className="text-sm text-gray-600">Twórz inspirujące treści</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Content Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {calculateReadTime()} min
                </div>
                <div className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {wordCount} słów
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        contentScore >= 80 ? 'bg-green-500' : 
                        contentScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${contentScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {contentScore}%
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title.trim()}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publikowanie...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{formData.status === 'published' ? 'Opublikuj' : 'Zapisz szkic'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clean Navigation */}
          <div className="flex gap-1 mt-6">
            {[
              { id: 'edit', label: 'Edytuj', icon: Type },
              { id: 'preview', label: 'Podgląd', icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Main Content Area */}
            <div className="xl:col-span-3">
              <AnimatePresence mode="wait">
                {activeTab === 'edit' && (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Title Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200/60">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Tytuł Artykułu
                        </label>
                        <div className="text-sm text-gray-500">
                          {charCount} znaków
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Wpisz chwytliwy tytuł, który przyciągnie uwagę..."
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full text-4xl font-bold bg-transparent outline-none placeholder:text-gray-400 resize-none"
                        style={{ minHeight: '60px' }}
                      />
                    </div>

                    {/* Excerpt Section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-900">
                          Krótki Opis
                        </label>
                        <div className="text-sm text-gray-500">
                          {formData.excerpt.length} znaków
                        </div>
                      </div>
                      <textarea
                        placeholder="Napisz krótki, zachęcający opis artykułu..."
                        value={formData.excerpt}
                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                        rows={3}
                        className="w-full text-lg text-gray-700 bg-transparent outline-none placeholder:text-gray-400 resize-none"
                      />
                    </div>

                    {/* Rich Text Editor */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                      <div className="border-b border-gray-200/60 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Treść Artykułu</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{wordCount} słów</span>
                            <span>•</span>
                            <span>{calculateReadTime()} min czytania</span>
                          </div>
                        </div>
                      </div>
                      <ReactQuill
                        value={formData.content}
                        onChange={handleContentChange}
                        modules={modules}
                        formats={formats}
                        className="h-[600px] [&_.ql-editor]:text-lg [&_.ql-editor]:leading-relaxed [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-10 [&_.ql-toolbar]:bg-white"
                        placeholder="Zacznij pisać swoją inspirującą treść..."
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'preview' && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Preview Controls */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Podgląd Artykułu</h3>
                        <div className="flex items-center gap-2">
                          {/* Device Selector */}
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            {[
                              { device: 'mobile', icon: Smartphone },
                              { device: 'tablet', icon: Tablet },
                              { device: 'desktop', icon: Monitor }
                            ].map(({ device, icon: Icon }) => (
                              <button
                                key={device}
                                onClick={() => setPreviewDevice(device as any)}
                                className={`p-2 rounded-md transition-all ${
                                  previewDevice === device
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            ))}
                          </div>

                          {/* Preview Actions */}
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={simulateReading}
                              disabled={isPlaying}
                              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                            >
                              <Play className="h-4 w-4" />
                              {isPlaying ? 'Czytanie...' : 'Symuluj czytanie'}
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
                              <Share2 className="h-4 w-4" />
                              Udostępnij podgląd
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actual Preview */}
                    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden mx-auto ${getPreviewWidth()} transition-all duration-300`}>
                      {/* Preview Header */}
                      <div className="border-b border-gray-200/60 p-6">
                        {coverPreview && (
                          <img
                            src={coverPreview}
                            alt="Okładka artykułu"
                            className="w-full h-48 object-cover rounded-xl mb-4"
                          />
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {formData.category}
                          </span>
                          <span>•</span>
                          <span>{calculateReadTime()} min czytania</span>
                          {formData.isFeatured && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                Wyróżniony
                              </span>
                            </>
                          )}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                          {formData.title || "Przykładowy tytuł artykułu"}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                          {formData.excerpt || "To jest przykładowy opis artykułu, który pojawi się w podglądzie."}
                        </p>
                      </div>

                      {/* Preview Content */}
                      <div className="p-6">
                        <div 
                          className="prose prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: formData.content || 
                            `<p class="text-gray-500 italic">Treść artykułu pojawi się tutaj. Zacznij pisać w zakładce "Edytuj".</p>`
                          }}
                        />
                        
                        {/* Tags Preview */}
                        {selectedTags.length > 0 && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">Tagi:</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedTags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Author & Date */}
                        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                          <p>Artykuł utworzony przez {user?.displayName || 'Administratora'}</p>
                          <p>Opublikowano {new Date().toLocaleDateString('pl-PL')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Stats */}
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white text-center">
                      <h4 className="font-semibold mb-3">Statystyki Podglądu</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{calculateReadTime()}</div>
                          <div className="text-blue-100 text-sm">minut czytania</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{wordCount}</div>
                          <div className="text-blue-100 text-sm">słów</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {Math.round((wordCount / 200) * 100)}%
                          </div>
                          <div className="text-blue-100 text-sm">zaangażowania</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clean Sidebar */}
            <div className="space-y-6">
              
              {/* Cover Image */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  Okładka Artykułu
                </h3>
                
                <AnimatePresence>
                  {coverPreview ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={coverPreview}
                        alt="Podgląd okładki"
                        className="w-full h-48 object-cover rounded-xl shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button
                          onClick={removeCover}
                          className="p-2 bg-red-500 text-white rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors group bg-gradient-to-br from-gray-50 to-blue-50/30"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Dodaj zdjęcie okładki
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG • Max 5MB
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </div>

              {/* Publishing Settings */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60 space-y-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  Ustawienia
                </h3>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-600" />
                    Tagi
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedTags.includes(tag) && <Check className="h-3 w-3 inline mr-1" />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'draft', label: 'Szkic', color: 'bg-amber-100 text-amber-700' },
                      { value: 'published', label: 'Opublikuj', color: 'bg-green-100 text-green-700' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: option.value as any }))}
                        className={`p-3 rounded-xl text-center font-medium transition-all duration-200 ${
                          formData.status === option.value
                            ? `${option.color} ring-2 ring-current ring-opacity-20`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature Toggle */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Wyróżniony
                    </div>
                    <div className="text-sm text-gray-600">Pokazuj na głównej</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Content Quality */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-4">Jakość Treści</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Ogólna ocena</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-blue-500 rounded-full h-2">
                        <div 
                          className="h-2 bg-white rounded-full transition-all duration-1000"
                          style={{ width: `${contentScore}%` }}
                        />
                      </div>
                      <span className="font-semibold">{contentScore}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-2xl font-bold">{wordCount}</div>
                      <div className="text-blue-100 text-xs">SŁOWA</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-2xl font-bold">{calculateReadTime()}</div>
                      <div className="text-blue-100 text-xs">MINUTY</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}