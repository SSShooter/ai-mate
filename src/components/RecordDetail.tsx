import React, { useState } from "react"
import type { Record, RecordCategory } from "~types"
import { storageService } from "~services/storage"
import { ConfirmDialog } from "./ConfirmDialog"

interface RecordDetailProps {
  record: Record
  onClose: () => void
  onUpdate: (updatedRecord: Record) => void
  onDelete: (recordId: string) => void
}

const CATEGORY_LABELS: { [K in RecordCategory]: string } = {
  inspiration: "灵感",
  todo: "待办", 
  principle: "原则",
  other: "其他"
}

const CATEGORY_OPTIONS: RecordCategory[] = ["inspiration", "todo", "principle", "other"]

export function RecordDetail({ record, onClose, onUpdate, onDelete }: RecordDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    content: record.content,
    category: record.category
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const formatDate = (date: Date) => {
    try {
      // Check if date is valid
      if (!date || isNaN(date.getTime())) {
        return "无效日期"
      }
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date)
    } catch (error) {
      return "无效日期"
    }
  }

  const handleSave = async () => {
    if (!editForm.content.trim()) {
      setError("记录内容不能为空")
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const updatedRecord: Record = {
        ...record,
        content: editForm.content.trim(),
        category: editForm.category,
        updatedAt: new Date()
      }

      await storageService.updateRecord(updatedRecord)
      onUpdate(updatedRecord)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditForm({
      content: record.content,
      category: record.category
    })
    setError(null)
    setIsEditing(false)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await storageService.deleteRecord(record.id)
      onDelete(record.id)
      setShowDeleteConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败")
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50">
      <div className="plasmo-bg-white plasmo-rounded-lg plasmo-shadow-xl plasmo-w-80 plasmo-max-h-96 plasmo-flex plasmo-flex-col">
        {/* Header */}
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-p-4 plasmo-border-b plasmo-border-gray-200">
          <h3 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-800">
            记录详情
          </h3>
          <button
            onClick={onClose}
            className="plasmo-text-gray-400 hover:plasmo-text-gray-600 plasmo-transition-colors"
          >
            <svg className="plasmo-w-5 plasmo-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="plasmo-flex-1 plasmo-p-4 plasmo-overflow-y-auto">
          {isEditing ? (
            <div className="plasmo-space-y-4">
              {/* Content Editor */}
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
                  记录内容
                </label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  className="plasmo-w-full plasmo-h-24 plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-text-sm plasmo-resize-none focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500 focus:plasmo-border-transparent"
                  placeholder="请输入记录内容..."
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
                  分组
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as RecordCategory }))}
                  className="plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500 focus:plasmo-border-transparent"
                >
                  {CATEGORY_OPTIONS.map(category => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="plasmo-text-sm plasmo-text-red-500 plasmo-bg-red-50 plasmo-p-2 plasmo-rounded">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="plasmo-space-y-4">
              {/* Content Display */}
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
                  记录内容
                </label>
                <div className="plasmo-text-sm plasmo-text-gray-800 plasmo-leading-relaxed plasmo-bg-gray-50 plasmo-p-3 plasmo-rounded-md">
                  {record.content}
                </div>
              </div>

              {/* Category Display */}
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
                  分组
                </label>
                <div className="plasmo-text-sm plasmo-text-gray-800">
                  <span className="plasmo-inline-flex plasmo-items-center plasmo-px-2 plasmo-py-1 plasmo-rounded-full plasmo-text-xs plasmo-font-medium plasmo-bg-blue-100 plasmo-text-blue-800">
                    {CATEGORY_LABELS[record.category]}
                  </span>
                </div>
              </div>

              {/* Source Info */}
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
                  来源信息
                </label>
                <div className="plasmo-space-y-2 plasmo-text-sm plasmo-text-gray-600">
                  <div className="plasmo-flex plasmo-items-start plasmo-space-x-2">
                    <span className="plasmo-text-gray-400">📄</span>
                    <span className="plasmo-break-all">{record.sourceTitle}</span>
                  </div>
                  <div className="plasmo-flex plasmo-items-start plasmo-space-x-2">
                    <span className="plasmo-text-gray-400">🔗</span>
                    <a 
                      href={record.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="plasmo-text-blue-600 hover:plasmo-text-blue-800 plasmo-break-all plasmo-underline"
                    >
                      {record.sourceUrl}
                    </a>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-text-gray-700 plasmo-mb-2">
                  时间信息
                </label>
                <div className="plasmo-space-y-1 plasmo-text-xs plasmo-text-gray-500">
                  <div>创建时间: {formatDate(record.createdAt)}</div>
                  <div>更新时间: {formatDate(record.updatedAt)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-p-4 plasmo-border-t plasmo-border-gray-200">
          {isEditing ? (
            <div className="plasmo-flex plasmo-space-x-2 plasmo-w-full">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="plasmo-flex-1 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-gray-700 plasmo-bg-gray-100 plasmo-rounded-md hover:plasmo-bg-gray-200 plasmo-transition-colors disabled:plasmo-opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="plasmo-flex-1 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-white plasmo-bg-blue-600 plasmo-rounded-md hover:plasmo-bg-blue-700 plasmo-transition-colors disabled:plasmo-opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          ) : (
            <div className="plasmo-flex plasmo-space-x-2 plasmo-w-full">
              <button
                onClick={handleDeleteClick}
                className="plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-red-600 plasmo-bg-red-50 plasmo-rounded-md hover:plasmo-bg-red-100 plasmo-transition-colors"
              >
                删除
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="plasmo-flex-1 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-white plasmo-bg-blue-600 plasmo-rounded-md hover:plasmo-bg-blue-700 plasmo-transition-colors"
              >
                编辑
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这条记录吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDestructive={true}
      />
    </div>
  )
}