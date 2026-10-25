import type { NextFunction, Request, Response } from 'express'
import { runWithUserClient, serviceSupabase } from '../config/supabase'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.INTERNAL_JOB_SECRET && req.header('x-internal-job-secret') === process.env.INTERNAL_JOB_SECRET) {
    return next()
  }
  const header = req.header('authorization')
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) return res.status(401).json({ error: 'Authentication required' })

  const { data, error } = await serviceSupabase.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ error: 'Session is invalid or expired' })

  res.locals.user = data.user
  runWithUserClient(token, () => next())
}

export function requireInternal(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.INTERNAL_JOB_SECRET
  if (!secret || req.header('x-internal-job-secret') !== secret) {
    return res.status(401).json({ error: 'Internal job authorization required' })
  }
  next()
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (process.env.INTERNAL_JOB_SECRET && _req.header('x-internal-job-secret') === process.env.INTERNAL_JOB_SECRET) return next()
  if (res.locals.user?.app_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' })
  }
  next()
}
