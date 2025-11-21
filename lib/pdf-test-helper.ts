/**
 * PDF Parsing Test Helper
 *
 * Use this to debug and verify PDF text extraction is working correctly
 * All parsing happens on the frontend using PDF.js
 */

import { extractTextFromPDF } from './file-parser'

export interface PDFTestResult {
  success: boolean
  fileName: string
  pages?: number
  totalCharacters: number
  emptyPages?: number
  extractedText: string
  preview: string
  error?: string
}

/**
 * Test PDF parsing and return detailed diagnostics
 */
export async function testPDFParsing(file: File): Promise<PDFTestResult> {
  const result: PDFTestResult = {
    success: false,
    fileName: file.name,
    totalCharacters: 0,
    extractedText: '',
    preview: '',
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🧪 PDF PARSING TEST (Frontend Only)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`File: ${file.name}`)
    console.log(`Size: ${(file.size / 1024).toFixed(2)} KB`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('⚙️ Using CLIENT-SIDE parsing (PDF.js)...')
    const extractedText = await extractTextFromPDF(file)

    result.extractedText = extractedText
    result.totalCharacters = extractedText.length

    // Count pages
    const pageMatches = extractedText.match(/--- Page \d+ ---/g)
    result.pages = pageMatches?.length || 0

    // Count empty pages
    const emptyPageMatches = extractedText.match(/\[Empty page - possibly scanned image\]/g)
    result.emptyPages = emptyPageMatches?.length || 0

    // Create preview (first 1000 characters)
    result.preview = extractedText.substring(0, 1000)

    result.success = true

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ PARSING SUCCESSFUL')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📄 Pages: ${result.pages}`)
    console.log(`⚠️ Empty Pages: ${result.emptyPages}`)
    console.log(`📝 Total Characters: ${result.totalCharacters}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 PREVIEW (First 1000 chars):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(result.preview)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Warnings
    if (result.emptyPages && result.emptyPages > 0) {
      console.warn('⚠️ WARNING: Some pages are empty (possibly scanned images)')
      console.warn(`   ${result.emptyPages} of ${result.pages} pages have no extractable text`)
    }

    if (result.totalCharacters < 100) {
      console.warn('⚠️ WARNING: Very little text extracted')
      console.warn('   This PDF may be image-based or corrupted')
    }

    return result
  } catch (error) {
    result.success = false
    result.error = error instanceof Error ? error.message : 'Unknown error'

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ PARSING FAILED')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', result.error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return result
  }
}

/**
 * Test multiple PDFs and compare results
 */
export async function testMultiplePDFs(files: File[]): Promise<PDFTestResult[]> {
  console.log(`\n🧪 Testing ${files.length} PDF file(s)...\n`)

  const results: PDFTestResult[] = []

  for (const file of files) {
    const result = await testPDFParsing(file)
    results.push(result)
    console.log('\n')
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Total Files: ${files.length}`)
  console.log(`Successful: ${results.filter((r) => r.success).length}`)
  console.log(`Failed: ${results.filter((r) => !r.success).length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌'
    const chars = result.totalCharacters > 0 ? `${result.totalCharacters} chars` : 'No text'
    console.log(`${status} ${result.fileName} - ${chars}`)
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return results
}

/**
 * Create a test component you can use in development
 * Usage: Add this to any page and upload a PDF to test
 */
export function createPDFTestComponent() {
  return `
import { testPDFParsing } from '@/lib/pdf-test-helper'

function PDFTester() {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('Testing frontend PDF parsing...')
    const result = await testPDFParsing(file)

    if (result.success) {
      alert(\`✅ Success! Extracted \${result.totalCharacters} characters from \${result.pages} pages\`)
    } else {
      alert(\`❌ Failed: \${result.error}\`)
    }
  }

  return (
    <div style={{ padding: '20px', border: '2px dashed #ccc' }}>
      <h2>PDF Parser Test (Frontend Only)</h2>
      <input type="file" accept=".pdf" onChange={handleFileSelect} />
      <p>Check browser console for detailed logs</p>
      <p><small>All parsing happens in your browser using PDF.js</small></p>
    </div>
  )
}
`
}
