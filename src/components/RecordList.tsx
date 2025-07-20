import React, { useEffect, useState } from "react"
import type { Record, RecordCategory } from "~types"
import { storageService } from "~services/storage"

interface RecordListProps {
  category: RecordCategory
  searchQuery?: string
  onRecordClick?: (record: Record) => void
  refreshTrigger?: number
}

const CATEGORY_LABELS: { [K in RecordCategory]: string } = {
  inspiration: "灵感",
  todo: "待办",
  principle: "原则",
  other: "其他"
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
      setError(err instanceof Error ? err.message : "加载记录失败")
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
        return "无效日期"
      }
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      return "无效日期"
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-py-8">
        <div className="plasmo-text-sm plasmo-text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-8">
        <div className="plasmo-text-sm plasmo-text-red-500 plasmo-mb-2">加载失败</div>
        <div className="plasmo-text-xs plasmo-text-gray-400 plasmo-mb-4">{error}</div>
        <button
          onClick={loadRecords}
          className="plasmo-px-3 plasmo-py-1 plasmo-text-xs plasmo-bg-blue-500 plasmo-text-white plasmo-rounded hover:plasmo-bg-blue-600"
        >
          重试
        </button>
      </div>
    )
  }

  // Empty state
  if (filteredRecords.length === 0) {
    return (
      <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-8">
        <div className="plasmo-text-gray-400 plasmo-mb-2">
          <svg className="plasmo-w-12 plasmo-h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="plasmo-text-sm plasmo-text-gray-500 plasmo-mb-1">
          {searchQuery.trim() ? "没有找到匹配的记录" : `暂无${CATEGORY_LABELS[category]}记录`}
        </div>
        <div className="plasmo-text-xs plasmo-text-gray-400">
          {searchQuery.trim() ? "尝试调整搜索关键词" : "在网页上选中文本并右键快速记录"}
        </div>
      </div>
    )
  }

  return (
    <div className="plasmo-space-y-3">
      {filteredRecords.map((record) => (
        <div
          key={record.id}
          onClick={() => onRecordClick?.(record)}
          className="plasmo-bg-white plasmo-border plasmo-border-gray-200 plasmo-rounded-lg plasmo-p-3 hover:plasmo-shadow-sm plasmo-transition-shadow plasmo-cursor-pointer hover:plasmo-border-blue-300"
        >
          {/* Record content - main focus */}
          <div className="plasmo-text-sm plasmo-text-gray-800 plasmo-mb-2 plasmo-leading-relaxed">
            {truncateText(record.content, 150)}
          </div>
          
          {/* Simplified metadata - only timestamp */}
          <div className="plasmo-text-xs plasmo-text-gray-400">
            {formatDate(record.createdAt)}
          </div>
        </div>
      ))}
    </div>
  )
}