'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient, type Opportunity } from '@/lib/api-client'
import { Badge } from '@/components/Badge'
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  DollarSign,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'internship', label: 'Internships' },
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'fellowship', label: 'Fellowships' },
  { value: 'remote', label: 'Remote' },
  { value: 'stipend', label: 'Paid' },
  { value: 'ppo_possible', label: 'PPO possible' },
  { value: 'beginner_friendly', label: 'Beginner friendly' },
]

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

export default function FeedPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'deadline'>('newest')
  const [error, setError] = useState<string | null>(null)

  const loadOpportunities = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    setError(null)

    const { data, error: requestError } = await apiClient.getOpportunities({
      limit: 100,
      filter,
    })

    if (requestError) {
      setError(requestError.message)
    } else {
      setOpportunities(data || [])
    }

    setLoading(false)
  }, [filter])

  const handleRefresh = useCallback(async () => {
    setScraping(true)
    setScrapeStatus('Agent is searching for new opportunities…')
    setError(null)

    const { error: scrapeError } = await apiClient.triggerScrape()
    if (scrapeError) {
      setScrapeStatus('Scrape had issues, loading cached results…')
    } else {
      setScrapeStatus('Found new opportunities! Loading…')
    }

    await loadOpportunities(true)
    setScraping(false)
    setScrapeStatus(null)
  }, [loadOpportunities])

  useEffect(() => {
    loadOpportunities()
  }, [loadOpportunities])

  const visibleOpportunities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = normalizedSearch
      ? opportunities.filter((opportunity) => {
          const haystack = [
            opportunity.title,
            opportunity.company,
            opportunity.location,
            opportunity.category,
            ...(opportunity.tags || []),
          ].join(' ').toLowerCase()
          return haystack.includes(normalizedSearch)
        })
      : opportunities

    return [...filtered].sort((a, b) => {
      if (sort === 'deadline') {
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
        return aDeadline - bDeadline
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [opportunities, search, sort])

  const openOpportunity = (opportunity: Opportunity) => {
    setOpportunities((current) =>
      current.map((item) =>
        item.id === opportunity.id ? { ...item, seen_at: new Date().toISOString() } : item
      )
    )
    void apiClient.markOpportunitySeen(opportunity.id)
    window.dispatchEvent(new CustomEvent('open-opportunity', { detail: opportunity }))
  }

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <section className="mb-8 overflow-hidden rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Your opportunity radar
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Find the next thing worth applying to.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Fresh internships, hackathons, fellowships, and competitions collected by your agent.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              id="feed-refresh-btn"
              onClick={handleRefresh}
              disabled={scraping}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-primary/30 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${scraping ? 'animate-spin' : ''}`} />
              {scraping ? 'Scraping…' : 'Refresh'}
            </button>
            {scrapeStatus && (
              <span className="text-xs font-medium text-blue-600 animate-pulse">
                {scrapeStatus}
              </span>
            )}
          </div>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search opportunities</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, company, location, or tag"
              className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>

          <label>
            <span className="sr-only">Sort opportunities</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'newest' | 'deadline')}
              className="h-12 w-full rounded-xl border bg-background px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="newest">Newest first</option>
              <option value="deadline">Deadline first</option>
            </select>
          </label>
        </div>

        <div className="scrollbar-thin mt-4 flex gap-2 overflow-x-auto pb-2">
          {filters.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading opportunities…' : `${visibleOpportunities.length} opportunities`}
        </p>
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <h2 className="mt-3 font-semibold text-red-950">Couldn’t reach the opportunity agent</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => loadOpportunities()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-2xl border bg-card/70" />
          ))}
        </div>
      ) : visibleOpportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No matching opportunities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another search or filter. Your agent will keep adding new matches.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleOpportunities.map((opportunity) => {
            const tags = opportunity.tags || []
            const hasLink = isExternalUrl(opportunity.url)

            return (
              <article
                key={opportunity.id}
                role="button"
                tabIndex={0}
                onClick={() => openOpportunity(opportunity)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openOpportunity(opportunity)
                  }
                }}
                className={`group flex min-h-72 cursor-pointer flex-col rounded-2xl border bg-card p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-primary/20 ${
                  !opportunity.seen_at ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      {!opportunity.seen_at && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                          New
                        </span>
                      )}
                      <Badge variant={opportunity.source === 'linkedin' ? 'blue' : 'green'}>
                        {opportunity.source}
                      </Badge>
                    </div>
                    <h2 className="text-balance text-lg font-bold leading-snug group-hover:text-primary">
                      {opportunity.title}
                    </h2>
                    <p className="mt-1 font-medium text-muted-foreground">{opportunity.company}</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-sm">
                    {opportunity.company?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>

                {opportunity.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {opportunity.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag.replaceAll('_', ' ')}
                    </Badge>
                  ))}
                  {tags.length > 4 && <Badge variant="outline">+{tags.length - 4}</Badge>}
                </div>

                <div className="mt-auto space-y-2 border-t pt-4 text-sm text-muted-foreground">
                  {opportunity.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{opportunity.location}</span>
                    </div>
                  )}
                  {opportunity.stipend && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="truncate">{opportunity.stipend}</span>
                    </div>
                  )}
                  {opportunity.deadline && (
                    <div className="flex items-center gap-2 font-medium text-orange-700">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline {new Date(opportunity.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}
                  </span>
                  {hasLink ? (
                    <a
                      href={opportunity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      View posting <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">Details available</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
