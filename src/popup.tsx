import { useState } from "react"

import "~style.css"
import { RecordList } from "~components/RecordList"
import { RecordDetail } from "~components/RecordDetail"
import { SearchBar } from "~components/SearchBar"
import { PromptList } from "~components/PromptList"
import { PromptForm } from "~components/PromptForm"
import { ConfirmDialog } from "~components/ConfirmDialog"
import type { Record, Prompt } from "~types"
import { storageService } from "~services/storage"

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

  // Prompt management state
  const [promptRefreshTrigger, setPromptRefreshTrigger] = useState(0)
  const [showPromptForm, setShowPromptForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null)

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

  // Prompt management handlers
  const handleAddPrompt = () => {
    setEditingPrompt(null)
    setShowPromptForm(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setShowPromptForm(true)
  }

  const handleDeletePrompt = (prompt: Prompt) => {
    setPromptToDelete(prompt)
  }

  const handlePromptSave = (prompt: Prompt) => {
    setShowPromptForm(false)
    setEditingPrompt(null)
    setPromptRefreshTrigger(prev => prev + 1)
  }

  const handlePromptFormCancel = () => {
    setShowPromptForm(false)
    setEditingPrompt(null)
  }

  const handleConfirmDeletePrompt = async () => {
    if (promptToDelete) {
      try {
        await storageService.deletePrompt(promptToDelete.id)
        setPromptToDelete(null)
        setPromptRefreshTrigger(prev => prev + 1)
      } catch (error) {
        console.error("Failed to delete prompt:", error)
      }
    }
  }

  const handleCancelDeletePrompt = () => {
    setPromptToDelete(null)
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
          <div className="plasmo-h-full plasmo-flex plasmo-flex-col">
            {/* Prompt Header with Add Button */}
            <div className="plasmo-p-4 plasmo-bg-white plasmo-border-b plasmo-border-gray-200">
              <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                <h2 className="plasmo-text-lg plasmo-font-medium plasmo-text-gray-900">Prompt 管理</h2>
                <button
                  onClick={handleAddPrompt}
                  className="plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-text-white plasmo-bg-blue-600 plasmo-border plasmo-border-transparent plasmo-rounded-md hover:plasmo-bg-blue-700 plasmo-transition-colors"
                >
                  添加 Prompt
                </button>
              </div>
            </div>

            {/* Prompt List */}
            <div className="plasmo-flex-1 plasmo-p-4 plasmo-overflow-y-auto plasmo-bg-gray-50">
              <PromptList
                onEdit={handleEditPrompt}
                onDelete={handleDeletePrompt}
                refreshTrigger={promptRefreshTrigger}
              />
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

      {/* Prompt Form Modal */}
      {showPromptForm && (
        <PromptForm
          prompt={editingPrompt}
          onSave={handlePromptSave}
          onCancel={handlePromptFormCancel}
        />
      )}

      {/* Prompt Delete Confirmation Dialog */}
      {promptToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="删除 Prompt"
          message={`确定要删除 Prompt "${promptToDelete.title}" 吗？此操作无法撤销。`}
          confirmText="删除"
          cancelText="取消"
          onConfirm={handleConfirmDeletePrompt}
          onCancel={handleCancelDeletePrompt}
          isDestructive={true}
        />
      )}
    </div>
  )
}

export default IndexPopup
