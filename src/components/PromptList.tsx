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
      setError(err instanceof Error ? err.message : "加载 Prompt 失败")
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
      <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-py-8">
        <div className="plasmo-text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="plasmo-text-center plasmo-py-8">
        <div className="plasmo-text-red-500 plasmo-mb-2">{error}</div>
        <button
          onClick={loadPrompts}
          className="plasmo-text-blue-600 hover:plasmo-text-blue-800 plasmo-text-sm">
          重试
        </button>
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <div className="plasmo-text-center plasmo-py-8 plasmo-text-gray-500">
        <div className="plasmo-mb-2">暂无 Prompt</div>
        <div className="plasmo-text-sm">
          点击上方"添加 Prompt"按钮创建第一个 Prompt
        </div>
      </div>
    )
  }

  return (
    <div className="plasmo-space-y-2">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          onClick={() => onPromptClick?.(prompt)}
          className="plasmo-bg-white plasmo-border plasmo-border-gray-200 plasmo-rounded-lg plasmo-p-4 hover:plasmo-bg-gray-50 plasmo-cursor-pointer plasmo-transition-colors">
          <div className="plasmo-flex plasmo-items-start plasmo-justify-between">
            <div className="plasmo-flex-1 plasmo-min-w-0">
              <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mb-2">
                <span className="plasmo-inline-flex plasmo-items-center plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-xs plasmo-font-medium plasmo-bg-blue-100 plasmo-text-blue-800">
                  {prompt.key}
                </span>
                <h3 className="plasmo-font-medium plasmo-text-gray-900 plasmo-truncate">
                  {prompt.title}
                </h3>
              </div>
              {prompt.description && (
                <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-mb-2 plasmo-line-clamp-2">
                  {prompt.description}
                </p>
              )}
              <p className="plasmo-text-sm plasmo-text-gray-500 plasmo-line-clamp-2">
                {prompt.content}
              </p>
              <div className="plasmo-text-xs plasmo-text-gray-400 plasmo-mt-2">
                更新于 {formatDate(prompt.updatedAt)}
              </div>
            </div>
            <div className="plasmo-flex plasmo-gap-1 plasmo-ml-2">
              <button
                onClick={(e) => handleEdit(prompt, e)}
                className="plasmo-p-1 plasmo-text-gray-400 hover:plasmo-text-blue-600 plasmo-transition-colors"
                title="编辑">
                <svg
                  className="plasmo-w-4 plasmo-h-4"
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
                className="plasmo-p-1 plasmo-text-gray-400 hover:plasmo-text-red-600 plasmo-transition-colors"
                title="删除">
                <svg
                  className="plasmo-w-4 plasmo-h-4"
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
