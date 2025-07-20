import { useEffect, useState } from "react"

import { storageService } from "~services/storage"
import type { Prompt } from "~types"

interface PromptFormProps {
  prompt?: Prompt | null
  onSave: (prompt: Prompt) => void
  onCancel: () => void
}

export function PromptForm({ prompt, onSave, onCancel }: PromptFormProps) {
  const [formData, setFormData] = useState({
    key: "",
    title: "",
    content: "",
    description: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (prompt) {
      setFormData({
        key: prompt.key,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description || ""
      })
    } else {
      setFormData({
        key: "",
        title: "",
        content: "",
        description: ""
      })
    }
    setErrors({})
  }, [prompt])

  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    // Key validation
    if (!formData.key.trim()) {
      newErrors.key = "Key 不能为空"
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.key)) {
      newErrors.key = "Key 只能包含字母、数字、下划线和连字符"
    } else {
      // Check key uniqueness
      const isUnique = await storageService.isPromptKeyUnique(
        formData.key,
        prompt?.id
      )
      if (!isUnique) {
        newErrors.key = "该 Key 已存在，请使用其他 Key"
      }
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "标题不能为空"
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = "内容不能为空"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (saving) return

    const isValid = await validateForm()
    if (!isValid) return

    setSaving(true)
    try {
      const now = Date.now()
      const promptData: Prompt = {
        id:
          prompt?.id ||
          `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        key: formData.key.trim(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        createdAt: prompt?.createdAt || now,
        updatedAt: now
      }

      await storageService.savePrompt(promptData)
      onSave(promptData)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "保存失败，请重试"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50">
      <div className="plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg plasmo-w-full plasmo-max-w-md plasmo-mx-4 plasmo-max-h-[90vh] plasmo-overflow-y-auto">
        <div className="plasmo-p-6">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-4">
            <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-900">
              {prompt ? "编辑 Prompt" : "添加 Prompt"}
            </h2>
            <button
              onClick={onCancel}
              className="plasmo-text-gray-400 hover:plasmo-text-gray-600 plasmo-transition-colors">
              <svg
                className="plasmo-w-6 plasmo-h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="plasmo-space-y-4">
            {/* Key Field */}
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
                Key *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleInputChange("key", e.target.value)}
                className={`plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-rounded-md plasmo-text-sm plasmo-transition-colors ${
                  errors.key
                    ? "plasmo-border-red-300 plasmo-bg-red-50"
                    : "plasmo-border-gray-300 focus:plasmo-border-blue-500 focus:plasmo-ring-1 focus:plasmo-ring-blue-500"
                }`}
                placeholder="例如: greeting, summary, translate"
              />
              {errors.key && (
                <p className="plasmo-text-red-500 plasmo-text-xs plasmo-mt-1">
                  {errors.key}
                </p>
              )}
              <p className="plasmo-text-gray-500 plasmo-text-xs plasmo-mt-1">
                用于触发 Prompt 的唯一标识，只能包含字母、数字、下划线和连字符
              </p>
            </div>

            {/* Title Field */}
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
                标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-rounded-md plasmo-text-sm plasmo-transition-colors ${
                  errors.title
                    ? "plasmo-border-red-300 plasmo-bg-red-50"
                    : "plasmo-border-gray-300 focus:plasmo-border-blue-500 focus:plasmo-ring-1 focus:plasmo-ring-blue-500"
                }`}
                placeholder="Prompt 的显示名称"
              />
              {errors.title && (
                <p className="plasmo-text-red-500 plasmo-text-xs plasmo-mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-text-sm focus:plasmo-border-blue-500 focus:plasmo-ring-1 focus:plasmo-ring-blue-500 plasmo-transition-colors"
                placeholder="简短描述这个 Prompt 的用途（可选）"
              />
            </div>

            {/* Content Field */}
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
                内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                rows={4}
                className={`plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-rounded-md plasmo-text-sm plasmo-transition-colors plasmo-resize-none ${
                  errors.content
                    ? "plasmo-border-red-300 plasmo-bg-red-50"
                    : "plasmo-border-gray-300 focus:plasmo-border-blue-500 focus:plasmo-ring-1 focus:plasmo-ring-blue-500"
                }`}
                placeholder="输入 Prompt 的具体内容..."
              />
              {errors.content && (
                <p className="plasmo-text-red-500 plasmo-text-xs plasmo-mt-1">
                  {errors.content}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="plasmo-text-red-500 plasmo-text-sm plasmo-text-center">
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="plasmo-flex plasmo-gap-3 plasmo-pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-bg-gray-100 plasmo-border plasmo-border-gray-300 plasmo-rounded-md hover:plasmo-bg-gray-200 plasmo-transition-colors">
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-text-white plasmo-bg-blue-600 plasmo-border plasmo-border-transparent plasmo-rounded-md hover:plasmo-bg-blue-700 disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed plasmo-transition-colors">
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
