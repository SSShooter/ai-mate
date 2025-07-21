import { RefreshCw, RotateCcw, Save, Wifi } from "lucide-react"
import React, { useEffect, useState } from "react"

import { syncService } from "~services/sync"
import type { SyncConfig, SyncState } from "~types"

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
    setConfig((prev) => ({ ...prev, apiKey: newApiKey }))
  }

  // 测试连接
  const testConnection = async () => {
    if (!config.workerUrl || !config.apiKey) {
      setTestResult(chrome.i18n.getMessage("fillWorkerUrlAndApiKey"))
      return
    }

    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch(`${config.workerUrl}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          records: [],
          prompts: [],
          settings: {},
          lastSyncTime: Date.now()
        })
      })

      if (response.ok) {
        setTestResult(chrome.i18n.getMessage("connectionTestSuccess"))
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestResult(
          chrome.i18n.getMessage(
            "connectionFailed",
            errorData.error || response.statusText
          )
        )
      }
    } catch (error) {
      setTestResult(chrome.i18n.getMessage("connectionFailed", error.message))
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
      setTestResult(chrome.i18n.getMessage("configSaveSuccess"))
    } catch (error) {
      setTestResult(chrome.i18n.getMessage("saveFailed", error.message))
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
        setTestResult(chrome.i18n.getMessage("syncSuccess"))
        await loadConfigAndState()
      } else {
        setTestResult(chrome.i18n.getMessage("syncFailed", result.error))
      }
    } catch (error) {
      setTestResult(chrome.i18n.getMessage("syncFailed", error.message))
    } finally {
      setLoading(false)
    }
  }

  // 重置配置
  const resetConfig = async () => {
    if (confirm(chrome.i18n.getMessage("resetConfigConfirm"))) {
      try {
        await syncService.resetConfig()
        await loadConfigAndState()
        setTestResult(chrome.i18n.getMessage("configReset"))
      } catch (error) {
        setTestResult(chrome.i18n.getMessage("resetFailed", error.message))
      }
    }
  }

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return chrome.i18n.getMessage("neverSynced")
    return new Date(timestamp).toLocaleString("zh-CN")
  }

  return (
    <div className="p-4 w-80 mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {chrome.i18n.getMessage("syncConfig")}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        )}
      </div>

      {/* 配置表单 */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {chrome.i18n.getMessage("workerUrlLabel")}
          </label>
          <input
            type="url"
            value={config.workerUrl}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, workerUrl: e.target.value }))
            }
            placeholder={chrome.i18n.getMessage("workerUrlPlaceholder")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {chrome.i18n.getMessage("apiKeyLabel")}
          </label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder={chrome.i18n.getMessage("apiKeyPlaceholder")}
              className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-2 py-1 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 text-sm">
              {showApiKey
                ? chrome.i18n.getMessage("hide")
                : chrome.i18n.getMessage("show")}
            </button>
            {/* <button
              type="button"
              onClick={generateNewApiKey}
              className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              {chrome.i18n.getMessage("generate")}
            </button> */}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, enabled: e.target.checked }))
            }
            className="rounded"
          />
          <label className="text-sm">
            {chrome.i18n.getMessage("enableSync")}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.autoSync}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, autoSync: e.target.checked }))
            }
            disabled={!config.enabled}
            className="rounded"
          />
          <label className="text-sm">
            {chrome.i18n.getMessage("enableAutoSync")}
          </label>
        </div>

        {config.autoSync && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {chrome.i18n.getMessage("syncIntervalLabel")}
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={config.syncInterval}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  syncInterval: parseInt(e.target.value) || 30
                }))
              }
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
          className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Test Connection">
          <Wifi size={16} />
        </button>

        <button
          onClick={saveConfig}
          disabled={loading}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save Config">
          <Save size={16} />
        </button>

        <button
          onClick={performSync}
          disabled={loading || !state.isConfigured || !config.enabled}
          className="p-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sync Now">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>

        {/* <button
          onClick={resetConfig}
          disabled={loading}
          className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset Config">
          <RotateCcw size={16} />
        </button> */}
      </div>

      {/* 测试结果 */}
      {testResult && (
        <div
          className={`p-3 mb-4 rounded-md text-sm ${
            testResult.startsWith("✅")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
          {testResult}
        </div>
      )}

      {/* 同步状态 */}
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
        <h3 className="text-sm font-medium mb-2">
          {chrome.i18n.getMessage("syncStatus")}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">
              {chrome.i18n.getMessage("status")}:
            </span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${
                state.status === "success"
                  ? "bg-green-100 text-green-800"
                  : state.status === "error"
                    ? "bg-red-100 text-red-800"
                    : state.status === "syncing"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
              }`}>
              {state.status === "idle"
                ? chrome.i18n.getMessage("idle")
                : state.status === "syncing"
                  ? chrome.i18n.getMessage("syncing")
                  : state.status === "success"
                    ? chrome.i18n.getMessage("success")
                    : state.status === "error"
                      ? chrome.i18n.getMessage("error")
                      : state.status}
            </span>
          </div>
          <div>
            <span className="font-medium">
              {chrome.i18n.getMessage("configStatus")}:
            </span>{" "}
            {state.isConfigured
              ? chrome.i18n.getMessage("configured")
              : chrome.i18n.getMessage("notConfigured")}
          </div>
          <div className="col-span-2">
            <span className="font-medium">
              {chrome.i18n.getMessage("lastSync")}:
            </span>{" "}
            {formatLastSyncTime(state.lastSyncTime)}
          </div>
          {state.lastErrorMessage && (
            <div className="col-span-2">
              <span className="font-medium">
                {chrome.i18n.getMessage("errorMessage")}:
              </span>
              <span className="text-red-600 ml-2">
                {state.lastErrorMessage}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium mb-2 text-blue-800">
          {chrome.i18n.getMessage("usageInstructions")}
        </h4>
        <ol className="text-xs text-blue-700 space-y-1 pl-4">
          <li>
            {chrome.i18n.getMessage("instruction1")}{" "}
            <code className="bg-blue-100 px-1 rounded">
              docs/cloudflare-worker-template.js
            </code>
          </li>
          <li>{chrome.i18n.getMessage("instruction2")}</li>
          <li>{chrome.i18n.getMessage("instruction3")}</li>
          <li>{chrome.i18n.getMessage("instruction4")}</li>
          <li>{chrome.i18n.getMessage("instruction5")}</li>
          <li>{chrome.i18n.getMessage("instruction6")}</li>
        </ol>
      </div>
    </div>
  )
}
