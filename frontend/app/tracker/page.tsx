'use client'

import { useEffect, useState } from 'react'
import { supabase, type Application, type Opportunity } from '@/lib/supabase'
import { apiUrl } from '@/lib/api-client'
import { Badge } from '@/components/Badge'

type ApplicationWithOpportunity = Application & {
  opportunities: Opportunity
}

const STATUS_OPTIONS = [
  { value: 'to_apply', label: 'To Apply', color: 'bg-orange-100 text-orange-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'oa_received', label: 'OA Received', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'oa_done', label: 'OA Done', color: 'bg-purple-100 text-purple-800' },
  { value: 'interview', label: 'Interview', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'ghosted', label: 'Ghosted', color: 'bg-gray-100 text-gray-800' },
]

export default function TrackerPage() {
  const [applications, setApplications] = useState<ApplicationWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [sortBy, setSortBy] = useState<'applied_date' | 'deadline'>('applied_date')
  const [sortAsc, setSortAsc] = useState(false)
  const [editingCell, setEditingCell] = useState<{ appId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(*)')

    if (error) {
      console.error('Error loading applications:', error)
    } else {
      setApplications(data as any || [])
    }
    setLoading(false)
  }

  const handleParseTimelines = async () => {
    if (!pasteText.trim()) return
    setIsParsing(true)

    try {
      const response = await fetch(apiUrl('/api/tracker/parse'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      })
      const result = await response.json()
      if (response.ok) {
        setIsModalOpen(false)
        setPasteText('')
        loadApplications()
      } else {
        alert(result.error || 'Failed to parse timelines')
      }
    } catch (err) {
      console.error(err)
      alert('Network error while parsing timelines')
    }
    setIsParsing(false)
  }

  // Update application fields (status, notes)
  const updateApplication = async (appId: string, updates: Record<string, any>) => {
    setSavingId(appId)
    const { error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', appId)

    if (error) {
      console.error('Failed to update application:', error)
      alert('Failed to save changes')
    } else {
      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, ...updates } : app
      ))
    }
    setSavingId(null)
  }

  // Update opportunity fields (company, title, deadline, url)
  const updateOpportunity = async (oppId: string, appId: string, updates: Record<string, any>) => {
    setSavingId(appId)
    const { error } = await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', oppId)

    if (error) {
      console.error('Failed to update opportunity:', error)
      alert('Failed to save changes')
    } else {
      setApplications(prev => prev.map(app =>
        app.id === appId
          ? { ...app, opportunities: { ...app.opportunities, ...updates } }
          : app
      ))
    }
    setSavingId(null)
  }

  const startEdit = (appId: string, field: string, currentValue: string) => {
    setEditingCell({ appId, field })
    setEditValue(currentValue || '')
  }

  const saveEdit = async () => {
    if (!editingCell) return
    const { appId, field } = editingCell
    const app = applications.find(a => a.id === appId)
    if (!app) return

    if (['company', 'title', 'deadline', 'url'].includes(field)) {
      const val = field === 'deadline' && !editValue ? null : editValue
      await updateOpportunity(app.opportunities.id, appId, { [field]: val })
    } else if (field === 'applied_date') {
      await updateApplication(appId, { [field]: editValue ? new Date(editValue).toISOString() : null })
    } else {
      await updateApplication(appId, { [field]: editValue || null })
    }
    setEditingCell(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  const sortedApplications = [...applications].sort((a, b) => {
    let valA = a.applied_date
    let valB = b.applied_date

    if (sortBy === 'deadline') {
      valA = a.opportunities.deadline || '9999-12-31'
      valB = b.opportunities.deadline || '9999-12-31'
    }

    if (valA < valB) return sortAsc ? -1 : 1
    if (valA > valB) return sortAsc ? 1 : -1
    return 0
  })

  const toggleSort = (col: 'applied_date' | 'deadline') => {
    if (sortBy === col) setSortAsc(!sortAsc)
    else {
      setSortBy(col)
      setSortAsc(col === 'deadline')
    }
  }

  const renderEditableCell = (appId: string, field: string, value: string, displayValue?: string) => {
    const isEditing = editingCell?.appId === appId && editingCell?.field === field
    const isSaving = savingId === appId

    if (isEditing) {
      return (
        <input
          autoFocus
          type={field === 'deadline' ? 'date' : 'text'}
          className="w-full px-2 py-1 border-2 border-primary rounded text-sm bg-background focus:outline-none"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
        />
      )
    }

    return (
      <span
        className={`cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors inline-block min-w-[60px] ${isSaving ? 'opacity-50' : ''}`}
        onClick={() => startEdit(appId, field, value)}
        title="Click to edit"
      >
        {displayValue || value || <span className="text-muted-foreground italic">Click to add</span>}
      </span>
    )
  }

  const deleteApplication = async (appId: string) => {
    if (!confirm('Delete this tracked item?')) return
    const { error } = await supabase.from('applications').delete().eq('id', appId)
    if (!error) {
      setApplications(prev => prev.filter(a => a.id !== appId))
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Application Tracker</h1>
          <p className="text-muted-foreground">Track your applications and their status. Click any cell to edit.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 flex items-center gap-2"
        >
          Paste Timelines
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No applications yet. Use "Paste Timelines" to add your opportunities!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-4 font-semibold">Company</th>
                <th className="text-left p-4 font-semibold">Position</th>
                <th 
                  className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/80"
                  onClick={() => toggleSort('applied_date')}
                >
                  Applied Date {sortBy === 'applied_date' && (sortAsc ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left p-4 font-semibold cursor-pointer hover:bg-muted/80 text-orange-600"
                  onClick={() => toggleSort('deadline')}
                >
                  Deadline {sortBy === 'deadline' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Link</th>
                <th className="text-left p-4 font-semibold">Notes</th>
                <th className="text-left p-4 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sortedApplications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">
                    {renderEditableCell(app.id, 'company', app.opportunities.company)}
                  </td>
                  <td className="p-4">
                    {renderEditableCell(app.id, 'title', app.opportunities.title)}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {renderEditableCell(
                      app.id,
                      'applied_date',
                      app.applied_date ? new Date(app.applied_date).toISOString().split('T')[0] : '',
                      app.applied_date
                        ? new Date(app.applied_date).toLocaleDateString()
                        : undefined
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium text-orange-600">
                    {renderEditableCell(
                      app.id,
                      'deadline',
                      app.opportunities.deadline || '',
                      app.opportunities.deadline
                        ? new Date(app.opportunities.deadline).toLocaleDateString()
                        : undefined
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplication(app.id, { status: e.target.value })}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${getStatusColor(app.status)}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-sm">
                    {editingCell?.appId === app.id && editingCell?.field === 'url' ? (
                      <input
                        autoFocus
                        type="url"
                        className="w-full px-2 py-1 border-2 border-primary rounded text-sm bg-background focus:outline-none"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        placeholder="https://..."
                      />
                    ) : app.opportunities.url && !app.opportunities.url.startsWith('pasted-') ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={app.opportunities.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[120px] inline-block"
                          title={app.opportunities.url}
                        >
                          🔗 Link
                        </a>
                        <button
                          onClick={() => startEdit(app.id, 'url', app.opportunities.url || '')}
                          className="text-muted-foreground hover:text-primary text-xs ml-1"
                          title="Edit link"
                        >
                          ✏️
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                        onClick={() => startEdit(app.id, 'url', '')}
                        title="Add link"
                      >
                        + Add link
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs">
                    {renderEditableCell(app.id, 'notes', app.notes || '')}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="text-red-400 hover:text-red-600 text-sm transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paste Timelines Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-2">Paste Timelines</h2>
            <p className="text-muted-foreground mb-4">
              Paste an email, slack message, or webpage text containing timelines. AI will extract companies, positions, deadlines, and statuses automatically.
            </p>
            <textarea
              className="w-full h-48 p-3 border rounded-lg bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              placeholder="e.g. Google SWE Intern closes on Nov 1st. I have a Microsoft interview tomorrow..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
              >
                Cancel
              </button>
              <button 
                onClick={handleParseTimelines}
                disabled={isParsing || !pasteText.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isParsing ? 'Parsing with AI...' : 'Extract & Track'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
