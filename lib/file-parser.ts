import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/browser/esm'

// Configure PDF.js worker - use local worker from public folder
if (typeof window !== 'undefined') {
  // Point to the worker file served from /public
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('[PDF Parser] Starting PDF extraction for:', file.name)
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    console.log(`[PDF Parser] PDF loaded: ${pdf.numPages} pages`)

    let fullText = ''
    let totalCharacters = 0
    let emptyPages = 0

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      // Extract text with better spacing and structure
      const pageText = textContent.items
        .map((item: any) => {
          // Preserve text structure with proper spacing
          if ('str' in item) {
            return item.str
          }
          return ''
        })
        .filter((text: string) => text.trim().length > 0)
        .join(' ')
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim()

      // Debug logging
      const pageLength = pageText.length
      totalCharacters += pageLength

      console.log(`[PDF Parser] Page ${i}: ${pageLength} characters`)

      if (pageLength === 0) {
        emptyPages++
        console.warn(`[PDF Parser] ⚠️ Page ${i} is EMPTY - might be image-based/scanned`)
      } else {
        console.log(`[PDF Parser] Page ${i} first 200 chars:`, pageText.substring(0, 200))
      }

      // Add page marker and content
      if (pageText.length > 0) {
        fullText += `\n--- Page ${i} ---\n${pageText}\n`
      } else {
        fullText += `\n--- Page ${i} ---\n[Empty page - possibly scanned image]\n`
      }
    }

    console.log('[PDF Parser] ✅ Extraction complete:')
    console.log(`  - Total pages: ${pdf.numPages}`)
    console.log(`  - Empty pages: ${emptyPages}`)
    console.log(`  - Total characters: ${totalCharacters}`)
    console.log(`  - Output length: ${fullText.length}`)

    // Warning if PDF appears to be image-based
    if (emptyPages === pdf.numPages) {
      console.error('[PDF Parser] ❌ All pages are empty!')
      console.error('[PDF Parser] This PDF is likely image-based/scanned and requires OCR')
      throw new Error(
        'This PDF appears to be image-based (scanned). Text extraction requires OCR. ' +
        'Please use a text-based PDF or contact support for OCR processing.'
      )
    }

    if (emptyPages > 0) {
      console.warn(
        `[PDF Parser] ⚠️ ${emptyPages} of ${pdf.numPages} pages are empty. ` +
        'These may be scanned images requiring OCR.'
      )
    }

    const result = fullText.trim()

    if (result.length === 0) {
      throw new Error('No text content extracted from PDF. The file may be corrupted or image-based.')
    }

    console.log('[PDF Parser] First 500 chars of final output:', result.substring(0, 500))

    return result
  } catch (error) {
    console.error('[PDF Parser] ❌ Error extracting text from PDF:', error)
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from Word document (.docx)
 */
export async function extractTextFromWord(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    if (result.messages.length > 0) {
      console.warn('Mammoth warnings:', result.messages)
    }

    return result.value.trim()
  } catch (error) {
    console.error('Error extracting text from Word:', error)
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from Excel file (.xlsx, .xls)
 */
export async function extractTextFromExcel(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    let fullText = ''

    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName]
      const sheetText = XLSX.utils.sheet_to_txt(sheet, { FS: '\t', RS: '\n' })

      fullText += `\n--- Sheet ${index + 1}: ${sheetName} ---\n${sheetText}\n`
    })

    return fullText.trim()
  } catch (error) {
    console.error('Error extracting text from Excel:', error)
    throw new Error(`Failed to extract text from Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from CSV file
 */
export async function extractTextFromCSV(file: File): Promise<string> {
  try {
    const text = await file.text()

    return new Promise((resolve, reject) => {
      const records: string[][] = []

      parse(text, {
        trim: true,
        skip_empty_lines: true,
      })
        .on('data', (row) => records.push(row))
        .on('error', (error) => reject(error))
        .on('end', () => {
          // Convert CSV records to formatted text
          const formattedText = records
            .map((row, index) => {
              if (index === 0) {
                // Header row
                return `Headers: ${row.join(' | ')}\n`
              }
              return row.join(' | ')
            })
            .join('\n')

          resolve(formattedText)
        })
    })
  } catch (error) {
    console.error('Error extracting text from CSV:', error)
    throw new Error(`Failed to extract text from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  try {
    return await file.text()
  } catch (error) {
    console.error('Error reading text file:', error)
    throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Main parser function - dispatches to appropriate parser based on file type
 */
export async function parseFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  // PDF files
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file)
  }

  // Word documents
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword' ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')
  ) {
    return await extractTextFromWord(file)
  }

  // Excel files
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    fileType === 'application/vnd.ms-excel' ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls')
  ) {
    return await extractTextFromExcel(file)
  }

  // CSV files
  if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    return await extractTextFromCSV(file)
  }

  // Plain text files
  if (
    fileType === 'text/plain' ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json')
  ) {
    return await extractTextFromTXT(file)
  }

  // Unsupported file type
  throw new Error(`Unsupported file type: ${fileType || 'unknown'} (${file.name})`)
}

/**
 * Parse multiple files and return array of extracted text
 * All parsing happens on the frontend
 */
export async function parseFiles(files: File[]): Promise<string[]> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`[File Parser] 📄 Starting to parse ${files.length} file(s)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const results: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`\n[File Parser] Processing file ${i + 1}/${files.length}: ${file.name}`)

    try {
      const text = await parseFile(file)
      results.push(text)

      console.log(`[File Parser] ✅ Successfully parsed: ${file.name}`)
      console.log(`[File Parser] Extracted length: ${text.length} characters`)
      console.log(`[File Parser] First 300 chars:`)
      console.log(`────────────────────────────────────────`)
      console.log(text.substring(0, 300))
      console.log(`────────────────────────────────────────`)
    } catch (error) {
      console.error(`[File Parser] ❌ Failed to parse ${file.name}:`, error)
      // Continue with other files, but add error message
      results.push(`[Error parsing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}]`)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('[File Parser] 📊 PARSING SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Total files: ${files.length}`)
  console.log(`Successfully parsed: ${results.filter(r => !r.startsWith('[Error')).length}`)
  console.log(`Failed: ${results.filter(r => r.startsWith('[Error')).length}`)
  console.log('\n[File Parser] 📦 COMPLETE PARSED OUTPUT:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  results.forEach((text, index) => {
    console.log(`\n[File Parser] File ${index + 1} Output (${text.length} chars):`)
    console.log('────────────────────────────────────────')
    console.log(text.substring(0, 500)) // Show first 500 chars
    if (text.length > 500) {
      console.log(`\n... (${text.length - 500} more characters)`)
    }
    console.log('────────────────────────────────────────')
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return results
}
