import fs from 'fs';
import path from 'path';

let loadedKeys: string[] = [];

function loadKeysFromFile() {
  if (loadedKeys.length > 0) return;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('GEMINI_API_KEY=') || line.trim().startsWith('GEMINI_API_KEYS=')) {
          const val = line.split('=')[1].trim();
          if (val) {
            val.split(',').forEach(k => loadedKeys.push(k.trim()));
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  
  if (loadedKeys.length === 0 && process.env.GEMINI_API_KEY) {
    loadedKeys.push(process.env.GEMINI_API_KEY);
  }
}

export function getGeminiKey(): string {
  loadKeysFromFile();
  
  if (loadedKeys.length === 0) return '';

  // Round robin
  if (typeof (getGeminiKey as any).counter === 'undefined') {
    (getGeminiKey as any).counter = 0;
  }

  const key = loadedKeys[(getGeminiKey as any).counter % loadedKeys.length];
  (getGeminiKey as any).counter++;

  return key;
}
