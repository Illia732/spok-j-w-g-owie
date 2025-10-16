// src/components/Admin/ArticleForm.jsx
import { useState } from 'react';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/components/providers/auth-provider';

export const ArticleForm = () => {
  const { user } = useAuth();
  const { addArticle } = useArticles('admin', user?.uid);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Stres',
    tags: '',
    readTime: 5,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addArticle({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        readTime: Number(formData.readTime),
      });
      alert('✅ Artykuł został dodany!');
      setFormData({ title: '', excerpt: '', content: '', category: 'Stres', tags: '', readTime: 5 });
    } catch (err) {
      alert('❌ Błąd: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Tytuł"
        required
        className="w-full p-3 border rounded"
      />
      <textarea
        value={formData.excerpt}
        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
        placeholder="Opis"
        required
        className="w-full p-3 border rounded"
        rows="3"
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="Treść artykułu"
        required
        className="w-full p-3 border rounded"
        rows="10"
      />
      {/* reszta pól... */}
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
      >
        Dodaj artykuł
      </button>
    </form>
  );
};