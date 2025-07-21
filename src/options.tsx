import React, { useEffect, useState } from "react"

import { DEFAULT_SHORTCUTS, SUCCESS_MESSAGES } from "~constants"
import { storageService } from "~services/storage"
import type { AppSettings, ShortcutConfig } from "~types"

import "./style.css"

const OptionsPage = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>({
    saveToInspiration: DEFAULT_SHORTCUTS.SAVE_TO_INSPIRATION,
    saveToTodo: DEFAULT_SHORTCUTS.SAVE_TO_TODO,
    saveToPrinciple: DEFAULT_SHORTCUTS.SAVE_TO_PRINCIPLE,
    saveToOther: DEFAULT_SHORTCUTS.SAVE_TO_OTHER,
    saveClipboardToOther: DEFAULT_SHORTCUTS.SAVE_CLIPBOARD_TO_OTHER,
    promptTrigger: DEFAULT_SHORTCUTS.PROMPT_TRIGGER
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentSettings = await storageService.getSettings()
      setSettings(currentSettings)
      setShortcuts(currentSettings.shortcutKeys)
    } catch (error) {
      console.error("Failed to load settings:", error)
      showMessage("加载设置失败", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShortcutChange = (key: keyof ShortcutConfig, value: string) => {
    setShortcuts(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedSettings: Partial<AppSettings> = {
        shortcutKeys: shortcuts
      }
      await storageService.updateSettings(updatedSettings)
      showMessage(SUCCESS_MESSAGES.SETTINGS_UPDATED, "success")
    } catch (error) {
      console.error("Failed to save settings:", error)
      showMessage("保存设置失败", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setShortcuts({
      saveToInspiration: DEFAULT_SHORTCUTS.SAVE_TO_INSPIRATION,
      saveToTodo: DEFAULT_SHORTCUTS.SAVE_TO_TODO,
      saveToPrinciple: DEFAULT_SHORTCUTS.SAVE_TO_PRINCIPLE,
      saveToOther: DEFAULT_SHORTCUTS.SAVE_TO_OTHER,
      saveClipboardToOther: DEFAULT_SHORTCUTS.SAVE_CLIPBOARD_TO_OTHER,
      promptTrigger: DEFAULT_SHORTCUTS.PROMPT_TRIGGER
    })
  }

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Mate 设置</h1>
          <p className="text-gray-600">自定义快捷键和其他选项</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷键设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保存到灵感
                </label>
                <input
                  type="text"
                  value={shortcuts.saveToInspiration}
                  onChange={(e) => handleShortcutChange("saveToInspiration", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: Alt+Q"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保存到待办
                </label>
                <input
                  type="text"
                  value={shortcuts.saveToTodo}
                  onChange={(e) => handleShortcutChange("saveToTodo", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: Alt+W"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保存到信条
                </label>
                <input
                  type="text"
                  value={shortcuts.saveToPrinciple}
                  onChange={(e) => handleShortcutChange("saveToPrinciple", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: Alt+A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保存到其他
                </label>
                <input
                  type="text"
                  value={shortcuts.saveToOther}
                  onChange={(e) => handleShortcutChange("saveToOther", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: Alt+S"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保存剪贴板到其他
                </label>
                <input
                  type="text"
                  value={shortcuts.saveClipboardToOther}
                  onChange={(e) => handleShortcutChange("saveClipboardToOther", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: Alt+C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt 触发器
                </label>
                <input
                  type="text"
                  value={shortcuts.promptTrigger}
                  onChange={(e) => handleShortcutChange("promptTrigger", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: /'"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              重置为默认
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "保存中..." : "保存设置"}
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">使用说明</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 快捷键格式：支持 Alt、Ctrl、Shift 等修饰键组合</li>
            <li>• 选中文本后使用快捷键可快速保存到对应分类</li>
            <li>• Prompt 触发器：在输入框中输入触发器+关键词可快速插入预设内容</li>
            <li>• 修改设置后会立即生效，无需重启浏览器</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
