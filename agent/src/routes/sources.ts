import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const sourcesFilePath = path.join(process.cwd(), 'custom_sources.json');

// Helper to read sources
function readSources(): string[] {
  try {
    if (!fs.existsSync(sourcesFilePath)) {
      fs.writeFileSync(sourcesFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(sourcesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading custom sources:', error);
    return [];
  }
}

// Helper to write sources
function writeSources(sources: string[]) {
  try {
    fs.writeFileSync(sourcesFilePath, JSON.stringify(sources, null, 2));
  } catch (error) {
    console.error('Error writing custom sources:', error);
  }
}

// GET /api/sources
router.get('/', (req, res) => {
  const sources = readSources();
  res.json({ sources });
});

// POST /api/sources
router.post('/', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  const sources = readSources();
  if (sources.includes(url)) {
    return res.status(400).json({ error: 'Source already exists' });
  }

  sources.push(url);
  writeSources(sources);
  res.status(201).json({ message: 'Source added successfully', sources });
});

// DELETE /api/sources
router.delete('/', (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }
  
  let sources = readSources();
  if (!sources.includes(url)) {
    return res.status(404).json({ error: 'Source not found' });
  }

  sources = sources.filter(s => s !== url);
  writeSources(sources);
  res.json({ message: 'Source deleted successfully', sources });
});

export default router;
