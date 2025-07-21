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
      newErrors.key = chrome.i18n.getMessage("keyEmpty")
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.key)) {
      newErrors.key = chrome.i18n.getMessage("keyInvalid")
    } else {
      // Check key uniqueness
      const isUnique = await storageService.isPromptKeyUnique(
        formData.key,
        prompt?.id
      )
      if (!isUnique) {
        newErrors.key = chrome.i18n.getMessage("keyExists")
      }
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = chrome.i18n.getMessage("titleEmpty")
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = chrome.i18n.getMessage("contentEmpty")
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
        submit: error instanceof Error ? error.message : chrome.i18n.getMessage("saveFailed")
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {prompt ? chrome.i18n.getMessage("editPrompt") : chrome.i18n.getMessage("addPrompt")}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg
                className="w-6 h-6"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Key Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {chrome.i18n.getMessage("keyLabel")}
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleInputChange("key", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                  errors.key
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                }`}
                placeholder={chrome.i18n.getMessage("keyPlaceholder")}
              />
              {errors.key && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.key}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {chrome.i18n.getMessage("keyHelp")}
              </p>
            </div>

            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {chrome.i18n.getMessage("titleLabel")}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                  errors.title
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                }`}
                placeholder={chrome.i18n.getMessage("titlePlaceholder")}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {chrome.i18n.getMessage("descriptionLabel")}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder={chrome.i18n.getMessage("descriptionPlaceholder")}
              />
            </div>

            {/* Content Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {chrome.i18n.getMessage("contentLabel")}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md text-sm transition-colors resize-none ${
                  errors.content
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                }`}
                placeholder={chrome.i18n.getMessage("contentPlaceholder")}
              />
              {errors.content && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.content}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="text-red-500 text-sm text-center">
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                {chrome.i18n.getMessage("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {saving ? chrome.i18n.getMessage("saving") : chrome.i18n.getMessage("save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
