import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'

const router = Router()

/**
 * POST /api/workflow/dispatch
 *
 * Triggers the GitHub Actions "OpGrid scheduled agent" workflow via
 * the workflow_dispatch event.  Requires GITHUB_PAT, GITHUB_OWNER,
 * and GITHUB_REPO environment variables.
 *
 * Body (optional):
 *   { "task": "scrape" | "deadlines" | "digest" | "follow-ups" | "all" }
 */
router.post('/dispatch', requireAdmin, async (req, res) => {
  const pat = process.env.GITHUB_PAT
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const workflowFile = process.env.GITHUB_WORKFLOW_FILE || 'opgrid-schedule.yml'

  if (!pat || !owner || !repo) {
    res.status(503).json({
      error: 'GitHub workflow dispatch is not configured. Set GITHUB_PAT, GITHUB_OWNER, and GITHUB_REPO in .env',
    })
    return
  }

  const validTasks = ['scrape', 'deadlines', 'digest', 'follow-ups', 'all']
  const task: string = req.body?.task || 'scrape'

  if (!validTasks.includes(task)) {
    res.status(400).json({
      error: `Invalid task "${task}". Choose: ${validTasks.join(', ')}`,
    })
    return
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${pat}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: branch,
        inputs: { task },
      }),
    })

    if (response.status === 204) {
      console.log(`[workflow] Dispatched "${task}" on ${owner}/${repo}@${branch}`)
      res.json({
        dispatched: true,
        task,
        message: `Workflow "${task}" triggered successfully on GitHub Actions`,
      })
      return
    }

    const body = await response.text()
    console.error(`[workflow] GitHub API returned ${response.status}: ${body}`)
    res.status(response.status).json({
      dispatched: false,
      error: `GitHub API returned ${response.status}`,
      details: body,
    })
  } catch (error) {
    console.error('[workflow] Failed to dispatch:', error)
    res.status(500).json({
      dispatched: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
