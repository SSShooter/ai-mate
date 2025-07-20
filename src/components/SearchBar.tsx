import React, { useState, useEffect } from "react"
import { useDebounce } from "~hooks/useDebounce"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder = "搜索记录...", className = "" }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300) // 300ms debounce

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    onChange(debouncedValue)
  }, [debouncedValue, onChange])

  const handleClear = () => {
    setLocalValue("")
    onChange("")
  }

  return (
    <div className={`plasmo-relative ${className}`}>
      <div className="plasmo-relative">
        <div className="plasmo-absolute plasmo-inset-y-0 plasmo-left-0 plasmo-pl-3 plasmo-flex plasmo-items-center plasmo-pointer-events-none">
          <svg className="plasmo-w-4 plasmo-h-4 plasmo-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="plasmo-block plasmo-w-full plasmo-pl-10 plasmo-pr-10 plasmo-py-2 plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-text-sm plasmo-placeholder-gray-500 focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500 focus:plasmo-border-transparent"
          placeholder={placeholder}
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="plasmo-absolute plasmo-inset-y-0 plasmo-right-0 plasmo-pr-3 plasmo-flex plasmo-items-center plasmo-text-gray-400 hover:plasmo-text-gray-600"
          >
            <svg className="plasmo-w-4 plasmo-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}