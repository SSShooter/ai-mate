import React, { useState, useEffect } from "react"
import type { SyncState } from "~types"
import { syncService } from "~services/sync"
import { SyncConfigComponent } from "./SyncConfig"

interface SyncStatusProps {
  onSyncComplete?: () => void
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ onSyncComplete }) => {
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载同步状态
  const loadSyncState = async () => {
    try {
      const state = await syncService.getSyncState()
      setSyncState(state)
    } catch (err) {
      console.error("Failed to load sync state:", err)
      setError("加载同步状态失败")
    }
  }

  // 初始加载
  useEffect(() => {
    loadSyncState()
    
    // 每30秒刷新一次状态
    const interval = setInterval(loadSyncState, 30000)
    return () => clearInterval(interval)
  }, [])

  // 执行同步
  const handleSync = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await syncService.sync()
      if (!result.success && result.error) {
        setError(result.error)
      }
      await loadSyncState()
      if (onSyncComplete) {
        onSyncComplete()
      }
    } catch (err) {
      console.error("Sync failed:", err)
      setError(err.message || "同步失败")
    } finally {
      setLoading(false)
    }
  }

  // 格式化上次同步时间
  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return "从未同步"
    
    const now = new Date()
    const syncTime = new Date(timestamp)
    const diffMs = now.getTime() - syncTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "刚刚"
    if (diffMins < 60) return `${diffMins}分钟前`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}小时前`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}天前`
    
    return syncTime.toLocaleDateString("zh-CN")
  }



  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "idle": return "空闲"
      case "syncing": return "同步中"
      case "success": return "成功"
      case "error": return "错误"
      case "conflict": return "冲突"
      default: return status
    }
  }

  if (!syncState) {
    return <div>加载中...</div>
  }

  if (showConfig) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto shadow-xl">
          <SyncConfigComponent onClose={() => {
            setShowConfig(false)
            loadSyncState()
          }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">同步:</span>
        <span className={`px-2 py-1 rounded-full text-xs ${
          syncState.status === "success" ? "bg-green-100 text-green-800" :
          syncState.status === "error" ? "bg-red-100 text-red-800" :
          syncState.status === "syncing" ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {getStatusText(syncState.status)}
        </span>
      </div>

      {syncState.lastSyncTime && (
        <div className="text-gray-600 text-xs">
          上次: {formatLastSyncTime(syncState.lastSyncTime)}
        </div>
      )}

      <div className="ml-auto flex gap-2">
        <button
          onClick={handleSync}
          disabled={loading || !syncState.isConfigured}
          className="px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "同步中..." : "同步"}
        </button>

        <button
          onClick={() => setShowConfig(true)}
          className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
        >
          配置
        </button>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md shadow-lg z-50 max-w-sm text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="absolute top-1 right-1 text-red-600 hover:text-red-800 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
