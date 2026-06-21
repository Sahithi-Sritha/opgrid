import React, { useState } from 'react';
import { JdAnalysis } from '../types';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, FileSearch, ChevronRight, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface JdAnalyzerProps {
  jdText: string;
  onJdTextChange: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysis: JdAnalysis | null;
  onApplyEdits: (editIds: string[]) => void;
}

export default function JdAnalyzer({
  jdText,
  onJdTextChange,
  onAnalyze,
  isAnalyzing,
  analysis,
  onApplyEdits
}: JdAnalyzerProps) {
  const [selectedEdits, setSelectedEdits] = useState<Set<string>>(new Set());

  const toggleEdit = (id: string) => {
    const newSet = new Set(selectedEdits);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEdits(newSet);
  };

  const selectAll = () => {
    if (analysis) {
      setSelectedEdits(new Set(analysis.suggested_edits.map(e => e.id)));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 75) return 'text-teal-400 stroke-teal-400';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Strong Match';
    if (score >= 50) return 'Decent Match';
    return 'Needs Work';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto custom-scrollbar relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Resume AI Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Paste a job description or URL to analyze and optimize your resume.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative group">
            <textarea
              className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none custom-scrollbar"
              placeholder="Paste Job Description text or a URL here..."
              value={jdText}
              onChange={(e) => onJdTextChange(e.target.value)}
            />
            <div className="absolute top-4 right-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
              <FileSearch size={20} />
            </div>
          </div>
          
          <button
            onClick={onAnalyze}
            disabled={!jdText.trim() || isAnalyzing}
            className="flex items-center justify-center gap-2 w-full sm:w-auto self-end px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
          >
            {isAnalyzing ? (
              <Activity className="animate-pulse" size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            {isAnalyzing ? 'Analyzing Alignment...' : 'Analyze & Optimize'}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Score Gauge */}
          <div className="flex items-center gap-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={clsx("transition-all duration-1000 ease-out", getScoreColor(analysis.match_score))}
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${(analysis.match_score / 100) * 283} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{analysis.match_score}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {getScoreLabel(analysis.match_score)}
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                Your resume currently matches {analysis.match_score}% of the core requirements found in the job description. Review the missing keywords and suggested edits below to improve your score.
              </p>
            </div>
          </div>

          {/* Keywords Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="text-emerald-500" size={18} />
                <h3 className="font-semibold text-emerald-400 text-sm tracking-wide uppercase">You Have</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.present_keywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-md text-xs font-medium tracking-wide">
                    {kw}
                  </span>
                ))}
                {analysis.present_keywords.length === 0 && (
                  <p className="text-slate-500 text-sm">No exact matches found.</p>
                )}
              </div>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="text-rose-500" size={18} />
                <h3 className="font-semibold text-rose-400 text-sm tracking-wide uppercase">You&apos;re Missing</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_keywords.map((kw, i) => (
                  <button 
                    key={i} 
                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs font-medium tracking-wide hover:bg-rose-500/20 transition-colors group relative"
                    title="Click to see where it could fit"
                  >
                    {kw}
                    <div className="absolute inset-0 border border-rose-400/0 rounded-md group-hover:animate-ping opacity-20 pointer-events-none" />
                  </button>
                ))}
                {analysis.missing_keywords.length === 0 && (
                  <p className="text-slate-500 text-sm">Great job! No major missing keywords.</p>
                )}
              </div>
            </div>
          </div>

          {/* Suggested Edits */}
          {analysis.suggested_edits.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Suggested Edits</h3>
                  <p className="text-sm text-slate-400">AI-powered suggestions to incorporate missing keywords seamlessly.</p>
                </div>
                <button 
                  onClick={selectAll}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Select All
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30 divide-y divide-slate-800/60">
                {analysis.suggested_edits.map((edit) => {
                  const isSelected = selectedEdits.has(edit.id);
                  return (
                    <div 
                      key={edit.id} 
                      className={clsx(
                        "p-5 flex gap-4 transition-colors hover:bg-slate-800/40 cursor-pointer",
                        isSelected ? "bg-indigo-500/5" : ""
                      )}
                      onClick={() => toggleEdit(edit.id)}
                    >
                      <div className="mt-1">
                        <div className={clsx(
                          "w-5 h-5 rounded border flex items-center justify-center transition-all",
                          isSelected 
                            ? "bg-indigo-500 border-indigo-500 text-white" 
                            : "border-slate-600 text-transparent"
                        )}>
                          <CheckCircle2 size={14} className="stroke-[3px]" />
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="inline-block px-2 py-1 bg-slate-800 rounded text-xs font-medium text-slate-300 border border-slate-700">
                          {edit.section}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current</span>
                            <p className="text-sm text-slate-400 line-clamp-3 line-through decoration-rose-500/50">
                              {edit.current_text}
                            </p>
                          </div>
                          
                          <div className="space-y-1.5">
                            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={12} /> Suggested
                            </span>
                            <p className="text-sm text-slate-200">
                              {edit.suggested_text}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                          <span className="text-xs text-slate-500">Adds keywords:</span>
                          <div className="flex gap-1.5">
                            {edit.keywords_added.map(kw => (
                              <span key={kw} className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                + {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedEdits.size > 0 && (
                <div className="sticky bottom-6 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 p-3 rounded-2xl shadow-2xl flex items-center gap-6">
                    <span className="text-sm text-slate-300 font-medium ml-2">
                      <strong className="text-white">{selectedEdits.size}</strong> edits selected
                    </span>
                    <button
                      onClick={() => onApplyEdits(Array.from(selectedEdits))}
                      className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    >
                      Apply to Resume <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
