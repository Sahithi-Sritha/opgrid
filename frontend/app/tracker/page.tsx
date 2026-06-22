'use client'

import { useEffect, useState } from 'react'
import { ClipboardPaste, Loader2, Plus, Trash2, X } from 'lucide-react'
import { apiClient, type Application, type Opportunity } from '@/lib/api-client'

type ApplicationWithOpportunity = Application & {
  opportunities: Opportunity
}

const STATUS_OPTIONS = [
  { value: 'to_apply', label: 'To Apply', color: 'bg-orange-100 text-orange-800' },
  { value: 'registered', label: 'Registered', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'idea_submission', label: 'Idea Submission', color: 'bg-fuchsia-100 text-fuchsia-800' },
  { value: 'idea_shortlisted', label: 'Idea Shortlisted', color: 'bg-pink-100 text-pink-800' },
  { value: 'video_submission', label: 'Video Submission', color: 'bg-rose-100 text-rose-800' },
  { value: 'assessment', label: 'Assessment / Quiz', color: 'bg-amber-100 text-amber-800' },
  { value: 'oa_received', label: 'OA Received', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'oa_done', label: 'OA Done', color: 'bg-purple-100 text-purple-800' },
  { value: 'prototype_building', label: 'Prototype Building', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'hackathon_round', label: 'Hackathon Round', color: 'bg-violet-100 text-violet-800' },
  { value: 'semifinalist', label: 'Semifinalist', color: 'bg-teal-100 text-teal-800' },
  { value: 'finalist', label: 'Finalist', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'presentation', label: 'Presentation / Pitch', color: 'bg-sky-100 text-sky-800' },
  { value: 'interview', label: 'Interview', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'winner', label: 'Winner', color: 'bg-lime-100 text-lime-800' },
  { value: 'ghosted', label: 'Ghosted', color: 'bg-gray-100 text-gray-800' },
]

const newManualForm = () => ({
  company: '',
  title: '',
  status: 'to_apply',
  applied_date: new Date().toISOString().slice(0, 10),
  deadline: '',
  url: '',
  notes: '',
})

