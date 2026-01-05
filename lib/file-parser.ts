/**
 * 文件解析工具
 * 支持 PDF 和 Word (.docx) 文件的前端解析
 */

// 动态导入 PDF.js，避免 SSR 问题
let pdfjsLib: typeof import('pdfjs-dist') | null = null

// 在客户端环境初始化 PDF.js
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((module) => {
    pdfjsLib = module
    // 设置 worker
    module.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${module.version}/pdf.worker.min.js`
  })
}

// 动态导入 mammoth
let mammoth: typeof import('mammoth') | null = null
if (typeof window !== 'undefined') {
  import('mammoth').then((module) => {
    mammoth = module.default || module
  })
}

// 文件大小限制 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// 文本长度限制 (约 8000 字)
export const MAX_TEXT_LENGTH = 8000

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx']

/**
 * 文件解析结果
 */
export interface ParseResult {
  success: boolean
  text: string
  error?: string
  truncated?: boolean // 是否被截断
  originalLength?: number // 原始文本长度
}

/**
 * 验证文件是否符合要求
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `文件大小超过限制，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // 检查文件类型
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `不支持的文件格式，请上传 PDF 或 Word (.docx) 文件`
    }
  }

  return { valid: true }
}

/**
 * 解析 PDF 文件
 */
async function parsePDF(file: File): Promise<ParseResult> {
  try {
    // 确保 PDF.js 已加载
    if (!pdfjsLib) {
      pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''
    const numPages = pdf.numPages

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
      fullText += pageText + '\n'
    }

    // 清理文本
    fullText = cleanText(fullText)

    // 检查文本长度
    if (fullText.length > MAX_TEXT_LENGTH) {
      return {
        success: false,
        text: '',
        error: `文档内容过长（${fullText.length} 字），建议上传精简版文档（最多 ${MAX_TEXT_LENGTH} 字）`,
        truncated: true,
        originalLength: fullText.length
      }
    }

    if (fullText.trim().length === 0) {
      return {
        success: false,
        text: '',
        error: '无法从 PDF 中提取文本内容，可能是扫描版 PDF'
      }
    }

    return {
      success: true,
      text: fullText
    }
  } catch (error) {
    console.error('PDF 解析错误:', error)
    return {
      success: false,
      text: '',
      error: 'PDF 文件解析失败，请确保文件未损坏'
    }
  }
}

/**
 * 解析 Word (.docx) 文件
 */
async function parseWord(file: File): Promise<ParseResult> {
  try {
    // 确保 mammoth 已加载
    if (!mammoth) {
      const module = await import('mammoth')
      mammoth = module.default || module
    }

    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    let fullText = result.value

    // 清理文本
    fullText = cleanText(fullText)

    // 检查文本长度
    if (fullText.length > MAX_TEXT_LENGTH) {
      return {
        success: false,
        text: '',
        error: `文档内容过长（${fullText.length} 字），建议上传精简版文档（最多 ${MAX_TEXT_LENGTH} 字）`,
        truncated: true,
        originalLength: fullText.length
      }
    }

    if (fullText.trim().length === 0) {
      return {
        success: false,
        text: '',
        error: '无法从 Word 文档中提取文本内容'
      }
    }

    return {
      success: true,
      text: fullText
    }
  } catch (error) {
    console.error('Word 解析错误:', error)
    return {
      success: false,
      text: '',
      error: 'Word 文件解析失败，请确保文件未损坏'
    }
  }
}

/**
 * 清理文本
 */
function cleanText(text: string): string {
  return text
    // 移除多余空白
    .replace(/\s+/g, ' ')
    // 移除特殊控制字符
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 规范化换行
    .replace(/\n\s*\n/g, '\n')
    .trim()
}

/**
 * 解析文件（自动识别类型）
 */
export async function parseFile(file: File): Promise<ParseResult> {
  // 先验证文件
  const validation = validateFile(file)
  if (!validation.valid) {
    return {
      success: false,
      text: '',
      error: validation.error
    }
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (extension === '.pdf') {
    return parsePDF(file)
  } else if (extension === '.docx') {
    return parseWord(file)
  }

  return {
    success: false,
    text: '',
    error: '不支持的文件格式'
  }
}
