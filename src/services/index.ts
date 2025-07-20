// Export all services and utilities
export * from './storage'
export * from './utils'

// Re-export commonly used functions and instances
export { storageService } from './storage'
export { 
  generateId, 
  validateRecord, 
  validatePrompt, 
  createRecord, 
  createPrompt,
  formatDate,
  searchRecords,
  searchPrompts
} from './utils'