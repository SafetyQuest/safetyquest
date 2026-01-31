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
        className="border border-border rounded-lg p-3 flex items-center justify-center text-text-muted bg-surface"
        style={{ minHeight: `${height}px` }}
      >
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border bg-surface p-2 flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            editor.isActive('bold') 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-white text-text-primary hover:bg-surface border border-border hover:border-primary-light'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            editor.isActive('italic') 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-white text-text-primary hover:bg-surface border border-border hover:border-primary-light'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            editor.isActive('bulletList') 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-white text-text-primary hover:bg-surface border border-border hover:border-primary-light'
          }`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Bullets
          </span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            editor.isActive('orderedList') 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-white text-text-primary hover:bg-surface border border-border hover:border-primary-light'
          }`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Numbers
          </span>
        </button>
      </div>
      <div className="min-h-[60px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}