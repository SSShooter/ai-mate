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
  const [recordingKey, setRecordingKey] = useState<keyof ShortcutConfig | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  // Add global keyboard listener and click outside listener when recording
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (recordingKey) {
        handleGlobalKeyDownEvent(event, recordingKey)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (recordingKey && !(event.target as Element)?.closest('.shortcut-input')) {
        stopRecording()
      }
    }

    if (recordingKey) {
      document.addEventListener('keydown', handleGlobalKeyDown)
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [recordingKey])

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

  const startRecording = (key: keyof ShortcutConfig) => {
    setRecordingKey(key)
  }

  const stopRecording = () => {
    setRecordingKey(null)
  }

  const handleGlobalKeyDownEvent = (event: KeyboardEvent, key: keyof ShortcutConfig) => {
    event.preventDefault()
    event.stopPropagation()

    // Handle escape key to cancel recording
    if (event.key === 'Escape') {
      stopRecording()
      return
    }

    // Get the actual key (not modifier keys)
    let actualKey = event.key
    if (actualKey === 'Control' || actualKey === 'Alt' || actualKey === 'Shift') {
      return // Don't record just modifier keys
    }

    // Build shortcut string
    const parts: string[] = []
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')

    // Convert some special keys to more readable format
    if (actualKey === ' ') actualKey = 'Space'
    if (actualKey === 'Enter') actualKey = 'Enter'
    if (actualKey === 'Tab') actualKey = 'Tab'

    // Capitalize single letters
    if (actualKey.length === 1) {
      actualKey = actualKey.toUpperCase()
    }

    parts.push(actualKey)

    // Must have at least one modifier key for shortcuts (except for prompt trigger)
    if (key !== 'promptTrigger' && parts.length === 1) {
      return // Need at least one modifier key
    }

    const shortcutString = parts.join('+')
    handleShortcutChange(key, shortcutString)
    stopRecording()
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

  // Component for shortcut input with recording functionality
  const ShortcutInput = ({
    label,
    value,
    shortcutKey,
    placeholder
  }: {
    label: string
    value: string
    shortcutKey: keyof ShortcutConfig
    placeholder: string
  }) => {
    const isRecording = recordingKey === shortcutKey

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative shortcut-input">
          <input
            type="text"
            value={isRecording ? "🎯 按下快捷键..." : value}
            readOnly
            onClick={() => startRecording(shortcutKey)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer transition-all duration-200 ${
              isRecording
                ? "border-blue-500 ring-2 ring-blue-500 bg-blue-50 animate-pulse"
                : "border-gray-300 focus:ring-blue-500 hover:border-gray-400"
            }`}
            placeholder={placeholder}
          />
          {isRecording && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600">
              按 ESC 取消
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          点击输入框然后按下快捷键组合，点击其他地方或按ESC取消
        </p>
      </div>
    )
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

        {recordingKey && (
          <div className="mb-6 p-4 rounded-md bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">
            <div className="flex items-center">
              <span className="mr-2">🎯</span>
              <span>正在录制快捷键，请按下您想要的快捷键组合...</span>
              <span className="ml-auto text-sm">按 ESC 取消</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷键设置</h2>
            <div className="space-y-4">
              <ShortcutInput
                label="保存到灵感"
                value={shortcuts.saveToInspiration}
                shortcutKey="saveToInspiration"
                placeholder="例如: Alt+Q"
              />

              <ShortcutInput
                label="保存到待办"
                value={shortcuts.saveToTodo}
                shortcutKey="saveToTodo"
                placeholder="例如: Alt+W"
              />

              <ShortcutInput
                label="保存到信条"
                value={shortcuts.saveToPrinciple}
                shortcutKey="saveToPrinciple"
                placeholder="例如: Alt+A"
              />

              <ShortcutInput
                label="保存到其他"
                value={shortcuts.saveToOther}
                shortcutKey="saveToOther"
                placeholder="例如: Alt+S"
              />

              <ShortcutInput
                label="保存剪贴板到其他"
                value={shortcuts.saveClipboardToOther}
                shortcutKey="saveClipboardToOther"
                placeholder="例如: Alt+C"
              />

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
                <p className="text-xs text-gray-500 mt-1">
                  输入触发Prompt的字符组合
                </p>
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
            <li>• 快捷键设置：点击输入框后直接按下您想要的快捷键组合</li>
            <li>• 支持的组合：Alt、Ctrl、Shift 等修饰键 + 字母/数字/功能键</li>
            <li>• 选中文本后使用快捷键可快速保存到对应分类</li>
            <li>• Prompt 触发器：在输入框中输入触发器+关键词可快速插入预设内容</li>
            <li>• 修改设置后会立即生效，无需重启浏览器</li>
            <li>• 按ESC可取消快捷键录制</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
