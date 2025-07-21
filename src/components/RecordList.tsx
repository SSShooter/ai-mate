import React, { useEffect, useState } from "react"
import type { Record, RecordCategory } from "~types"
import { storageService } from "~services/storage"

interface RecordListProps {
  category: RecordCategory
  searchQuery?: string
  onRecordClick?: (record: Record) => void
  refreshTrigger?: number
}

const getCategoryLabel = (category: RecordCategory): string => {
  return chrome.i18n.getMessage(category)
}

export function RecordList({ category, searchQuery = "", onRecordClick, refreshTrigger }: RecordListProps) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecords()
  }, [category, refreshTrigger])

  const loadRecords = async () => {
    try {
      setLoading(true)
      setError(null)
      const categoryRecords = await storageService.getRecordsByCategory(category)
      setRecords(categoryRecords)
    } catch (err) {
      setError(err instanceof Error ? err.message : chrome.i18n.getMessage("loadRecordsFailed"))
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort records based on search query (newest to oldest)
  const filteredRecords = records
    .filter(record => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        record.content.toLowerCase().includes(query) ||
        record.sourceTitle.toLowerCase().includes(query) ||
        record.sourceUrl.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => b.createdAt - a.createdAt)

  const formatDate = (date: Date | number) => {
    try {
      // Convert timestamp to Date if needed
      const dateObj = typeof date === 'number' ? new Date(date) : date
      
      // Check if date is valid
      if (!dateObj || isNaN(dateObj.getTime())) {
        return chrome.i18n.getMessage("invalidDate")
      }
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      return chrome.i18n.getMessage("invalidDate")
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">{chrome.i18n.getMessage("loading")}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-sm text-red-500 mb-2">{chrome.i18n.getMessage("loadFailed")}</div>
        <div className="text-xs text-gray-400 mb-4">{error}</div>
        <button
          onClick={loadRecords}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {chrome.i18n.getMessage("retry")}
        </button>
      </div>
    )
  }

  // Empty state
  if (filteredRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-sm text-gray-500 mb-1">
          {searchQuery.trim() ? chrome.i18n.getMessage("noRecordsFound") : chrome.i18n.getMessage("noRecordsInCategory", getCategoryLabel(category))}
        </div>
        <div className="text-xs text-gray-400">
          {searchQuery.trim() ? chrome.i18n.getMessage("adjustSearchKeywords") : chrome.i18n.getMessage("quickRecordHint")}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filteredRecords.map((record) => (
        <div
          key={record.id}
          onClick={() => onRecordClick?.(record)}
          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer hover:border-blue-300"
        >
          {/* Record content - main focus */}
          <div className="text-sm text-gray-800 mb-2 leading-relaxed">
            {truncateText(record.content, 150)}
          </div>
          
          {/* Simplified metadata - only timestamp */}
          <div className="text-xs text-gray-400">
            {formatDate(record.createdAt)}
          </div>
        </div>
      ))}
    </div>
  )
}