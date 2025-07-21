import { useEffect, useState } from "react"

import { storageService } from "~services/storage"
import { formatDate } from "~services/utils"
import type { Prompt } from "~types"

interface PromptListProps {
  onPromptClick?: (prompt: Prompt) => void
  onEdit?: (prompt: Prompt) => void
  onDelete?: (prompt: Prompt) => void
  refreshTrigger?: number
}

export function PromptList({
  onPromptClick,
  onEdit,
  onDelete,
  refreshTrigger = 0
}: PromptListProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
  }, [refreshTrigger])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      setError(null)
      const allPrompts = await storageService.getAllPrompts()
      // Sort by createdAt (newest to oldest) for consistency with records
      setPrompts(
        allPrompts.sort((a, b) => b.createdAt - a.createdAt)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : chrome.i18n.getMessage("loadPromptsFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(prompt)
  }

  const handleDelete = (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(prompt)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">{chrome.i18n.getMessage("loading")}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">{error}</div>
        <button
          onClick={loadPrompts}
          className="text-blue-600 hover:text-blue-800 text-sm">
          {chrome.i18n.getMessage("retry")}
        </button>
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="mb-2">{chrome.i18n.getMessage("noPrompts")}</div>
        <div className="text-sm">
          {chrome.i18n.getMessage("noPromptsHint")}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          onClick={() => onPromptClick?.(prompt)}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {prompt.key}
                </span>
                <h3 className="font-medium text-gray-900 truncate">
                  {prompt.title}
                </h3>
              </div>
              {prompt.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {prompt.description}
                </p>
              )}
              <p className="text-sm text-gray-500 line-clamp-2">
                {prompt.content}
              </p>
              <div className="text-xs text-gray-400 mt-2">
                {chrome.i18n.getMessage("updatedAt", formatDate(prompt.updatedAt))}
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={(e) => handleEdit(prompt, e)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title={chrome.i18n.getMessage("edit")}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => handleDelete(prompt, e)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title={chrome.i18n.getMessage("delete")}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
