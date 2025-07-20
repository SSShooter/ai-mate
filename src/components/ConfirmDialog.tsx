import React from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = chrome.i18n.getMessage("confirm"),
  cancelText = chrome.i18n.getMessage("cancel"),
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50">
      <div className="plasmo-bg-white plasmo-rounded-lg plasmo-shadow-xl plasmo-w-80 plasmo-max-w-sm">
        {/* Header */}
        <div className="plasmo-p-4 plasmo-border-b plasmo-border-gray-200">
          <h3 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-800">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="plasmo-p-4">
          <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="plasmo-flex plasmo-space-x-2 plasmo-p-4 plasmo-border-t plasmo-border-gray-200">
          <button
            onClick={onCancel}
            className="plasmo-flex-1 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-gray-700 plasmo-bg-gray-100 plasmo-rounded-md hover:plasmo-bg-gray-200 plasmo-transition-colors">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`plasmo-flex-1 plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-white plasmo-rounded-md plasmo-transition-colors ${
              isDestructive
                ? "plasmo-bg-red-600 hover:plasmo-bg-red-700"
                : "plasmo-bg-blue-600 hover:plasmo-bg-blue-700"
            }`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
