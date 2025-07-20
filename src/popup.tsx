import { useState } from "react"

import "~style.css"
import { RecordList } from "~components/RecordList"
import { RecordDetail } from "~components/RecordDetail"
import { SearchBar } from "~components/SearchBar"
import type { Record } from "~types"

type NavigationTab = "records" | "prompts"
type RecordCategory = "inspiration" | "todo" | "principle" | "other"

const CATEGORY_LABELS: { [K in RecordCategory]: string } = {
  inspiration: "灵感",
  todo: "待办",
  principle: "原则",
  other: "其他"
}

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("records")
  const [activeCategory, setActiveCategory] = useState<RecordCategory>("inspiration")
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRecordClick = (record: Record) => {
    setSelectedRecord(record)
  }

  const handleRecordUpdate = (updatedRecord: Record) => {
    setSelectedRecord(updatedRecord)
    // Trigger refresh of the record list
    setRefreshTrigger(prev => prev + 1)
  }

  const handleRecordDelete = (recordId: string) => {
    setSelectedRecord(null)
    // Trigger refresh of the record list
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCloseDetail = () => {
    setSelectedRecord(null)
  }

  return (
    <div className="plasmo-w-96 plasmo-h-96 plasmo-bg-white plasmo-flex plasmo-flex-col">
      {/* Header */}
      <div className="plasmo-bg-blue-600 plasmo-text-white plasmo-p-4">
        <h1 className="plasmo-text-lg plasmo-font-semibold">Quick Note & Prompt</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="plasmo-flex plasmo-border-b plasmo-border-gray-200">
        <button
          onClick={() => setActiveTab("records")}
          className={`plasmo-flex-1 plasmo-py-3 plasmo-px-4 plasmo-text-sm plasmo-font-medium plasmo-transition-colors ${
            activeTab === "records"
              ? "plasmo-bg-blue-50 plasmo-text-blue-600 plasmo-border-b-2 plasmo-border-blue-600"
              : "plasmo-text-gray-600 hover:plasmo-text-gray-800 hover:plasmo-bg-gray-50"
          }`}
        >
          记录管理
        </button>
        <button
          onClick={() => setActiveTab("prompts")}
          className={`plasmo-flex-1 plasmo-py-3 plasmo-px-4 plasmo-text-sm plasmo-font-medium plasmo-transition-colors ${
            activeTab === "prompts"
              ? "plasmo-bg-blue-50 plasmo-text-blue-600 plasmo-border-b-2 plasmo-border-blue-600"
              : "plasmo-text-gray-600 hover:plasmo-text-gray-800 hover:plasmo-bg-gray-50"
          }`}
        >
          Prompt 管理
        </button>
      </div>

      {/* Content Area */}
      <div className="plasmo-flex-1 plasmo-overflow-hidden">
        {activeTab === "records" && (
          <div className="plasmo-h-full plasmo-flex plasmo-flex-col">
            {/* Category Tabs */}
            <div className="plasmo-flex plasmo-bg-gray-50 plasmo-border-b plasmo-border-gray-200">
              {(Object.keys(CATEGORY_LABELS) as RecordCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`plasmo-flex-1 plasmo-py-2 plasmo-px-3 plasmo-text-xs plasmo-font-medium plasmo-transition-colors ${
                    activeCategory === category
                      ? "plasmo-bg-white plasmo-text-blue-600 plasmo-border-b-2 plasmo-border-blue-600"
                      : "plasmo-text-gray-600 hover:plasmo-text-gray-800 hover:plasmo-bg-gray-100"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="plasmo-p-3 plasmo-bg-white plasmo-border-b plasmo-border-gray-200">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜索记录内容、标题或网址..."
              />
            </div>

            {/* Records Content */}
            <div className="plasmo-flex-1 plasmo-p-4 plasmo-overflow-y-auto plasmo-bg-gray-50">
              <RecordList 
                category={activeCategory} 
                searchQuery={searchQuery}
                onRecordClick={handleRecordClick}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        )}
        {activeTab === "prompts" && (
          <div className="plasmo-h-full plasmo-p-4">
            <div className="plasmo-text-center plasmo-text-gray-500 plasmo-mt-8">
              Prompt 管理功能即将推出
            </div>
          </div>
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <RecordDetail
          record={selectedRecord}
          onClose={handleCloseDetail}
          onUpdate={handleRecordUpdate}
          onDelete={handleRecordDelete}
        />
      )}
    </div>
  )
}

export default IndexPopup
