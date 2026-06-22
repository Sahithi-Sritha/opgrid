import { Router } from 'express'
import { supabase } from '../config/supabase'
import { decodeStoredStage, type ApplicationDeadline } from '../services/timeline-parser'

const router = Router()
const DAY_MS = 86_400_000
const TERMINAL_STATUSES = new Set(['rejected', 'offer', 'winner', 'ghosted'])

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

router.get('/', async (_req, res) => {
  try {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS)
    const sevenDaysAhead = new Date(today.getTime() + 7 * DAY_MS)

    const [applicationsResult, opportunitiesResult, notificationsResult] = await Promise.all([
      supabase
        .from('applications')
        .select('*, opportunities(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('opportunities')
        .select('id, title, company, deadline, url, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (applicationsResult.error) throw applicationsResult.error
    if (opportunitiesResult.error) throw opportunitiesResult.error

    const applications = (applicationsResult.data || []).map(decodeStoredStage) as Array<any & {
      deadlines: ApplicationDeadline[]
    }>
    const opportunities = opportunitiesResult.data || []
    const trackedOpportunityIds = new Set(applications.map(application => application.opportunity_id))
    const deadlines: any[] = []

    for (const application of applications) {
      const opportunity = application.opportunities
      if (!opportunity) continue
      const milestones = application.deadlines?.length
        ? application.deadlines
        : opportunity.deadline
          ? [{
            id: `original-${application.id}`,
            label: 'Application deadline',
            due_date: opportunity.deadline,
            completed: false,
          }]
          : []

      for (const milestone of milestones) {
        if (milestone.completed) continue
        const due = new Date(`${milestone.due_date}T00:00:00Z`)
        const daysRemaining = Math.round((due.getTime() - today.getTime()) / DAY_MS)
        deadlines.push({
          id: `${application.id}:${milestone.id}`,
          deadline_id: milestone.id,
          application_id: application.id,
          opportunity_id: opportunity.id,
          label: milestone.label,
          title: opportunity.title,
          company: opportunity.company,
          status: application.status,
          deadline: milestone.due_date,
          days_remaining: daysRemaining,
          urgency_level: daysRemaining <= 3 ? 'urgent' : daysRemaining <= 7 ? 'warning' : 'normal',
          already_applied: true,
          can_complete: !milestone.id.startsWith('original-'),
          url: opportunity.url,
        })
      }
    }

    for (const opportunity of opportunities) {
      if (!opportunity.deadline || trackedOpportunityIds.has(opportunity.id)) continue
      const due = new Date(`${opportunity.deadline}T00:00:00Z`)
      const daysRemaining = Math.round((due.getTime() - today.getTime()) / DAY_MS)
      deadlines.push({
        id: `opportunity:${opportunity.id}`,
        deadline_id: null,
        application_id: null,
        opportunity_id: opportunity.id,
        label: 'Application deadline',
        title: opportunity.title,
        company: opportunity.company,
        status: 'to_apply',
        deadline: opportunity.deadline,
        days_remaining: daysRemaining,
        urgency_level: daysRemaining <= 3 ? 'urgent' : daysRemaining <= 7 ? 'warning' : 'normal',
        already_applied: false,
        can_complete: false,
        url: opportunity.url,
      })
    }

    deadlines.sort((a, b) => a.deadline.localeCompare(b.deadline))
    const upcomingDeadlines = deadlines.filter(deadline => deadline.days_remaining >= 0)
    const activePipeline = applications.filter(application => !TERMINAL_STATUSES.has(application.status)).length
    const applicationsThisWeek = applications.filter(application =>
      application.applied_date && application.applied_date >= dateOnly(sevenDaysAgo),
    ).length
    const deadlinesNextWeek = upcomingDeadlines.filter(deadline =>
      deadline.deadline <= dateOnly(sevenDaysAhead),
    ).length

    const sparkline = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo.getTime() + index * DAY_MS)
      const value = dateOnly(date)
      return {
        date: value,
        count: opportunities.filter(opportunity => opportunity.created_at?.slice(0, 10) === value).length,
      }
    })

    const applicationActivities = applications.slice(0, 12).map(application => ({
      id: `application-${application.id}`,
      type: application.status === 'to_apply' ? 'tracked' : 'applied',
      title: application.opportunities?.title || 'Tracked opportunity',
      body: `${application.opportunities?.company || 'Unknown company'} · ${String(application.status).replace(/_/g, ' ')}`,
      created_at: application.created_at,
    }))
    const notificationActivities = notificationsResult.error ? [] : (notificationsResult.data || [])
    const activities = [...notificationActivities, ...applicationActivities]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 20)

    res.json({
      stats: {
        total_opportunities: opportunities.length,
        applications_this_week: applicationsThisWeek,
        deadlines_next_7_days: deadlinesNextWeek,
        active_pipeline: activePipeline,
        tracked_applications: applications.length,
      },
      deadlines,
      activities,
      sparkline,
    })
  } catch (error) {
    console.error('Dashboard load error:', error)
    res.status(500).json({ error: 'Failed to load dashboard' })
  }
})

export default router
