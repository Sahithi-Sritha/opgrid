import React from 'react';
import { ResumeVersion } from '../types';
import { Upload, FileText, Download, Clock, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface ResumeSidebarProps {
  versions: ResumeVersion[];
  activeVersionId: string | null;
  onSelectVersion: (id: string) => void;
  onUpload: (file: File) => void;
}

export default function ResumeSidebar({
  versions,
  activeVersionId,
  onSelectVersion,
  onUpload,
}: ResumeSidebarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  // Build a simple tree view. In a production app, this would be a recursive component.
  // For UI sake, we will just indent versions that have a base_version_id.
  
  return (
    <div className="flex flex-col h-full bg-slate-950/50 backdrop-blur-md border-r border-slate-800 text-slate-200">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-sm tracking-wide uppercase text-slate-400">Versions</h2>
        <label className="cursor-pointer group">
          <input 
            type="file" 
            accept=".tex,.pdf" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 flex items-center gap-1.5 text-xs font-medium">
            <Upload size={14} />
            <span>Upload</span>
          </div>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {versions.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">
            No resumes found.<br/>Upload one to start.
          </div>
        ) : (
          versions.map((version) => {
            const isActive = activeVersionId === version.id;
            const isChild = !!version.base_version_id;
            
            return (
              <div
                key={version.id}
                onClick={() => onSelectVersion(version.id)}
                className={clsx(
                  "relative group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                  isActive 
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "bg-slate-900/40 border-transparent hover:bg-slate-800/60 hover:border-slate-700 text-slate-400",
                  isChild ? "ml-6" : ""
                )}
              >
                {isChild && (
                  <div className="absolute -left-5 top-1/2 -translate-y-1/2 text-slate-700">
                    <GitBranch size={16} />
                  </div>
                )}
                
                <div className={clsx(
                  "p-2 rounded-md",
                  isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"
                )}>
                  <FileText size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-slate-200 transition-colors">
                    {version.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 uppercase tracking-wider">
                    <Clock size={10} />
                    {format(new Date(version.created_at), 'MMM d, yyyy')}
                  </div>
                </div>

                <div 
                  className={clsx(
                    "p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100",
                    isActive && "opacity-100 text-indigo-400"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Download logic here
                  }}
                  title="Download PDF"
                >
                  <Download size={14} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
