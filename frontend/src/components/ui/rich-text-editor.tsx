import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your content here...",
  className,
  error,
  disabled = false,
  minHeight = "200px"
}) => {
  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link'
  ];

  return (
    <div className={cn('rich-text-editor', className)}>
      <div 
        className={cn(
          'border rounded-md overflow-hidden transition-colors duration-200',
          error ? 'border-red-500' : 'border-gray-300',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          style={{
            minHeight: minHeight,
          }}
        />
      </div>
      {error && (
        <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
      )}
      
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px 12px;
          background-color: #f9fafb;
        }
        
        .rich-text-editor .ql-container {
          border: none;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .rich-text-editor .ql-editor {
          padding: 12px;
          min-height: ${minHeight};
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .rich-text-editor .ql-toolbar .ql-formats {
          margin-right: 15px;
        }
        
        .rich-text-editor .ql-toolbar button {
          padding: 4px 6px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .rich-text-editor .ql-toolbar button:hover {
          background-color: #e5e7eb;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active {
          background-color: #10b981;
          color: white;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker {
          color: #374151;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-options {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .rich-text-editor .ql-editor h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .rich-text-editor .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .rich-text-editor .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .rich-text-editor .ql-editor ul, 
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-text-editor .ql-editor code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
        }
        
        .rich-text-editor .ql-editor pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        @media (max-width: 768px) {
          .rich-text-editor .ql-toolbar {
            padding: 6px 8px;
          }
          
          .rich-text-editor .ql-toolbar .ql-formats {
            margin-right: 8px;
          }
          
          .rich-text-editor .ql-toolbar button {
            padding: 3px 4px;
          }
          
          .rich-text-editor .ql-container {
            font-size: 13px;
          }
          
          .rich-text-editor .ql-editor {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};
