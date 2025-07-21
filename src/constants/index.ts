import type { RecordCategory } from "~types"

/**
 * Application constants and configuration
 */

// Record categories with display names
export const RECORD_CATEGORIES: { value: RecordCategory; label: string }[] = [
  { value: "inspiration", label: "灵感" },
  { value: "todo", label: "待办" },
  { value: "principle", label: "信条" },
  { value: "other", label: "其他" }
]

// Default prompt trigger pattern
export const DEFAULT_PROMPT_TRIGGER = "/'"

// Default shortcut keys
export const DEFAULT_SHORTCUTS = {
  SAVE_TO_INSPIRATION: "Alt+Q",
  SAVE_TO_TODO: "Alt+W",
  SAVE_TO_PRINCIPLE: "Alt+A",
  SAVE_TO_OTHER: "Alt+S",
  SAVE_CLIPBOARD_TO_OTHER: "Alt+C",
  PROMPT_TRIGGER: "/'"
}

// UI constants
export const UI_CONSTANTS = {
  MAX_CONTENT_PREVIEW_LENGTH: 100,
  MAX_TITLE_LENGTH: 50,
  NOTIFICATION_DURATION: 3000,
  DEBOUNCE_DELAY: 300
}

// Storage limits
export const STORAGE_LIMITS = {
  MAX_RECORDS: 1000,
  MAX_PROMPTS: 100,
  MAX_RECORD_CONTENT_LENGTH: 5000,
  MAX_PROMPT_CONTENT_LENGTH: 2000
}

// Error messages
export const ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED: "存储空间不足，请删除一些记录或Prompt",
  NETWORK_ERROR: "网络连接错误，请检查网络设置",
  PERMISSION_DENIED: "权限不足，请检查扩展权限设置",
  VALIDATION_FAILED: "数据验证失败，请检查输入内容",
  RECORD_NOT_FOUND: "记录不存在",
  PROMPT_NOT_FOUND: "Prompt不存在",
  DUPLICATE_PROMPT_KEY: "Prompt key已存在，请使用其他key"
}

// Success messages
export const SUCCESS_MESSAGES = {
  RECORD_SAVED: "记录保存成功",
  RECORD_UPDATED: "记录更新成功",
  RECORD_DELETED: "记录删除成功",
  PROMPT_SAVED: "Prompt保存成功",
  PROMPT_UPDATED: "Prompt更新成功",
  PROMPT_DELETED: "Prompt删除成功",
  SETTINGS_UPDATED: "设置更新成功"
}

// Context menu item IDs
export const CONTEXT_MENU_IDS = {
  SAVE_TO_INSPIRATION: "save-to-inspiration",
  SAVE_TO_TODO: "save-to-todo",
  SAVE_TO_PRINCIPLE: "save-to-principle",
  SAVE_TO_OTHER: "save-to-other"
}

// CSS class prefixes for Plasmo
export const CSS_PREFIXES = {
  PLASMO: "",
  EXTENSION: "ai-mate-"
}
