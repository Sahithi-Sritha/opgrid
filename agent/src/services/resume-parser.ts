import fs from 'fs'
import pdfParse from 'pdf-parse'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function extractPDFText(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(dataBuffer)
  return data.text
}

export async function pdfToLatex(extractedText: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are a LaTeX resume expert. Convert the extracted text from a PDF resume into clean, compilable LaTeX code using the standard resume template (article class, custom sections). 

Preserve ALL content exactly. Use \\section{}, \\subsection{}, itemize for bullets. 

Output ONLY the complete .tex file content, no explanation, no markdown code blocks.

Here is extracted resume text:

${extractedText}

Reconstruct as LaTeX. Use this preamble:

\\documentclass[a4paper,11pt]{article}
\\usepackage{latexsym,fullpage,titlesec,marvosym,verbatim,enumitem,hyperref,fancyhdr,tabularx,multicol,fontawesome5,color,graphicx}
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\begin{document}

% Your content here

\\end{document}`

  const result = await model.generateContent(prompt)
  const response = result.response
  let latex = response.text().trim()
  latex = latex.replace(/```latex\n?/g, '').replace(/```\n?/g, '')
  return latex
}
