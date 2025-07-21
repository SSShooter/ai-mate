# AI Mate - Chrome 浏览器插件

AI Mate 是一个功能强大的 Chrome 浏览器插件，帮助你快速保存和管理网页内容、提示词，并支持跨设备数据同步。

## ✨ 主要功能

- 📝 **快速记录**: 保存网页内容到不同分类（灵感、待办、原则、其他）
- 🤖 **提示词管理**: 创建和管理 AI 提示词模板
- 🔄 **数据同步**: 基于 Cloudflare Worker + KV 的跨设备同步
- ⌨️ **快捷键支持**: 自定义快捷键快速操作
- 🎨 **直观界面**: 简洁易用的侧边栏界面

## 🚀 新功能：数据同步

现在支持跨设备数据同步！通过 Cloudflare Worker + KV 存储，你可以：

- ☁️ **免费部署**: 基于 Cloudflare 免费套餐
- 🔐 **安全可靠**: API Key 认证 + HTTPS 加密
- 🔄 **智能合并**: Last-Write-Wins 策略自动解决冲突
- ⚡ **自动同步**: 支持定时自动同步
- 📱 **多设备**: 在所有设备间保持数据一致

### 快速开始同步功能

1. **部署 Worker**: 复制 `docs/cloudflare-worker-template.js` 到 Cloudflare Worker
2. **创建 KV**: 创建名为 `AI_MATE_SYNC` 的 KV 命名空间并绑定
3. **配置插件**: 在插件中填入 Worker URL 和 API Key
4. **开始同步**: 点击同步按钮，享受跨设备数据同步

详细设置指南请查看 [同步功能设置指南](docs/sync-setup-guide.md)

