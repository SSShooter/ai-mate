import type { Record, Prompt, RecordCategory } from "~types"

/**
 * Utility functions for data validation and manipulation
 */

/**
 * Generate a unique ID using timestamp and random string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate record data
 */
export function validateRecord(record: Partial<Record>): string[] {
  const errors: string[] = []
  
  if (!record.content || record.content.trim().length === 0) {
    errors.push('记录内容不能为空')
  }
  
  if (!record.category) {
    errors.push('记录分组不能为空')
  } else if (!isValidRecordCategory(record.category)) {
    errors.push('无效的记录分组')
  }
  
  if (!record.sourceUrl || !isValidUrl(record.sourceUrl)) {
    errors.push('无效的来源URL')
  }
  
  if (!record.sourceTitle || record.sourceTitle.trim().length === 0) {
    errors.push('来源标题不能为空')
  }
  
  return errors
}

/**
 * Validate prompt data
 */
export function validatePrompt(prompt: Partial<Prompt>): string[] {
  const errors: string[] = []
  
  if (!prompt.key || prompt.key.trim().length === 0) {
    errors.push('Prompt key不能为空')
  } else if (!isValidPromptKey(prompt.key)) {
    errors.push('Prompt key只能包含字母、数字、下划线和连字符')
  }
  
  if (!prompt.title || prompt.title.trim().length === 0) {
    errors.push('Prompt标题不能为空')
  }
  
  if (!prompt.content || prompt.content.trim().length === 0) {
    errors.push('Prompt内容不能为空')
  }
  
  return errors
}

/**
 * Check if a string is a valid record category
 */
export function isValidRecordCategory(category: string): category is RecordCategory {
  return ['灵感', '待办', '信条', '其他'].includes(category)
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a prompt key is valid (alphanumeric, underscore, hyphen only)
 */
export function isValidPromptKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(key)
}

/**
 * Create a new record with default values
 */
export function createRecord(
  content: string,
  category: RecordCategory,
  sourceUrl: string,
  sourceTitle: string
): Record {
  const now = new Date()
  
  return {
    id: generateId(),
    content: content.trim(),
    category,
    sourceUrl,
    sourceTitle: sourceTitle.trim(),
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Create a new prompt with default values
 */
export function createPrompt(
  key: string,
  title: string,
  content: string,
  description?: string
): Prompt {
  const now = new Date()
  
  return {
    id: generateId(),
    key: key.trim(),
    title: title.trim(),
    content: content.trim(),
    description: description?.trim(),
    createdAt: now,
    updatedAt: now
  }
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Search records by content
 */
export function searchRecords(records: Record[], query: string): Record[] {
  if (!query.trim()) return records
  
  const searchTerm = query.toLowerCase().trim()
  return records.filter(record => 
    record.content.toLowerCase().includes(searchTerm) ||
    record.sourceTitle.toLowerCase().includes(searchTerm)
  )
}

/**
 * Search prompts by key, title, or content
 */
export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  if (!query.trim()) return prompts
  
  const searchTerm = query.toLowerCase().trim()
  return prompts.filter(prompt => 
    prompt.key.toLowerCase().includes(searchTerm) ||
    prompt.title.toLowerCase().includes(searchTerm) ||
    prompt.content.toLowerCase().includes(searchTerm) ||
    (prompt.description && prompt.description.toLowerCase().includes(searchTerm))
  )
}