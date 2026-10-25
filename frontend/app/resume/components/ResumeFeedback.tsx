'use client'

import { useState } from 'react'
import { FileText, Loader2, ShieldCheck } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function ResumeFeedback() {
  const [file, setFile] = useState<File | null>(null)
  const [role, setRole] = useState('software_engineering_intern')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function evaluate() {
    if (!file) return
    setLoading(true); setError(''); setResult(null)
    const response = await apiClient.evaluateResume(file, role)
    if (response.error) setError(response.error.message); else setResult(response.data)
    setLoading(false)
  }

  const evaluation = result?.evaluations?.[0]
  return <section className="m-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-slate-200">
    <div className="flex gap-3"><ShieldCheck className="mt-0.5 text-indigo-400" /><div><h2 className="font-semibold">Private CV feedback</h2><p className="mt-1 text-sm text-slate-400">Uses HackerAgentRank&apos;s explainable rubric. This is feedback, not ATS scoring or a hiring decision. Your PDF is forwarded only to your configured private evaluator and is not stored by OpGrid.</p></div></div>
    <div className="mt-4 flex flex-wrap gap-3"><input aria-label="Resume PDF" type="file" accept="application/pdf,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="max-w-xs text-sm" /><select value={role} onChange={e => setRole(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="software_engineering_intern">Software engineering intern</option><option value="backend_engineer">Backend engineer</option><option value="frontend_engineer">Frontend engineer</option><option value="machine_learning_engineer">Machine learning engineer</option></select><button disabled={!file || loading} onClick={() => void evaluate()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={16} /> : 'Get feedback'}</button></div>
    {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
    {evaluation && <div className="mt-5 space-y-3 border-t border-slate-800 pt-4"><div className="flex items-baseline justify-between"><h3 className="font-semibold">{evaluation.position_title || evaluation.role}</h3><span className="text-2xl font-bold text-indigo-300">{Math.round(evaluation.overall ?? evaluation.total_score ?? 0)}</span></div><p className="text-sm text-slate-400">{evaluation.overall ? 'Read the evidence below; scores can vary between model runs.' : ''}</p>{(evaluation.categories || []).map((category: any) => <article key={category.key} className="rounded-lg bg-slate-950/70 p-3"><div className="flex justify-between text-sm font-medium"><span>{category.label}</span><span>{category.score}/{category.max}</span></div><p className="mt-1 text-sm text-slate-400">{category.evidence || 'No evidence returned.'}</p></article>)}{evaluation.areas_for_improvement?.length > 0 && <div><h4 className="text-sm font-medium">Areas to improve</h4><ul className="mt-1 list-disc pl-5 text-sm text-slate-400">{evaluation.areas_for_improvement.map((item: string) => <li key={item}>{item}</li>)}</ul></div>}</div>}
  </section>
}
