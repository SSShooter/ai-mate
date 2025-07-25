import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"

import { CONTEXT_MENU_IDS, SUCCESS_MESSAGES } from "~constants"
import { storageService } from "~services/storage"
import { createRecord } from "~services/utils"
import type { RecordCategory, ShortcutConfig } from "~types"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Utility function to parse shortcut string
function parseShortcut(shortcut: string): {
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  key: string
} {
  const parts = shortcut.toLowerCase().split('+')
  const result = {
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    key: ''
  }

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed === 'alt') {
      result.altKey = true
    } else if (trimmed === 'ctrl') {
      result.ctrlKey = true
    } else if (trimmed === 'shift') {
      result.shiftKey = true
    } else {
      result.key = trimmed
    }
  }

  return result
}

// Utility function to check if keyboard event matches shortcut
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut)
  return (
    event.altKey === parsed.altKey &&
    event.ctrlKey === parsed.ctrlKey &&
    event.shiftKey === parsed.shiftKey &&
    event.key.toLowerCase() === parsed.key.toLowerCase()
  )
}

/**
 * Generates a style element with adjusted CSS to work correctly within a Shadow DOM.
 */
export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  // let updatedCssText = cssText.replaceAll(":root", ":host(csui)")
  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize
    return `${pixelsValue}px`
  })

  const styleElement = document.createElement("style")
  styleElement.textContent = updatedCssText

  return styleElement
}

// Text selection handler
class TextSelectionHandler {
  private selectedText: string = ""
  private selectionPosition: { x: number; y: number } = { x: 0, y: 0 }
  private shortcuts: ShortcutConfig | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Load shortcuts from settings
    await this.loadShortcuts()

    // Listen for text selection
    document.addEventListener("mouseup", this.handleMouseUp.bind(this))
    document.addEventListener("keyup", this.handleKeyUp.bind(this))

