'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'
import Fuse from 'fuse.js'
import { Search, FileText, TrendingUp, Calendar, X } from 'lucide-react'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen && opportunities.length === 0) {
      loadOpportunities()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (query.length > 0) {
      searchOpportunities(query)
    } else {
      setResults([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const loadOpportunities = async () => {
    const { data } = await supabase
      .from('opportunities')
      .select('id, title, company, source, category, tags, url')
      .order('created_at', { ascending: false })
      .limit(500)

    if (data) {
      setOpportunities(data)
    }
  }

  const searchOpportunities = (searchQuery: string) => {
    // Check for intent commands
    if (searchQuery.toLowerCase().startsWith('i applied')) {
      const companyMatch = searchQuery.match(/i applied (?:to |at )?(.+)/i)
      if (companyMatch) {
        const company = companyMatch[1]
        const fuzzy = new Fuse(opportunities, {
          keys: ['company', 'title'],
          threshold: 0.4
        })
        const matches = fuzzy.search(company)
        setResults(matches.map(m => ({
          ...m.item,
          action: 'track_application',
          label: `Track application to ${m.item.company}`
        })))
        return
      }
    }

    if (searchQuery.toLowerCase() === 'show deadlines this week') {
      setResults([{
        id: 'deadlines',
        action: 'navigate',
        url: '/dashboard?filter=deadlines',
        label: 'Show deadlines this week',
        icon: Calendar
      }])
      return
    }

    if (searchQuery.toLowerCase().startsWith('analyze')) {
      const companyMatch = searchQuery.match(/analyze (.+) jd/i)
      if (companyMatch) {
        const company = companyMatch[1]
        setResults([{
          id: 'analyze',
          action: 'analyze_jd',
          company,
          label: `Analyze ${company} job description`,
          icon: FileText
        }])
        return
      }
    }

    // Regular fuzzy search
    const fuse = new Fuse(opportunities, {
      keys: ['title', 'company', 'tags', 'category'],
      threshold: 0.3,
      includeScore: true
    })

    const matches = fuse.search(searchQuery).slice(0, 10)
    setResults(matches.map(m => ({
      ...m.item,
      score: m.score,
      action: 'view_opportunity'
    })))
  }

  const handleAction = async (result: any) => {
    switch (result.action) {
      case 'track_application':
        await apiClient.markApplied(result.id)
        setIsOpen(false)
        router.push('/tracker')
        break

      case 'navigate':
        router.push(result.url)
        setIsOpen(false)
        break

      case 'analyze_jd':
        router.push(`/resume?company=${encodeURIComponent(result.company)}`)
        setIsOpen(false)
        break

      case 'view_opportunity':
        // Open opportunity slide-over
        window.dispatchEvent(new CustomEvent('open-opportunity', { detail: result }))
        setIsOpen(false)
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search opportunities, or try: 'I applied to Flipkart', 'show deadlines this week'..."
            className="flex-1 outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 && query.length > 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No results found
            </div>
          )}

          {results.length === 0 && query.length === 0 && (
            <div className="p-8 space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">Try these commands:</div>
              <div className="space-y-2 text-sm">
                <div>• <code className="bg-muted px-2 py-1 rounded">I applied to [company]</code> - Track application</div>
                <div>• <code className="bg-muted px-2 py-1 rounded">show deadlines this week</code> - View upcoming deadlines</div>
                <div>• <code className="bg-muted px-2 py-1 rounded">analyze [company] jd</code> - Analyze job description</div>
                <div>• Or just search for any opportunity</div>
              </div>
            </div>
          )}

          {results.map((result, i) => (
            <button
              key={result.id || i}
              onClick={() => handleAction(result)}
              className="w-full p-4 hover:bg-muted transition-colors text-left flex items-center gap-3"
            >
              <div className="flex-shrink-0">
                {result.icon ? (
                  <result.icon className="w-5 h-5" />
                ) : (
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-xs font-bold">
                    {result.company?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{result.label || result.title}</div>
                {result.company && !result.label && (
                  <div className="text-sm text-muted-foreground">{result.company}</div>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {result.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-muted text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                {result.action === 'track_application' && 'Track'}
                {result.action === 'view_opportunity' && 'View'}
                {result.action === 'navigate' && 'Go'}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span><kbd className="bg-muted px-2 py-1 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-muted px-2 py-1 rounded">Enter</kbd> Select</span>
          </div>
          <span>Powered by fuzzy search</span>
        </div>
      </div>
    </div>
  )
}
