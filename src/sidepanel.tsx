import { useEffect, useState } from "react"

import "~style.css"

import { ConfirmDialog } from "~components/ConfirmDialog"
import { PromptForm } from "~components/PromptForm"
import { PromptList } from "~components/PromptList"
import { RecordDetail } from "~components/RecordDetail"
import { RecordList } from "~components/RecordList"
import { SearchBar } from "~components/SearchBar"
import { SyncStatus } from "~components/SyncStatus"
import { storageService } from "~services/storage"
import type { Prompt, Record } from "~types"

type NavigationTab = "records" | "prompts"
type RecordCategory = "inspiration" | "todo" | "principle" | "other"

const getCategoryLabel = (category: RecordCategory): string => {
  return chrome.i18n.getMessage(category)
}

function IndexSidepanel() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("records")
  const [activeCategory, setActiveCategory] =
    useState<RecordCategory>("inspiration")
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Prompt management state
  const [promptRefreshTrigger, setPromptRefreshTrigger] = useState(0)
  const [showPromptForm, setShowPromptForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null)

  // Listen for storage changes to automatically refresh when records are updated
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.records) {
        console.log("Records updated, refreshing side panel UI")
        // Automatically refresh the records list when records are updated
        setRefreshTrigger((prev) => prev + 1)
      }
    }

    // Add storage change listener
    chrome.storage.onChanged.addListener(handleStorageChange)

    // Also listen for runtime messages from content script for immediate updates
    const handleRuntimeMessage = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === "recordSaved") {
        console.log("Received recordSaved message, refreshing UI")
        setRefreshTrigger((prev) => prev + 1)
        sendResponse({ success: true })
      }
      return true // Keep message channel open for async response
    }

    chrome.runtime.onMessage.addListener(handleRuntimeMessage)

    // Cleanup listeners on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage)
    }
  }, [])

  const handleRecordClick = (record: Record) => {
    setSelectedRecord(record)
  }

  const handleRecordUpdate = (updatedRecord: Record) => {
    setSelectedRecord(updatedRecord)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleRecordDelete = () => {
    setSelectedRecord(null)
    setRefreshTrigger((prev) => prev + 1)
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

  const handlePromptSave = () => {
    setShowPromptForm(false)
    setEditingPrompt(null)
    setPromptRefreshTrigger((prev) => prev + 1)
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
        setPromptRefreshTrigger((prev) => prev + 1)
      } catch (error) {
        console.error("Failed to delete prompt:", error)
      }
    }
  }

  const handleCancelDeletePrompt = () => {
    setPromptToDelete(null)
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {chrome.i18n.getMessage("appTitle")}
          </h1>
        </div>
      </div>

      {/* Sync Status Bar */}
      <div className="border-b border-gray-200">
        <SyncStatus onSyncComplete={() => {
          setRefreshTrigger(prev => prev + 1)
          setPromptRefreshTrigger(prev => prev + 1)
        }} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("records")}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === "records"
              ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}>
          {chrome.i18n.getMessage("recordManagement")}
        </button>
        <button
          onClick={() => setActiveTab("prompts")}
          className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
            activeTab === "prompts"
              ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}>
          {chrome.i18n.getMessage("promptManagement")}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "records" && (
          <div className="h-full flex flex-col">
            {/* Category Tabs */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              {(
                [
                  "inspiration",
                  "todo",
                  "principle",
                  "other"
                ] as RecordCategory[]
              ).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium transition-colors ${
                    activeCategory === category
                      ? "bg-white text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}>
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="p-2 bg-white border-b border-gray-200">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={chrome.i18n.getMessage("searchPlaceholder")}
              />
            </div>

            {/* Records Content */}
            <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
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
          <div className="h-full flex flex-col">
            {/* Prompt Header with Add Button */}
            <div className="p-3 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleAddPrompt}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors">
                  {chrome.i18n.getMessage("addPrompt")}
                </button>
              </div>
            </div>

            {/* Prompt List */}
            <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
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
          title={chrome.i18n.getMessage("deletePrompt")}
          message={chrome.i18n.getMessage(
            "deletePromptConfirm",
            promptToDelete.title
          )}
          confirmText={chrome.i18n.getMessage("delete")}
          cancelText={chrome.i18n.getMessage("cancel")}
          onConfirm={handleConfirmDeletePrompt}
          onCancel={handleCancelDeletePrompt}
          isDestructive={true}
        />
      )}
    </div>
  )
}

export default IndexSidepanel