    // Listen for context menu messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this))
  }

  private async loadShortcuts() {
    try {
      const settings = await storageService.getSettings()
      this.shortcuts = settings.shortcutKeys
    } catch (error) {
      console.error("Failed to load shortcuts:", error)
      // Use default shortcuts if loading fails
      this.shortcuts = {
        saveToInspiration: "Alt+Q",
        saveToTodo: "Alt+W",
        saveToPrinciple: "Alt+A",
        saveToOther: "Alt+S",
        saveClipboardToOther: "Alt+C",
        promptTrigger: "/'"
      }
    }
  }

  private handleMouseUp(event: MouseEvent) {
    setTimeout(() => {
      this.detectTextSelection()
    }, 10)
  }

  private handleKeyUp(event: KeyboardEvent) {
    // Handle keyboard shortcuts for quick record
    if (!this.shortcuts) {
      // Shortcuts not loaded yet, skip
      setTimeout(() => {
        this.detectTextSelection()
      }, 10)
      return
    }

    // Check each shortcut
    if (matchesShortcut(event, this.shortcuts.saveToInspiration)) {
      event.preventDefault()
      this.quickSaveToCategory("inspiration")
      return
    }

    if (matchesShortcut(event, this.shortcuts.saveToTodo)) {
      event.preventDefault()
      this.quickSaveToCategory("todo")
      return
    }

    if (matchesShortcut(event, this.shortcuts.saveToPrinciple)) {
      event.preventDefault()
      this.quickSaveToCategory("principle")
      return
    }

    if (matchesShortcut(event, this.shortcuts.saveToOther)) {
      event.preventDefault()
      this.quickSaveToCategory("other")
      return
    }

    if (matchesShortcut(event, this.shortcuts.saveClipboardToOther)) {
      event.preventDefault()
      this.saveClipboardToOther()
      return
    }

    setTimeout(() => {
      this.detectTextSelection()
    }, 10)
  }

  private detectTextSelection(): boolean {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      this.selectedText = ""
      return false
    }

    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) {
      this.selectedText = ""
      return false
    }

    this.selectedText = selectedText

    // Get selection position for potential UI positioning
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    this.selectionPosition = {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY
    }

    return true
  }

  private async handleMessage(message: any, sender: any, sendResponse: any) {
    if (message.action === "saveSelectedText") {
      const category = message.category as RecordCategory
      try {
        await this.saveSelectedText(category)
        sendResponse({ success: true })
      } catch (error) {
        console.error("Failed to save selected text:", error)
        sendResponse({ success: false, error: error.message })
      }
    }
    return true // Keep message channel open for async response
  }

  private async quickSaveToCategory(category: RecordCategory) {
    if (!this.selectedText) {
      this.showNotification("请先选择要保存的文本", "error")
      return
    }

    try {
      await this.saveSelectedText(category)
    } catch (error) {
      console.error("Quick save failed:", error)
      this.showNotification("保存失败，请重试", "error")
    }
  }

  private async saveClipboardToOther() {
    try {
      // Read clipboard content
      const clipboardText = await navigator.clipboard.readText()

      if (!clipboardText || clipboardText.trim().length === 0) {
        this.showNotification("剪贴板内容为空", "error")
        return
      }

      const record = createRecord(
        clipboardText.trim(),
        "other",
        window.location.href,
        document.title || window.location.hostname
      )

      await storageService.saveRecord(record)
      this.showNotification("剪贴板内容已保存到其他分组", "success")

      // Notify side panel to refresh immediately
      try {
        await chrome.runtime.sendMessage({
          action: 'recordSaved',
          record: record,
          category: "other"
        })
      } catch (messageError) {
        // Side panel might not be open, which is fine
        console.log('Side panel not available for immediate refresh:', messageError)
      }
    } catch (error) {
      console.error("Failed to save clipboard content:", error)
      if (error.name === 'NotAllowedError') {
        this.showNotification("无法访问剪贴板，请确保已授权", "error")
      } else {
        this.showNotification("保存剪贴板内容失败，请重试", "error")
      }
    }
  }

  private async saveSelectedText(category: RecordCategory) {
    if (!this.selectedText) {
      this.showNotification("没有选中的文本", "error")
      return
    }

    try {
      const record = createRecord(
        this.selectedText,
        category,
        window.location.href,
        document.title || window.location.hostname
      )

      await storageService.saveRecord(record)
      this.showNotification(SUCCESS_MESSAGES.RECORD_SAVED, "success")

      // Notify side panel to refresh immediately
      try {
        await chrome.runtime.sendMessage({
          action: 'recordSaved',
          record: record,
          category: category
        })
      } catch (messageError) {
        // Side panel might not be open, which is fine
        console.log('Side panel not available for immediate refresh:', messageError)
      }

      // Clear selection after successful save
      window.getSelection()?.removeAllRanges()
      this.selectedText = ""
    } catch (error) {
      console.error("Failed to save record:", error)
      this.showNotification("保存失败，请重试", "error")
    }
  }

  private showNotification(
    message: string,
    type: "success" | "error" = "success"
  ) {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `ai-mate-notification ai-mate-notification-${type}`
    notification.textContent = message

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 16px",
      borderRadius: "6px",
      color: "white",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "10000",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      backgroundColor: type === "success" ? "#10b981" : "#ef4444",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease-in-out"
    })

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 10)

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }
}

// Prompt replacement engine
class PromptReplacementEngine {
  private triggerPattern: string = "/'"
  private debounceTimer: number | null = null
  private readonly DEBOUNCE_DELAY = 300

  constructor() {
    this.init()
  }

  private async init() {
    // Load trigger pattern from settings
    await this.loadTriggerPattern()

    // Listen for input events on all input elements
    this.attachInputListeners()
  }

  private async loadTriggerPattern() {
    try {
      const settings = await storageService.getSettings()
      this.triggerPattern = settings.shortcutKeys.promptTrigger
    } catch (error) {
      console.error("Failed to load trigger pattern:", error)
      // Use default trigger pattern if loading fails
      this.triggerPattern = "/'"
    }
  }

  private attachInputListeners() {
    // Listen for input events on the document
    document.addEventListener("input", this.handleInput.bind(this), true)

    // Also listen for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            // Check if the added element or its children contain input elements
            const inputs = element.querySelectorAll(
              "input, textarea, [contenteditable]"
            )
            inputs.forEach((input) => {
              // Input listeners are handled by the document-level listener
            })
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLElement

    if (!this.isValidInputElement(target)) {
      return
    }

    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Debounce the input processing
    this.debounceTimer = window.setTimeout(() => {
      this.processInput(target)
    }, this.DEBOUNCE_DELAY)
  }

