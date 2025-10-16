// src/components/Admin/RichTextEditor.tsx
'use client'

import { useState, forwardRef } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Dodaj moduł tabel (Quill nie ma go domyślnie)
const Table = Quill.import('formats/table')
const TableRow = Quill.import('formats/table-row')
const TableCell = Quill.import('formats/table-cell')

Quill.register({ 'formats/table': Table })
Quill.register({ 'formats/table-row': TableRow })
Quill.register({ 'formats/table-cell': TableCell })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(({ value, onChange }, ref) => {
  const [editorRef, setEditorRef] = useState<ReactQuill | null>(null)

  const insertTable = () => {
    if (!editorRef) return
    const editor = editorRef.getEditor()
    const range = editor.getSelection()
    if (!range) return

    // Wstaw prostą tabelę 2x2 jako HTML
    const tableHTML = `
      <table class="table-auto w-full border-collapse">
        <tbody>
          <tr><td class="border p-2">Komórka 1</td><td class="border p-2">Komórka 2</td></tr>
          <tr><td class="border p-2">Komórka 3</td><td class="border p-2">Komórka 4</td></tr>
        </tbody>
      </table>
    `
    editor.clipboard.dangerouslyPasteHTML(range.index, tableHTML)
  }

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image', 'blockquote', 'code-block'],
        [{ 'color': [] }, { 'background': [] }],
        ['clean'],
        ['table'] // niestandardowy przycisk
      ],
      handlers: {
        table: insertTable
      }
    }
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'ordered',
    'link', 'image', 'blockquote', 'code-block',
    'color', 'background',
    'table'
  ]

  return (
    <div ref={ref}>
      <ReactQuill
        ref={setEditorRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="h-96"
      />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor'
export default RichTextEditor