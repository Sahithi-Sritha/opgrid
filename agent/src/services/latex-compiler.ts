import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { supabase } from '../config/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function compileLatexToPDF(latexSource: string): Promise<Buffer> {
  const tempId = uuidv4()
  const tempDir = '/tmp'
  const texFile = path.join(tempDir, `${tempId}.tex`)
  const pdfFile = path.join(tempDir, `${tempId}.pdf`)

  try {
    // Write LaTeX source to temp file
    fs.writeFileSync(texFile, latexSource)

    // Try tectonic first (modern, better error handling)
    try {
      execSync(`tectonic ${texFile} --outdir ${tempDir}`, {
        stdio: 'pipe',
        timeout: 30000
      })
    } catch (tectonicError) {
      console.log('Tectonic failed, trying pdflatex...')
      
      // Fallback to pdflatex
      execSync(`pdflatex -interaction=nonstopmode -output-directory ${tempDir} ${texFile}`, {
        stdio: 'pipe',
        timeout: 30000
      })
    }

    // Read compiled PDF
    if (!fs.existsSync(pdfFile)) {
      throw new Error('PDF compilation produced no output file')
    }

    const pdfBuffer = fs.readFileSync(pdfFile)

    // Clean up temp files
    fs.unlinkSync(texFile)
    fs.unlinkSync(pdfFile)
    
    // Clean up auxiliary files
    const auxFiles = ['.aux', '.log', '.out']
    auxFiles.forEach(ext => {
      const auxFile = path.join(tempDir, `${tempId}${ext}`)
      if (fs.existsSync(auxFile)) {
        fs.unlinkSync(auxFile)
      }
    })

    return pdfBuffer

  } catch (error) {
    // Clean up on error
    if (fs.existsSync(texFile)) fs.unlinkSync(texFile)
    if (fs.existsSync(pdfFile)) fs.unlinkSync(pdfFile)
    
    throw new Error(`LaTeX compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function uploadPDFToStorage(pdfBuffer: Buffer, filename: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(filename, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(filename)

  return urlData.publicUrl
}
