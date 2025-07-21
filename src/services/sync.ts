import type {
  SyncConfig,
  SyncState,
  SyncData,
  SyncResult
} from "~types"
import { SyncStatus } from "~types"
import { storageService } from "./storage"

/**
 * 同步服务类
 * 负责与 Cloudflare Worker 通信，实现数据同步功能
 */
export class SyncService {
  private readonly SYNC_CONFIG_KEY = "syncConfig"
  private readonly SYNC_STATE_KEY = "syncState"
  
  private readonly DEFAULT_CONFIG: SyncConfig = {
    workerUrl: "",
    apiKey: "",
    enabled: false,
    autoSync: false,
    syncInterval: 30 // 30分钟
  }

  private readonly DEFAULT_STATE: SyncState = {
    status: SyncStatus.IDLE,
    lastSyncTime: null,
    lastErrorMessage: null,
    isConfigured: false
  }

  private autoSyncTimer: NodeJS.Timeout | null = null

  /**
   * 获取同步配置
   */
  async getSyncConfig(): Promise<SyncConfig> {
    try {
      const result = await chrome.storage.sync.get(this.SYNC_CONFIG_KEY)
      return { ...this.DEFAULT_CONFIG, ...result[this.SYNC_CONFIG_KEY] }
    } catch (error) {
      console.error("Failed to get sync config:", error)
      return this.DEFAULT_CONFIG
    }
  }

  /**
   * 更新同步配置
   */
  async updateSyncConfig(config: Partial<SyncConfig>): Promise<void> {
    try {
      const currentConfig = await this.getSyncConfig()
      const updatedConfig = { ...currentConfig, ...config }
      
      await chrome.storage.sync.set({
        [this.SYNC_CONFIG_KEY]: updatedConfig
      })

      // 更新配置状态
      await this.updateSyncState({
        isConfigured: !!(updatedConfig.workerUrl && updatedConfig.apiKey)
      })

      // 重新设置自动同步
      if (updatedConfig.autoSync && updatedConfig.enabled) {
        this.startAutoSync()
      } else {
        this.stopAutoSync()
      }
    } catch (error) {
      console.error("Failed to update sync config:", error)
      throw new Error("更新同步配置失败")
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncState(): Promise<SyncState> {
    try {
      const result = await chrome.storage.local.get(this.SYNC_STATE_KEY)
      return { ...this.DEFAULT_STATE, ...result[this.SYNC_STATE_KEY] }
    } catch (error) {
      console.error("Failed to get sync state:", error)
      return this.DEFAULT_STATE
    }
  }

  /**
   * 更新同步状态
   */
  async updateSyncState(state: Partial<SyncState>): Promise<void> {
    try {
      const currentState = await this.getSyncState()
      const updatedState = { ...currentState, ...state }
      
      await chrome.storage.local.set({
        [this.SYNC_STATE_KEY]: updatedState
      })
    } catch (error) {
      console.error("Failed to update sync state:", error)
    }
  }

  /**
   * 生成随机 API Key
   */
  generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 执行同步操作
   */
  async sync(): Promise<SyncResult> {
    const config = await this.getSyncConfig()
    
    if (!config.enabled || !config.workerUrl || !config.apiKey) {
      throw new Error("同步未配置或未启用")
    }

    // 更新状态为同步中
    await this.updateSyncState({
      status: SyncStatus.SYNCING,
      lastErrorMessage: null
    })

    try {
      // 获取本地数据（包括已删除的项目）
      const localData = await storageService.exportAllDataForSync()
      const syncData: SyncData = {
        ...localData,
        lastSyncTime: Date.now()
      }

      // 发送到 Worker
      const response = await fetch(`${config.workerUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(syncData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "同步失败")
      }

      // 用服务器返回的数据更新本地存储
      if (result.data) {
        await storageService.importData(result.data)

        // 定期清理已删除的项目（每次同步时有10%的概率执行清理）
        if (Math.random() < 0.1) {
          await storageService.cleanupDeletedItems()
        }
      }

      // 更新同步状态
      await this.updateSyncState({
        status: SyncStatus.SUCCESS,
        lastSyncTime: Date.now(),
        lastErrorMessage: null
      })

      return {
        success: true,
        lastSyncTime: Date.now()
      }

    } catch (error) {
      console.error("Sync failed:", error)
      
      // 更新错误状态
      await this.updateSyncState({
        status: SyncStatus.ERROR,
        lastErrorMessage: error.message
      })

      return {
        success: false,
        error: error.message,
        lastSyncTime: Date.now()
      }
    }
  }

  /**
   * 启动自动同步
   */
  async startAutoSync(): Promise<void> {
    const config = await this.getSyncConfig()
    
    if (!config.autoSync || !config.enabled) {
      return
    }

    this.stopAutoSync() // 先停止现有的定时器

    const intervalMs = config.syncInterval * 60 * 1000 // 转换为毫秒
    
    this.autoSyncTimer = setInterval(async () => {
      try {
        await this.sync()
      } catch (error) {
        console.error("Auto sync failed:", error)
      }
    }, intervalMs)
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
      this.autoSyncTimer = null
    }
  }

  /**
   * 检查是否已配置
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.getSyncConfig()
    return !!(config.workerUrl && config.apiKey)
  }

  /**
   * 重置同步配置
   */
  async resetConfig(): Promise<void> {
    await chrome.storage.sync.remove(this.SYNC_CONFIG_KEY)
    await chrome.storage.local.remove(this.SYNC_STATE_KEY)
    this.stopAutoSync()
  }
}

// 创建并导出单例实例
export const syncService = new SyncService()
