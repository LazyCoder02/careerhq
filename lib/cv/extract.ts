import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

/**
 * Extract plain text from an uploaded CV so we can mine it for skills.
 * Supports PDF, DOCX and plain text/markdown. Returns '' (never throws) on an
 * unsupported type or a parse failure — the caller treats empty text as
 * "couldn't read skills from this file" and surfaces that to the user.
 */
export async function extractCvText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()
  try {
    if (ext === 'pdf') {
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      return (result.text ?? '').trim()
    }
    if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      return (result.value ?? '').trim()
    }
    if (ext === 'txt' || ext === 'md') {
      return buffer.toString('utf8').trim()
    }
  } catch {
    return ''
  }
  return ''
}
