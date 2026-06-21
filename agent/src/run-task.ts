import 'dotenv/config'
import { startScrapers, runHackathonScrapers } from './scheduler/jobs'
import { sendDailyDigest } from './notifier/email'
import { checkDeadlines, checkFollowUps } from './scheduler/deadlines'

type Task = 'scrape' | 'digest' | 'deadlines' | 'follow-ups' | 'all'

async function run(task: Task) {
  switch (task) {
    case 'scrape':
      await startScrapers()
      await runHackathonScrapers()
      return
    case 'digest':
      await sendDailyDigest()
      return
    case 'deadlines':
      await checkDeadlines()
      return
    case 'follow-ups':
      await checkFollowUps()
      return
    case 'all':
      await startScrapers()
      await runHackathonScrapers()
      await checkDeadlines()
      await checkFollowUps()
      await sendDailyDigest()
      return
  }
}

const requestedTask = (process.argv[2] || 'scrape') as Task
const validTasks: Task[] = ['scrape', 'digest', 'deadlines', 'follow-ups', 'all']

if (!validTasks.includes(requestedTask)) {
  console.error(`Unknown task "${requestedTask}". Choose: ${validTasks.join(', ')}`)
  process.exitCode = 1
} else {
  run(requestedTask).catch((error) => {
    console.error(`Scheduled task "${requestedTask}" failed:`, error)
    process.exitCode = 1
  })
}
