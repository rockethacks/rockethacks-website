import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

// For pdf-parse v2.4+, we need to import differently based on environment
// In Node.js (API routes), we use the node-specific export
let pdfParseCache: any = null

async function getPdfParse() {
  if (pdfParseCache) return pdfParseCache
  
  try {
    // pdf-parse v2.4+ has node-specific exports
    // @ts-ignore - dynamic module with different export patterns
    const pdfParseModule = await import('pdf-parse/node')
    // The module might export as default or as named export
    // @ts-ignore
    pdfParseCache = pdfParseModule.default || pdfParseModule.parse || pdfParseModule
    console.log('Loaded pdf-parse/node successfully')
    return pdfParseCache
  } catch (error: any) {
    console.error('Failed to import pdf-parse/node:', error.message)
    // Fallback: try regular import
    try {
      // @ts-ignore
      const pdfParseModule = await import('pdf-parse')
      // @ts-ignore
      pdfParseCache = pdfParseModule.default || pdfParseModule
      console.log('Loaded pdf-parse (fallback) successfully')
      return pdfParseCache
    } catch (fallbackError: any) {
      console.error('Failed to import pdf-parse:', fallbackError.message)
      throw new Error('pdf-parse module not available')
    }
  }
}

/**
 * Convert plain text resume to markdown format
 */
function convertToMarkdown(text: string): string {
  // Split into lines and clean up
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let markdown = '# Resume\n\n'
  let currentSection = ''

  for (const line of lines) {
    // Detect section headers (lines that might be all caps or end with colon)
    if (
      line.toUpperCase() === line && 
      line.length < 50 && 
      line.length > 2 &&
      !line.match(/^\d/)
    ) {
      currentSection = line
      markdown += `\n## ${line}\n\n`
    } 
    // Check for lines ending with colon (another common header format)
    else if (line.endsWith(':') && line.length < 50) {
      currentSection = line.slice(0, -1)
      markdown += `\n## ${currentSection}\n\n`
    }
    // Detect bullet points or list items
    else if (line.match(/^[•\-\*\+]\s/)) {
      markdown += `${line}\n`
    }
    // Detect dates (common in experience sections)
    else if (line.match(/\d{4}\s*[-–]\s*(\d{4}|present|current)/i)) {
      markdown += `**${line}**\n\n`
    }
    // Regular content
    else {
      // Check if this looks like a title (short line after a section header)
      if (line.length < 60 && currentSection) {
        markdown += `**${line}**\n\n`
      } else {
        markdown += `${line}\n\n`
      }
    }
  }

  return markdown
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let text = ''

    // Parse based on file type
    if (file.type === 'application/pdf') {
      try {
        console.log('Attempting to parse PDF...')
        const pdfParse = await getPdfParse()
        console.log('pdf-parse loaded, parsing buffer of size:', buffer.length)
        
        // Call pdfParse - it should be a function
        // @ts-ignore - pdf-parse returns a promise with text property
        const pdfData = await pdfParse(buffer)
        console.log('PDF parsed successfully, text length:', pdfData?.text?.length || 0)
        text = pdfData.text
        
        if (!text || text.trim().length === 0) {
          throw new Error('PDF parsing returned empty text')
        }
      } catch (pdfError: any) {
        console.error('PDF parsing error details:', {
          message: pdfError.message,
          stack: pdfError.stack,
          name: pdfError.name
        })
        throw new Error(`PDF parsing failed: ${pdfError.message}`)
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF or DOCX.' },
        { status: 400 }
      )
    }

    // Convert to markdown
    const markdown = convertToMarkdown(text)

    return NextResponse.json({ markdown })
  } catch (error: any) {
    console.error('Error parsing resume:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume' },
      { status: 500 }
    )
  }
}
