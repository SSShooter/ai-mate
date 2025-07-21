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
      saveToInspiration: "Alt+Q",
      saveToTodo: "Alt+W",
      saveToPrinciple: "Alt+A",
      saveToOther: "Alt+S",
      saveClipboardToOther: "Alt+C",
      promptTrigger: "/'"
    }
  }

  // Record operations
  async saveRecord(record: Record): Promise<void> {
    try {
      const records = await this.getAllRecords()
      const existingIndex = records.findIndex((r) => r.id === record.id)

      // Ensure updatedAt is current timestamp
      const recordToStore = {
        ...record,
        updatedAt: Date.now()
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

      // Ensure timestamps are numbers with validation and filter out deleted records
      return records
        .filter((record: any) => !record.deleted)
        .map((record: any) => ({
          ...record,
          createdAt: record.createdAt || Date.now(),
          updatedAt: record.updatedAt || Date.now()
        }))
    } catch (error) {
      throw new Error(`Failed to get all records: ${error.message}`)
    }
  }

  async updateRecord(record: Record): Promise<void> {
    await this.saveRecord({ ...record, updatedAt: Date.now() })
  }

  async deleteRecord(recordId: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.RECORDS)
      const records = result[this.STORAGE_KEYS.RECORDS] || []
      const updatedRecords = records.map((record: any) => {
        if (record.id === recordId) {
          return {
            ...record,
            deleted: true,
            deletedAt: Date.now(),
            updatedAt: Date.now()
          }
        }
        return record
      })
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.RECORDS]: updatedRecords
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
        prompts[existingIndex] = { ...prompt, updatedAt: Date.now() }
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

      // Ensure timestamps are numbers with validation and filter out deleted prompts
      return prompts
        .filter((prompt: any) => !prompt.deleted)
        .map((prompt: any) => ({
          ...prompt,
          createdAt: prompt.createdAt || Date.now(),
          updatedAt: prompt.updatedAt || Date.now()
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
    await this.savePrompt({ ...prompt, updatedAt: Date.now() })
  }

  async deletePrompt(promptId: string): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.PROMPTS)
      const prompts = result[this.STORAGE_KEYS.PROMPTS] || []
      const updatedPrompts = prompts.map((prompt: any) => {
        if (prompt.id === promptId) {
          return {
            ...prompt,
            deleted: true,
            deletedAt: Date.now(),
            updatedAt: Date.now()
          }
        }
        return prompt
      })
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.PROMPTS]: updatedPrompts
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

  // 新增方法：导出所有数据（包括已删除的项目，用于同步）
  async exportAllDataForSync(): Promise<StorageSchema> {
    try {
      const [recordsResult, promptsResult, settings] = await Promise.all([
        chrome.storage.local.get(this.STORAGE_KEYS.RECORDS),
        chrome.storage.local.get(this.STORAGE_KEYS.PROMPTS),
        this.getSettings()
      ])

      const allRecords = recordsResult[this.STORAGE_KEYS.RECORDS] || []
      const allPrompts = promptsResult[this.STORAGE_KEYS.PROMPTS] || []

      // 确保时间戳正确，但不过滤已删除的项目
      const records = allRecords.map((record: any) => ({
        ...record,
        createdAt: record.createdAt || Date.now(),
        updatedAt: record.updatedAt || Date.now()
      }))

      const prompts = allPrompts.map((prompt: any) => ({
        ...prompt,
        createdAt: prompt.createdAt || Date.now(),
        updatedAt: prompt.updatedAt || Date.now()
      }))

      return { records, prompts, settings }
    } catch (error) {
      throw new Error(`Failed to export all data for sync: ${error.message}`)
    }
  }

  async importData(data: StorageSchema): Promise<void> {
    try {
      // 直接导入所有数据，包括删除标记
      // 这样可以确保删除状态在设备间正确同步
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.RECORDS]: data.records,
        [this.STORAGE_KEYS.PROMPTS]: data.prompts,
        [this.STORAGE_KEYS.SETTINGS]: data.settings
      })
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`)
    }
  }

  // 清理已删除的项目（删除超过30天的项目）
  async cleanupDeletedItems(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

      // 清理记录
      const recordsResult = await chrome.storage.local.get(this.STORAGE_KEYS.RECORDS)
      const allRecords = recordsResult[this.STORAGE_KEYS.RECORDS] || []
      const cleanedRecords = allRecords.filter((record: any) => {
        return !record.deleted || (record.deletedAt && record.deletedAt > thirtyDaysAgo)
      })

      // 清理提示词
      const promptsResult = await chrome.storage.local.get(this.STORAGE_KEYS.PROMPTS)
      const allPrompts = promptsResult[this.STORAGE_KEYS.PROMPTS] || []
      const cleanedPrompts = allPrompts.filter((prompt: any) => {
        return !prompt.deleted || (prompt.deletedAt && prompt.deletedAt > thirtyDaysAgo)
      })

      await chrome.storage.local.set({
        [this.STORAGE_KEYS.RECORDS]: cleanedRecords,
        [this.STORAGE_KEYS.PROMPTS]: cleanedPrompts
      })
    } catch (error) {
      console.error('Failed to cleanup deleted items:', error)
    }
  }
}

// Create and export a singleton instance
export const storageService = new ChromeStorageService()
