import React, { useState } from "react"
import type { Record, RecordCategory } from "~types"
import { storageService } from "~services/storage"
import { ConfirmDialog } from "./ConfirmDialog"
import { formatDate } from '~services/utils'

interface RecordDetailProps {
  record: Record
  onClose: () => void
  onUpdate: (updatedRecord: Record) => void
  onDelete: (recordId: string) => void
}

const getCategoryLabel = (category: RecordCategory): string => {
  return chrome.i18n.getMessage(category)
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

 

  const handleSave = async () => {
    if (!editForm.content.trim()) {
      setError(chrome.i18n.getMessage("recordContentEmpty"))
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const updatedRecord: Record = {
        ...record,
        content: editForm.content.trim(),
        category: editForm.category,
        updatedAt: Date.now()
      }

      await storageService.updateRecord(updatedRecord)
      onUpdate(updatedRecord)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : chrome.i18n.getMessage("saveFailed"))
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
      setError(err instanceof Error ? err.message : chrome.i18n.getMessage("saveFailed"))
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-80 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {chrome.i18n.getMessage("recordDetail")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4">
              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chrome.i18n.getMessage("recordContent")}
                </label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-[45vh] px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={chrome.i18n.getMessage("contentPlaceholder")}
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chrome.i18n.getMessage("category")}
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as RecordCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORY_OPTIONS.map(category => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Content Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chrome.i18n.getMessage("recordContent")}
                </label>
                <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-md">
                  {record.content}
                </div>
              </div>

              {/* Category Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chrome.i18n.getMessage("category")}
                </label>
                <div className="text-sm text-gray-800">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getCategoryLabel(record.category)}
                  </span>
                </div>
              </div>

              {/* Source Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chrome.i18n.getMessage("sourceInfo")}
                </label>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-400">📄</span>
                    <span className="break-all">{record.sourceTitle}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-400">🔗</span>
                    <a 
                      href={record.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all underline"
                    >
                      {record.sourceUrl}
                    </a>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {chrome.i18n.getMessage("timeInfo")}
                </label>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>{chrome.i18n.getMessage("createdAt", formatDate(record.createdAt))}</div>
                  <div>{chrome.i18n.getMessage("updatedAtTime", formatDate(record.updatedAt))}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          {isEditing ? (
            <div className="flex space-x-2 w-full">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {chrome.i18n.getMessage("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? chrome.i18n.getMessage("saving") : chrome.i18n.getMessage("save")}
              </button>
            </div>
          ) : (
            <div className="flex space-x-2 w-full">
              <button
                onClick={handleDeleteClick}
                className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                {chrome.i18n.getMessage("delete")}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {chrome.i18n.getMessage("edit")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={chrome.i18n.getMessage("confirmDelete")}
        message={chrome.i18n.getMessage("deleteRecordConfirm")}
        confirmText={chrome.i18n.getMessage("delete")}
        cancelText={chrome.i18n.getMessage("cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDestructive={true}
      />
    </div>
  )
}