  private isValidInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase()
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      element.contentEditable === "true"
    )
  }

  private processInput(element: HTMLElement) {
    const text = this.getElementText(element)

    if (!this.detectTriggerPattern(text)) {
      return
    }

    const triggerMatch = this.findTriggerMatch(text)
    if (triggerMatch) {
      this.replaceWithPrompt(element, triggerMatch)
    }
  }

  private getElementText(element: HTMLElement): string {
    if (
      element.tagName.toLowerCase() === "input" ||
      element.tagName.toLowerCase() === "textarea"
    ) {
      return (element as HTMLInputElement | HTMLTextAreaElement).value
    } else if (element.contentEditable === "true") {
      return element.textContent || ""
    }
    return ""
  }

  private setElementText(element: HTMLElement, text: string) {
    if (
      element.tagName.toLowerCase() === "input" ||
      element.tagName.toLowerCase() === "textarea"
    ) {
      ; (element as HTMLInputElement | HTMLTextAreaElement).value = text
      // Trigger input event to notify other listeners
      element.dispatchEvent(new Event("input", { bubbles: true }))
    } else if (element.contentEditable === "true") {
      element.textContent = text
      // Trigger input event
      element.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  private detectTriggerPattern(text: string): boolean {
    return text.includes(this.triggerPattern)
  }

  private findTriggerMatch(text: string): {
    fullMatch: string
    key: string
    startIndex: number
    endIndex: number
  } | null {
    const triggerIndex = text.lastIndexOf(this.triggerPattern)
    if (triggerIndex === -1) {
      return null
    }

    const afterTrigger = text.substring(
      triggerIndex + this.triggerPattern.length
    )

    // Extract key until whitespace or end of string
    const keyMatch = afterTrigger.match(/^([a-zA-Z0-9_-]+)/)
    if (!keyMatch) {
      return null
    }

    const key = keyMatch[1]
    const fullMatch = this.triggerPattern + key

    return {
      fullMatch,
      key,
      startIndex: triggerIndex,
      endIndex: triggerIndex + fullMatch.length
    }
  }

  private async replaceWithPrompt(
    element: HTMLElement,
    triggerMatch: {
      fullMatch: string
      key: string
      startIndex: number
      endIndex: number
    }
  ) {
    try {
      const prompt = await storageService.getPromptByKey(triggerMatch.key)

      if (!prompt) {
        // Key not found, leave text unchanged
        return
      }

      const currentText = this.getElementText(element)
      const newText =
        currentText.substring(0, triggerMatch.startIndex) +
        prompt.content +
        currentText.substring(triggerMatch.endIndex)

      this.setElementText(element, newText)

      // Set cursor position after the replaced text
      this.setCursorPosition(
        element,
        triggerMatch.startIndex + prompt.content.length
      )
    } catch (error) {
      console.error("Failed to replace prompt:", error)
    }
  }

  private setCursorPosition(element: HTMLElement, position: number) {
    try {
      if (
        element.tagName.toLowerCase() === "input" ||
        element.tagName.toLowerCase() === "textarea"
      ) {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        inputElement.setSelectionRange(position, position)
        inputElement.focus()
      } else if (element.contentEditable === "true") {
        const range = document.createRange()
        const selection = window.getSelection()

        if (
          element.firstChild &&
          element.firstChild.nodeType === Node.TEXT_NODE
        ) {
          const textNode = element.firstChild as Text
          const safePosition = Math.min(
            position,
            textNode.textContent?.length || 0
          )
          range.setStart(textNode, safePosition)
          range.setEnd(textNode, safePosition)

          selection?.removeAllRanges()
          selection?.addRange(range)
        }

        element.focus()
      }
    } catch (error) {
      console.error("Failed to set cursor position:", error)
    }
  }
}

// Context menu setup
class ContextMenuManager {
  constructor() {
    this.setupContextMenu()
  }

  private setupContextMenu() {
    // Send message to background script to create context menu
    chrome.runtime
      .sendMessage({
        action: "setupContextMenu"
      })
      .catch(() => {
        // Ignore errors if background script is not ready
      })
  }
}

const PlasmoOverlay = () => {
  useEffect(() => {
    // Initialize text selection handler, prompt replacement engine, and context menu
    const textHandler = new TextSelectionHandler()
    const promptEngine = new PromptReplacementEngine()
    const contextMenu = new ContextMenuManager()

    return () => {
      // Cleanup if needed
    }
  }, [])

  return null // No visible UI needed for content script
}

export default PlasmoOverlay
