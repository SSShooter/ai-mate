import "~style.css"

function IndexPopup() {
  const handleOpenSidePanel = async () => {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (tab?.id) {
        // Open side panel for current tab
        await chrome.sidePanel.open({ tabId: tab.id })
        // Close popup
        window.close()
      }
    } catch (error) {
      console.error("Failed to open side panel:", error)
    }
  }

  return (
    <div className="plasmo-w-80 plasmo-h-32 plasmo-bg-white plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-p-6">
      <div className="plasmo-text-center plasmo-mb-4">
        <h1 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-900 plasmo-mb-2">
          Quick Note & Prompt
        </h1>
        <p className="plasmo-text-sm plasmo-text-gray-600">
          点击下方按钮打开侧边栏获得更好的体验
        </p>
      </div>

      <button
        onClick={handleOpenSidePanel}
        className="plasmo-px-4 plasmo-py-2 plasmo-text-sm plasmo-font-medium plasmo-text-white plasmo-bg-blue-600 plasmo-border plasmo-border-transparent plasmo-rounded-md hover:plasmo-bg-blue-700 plasmo-transition-colors">
        打开侧边栏
      </button>
    </div>
  )
}

export default IndexPopup
