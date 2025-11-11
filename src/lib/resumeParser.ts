/**
 * Parse a resume file (PDF or DOCX) and convert to markdown
 * Client-side version - sends file to API for parsing
 * @param file - The file to parse
 * @returns Markdown formatted text
 */
export async function parseResume(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/resume/parse', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to parse resume')
  }

  const data = await response.json()
  return data.markdown
}

/**
 * Server-side resume parsing function
 * This should only be imported in server-side code (API routes)
 * Note: This uses dynamic imports to avoid bundling server-side dependencies in client code
 */
export async function parseResumeServer(file: Buffer, fileType: string): Promise<string> {
  let text = ''

  try {
    if (fileType === 'application/pdf') {
      // pdf-parse is a CommonJS module, need to handle it carefully
      // @ts-ignore - pdf-parse has ESM wrapper but types are not perfect
      const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'))
      // @ts-ignore
      const pdfData = await pdfParse(file)
      text = pdfData.text
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer: file })
      text = result.value
    } else {
      throw new Error('Unsupported file type')
    }

    // Convert to markdown format
    return convertToMarkdown(text)
  } catch (error) {
    console.error('Error parsing resume:', error)
    throw error // Re-throw the original error for better debugging
  }
}

/**
 * Convert plain text resume to markdown format
 * This is a basic converter - you can enhance it with better parsing logic
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

/**
 * Extract structured data from resume text
 * This is a basic implementation - you can enhance with NLP/AI services
 */
export function extractResumeData(text: string): {
  email?: string
  phone?: string
  linkedin?: string
  github?: string
} {
  const data: any = {}

  // Extract email
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/)
  if (emailMatch) data.email = emailMatch[0]

  // Extract phone
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) data.phone = phoneMatch[0]

  // Extract LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/)
  if (linkedinMatch) data.linkedin = `https://${linkedinMatch[0]}`

  // Extract GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/)
  if (githubMatch) data.github = `https://${githubMatch[0]}`

  return data
}
