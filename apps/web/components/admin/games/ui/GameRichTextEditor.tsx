// apps/web/components/admin/games/ui/GameRichTextEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

type GameRichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  height?: number;
  placeholder?: string;
};

/**
 * Generic rich text editor for game editors (Hotspot, Matching, Drag-Drop, etc.)
 * 
 * Features:
 * - Uses onBlur to prevent focus loss during typing
 * - Updates content when switching between game items (hotspots, cards, etc.)
 * - Lightweight toolbar with essential formatting
 * 
 * Usage:
 * <GameRichTextEditor
 *   content={explanation}
 *   onChange={(html) => updateItem({ explanation: html })}
 *   height={120}
 *   placeholder="Explain why this is correct..."
 * />
 */
export default function GameRichTextEditor({ 
  content, 
  onChange, 
  height = 120,
  placeholder = 'Enter text...'
}: GameRichTextEditorProps) {
  const contentRef = useRef(content);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-3 focus:outline-none',
        style: `min-height: ${height}px; max-height: ${height * 2}px; overflow-y: auto;`,
      },
    },
    onUpdate: ({ editor }) => {
      // Store current content in ref but don't call onChange yet
      contentRef.current = editor.getHTML();
    },
    onBlur: ({ editor }) => {
      // Only call onChange when user leaves the editor
      const html = editor.getHTML();
      if (html !== content) {
        onChange(html);
      }
    },
  });

  // Update editor content when prop changes (important for switching between items!)
  useEffect(() => {
    if (editor && content !== contentRef.current) {
      editor.commands.setContent(content || '<p></p>');
      contentRef.current = content;
    }
  }, [content, editor]);

  // Return loading state if editor isn't ready
  if (!editor) {
    return (
      <div 
        className="border rounded-md p-2 flex items-center justify-center text-gray-500"
        style={{ minHeight: `${height}px` }}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex gap-2 flex-wrap bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('bold') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('italic') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('bulletList') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('orderedList') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          1. List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}