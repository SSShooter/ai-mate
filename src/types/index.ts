// Core data types and interfaces for the quick note and prompt extension

export type RecordCategory = '灵感' | '待办' | '信条' | '其他'

export interface Record {
  id: string
  content: string
  category: RecordCategory
  sourceUrl: string
  sourceTitle: string
  createdAt: Date
  updatedAt: Date
}

export interface Prompt {
  id: string
  key: string
  title: string
  content: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface ShortcutConfig {
  quickRecord: string
  promptTrigger: string
}

export interface AppSettings {
  defaultCategory: RecordCategory
  enableNotifications: boolean
  shortcutKeys: ShortcutConfig
}

export interface StorageSchema {
  records: Record[]
  prompts: Prompt[]
  settings: AppSettings
}

// Error handling types
export enum ErrorType {
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
}

// Position interface for UI positioning
export interface Position {
  x: number
  y: number
}