'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { ResumeVersion, JdAnalysis } from './types';
import ResumeSidebar from './components/ResumeSidebar';
import JdAnalyzer from './components/JdAnalyzer';
import LatexEditor from './components/LatexEditor';
import ResumeFeedback from './components/ResumeFeedback';
import { apiClient } from '@/lib/api-client';

export default function ResumePage() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<JdAnalysis | null>(null);
  
  // Mobile tab state
  const [activeTab, setActiveTab] = useState<'sidebar' | 'analyzer' | 'editor'>('analyzer');

  const activeVersion = versions.find(v => v.id === activeVersionId);

  useEffect(() => {
    void apiClient.getResumeVersions().then(({ data }) => {
      const resumes = (data?.resumes || []) as ResumeVersion[]
      setVersions(resumes)
      setActiveVersionId(resumes[0]?.id || null)
    })
  }, []);

  const createResume = async () => {
    const label = window.prompt('Resume name')?.trim()
    if (!label) return
    const latex = '\\documentclass{article}\n\\begin{document}\nYour resume content\n\\end{document}'
    const { data, error } = await apiClient.createResume(label, latex)
    if (error || !data) return alert(error?.message || 'Could not create resume')
    const resume = data.resume as ResumeVersion
    setVersions(current => [resume, ...current]); setActiveVersionId(resume.id)
  }

  const saveActiveResume = async () => {
    if (!activeVersion) return
    const { data, error } = await apiClient.updateResume(activeVersion.id, { latex_source: activeVersion.latex_source })
    if (error || !data) return alert(error?.message || 'Could not save resume')
    setVersions(current => current.map(item => item.id === activeVersion.id ? data.resume : item))
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Check if the input is a URL and scrape it
    let textToAnalyze = jdText;
    if (jdText.startsWith('http://') || jdText.startsWith('https://')) {
      try {
        const res = await fetch(`/api/jd/scrape?url=${encodeURIComponent(jdText)}`);
        const data = await res.json();
        if (data.text) {
          textToAnalyze = data.text;
          setJdText(textToAnalyze);
        }
      } catch (e) {
        console.error('Failed to scrape URL:', e);
      }
    }

    // Mock analysis request
    setTimeout(() => {
      setAnalysis({
        match_score: 68,
        present_keywords: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
        missing_keywords: ['Next.js', 'GraphQL', 'AWS', 'Docker'],
        suggested_edits: [
          {
            id: 'e1',
            section: 'Experience',
            current_text: 'Built web applications using React and Node.js.',
            suggested_text: 'Architected scalable SSR web applications using Next.js, React, and Node.js deployed on AWS.',
            keywords_added: ['Next.js', 'AWS']
          },
          {
            id: 'e2',
            section: 'Skills',
            current_text: 'REST APIs, Git, Agile',
            suggested_text: 'REST & GraphQL APIs, Docker containerization, Git, Agile',
            keywords_added: ['GraphQL', 'Docker']
          }
        ]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleApplyEdits = async (editIds: string[]) => {
    // In production, call /api/resume/apply-edits
    alert(`Applied ${editIds.length} edits! Regenerating PDF...`);
  };

  // Global "I applied" detector for this page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Just a simple detector for typing "i applied" anywhere
      // In a real app, this might be hooked to a specific input or state
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerAppliedFlow = async () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899']
    });
    
    // Simulate /api/apply/detect
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-2xl font-medium animate-in slide-in-from-bottom-5 z-50';
    toast.innerText = 'Application auto-tracked! 🎉';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-out', 'slide-out-to-bottom-5', 'fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Mobile Tabs */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-20">
        <button 
          onClick={() => setActiveTab('sidebar')}
          className={clsx("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'sidebar' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400")}
        >
          Versions
        </button>
        <button 
          onClick={() => setActiveTab('analyzer')}
          className={clsx("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'analyzer' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400")}
        >
          Analyze
        </button>
        <button 
          onClick={() => setActiveTab('editor')}
          className={clsx("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === 'editor' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400")}
        >
          Editor
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Versions) */}
        <div className={clsx(
          "w-full md:w-[260px] flex-shrink-0 h-full",
          activeTab !== 'sidebar' && "hidden md:block"
        )}>
          <ResumeSidebar 
            versions={versions}
            activeVersionId={activeVersionId}
            onSelectVersion={setActiveVersionId}
            onUpload={() => void createResume()}
          />
        </div>

        {/* Main Panel (Analyzer) */}
        <div className={clsx(
          "flex-1 min-w-0 h-full flex flex-col",
          activeTab !== 'analyzer' && "hidden md:flex"
        )}>
          <JdAnalyzer
            jdText={jdText}
            onJdTextChange={setJdText}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            analysis={analysis}
            onApplyEdits={handleApplyEdits}
          />
          <ResumeFeedback />
          
          {/* Quick trigger for demonstration */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
            <button onClick={triggerAppliedFlow} className="px-4 py-2 bg-indigo-600 rounded-full text-xs shadow-lg">
              Test &quot;I Applied&quot;
            </button>
          </div>
        </div>

        {/* Right Panel (Editor) */}
        <div className={clsx(
          "w-full md:w-[480px] flex-shrink-0 h-full",
          activeTab !== 'editor' && "hidden md:block"
        )}>
          <LatexEditor
            latexContent={activeVersion?.latex_source || ''}
            pdfUrl={activeVersion?.pdf_url || null}
            onContentChange={(newContent) => {
              if (activeVersionId) {
                setVersions(v => v.map(ver => ver.id === activeVersionId ? { ...ver, latex_source: newContent } : ver));
              }
            }}
          />
          {activeVersion && <button onClick={() => void saveActiveResume()} className="absolute right-6 top-20 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white">Save LaTex</button>}
        </div>
      </div>

      {/* Desktop Quick Trigger for Confetti (for demonstration purposes as requested) */}
      <button 
        onClick={triggerAppliedFlow}
        className="hidden md:flex fixed bottom-6 right-6 px-4 py-2.5 bg-indigo-600/90 backdrop-blur hover:bg-indigo-500 text-white rounded-full font-medium shadow-2xl items-center gap-2 transition-transform hover:scale-105 z-50"
      >
        <span>Mark as applied</span>
        <span className="text-lg">🎉</span>
      </button>

    </div>
  );
}
