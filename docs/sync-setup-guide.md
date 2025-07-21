# AI Mate 数据同步功能设置指南

## 概述

AI Mate 提供了基于 Cloudflare Worker + KV 的数据同步功能，让你可以在多个设备之间同步你的记录和提示词数据。

## 核心特性

- 🔄 **增量同步**: 基于时间戳的 Last-Write-Wins 策略，自动合并数据
- 🔐 **安全认证**: 使用自定义 API Key 进行身份验证
- ☁️ **免费部署**: 基于 Cloudflare 免费套餐，无需额外费用
- 🚀 **自动同步**: 支持设置自动同步间隔
- 💾 **Chrome Sync**: 配置信息保存在 Chrome 同步存储中，减少重复配置

## 设置步骤

### 第一步：部署 Cloudflare Worker

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 如果没有账号，请先注册（免费）

2. **创建 Worker**
   - 在左侧菜单中选择 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Create Worker"
   - 给 Worker 起一个名字（例如：`ai-mate-sync`）
   - 点击 "Deploy"

3. **配置 Worker 代码**
   - 在 Worker 编辑器中，删除所有默认代码
   - 复制 `docs/cloudflare-worker-template.js` 中的完整代码
   - 粘贴到编辑器中
   - 点击 "Save and deploy"

4. **创建 KV 命名空间**
   - 在 Cloudflare Dashboard 中，选择 "Workers & Pages"
   - 点击 "KV"
   - 点击 "Create a namespace"
   - 命名空间名称输入：`AI_MATE_SYNC`
   - 点击 "Add"

5. **绑定 KV 命名空间到 Worker**
   - 回到你的 Worker 页面
   - 点击 "Settings" 标签
   - 在 "Variables" 部分，点击 "Add variable"
   - 选择 "KV namespace binding"
   - Variable name: `AI_MATE_SYNC`
   - KV namespace: 选择刚创建的 `AI_MATE_SYNC`
   - 点击 "Save and deploy"

6. **获取 Worker URL**
   - 在 Worker 概览页面，复制 Worker URL
   - 格式类似：`https://ai-mate-sync.your-subdomain.workers.dev`

### 第二步：配置 Chrome 插件

1. **打开同步配置**
   - 在 AI Mate 插件界面中，点击同步状态栏的 "配置" 按钮
   - 或者在主界面顶部的同步状态区域点击配置

2. **填写配置信息**
   - **Worker URL**: 粘贴第一步获取的 Worker URL
   - **API Key**: 点击 "生成" 按钮生成一个随机 API Key，或者输入自定义的 Key
   - **启用同步功能**: 勾选此选项
   - **启用自动同步**: （可选）勾选此选项并设置同步间隔

3. **测试连接**
   - 点击 "测试连接" 按钮
   - 如果显示 "✅ 连接测试成功！"，说明配置正确
   - 如果出现错误，请检查 Worker URL 和 KV 绑定配置

4. **保存配置**
   - 点击 "保存配置" 按钮
   - 配置会自动保存到 Chrome 同步存储中

5. **执行首次同步**
   - 点击 "立即同步" 按钮进行首次数据同步
   - 同步成功后，状态会显示为 "成功"

## 同步逻辑说明

### Last-Write-Wins 策略

- 每个记录和提示词都有 `updatedAt` 时间戳
- 同步时比较客户端和服务器端的时间戳
- 保留时间戳最新的版本
- 如果某项只存在于一端，则直接保留

### 数据合并过程

1. **客户端发送**: 插件将本地所有数据发送到 Worker
2. **服务器合并**: Worker 从 KV 读取服务器数据，与客户端数据合并
3. **保存结果**: 合并后的数据保存到 KV 存储
4. **返回数据**: Worker 将最终数据返回给客户端
5. **客户端更新**: 插件用返回的数据完全覆盖本地存储

### 冲突处理

- 基于时间戳自动解决冲突，无需手动干预
- 最后修改的版本总是获胜
- 删除操作通过时间戳也能正确同步

## 安全说明

- **API Key**: 作为用户身份标识，请妥善保管
- **数据加密**: 数据在传输过程中使用 HTTPS 加密
- **访问控制**: 只有拥有正确 API Key 的用户才能访问对应数据
- **隔离存储**: 每个 API Key 对应独立的存储空间

## 故障排除

### 连接测试失败

1. **检查 Worker URL**: 确保 URL 正确且可访问
2. **检查 KV 绑定**: 确保 KV 命名空间正确绑定到 Worker
3. **检查 Worker 代码**: 确保代码完整且无语法错误
4. **检查网络**: 确保网络连接正常

### 同步失败

1. **检查配置**: 确保同步功能已启用且配置正确
2. **检查权限**: 确保 Chrome 插件有必要的存储权限
3. **查看错误信息**: 在同步状态中查看具体错误信息
4. **重新配置**: 尝试重置配置并重新设置

### 数据丢失

1. **检查时间戳**: 确保设备时间正确
2. **手动同步**: 尝试手动执行同步操作
3. **导出备份**: 定期使用插件的导出功能备份数据

## 费用说明

- **Cloudflare Workers**: 免费套餐每天 100,000 次请求
- **Cloudflare KV**: 免费套餐每天 100,000 次读取，1,000 次写入
- **存储空间**: 免费套餐 1GB 存储空间

对于个人使用，免费套餐完全足够。

## 技术支持

如果遇到问题，请：

1. 检查本指南的故障排除部分
2. 查看浏览器控制台的错误信息
3. 确认 Cloudflare Worker 的日志
4. 联系技术支持并提供详细的错误信息