export default function TrackerPage() {
  const [applications, setApplications] = useState<ApplicationWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'paste' | 'manual' | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [manualForm, setManualForm] = useState(newManualForm)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sortBy, setSortBy] = useState<'applied_date' | 'deadline'>('applied_date')
  const [sortAsc, setSortAsc] = useState(false)
  const [editingCell, setEditingCell] = useState<{ appId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadApplications = async () => {
    setLoading(true)
    const { data, error } = await apiClient.getApplications()
    if (error) {
      setNotice({ type: 'error', text: error.message })
    } else {
      setApplications(
        (data || []).filter(
          (application): application is ApplicationWithOpportunity => Boolean(application.opportunities),
        ),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadApplications()
  }, [])

  const handleParseTimelines = async () => {
    if (!pasteText.trim()) return
    setIsParsing(true)
    setNotice(null)
    const { data, error } = await apiClient.parseTimelines(pasteText)
    if (error) {
      setNotice({ type: 'error', text: error.message })
    } else if (data) {
      setActiveModal(null)
      setPasteText('')
      setNotice({
        type: 'success',
        text: `${data.message}${data.extraction === 'fallback' ? ' Used the built-in parser.' : ''}`,
      })
      await loadApplications()
    }
    setIsParsing(false)
  }

  const handleAddManually = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!manualForm.company.trim() || !manualForm.title.trim()) return
    setIsAdding(true)
    setNotice(null)
    const { error } = await apiClient.addTrackedItem({
      ...manualForm,
      deadline: manualForm.deadline || null,
      url: manualForm.url || null,
      notes: manualForm.notes || null,
    })

    if (error) {
      setNotice({ type: 'error', text: error.message })
    } else {
      setActiveModal(null)
      setManualForm(newManualForm())
      setNotice({ type: 'success', text: 'Added to your tracker.' })
      await loadApplications()
    }
    setIsAdding(false)
  }

  const updateApplication = async (appId: string, updates: Partial<Application>) => {
    setSavingId(appId)
    const { data, error } = await apiClient.updateApplication(appId, updates)
    if (error) {
      setNotice({ type: 'error', text: error.message })
    } else {
      setApplications(current => current.map(application =>
        application.id === appId ? { ...application, ...(data || updates) } : application,
      ))
    }
    setSavingId(null)
  }

  const updateOpportunity = async (
    opportunityId: string,
    appId: string,
    updates: Partial<Opportunity>,
  ) => {
    setSavingId(appId)
    const { data, error } = await apiClient.updateOpportunity(opportunityId, updates)
    if (error) {
      setNotice({ type: 'error', text: error.message })
    } else {
      setApplications(current => current.map(application =>
        application.id === appId
          ? { ...application, opportunities: { ...application.opportunities, ...(data || updates) } }
          : application,
      ))
    }
    setSavingId(null)
  }

  const startEdit = (appId: string, field: string, value: string) => {
    setEditingCell({ appId, field })
    setEditValue(value || '')
  }

  const saveEdit = async () => {
    if (!editingCell) return
    const { appId, field } = editingCell
    const application = applications.find(item => item.id === appId)
    setEditingCell(null)
    if (!application) return

    if (['company', 'title', 'deadline', 'url'].includes(field)) {
      const value = field === 'deadline' && !editValue ? null : editValue
      await updateOpportunity(application.opportunities.id, appId, { [field]: value })
    } else if (field === 'applied_date') {
      await updateApplication(appId, { applied_date: editValue || null } as Partial<Application>)
    } else {
      await updateApplication(appId, { [field]: editValue || null })
    }
    setEditValue('')
  }

  const deleteApplication = async (appId: string) => {
    if (!confirm('Delete this tracked item?')) return
    const { error } = await apiClient.deleteApplication(appId)
    if (error) {
      setNotice({ type: 'error', text: error.message })
    } else {
      setApplications(current => current.filter(application => application.id !== appId))
    }
  }

  const getStatusColor = (status: string) =>
    STATUS_OPTIONS.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800'

  const sortedApplications = [...applications].sort((a, b) => {
    const valueA = sortBy === 'deadline'
      ? a.opportunities.deadline || '9999-12-31'
      : a.applied_date || ''
    const valueB = sortBy === 'deadline'
      ? b.opportunities.deadline || '9999-12-31'
      : b.applied_date || ''
    return valueA === valueB ? 0 : (valueA < valueB ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1))
  })

  const toggleSort = (column: 'applied_date' | 'deadline') => {
    if (sortBy === column) setSortAsc(current => !current)
    else {
      setSortBy(column)
      setSortAsc(column === 'deadline')
    }
  }

  const renderEditableCell = (appId: string, field: string, value: string, displayValue?: string) => {
    const isEditing = editingCell?.appId === appId && editingCell.field === field
    if (isEditing) {
      return (
        <input
          autoFocus
          type={field === 'deadline' || field === 'applied_date' ? 'date' : 'text'}
          className="w-full rounded border-2 border-primary bg-background px-2 py-1 text-sm focus:outline-none"
          value={editValue}
          onChange={event => setEditValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') void saveEdit()
            if (event.key === 'Escape') setEditingCell(null)
          }}
          onBlur={() => void saveEdit()}
        />
      )
    }

    return (
      <span
        className={`inline-block min-w-16 cursor-pointer rounded px-2 py-1 transition hover:bg-primary/10 ${
          savingId === appId ? 'opacity-50' : ''
        }`}
        onClick={() => startEdit(appId, field, value)}
        title="Click to edit"
      >
        {displayValue || value || <span className="italic text-muted-foreground">Click to add</span>}
      </span>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Application Tracker</h1>
          <p className="text-muted-foreground">Track job applications and every stage of your hackathons.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setNotice(null)
              setActiveModal('manual')
            }}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 font-medium transition hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add manually
          </button>
          <button
            onClick={() => {
              setNotice(null)
              setActiveModal('paste')
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste timelines
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="status"
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          No tracking items yet. Add one manually or paste a timeline.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-4 text-left font-semibold">Company</th>
                <th className="p-4 text-left font-semibold">Opportunity</th>
                <th
                  className="cursor-pointer p-4 text-left font-semibold hover:bg-muted/80"
                  onClick={() => toggleSort('applied_date')}
                >
                  Tracked Date {sortBy === 'applied_date' && (sortAsc ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer p-4 text-left font-semibold text-orange-600 hover:bg-muted/80"
                  onClick={() => toggleSort('deadline')}
                >
                  Next Deadline {sortBy === 'deadline' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Link</th>
                <th className="p-4 text-left font-semibold">Notes</th>
                <th className="w-10 p-4 text-left font-semibold" />
              </tr>
            </thead>
            <tbody>
              {sortedApplications.map(application => (
                <tr key={application.id} className="border-t transition hover:bg-muted/30">
                  <td className="p-4 font-medium">
                    {renderEditableCell(application.id, 'company', application.opportunities.company)}
                  </td>
                  <td className="p-4">
                    {renderEditableCell(application.id, 'title', application.opportunities.title)}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {renderEditableCell(
                      application.id,
                      'applied_date',
                      application.applied_date?.slice(0, 10) || '',
                      application.applied_date ? new Date(application.applied_date).toLocaleDateString() : undefined,
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium text-orange-600">
                    {renderEditableCell(
                      application.id,
                      'deadline',
                      application.opportunities.deadline || '',
                      application.opportunities.deadline
                        ? new Date(application.opportunities.deadline).toLocaleDateString()
                        : undefined,
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      value={application.status}
                      onChange={event => void updateApplication(application.id, { status: event.target.value })}
                      className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary ${getStatusColor(application.status)}`}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-sm">
                    {editingCell?.appId === application.id && editingCell.field === 'url' ? (
                      renderEditableCell(application.id, 'url', application.opportunities.url || '')
                    ) : application.opportunities.url && !application.opportunities.url.startsWith('pasted-') ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={application.opportunities.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-32 truncate text-primary hover:underline"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => startEdit(application.id, 'url', application.opportunities.url || '')}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(application.id, 'url', '')}
                        className="text-muted-foreground hover:text-primary"
                      >
                        + Add link
                      </button>
                    )}
                  </td>
                  <td className="max-w-xs p-4 text-sm text-muted-foreground">
                    {renderEditableCell(application.id, 'notes', application.notes || '')}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => void deleteApplication(application.id)}
                      className="rounded p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                      aria-label={`Delete ${application.opportunities.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeModal === 'paste' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Paste timelines</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-muted-foreground">
              Paste an email, message, or event timeline. Separate opportunities by line for the best result.
            </p>
            <textarea
              className="mb-4 h-56 w-full rounded-xl border bg-secondary/10 p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={'Adobe — Student Insider — apply by 30 June 2026\nHackathon X — idea submission 5 July, video submission 12 July'}
              value={pasteText}
              onChange={event => setPasteText(event.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleParseTimelines()}
                disabled={isParsing || !pasteText.trim()}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              >
                {isParsing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isParsing ? 'Extracting…' : 'Extract & track'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'manual' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-4">
          <form
            onSubmit={event => void handleAddManually(event)}
            className="my-auto w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Add tracking item</h2>
                <p className="mt-1 text-sm text-muted-foreground">Jobs, hackathons, fellowships—anything with a timeline.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Company / organizer *
                <input
                  required
                  value={manualForm.company}
                  onChange={event => setManualForm(current => ({ ...current, company: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                  placeholder="Adobe"
                />
              </label>
              <label className="text-sm font-medium">
                Opportunity title *
                <input
                  required
                  value={manualForm.title}
                  onChange={event => setManualForm(current => ({ ...current, title: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                  placeholder="Student Insider"
                />
              </label>
              <label className="text-sm font-medium">
                Current status
                <select
                  value={manualForm.status}
                  onChange={event => setManualForm(current => ({ ...current, status: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Tracked / applied date
                <input
                  type="date"
                  value={manualForm.applied_date}
                  onChange={event => setManualForm(current => ({ ...current, applied_date: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                />
              </label>
              <label className="text-sm font-medium">
                Next deadline
                <input
                  type="date"
                  value={manualForm.deadline}
                  onChange={event => setManualForm(current => ({ ...current, deadline: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                />
              </label>
              <label className="text-sm font-medium">
                Link
                <input
                  type="url"
                  value={manualForm.url}
                  onChange={event => setManualForm(current => ({ ...current, url: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                  placeholder="https://…"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Notes / full timeline
                <textarea
                  value={manualForm.notes}
                  onChange={event => setManualForm(current => ({ ...current, notes: event.target.value }))}
                  className="mt-1.5 h-24 w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
                  placeholder="Idea submission, shortlist, final presentation…"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding || !manualForm.company.trim() || !manualForm.title.trim()}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
              >
                {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAdding ? 'Adding…' : 'Add to tracker'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
