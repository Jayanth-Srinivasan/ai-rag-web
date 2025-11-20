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
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      fullText += `\n--- Page ${i} ---\n${pageText}\n`
    }

    return fullText.trim()
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
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
 */
export async function parseFiles(files: File[]): Promise<string[]> {
  const results: string[] = []

  for (const file of files) {
    try {
      const text = await parseFile(file)
      results.push(text)
    } catch (error) {
      console.error(`Failed to parse ${file.name}:`, error)
      // Continue with other files, but add error message
      results.push(`[Error parsing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}]`)
    }
  }

  return results
}
