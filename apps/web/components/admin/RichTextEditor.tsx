// apps/web/components/admin/FroalaEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Froala Editor to avoid SSR issues
const FroalaEditorComponent = dynamic(
  async () => {
    const values = await Promise.all([
      import('react-froala-wysiwyg'),
      import('froala-editor/js/plugins/align.min'),
      import('froala-editor/js/plugins/lists.min'),
      import('froala-editor/js/plugins/colors.min'),
      import('froala-editor/js/plugins/font_size.min'),
      import('froala-editor/js/plugins/link.min'),
      import('froala-editor/js/plugins/image.min')
    ]);
    return values[0];
  },
  {
    loading: () => (
      <div className="border rounded-md p-4 min-h-[200px] bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    ),
    ssr: false
  }
);

// Import Froala Editor CSS in the component
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';

type FroalaEditorProps = {
  initialContent?: string;
  onChange: (content: string) => void;
  height?: number;
};

export default function FroalaEditor({
  initialContent = '',
  onChange,
  height = 200
}: FroalaEditorProps) {
  const [model, setModel] = useState(initialContent);
  const [isMounted, setIsMounted] = useState(false);
  
  // Component did mount
  useEffect(() => {
    setIsMounted(true);
    setModel(initialContent);
  }, [initialContent]);
  
  // Handle model change
  const handleModelChange = (content: string) => {
    setModel(content);
    onChange(content);
  };
  
  // Froala Editor configuration
  const config = {
    placeholderText: 'Enter your content here...',
    charCounterCount: true,
    toolbarButtons: [
      'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|',
      'fontSize', 'color', '|',
      'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', '|',
      'insertLink', 'insertImage', 'insertTable', '|',
      'specialCharacters', 'insertHR', 'clearFormatting', '|',
      'html', 'undo', 'redo'
    ],
    height: height,
    attribution: false  // This removes the "Powered by Froala" text if you have a license
  };
  
  if (!isMounted) {
    return (
      <div className="border rounded-md p-4 min-h-[200px] bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }
  
  return (
    <div>
      <FroalaEditorComponent
        model={model}
        onModelChange={handleModelChange}
        config={config}
      />
    </div>
  );
}