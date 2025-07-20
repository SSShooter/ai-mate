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
    <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50">
      <div className="plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg plasmo-w-full plasmo-max-w-md plasmo-mx-4 plasmo-max-h-[90vh] plasmo-overflow-y-auto">
        <div className="plasmo-p-6">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-4">
            <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-900">
              {prompt ? chrome.i18n.getMessage("editPrompt") : chrome.i18n.getMessage("addPrompt")}
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
                {chrome.i18n.getMessage("keyLabel")}
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
                placeholder={chrome.i18n.getMessage("keyPlaceholder")}
              />
              {errors.key && (
                <p className="plasmo-text-red-500 plasmo-text-xs plasmo-mt-1">
                  {errors.key}
                </p>
              )}
              <p className="plasmo-text-gray-500 plasmo-text-xs plasmo-mt-1">
                {chrome.i18n.getMessage("keyHelp")}
              </p>
            </div>

            {/* Title Field */}
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
                {chrome.i18n.getMessage("titleLabel")}
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
                placeholder={chrome.i18n.getMessage("titlePlaceholder")}
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
                {chrome.i18n.getMessage("descriptionLabel")}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-text-sm focus:plasmo-border-blue-500 focus:plasmo-ring-1 focus:plasmo-ring-blue-500 plasmo-transition-colors"
                placeholder={chrome.i18n.getMessage("descriptionPlaceholder")}
              />
            </div>

            {/* Content Field */}
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-1">
                {chrome.i18n.getMessage("contentLabel")}
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
                placeholder={chrome.i18n.getMessage("contentPlaceholder")}
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
                {chrome.i18n.getMessage("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-text-white plasmo-bg-blue-600 plasmo-border plasmo-border-transparent plasmo-rounded-md hover:plasmo-bg-blue-700 disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed plasmo-transition-colors">
                {saving ? chrome.i18n.getMessage("saving") : chrome.i18n.getMessage("save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
