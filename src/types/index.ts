// Core data types and interfaces for the quick note and prompt extension

export type RecordCategory = "inspiration" | "todo" | "principle" | "other"

export interface Record {
  id: string
  content: string
  category: RecordCategory
  sourceUrl: string
  sourceTitle: string
  createdAt: number
  updatedAt: number
  deleted?: boolean
  deletedAt?: number
}

export interface Prompt {
  id: string
  key: string
  title: string
  content: string
  description?: string
  createdAt: number
  updatedAt: number
  deleted?: boolean
  deletedAt?: number
}

export interface ShortcutConfig {
  saveToInspiration: string
  saveToTodo: string
  saveToPrinciple: string
  saveToOther: string
  saveClipboardToOther: string
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
  STORAGE_ERROR = "STORAGE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PERMISSION_ERROR = "PERMISSION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR"
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

// Sync related types
export interface SyncConfig {
  workerUrl: string
  apiKey: string
  enabled: boolean
  autoSync: boolean
  syncInterval: number // minutes
}

export const SyncStatus = {
  IDLE: "idle",
  SYNCING: "syncing",
  SUCCESS: "success",
  ERROR: "error",
  CONFLICT: "conflict"
} as const

export type SyncStatusType = typeof SyncStatus[keyof typeof SyncStatus]

export interface SyncState {
  status: SyncStatusType
  lastSyncTime: number | null
  lastErrorMessage: string | null
  isConfigured: boolean
}

export interface SyncData {
  records: Record[]
  prompts: Prompt[]
  settings: AppSettings
  lastSyncTime: number | null
}

export interface ConflictResolution {
  type: 'local' | 'remote' | 'merge'
  recordId?: string
  promptId?: string
}

export interface SyncResult {
  success: boolean
  conflicts?: {
    records: Record[]
    prompts: Prompt[]
  }
  error?: string
  lastSyncTime: number
}
