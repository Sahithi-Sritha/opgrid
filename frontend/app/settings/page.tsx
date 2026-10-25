'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { apiClient, apiUrl } from '@/lib/api-client'

type ScraperStatus = {
  name: string
  last_run: string
  status: string
  new_found: number
  errors: string | null
  duration_ms: number
}

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [telegramNotifs, setTelegramNotifs] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(true)
  const [deadlineReminders, setDeadlineReminders] = useState(true)
  const [activeTab, setActiveTab] = useState<'notifications' | 'sources' | 'scrapers'>('notifications')
  const [scrapers, setScrapers] = useState<ScraperStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [customSources, setCustomSources] = useState<string[]>([])
  const [newSource, setNewSource] = useState('')

  useEffect(() => {
    if (activeTab === 'scrapers') {
      loadScraperHealth()
    } else if (activeTab === 'sources') {
      loadCustomSources()
    }
  }, [activeTab])

  const loadCustomSources = async () => {
    try {
      const response = await fetch(apiUrl('/api/sources'), { headers: apiClient.authHeaders() })
      const data = await response.json()
      setCustomSources(data.sources || [])
    } catch (error) {
      console.error('Failed to load custom sources:', error)
    }
  }

  const addCustomSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSource.trim()) return

    try {
      const response = await fetch(apiUrl('/api/sources'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiClient.authHeaders() },
        body: JSON.stringify({ url: newSource.trim() })
      })
      const data = await response.json()
      if (response.ok) {
        setCustomSources(data.sources)
        setNewSource('')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Failed to add source:', error)
    }
  }

  const removeCustomSource = async (url: string) => {
    try {
      const response = await fetch(apiUrl('/api/sources'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...apiClient.authHeaders() },
        body: JSON.stringify({ url })
      })
      const data = await response.json()
      if (response.ok) {
        setCustomSources(data.sources)
      }
    } catch (error) {
      console.error('Failed to remove source:', error)
    }
  }

  const loadScraperHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch(apiUrl('/api/scrapers/health'), { headers: apiClient.authHeaders() })
      const data = await response.json()
      setScrapers(data.scrapers || [])
    } catch (error) {
      console.error('Failed to load scraper health:', error)
    }
    setLoading(false)
  }

  const runScraper = async (scraperName: string) => {
    try {
      await fetch(apiUrl(`/api/scrapers/run?scraper=${scraperName}`), {
        method: 'POST',
        headers: apiClient.authHeaders(),
      })
      // Reload health after 2 seconds
      setTimeout(loadScraperHealth, 2000)
    } catch (error) {
      console.error('Failed to run scraper:', error)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and notifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sources'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sources
        </button>
        <button
          onClick={() => setActiveTab('scrapers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'scrapers'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Scraper Health
        </button>
      </div>

      <div className="space-y-6">
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <section className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive new opportunities via email
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Telegram Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Get instant alerts via Telegram bot
                </div>
              </div>
              <input
                type="checkbox"
                checked={telegramNotifs}
                onChange={(e) => setTelegramNotifs(e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Daily Digest</div>
                <div className="text-sm text-muted-foreground">
                  Summary of new opportunities each day
                </div>
              </div>
              <input
                type="checkbox"
                checked={dailyDigest}
                onChange={(e) => setDailyDigest(e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Deadline Reminders</div>
                <div className="text-sm text-muted-foreground">
                  Alert 3 days before application deadlines
                </div>
              </div>
              <input
                type="checkbox"
                checked={deadlineReminders}
                onChange={(e) => setDeadlineReminders(e.target.checked)}
                className="w-5 h-5"
              />
            </div>
          </div>
        </section>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <section className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Default Sources</h2>
            <div className="space-y-3 mb-8">
              {['LinkedIn', 'Wellfound', 'YC Jobs', 'Telegram Groups', 'Career Pages'].map(source => (
                <div key={source} className="flex items-center justify-between">
                  <span>{source}</span>
                  <span className="text-green-600 text-sm">Active</span>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">Custom Sources</h2>
            <p className="text-muted-foreground text-sm mb-4">Add your own websites (e.g. lever.co, greenhouse.io). The agent will automatically search them for opportunities.</p>
            
            <form onSubmit={addCustomSource} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="e.g. jobs.lever.co/company"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
              />
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90">
                Add Source
              </button>
            </form>

            {customSources.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No custom sources added yet.</p>
            ) : (
              <div className="space-y-3 border rounded-lg p-4 bg-secondary/10">
                {customSources.map(source => (
                  <div key={source} className="flex items-center justify-between group">
                    <span className="font-medium text-sm">{source}</span>
                    <button
                      onClick={() => removeCustomSource(source)}
                      className="text-red-500 text-sm hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Scraper Health Tab */}
        {activeTab === 'scrapers' && (
          <section className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Scraper Health Dashboard</h2>
              <button
                onClick={loadScraperHealth}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading scraper status...</div>
            ) : scrapers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scraper runs found. Scrapers will start automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 font-semibold">Scraper</th>
                      <th className="py-3 px-4 font-semibold">Last Run</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">New Found</th>
                      <th className="py-3 px-4 font-semibold">Duration</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapers.map((scraper) => (
                      <tr key={scraper.name} className="border-b hover:bg-secondary/20">
                        <td className="py-3 px-4 font-medium">{scraper.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(scraper.last_run), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-4">
                          {scraper.status === 'success' ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{scraper.new_found}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {(scraper.duration_ms / 1000).toFixed(1)}s
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => runScraper(scraper.name)}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm font-medium flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Run Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {scrapers.some(s => s.errors) && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                    {scrapers.filter(s => s.errors).map(scraper => (
                      <div key={scraper.name} className="text-sm text-red-700">
                        <strong>{scraper.name}:</strong> {scraper.errors}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'notifications' && (
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">
            Save Settings
          </button>
        )}
      </div>
    </div>
  )
}
