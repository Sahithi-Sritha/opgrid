import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();
// GET /api/sources
router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('user_sources').select('url').order('created_at');
  if (error) return res.status(500).json({ error: 'Failed to load custom sources' });
  res.json({ sources: (data || []).map(row => row.url) });
});

// POST /api/sources
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  try { new URL(url.startsWith('http') ? url : `https://${url}`) } catch { return res.status(400).json({ error: 'A valid URL is required' }) }
  const { error } = await supabase.from('user_sources').insert({ url });
  if (error?.code === '23505') return res.status(400).json({ error: 'Source already exists' });
  if (error) return res.status(500).json({ error: 'Failed to add custom source' });
  const { data } = await supabase.from('user_sources').select('url').order('created_at');
  res.status(201).json({ message: 'Source added successfully', sources: (data || []).map(row => row.url) });
});

// DELETE /api/sources
router.delete('/', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  const { data, error } = await supabase.from('user_sources').delete().eq('url', url).select('url');
  if (error) return res.status(500).json({ error: 'Failed to remove custom source' });
  if (!data?.length) return res.status(404).json({ error: 'Source not found' });
  const { data: sources } = await supabase.from('user_sources').select('url').order('created_at');
  res.json({ message: 'Source deleted successfully', sources: (sources || []).map(row => row.url) });
});

export default router;
