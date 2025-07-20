import { CONTEXT_MENU_IDS, RECORD_CATEGORIES } from "~constants"
import type { RecordCategory } from "~types"

// Background script for handling context menu and communication
class BackgroundService {
  constructor() {
    this.init()
  }

  private init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this))
    
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this))
    
    // Listen for context menu clicks
    chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this))
    
    // Listen for action clicks (extension icon)
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this))
  }

  private handleInstalled() {
    this.createContextMenus()
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    if (message.action === "setupContextMenu") {
      this.createContextMenus()
      sendResponse({ success: true })
    }
    
    return true // Keep message channel open for async response
  }

  private createContextMenus() {
    // Remove existing context menus
    chrome.contextMenus.removeAll(() => {
      // Create parent menu
      chrome.contextMenus.create({
        id: "quick-record-parent",
        title: "快速记录到...",
        contexts: ["selection"]
      })

      // Create submenu items for each category
      RECORD_CATEGORIES.forEach(category => {
        chrome.contextMenus.create({
          id: this.getCategoryMenuId(category.value),
          parentId: "quick-record-parent",
          title: category.label,
          contexts: ["selection"]
        })
      })
    })
  }

  private getCategoryMenuId(category: RecordCategory): string {
    const menuIds = {
      inspiration: CONTEXT_MENU_IDS.SAVE_TO_INSPIRATION,
      todo: CONTEXT_MENU_IDS.SAVE_TO_TODO,
      principle: CONTEXT_MENU_IDS.SAVE_TO_PRINCIPLE,
      other: CONTEXT_MENU_IDS.SAVE_TO_OTHER
    }
    return menuIds[category]
  }

  private getCategoryFromMenuId(menuItemId: string): RecordCategory | null {
    const categoryMap = {
      [CONTEXT_MENU_IDS.SAVE_TO_INSPIRATION]: "inspiration" as RecordCategory,
      [CONTEXT_MENU_IDS.SAVE_TO_TODO]: "todo" as RecordCategory,
      [CONTEXT_MENU_IDS.SAVE_TO_PRINCIPLE]: "principle" as RecordCategory,
      [CONTEXT_MENU_IDS.SAVE_TO_OTHER]: "other" as RecordCategory
    }
    return categoryMap[menuItemId] || null
  }

  private async handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    if (!tab?.id) return

    const category = this.getCategoryFromMenuId(info.menuItemId as string)
    if (!category) return

    try {
      // Send message to content script to save selected text
      await chrome.tabs.sendMessage(tab.id, {
        action: "saveSelectedText",
        category: category
      })
    } catch (error) {
      console.error("Failed to send message to content script:", error)
    }
  }

  private async handleActionClick(tab: chrome.tabs.Tab) {
    if (!tab.id) return

    try {
      // Open the side panel for the current tab
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (error) {
      console.error("Failed to open side panel:", error)
    }
  }
}

// Initialize background service
new BackgroundService()