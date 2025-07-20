import type {
  AppSettings,
  Prompt,
  Record,
  RecordCategory,
  StorageSchema
} from "~types"

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
  isPromptKeyUnique(key: string, excludeId?: string): Promise<boolean>

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
    RECORDS: "records",
    PROMPTS: "prompts",
    SETTINGS: "settings"
  } as const

  private readonly DEFAULT_SETTINGS: AppSettings = {
    defaultCategory: "other",
    enableNotifications: true,
    shortcutKeys: {
      quickRecord: "Ctrl+Shift+S",
      promptTrigger: "/'"
    }
  }

  // Record operations
  async saveRecord(record: Record): Promise<void> {
    try {
      const records = await this.getAllRecords()
      const existingIndex = records.findIndex((r) => r.id === record.id)

      // Convert dates to timestamps for storage
      const recordToStore = {
        ...record,
        createdAt: record.createdAt.getTime(),
        updatedAt: new Date().getTime()
      }

      if (existingIndex >= 0) {
        const existingRecords = await chrome.storage.local.get(
          this.STORAGE_KEYS.RECORDS
        )
        const storedRecords = existingRecords[this.STORAGE_KEYS.RECORDS] || []
        storedRecords[existingIndex] = recordToStore
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.RECORDS]: storedRecords
        })
      } else {
        const existingRecords = await chrome.storage.local.get(
          this.STORAGE_KEYS.RECORDS
        )
        const storedRecords = existingRecords[this.STORAGE_KEYS.RECORDS] || []
        storedRecords.push(recordToStore)
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.RECORDS]: storedRecords
        })
      }
    } catch (error) {
      throw new Error(`Failed to save record: ${error.message}`)
    }
  }

  async getRecordsByCategory(category: RecordCategory): Promise<Record[]> {
    try {
      const allRecords = await this.getAllRecords()
      return allRecords.filter((record) => record.category === category)
    } catch (error) {
      throw new Error(`Failed to get records by category: ${error.message}`)
    }
  }

  async getAllRecords(): Promise<Record[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.RECORDS)
      const records = result[this.STORAGE_KEYS.RECORDS] || []

      // Convert timestamps back to Date objects with validation
      return records.map((record) => ({
        ...record,
        createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
        updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date()
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
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.RECORDS)
      const records = result[this.STORAGE_KEYS.RECORDS] || []
      const filteredRecords = records.filter(
        (record: any) => record.id !== recordId
      )
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.RECORDS]: filteredRecords
      })
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`)
    }
  }

  // Prompt operations
  async savePrompt(prompt: Prompt): Promise<void> {
    try {
      const prompts = await this.getAllPrompts()
      const existingIndex = prompts.findIndex((p) => p.id === prompt.id)

      // Check for duplicate key (only if it's a new prompt or key has changed)
      const existingKeyPrompt = prompts.find(
        (p) => p.key === prompt.key && p.id !== prompt.id
      )
      if (existingKeyPrompt) {
        throw new Error("Prompt key已存在，请使用其他key")
      }

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

      // Convert date strings back to Date objects with validation
      return prompts.map((prompt) => ({
        ...prompt,
        createdAt: prompt.createdAt ? new Date(prompt.createdAt) : new Date(),
        updatedAt: prompt.updatedAt ? new Date(prompt.updatedAt) : new Date()
      }))
    } catch (error) {
      throw new Error(`Failed to get all prompts: ${error.message}`)
    }
  }

  async getPromptByKey(key: string): Promise<Prompt | null> {
    try {
      const prompts = await this.getAllPrompts()
      return prompts.find((prompt) => prompt.key === key) || null
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
      const filteredPrompts = prompts.filter((prompt) => prompt.id !== promptId)
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.PROMPTS]: filteredPrompts
      })
    } catch (error) {
      throw new Error(`Failed to delete prompt: ${error.message}`)
    }
  }

  async isPromptKeyUnique(key: string, excludeId?: string): Promise<boolean> {
    try {
      const prompts = await this.getAllPrompts()
      return !prompts.some(
        (prompt) => prompt.key === key && prompt.id !== excludeId
      )
    } catch (error) {
      throw new Error(`Failed to check prompt key uniqueness: ${error.message}`)
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
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.SETTINGS]: updatedSettings
      })
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
