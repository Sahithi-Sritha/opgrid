import React, { useState } from 'react';
import { Code2, File as FileIcon, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface LatexEditorProps {
  latexContent: string;
  pdfUrl: string | null;
  onContentChange: (newContent: string) => void;
}

export default function LatexEditor({ latexContent, pdfUrl, onContentChange }: LatexEditorProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Tabs */}
      <div className="flex items-center p-2 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800/60 w-full max-w-[240px]">
          <button
            onClick={() => setActiveTab('code')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
              activeTab === 'code' 
                ? "bg-slate-800 text-slate-200 shadow-sm" 
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            )}
          >
            <Code2 size={14} />
            Raw LaTeX
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
              activeTab === 'preview' 
                ? "bg-indigo-500 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            )}
          >
            <FileIcon size={14} />
            PDF Preview
          </button>
        </div>
        
        {activeTab === 'preview' && pdfUrl && (
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noreferrer"
            className="ml-auto p-2 text-slate-400 hover:text-indigo-400 transition-colors"
            title="Open PDF in new tab"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'code' ? (
          <div className="h-full w-full flex">
            <textarea
              value={latexContent}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-1 h-full bg-transparent text-slate-300 p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none custom-scrollbar"
              spellCheck={false}
              placeholder="% LaTeX source goes here..."
            />
          </div>
        ) : (
          <div className="h-full w-full bg-slate-950 flex items-center justify-center">
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-none"
                title="Resume PDF Preview"
              />
            ) : (
              <div className="text-center text-slate-500 flex flex-col items-center gap-3">
                <FileIcon size={48} className="opacity-20" />
                <p>No PDF available.<br/>Compile the LaTeX to preview.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
