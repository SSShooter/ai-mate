import type { Record, Prompt, RecordCategory, StorageSchema, AppSettings } from "~types"

/**
 * Storage Service Interface
 * Defines the contract for data storage operations
 */
export interface IStorageService {
  // Record operations
  saveRecord(record: Record): Promise<void>
  getRecordsByCategory(category: RecordCategory): Promise<Record[]>
  getAllRecords(): Promise<Record[]>
  updateRecord(record: Record): Promise<void>
  deleteRecord(recordId: string): Promise<void>
  
  // Prompt operations
  savePrompt(prompt: Prompt): Promise<void>
  getAllPrompts(): Promise<Prompt[]>
  getPromptByKey(key: string): Promise<Prompt | null>
  updatePrompt(prompt: Prompt): Promise<void>
  deletePrompt(promptId: string): Promise<void>
  
  // Settings operations
  getSettings(): Promise<AppSettings>
  updateSettings(settings: Partial<AppSettings>): Promise<void>
  
  // Utility operations
  clearAllData(): Promise<void>
  exportData(): Promise<StorageSchema>
  importData(data: StorageSchema): Promise<void>
}

/**
 * Chrome Storage Service Implementation
 * Implements storage operations using Chrome Storage API
 */
export class ChromeStorageService implements IStorageService {
  private readonly STORAGE_KEYS = {
    RECORDS: 'records',
    PROMPTS: 'prompts',
    SETTINGS: 'settings'
  } as const

  private readonly DEFAULT_SETTINGS: AppSettings = {
    defaultCategory: '其他',
    enableNotifications: true,
    shortcutKeys: {
      quickRecord: 'Ctrl+Shift+S',
      promptTrigger: '/pmt:'
    }
  }

  // Record operations
  async saveRecord(record: Record): Promise<void> {
    try {
      const records = await this.getAllRecords()
      const existingIndex = records.findIndex(r => r.id === record.id)
      
      if (existingIndex >= 0) {
        records[existingIndex] = { ...record, updatedAt: new Date() }
      } else {
        records.push(record)
      }
      
      await chrome.storage.local.set({ [this.STORAGE_KEYS.RECORDS]: records })
    } catch (error) {
      throw new Error(`Failed to save record: ${error.message}`)
    }
  }

  async getRecordsByCategory(category: RecordCategory): Promise<Record[]> {
    try {
      const allRecords = await this.getAllRecords()
      return allRecords.filter(record => record.category === category)
    } catch (error) {
      throw new Error(`Failed to get records by category: ${error.message}`)
    }
  }

  async getAllRecords(): Promise<Record[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.RECORDS)
      const records = result[this.STORAGE_KEYS.RECORDS] || []
      
      // Convert date strings back to Date objects
      return records.map(record => ({
        ...record,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt)
      }))
    } catch (error) {
      throw new Error(`Failed to get all records: ${error.message}`)
    }
  }

  async updateRecord(record: Record): Promise<void> {
    await this.saveRecord({ ...record, updatedAt: new Date() })
  }

  async deleteRecord(recordId: string): Promise<void> {
    try {
      const records = await this.getAllRecords()
      const filteredRecords = records.filter(record => record.id !== recordId)
      await chrome.storage.local.set({ [this.STORAGE_KEYS.RECORDS]: filteredRecords })
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`)
    }
  }

  // Prompt operations
  async savePrompt(prompt: Prompt): Promise<void> {
    try {
      const prompts = await this.getAllPrompts()
      const existingIndex = prompts.findIndex(p => p.id === prompt.id)
      
      if (existingIndex >= 0) {
        prompts[existingIndex] = { ...prompt, updatedAt: new Date() }
      } else {
        prompts.push(prompt)
      }
      
      await chrome.storage.local.set({ [this.STORAGE_KEYS.PROMPTS]: prompts })
    } catch (error) {
      throw new Error(`Failed to save prompt: ${error.message}`)
    }
  }

  async getAllPrompts(): Promise<Prompt[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.PROMPTS)
      const prompts = result[this.STORAGE_KEYS.PROMPTS] || []
      
      // Convert date strings back to Date objects
      return prompts.map(prompt => ({
        ...prompt,
        createdAt: new Date(prompt.createdAt),
        updatedAt: new Date(prompt.updatedAt)
      }))
    } catch (error) {
      throw new Error(`Failed to get all prompts: ${error.message}`)
    }
  }

  async getPromptByKey(key: string): Promise<Prompt | null> {
    try {
      const prompts = await this.getAllPrompts()
      return prompts.find(prompt => prompt.key === key) || null
    } catch (error) {
      throw new Error(`Failed to get prompt by key: ${error.message}`)
    }
  }

  async updatePrompt(prompt: Prompt): Promise<void> {
    await this.savePrompt({ ...prompt, updatedAt: new Date() })
  }

  async deletePrompt(promptId: string): Promise<void> {
    try {
      const prompts = await this.getAllPrompts()
      const filteredPrompts = prompts.filter(prompt => prompt.id !== promptId)
      await chrome.storage.local.set({ [this.STORAGE_KEYS.PROMPTS]: filteredPrompts })
    } catch (error) {
      throw new Error(`Failed to delete prompt: ${error.message}`)
    }
  }

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.SETTINGS)
      return { ...this.DEFAULT_SETTINGS, ...result[this.STORAGE_KEYS.SETTINGS] }
    } catch (error) {
      throw new Error(`Failed to get settings: ${error.message}`)
    }
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings()
      const updatedSettings = { ...currentSettings, ...settings }
      await chrome.storage.local.set({ [this.STORAGE_KEYS.SETTINGS]: updatedSettings })
    } catch (error) {
      throw new Error(`Failed to update settings: ${error.message}`)
    }
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear()
    } catch (error) {
      throw new Error(`Failed to clear all data: ${error.message}`)
    }
  }

  async exportData(): Promise<StorageSchema> {
    try {
      const [records, prompts, settings] = await Promise.all([
        this.getAllRecords(),
        this.getAllPrompts(),
        this.getSettings()
      ])
      
      return { records, prompts, settings }
    } catch (error) {
      throw new Error(`Failed to export data: ${error.message}`)
    }
  }

  async importData(data: StorageSchema): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.RECORDS]: data.records,
        [this.STORAGE_KEYS.PROMPTS]: data.prompts,
        [this.STORAGE_KEYS.SETTINGS]: data.settings
      })
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`)
    }
  }
}

// Create and export a singleton instance
export const storageService = new ChromeStorageService()