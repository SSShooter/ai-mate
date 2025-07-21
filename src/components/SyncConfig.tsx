import React, { useState, useEffect } from "react"
import type { SyncConfig, SyncState } from "~types"
import { syncService } from "~services/sync"

interface SyncConfigProps {
  onClose?: () => void
}

export const SyncConfigComponent: React.FC<SyncConfigProps> = ({ onClose }) => {
  const [config, setConfig] = useState<SyncConfig>({
    workerUrl: "",
    apiKey: "",
    enabled: false,
    autoSync: false,
    syncInterval: 30
  })
  
  const [state, setState] = useState<SyncState>({
    status: "idle",
    lastSyncTime: null,
    lastErrorMessage: null,
    isConfigured: false
  })
  
  const [loading, setLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // 加载配置和状态
  useEffect(() => {
    loadConfigAndState()
  }, [])

  const loadConfigAndState = async () => {
    try {
      const [currentConfig, currentState] = await Promise.all([
        syncService.getSyncConfig(),
        syncService.getSyncState()
      ])
      setConfig(currentConfig)
      setState(currentState)
    } catch (error) {
      console.error("Failed to load sync config:", error)
    }
  }

  // 生成新的 API Key
  const generateNewApiKey = () => {
    const newApiKey = syncService.generateApiKey()
    setConfig(prev => ({ ...prev, apiKey: newApiKey }))
  }

  // 测试连接
  const testConnection = async () => {
    if (!config.workerUrl || !config.apiKey) {
      setTestResult("请先填写 Worker URL 和 API Key")
      return
    }

    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch(`${config.workerUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          records: [],
          prompts: [],
          settings: {},
          lastSyncTime: Date.now()
        })
      })

      if (response.ok) {
        setTestResult("✅ 连接测试成功！")
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestResult(`❌ 连接失败: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      setTestResult(`❌ 连接失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 保存配置
  const saveConfig = async () => {
    setLoading(true)
    try {
      await syncService.updateSyncConfig(config)
      await loadConfigAndState() // 重新加载状态
      setTestResult("✅ 配置保存成功！")
    } catch (error) {
      setTestResult(`❌ 保存失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 执行同步
  const performSync = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const result = await syncService.sync()
      if (result.success) {
        setTestResult("✅ 同步成功！")
        await loadConfigAndState()
      } else {
        setTestResult(`❌ 同步失败: ${result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ 同步失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 重置配置
  const resetConfig = async () => {
    if (confirm("确定要重置所有同步配置吗？")) {
      try {
        await syncService.resetConfig()
        await loadConfigAndState()
        setTestResult("✅ 配置已重置")
      } catch (error) {
        setTestResult(`❌ 重置失败: ${error.message}`)
      }
    }
  }

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return "从未同步"
    return new Date(timestamp).toLocaleString("zh-CN")
  }

  return (
    <div className="p-4 w-80 mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">数据同步配置</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        )}
      </div>

      {/* 配置表单 */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Cloudflare Worker URL:
          </label>
          <input
            type="url"
            value={config.workerUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, workerUrl: e.target.value }))}
            placeholder="https://your-worker.your-subdomain.workers.dev"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            API Key:
          </label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="输入或生成 API Key"
              className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-2 py-1 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 text-sm"
            >
              {showApiKey ? "隐藏" : "显示"}
            </button>
            <button
              type="button"
              onClick={generateNewApiKey}
              className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              生成
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
            className="rounded"
          />
          <label className="text-sm">启用同步功能</label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.autoSync}
            onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
            disabled={!config.enabled}
            className="rounded"
          />
          <label className="text-sm">启用自动同步</label>
        </div>

        {config.autoSync && (
          <div>
            <label className="block text-sm font-medium mb-1">
              同步间隔（分钟）:
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={config.syncInterval}
              onChange={(e) => setConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) || 30 }))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testConnection}
          disabled={loading || !config.workerUrl || !config.apiKey}
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "测试中..." : "测试连接"}
        </button>

        <button
          onClick={saveConfig}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "保存中..." : "保存配置"}
        </button>

        <button
          onClick={performSync}
          disabled={loading || !state.isConfigured || !config.enabled}
          className="px-3 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "同步中..." : "立即同步"}
        </button>

        <button
          onClick={resetConfig}
          disabled={loading}
          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          重置配置
        </button>
      </div>

      {/* 测试结果 */}
      {testResult && (
        <div className={`p-3 mb-4 rounded-md text-sm ${
          testResult.startsWith("✅")
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {testResult}
        </div>
      )}

      {/* 同步状态 */}
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
        <h3 className="text-sm font-medium mb-2">同步状态</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">状态:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              state.status === "success" ? "bg-green-100 text-green-800" :
              state.status === "error" ? "bg-red-100 text-red-800" :
              state.status === "syncing" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {state.status === "idle" ? "空闲" :
               state.status === "syncing" ? "同步中" :
               state.status === "success" ? "成功" :
               state.status === "error" ? "错误" : state.status}
            </span>
          </div>
          <div><span className="font-medium">配置状态:</span> {state.isConfigured ? "已配置" : "未配置"}</div>
          <div className="col-span-2"><span className="font-medium">上次同步:</span> {formatLastSyncTime(state.lastSyncTime)}</div>
          {state.lastErrorMessage && (
            <div className="col-span-2">
              <span className="font-medium">错误信息:</span>
              <span className="text-red-600 ml-2">{state.lastErrorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium mb-2 text-blue-800">使用说明:</h4>
        <ol className="text-xs text-blue-700 space-y-1 pl-4">
          <li>复制 <code className="bg-blue-100 px-1 rounded">docs/cloudflare-worker-template.js</code> 中的代码</li>
          <li>在 Cloudflare Dashboard 中创建新的 Worker 并粘贴代码</li>
          <li>创建 KV 命名空间 "AI_MATE_SYNC" 并绑定到 Worker</li>
          <li>部署 Worker 并复制 URL 到上面的配置中</li>
          <li>生成或输入 API Key，测试连接后保存配置</li>
          <li>启用同步功能，可选择开启自动同步</li>
        </ol>
      </div>
    </div>
  )
}
