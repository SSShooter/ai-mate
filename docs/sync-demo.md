# AI Mate 数据同步功能演示

## 功能概览

AI Mate 现在支持跨设备数据同步！通过 Cloudflare Worker + KV 存储，你可以在多个设备之间同步你的记录和提示词。

## 主要特性

### 🔄 智能合并
- **Last-Write-Wins 策略**: 基于时间戳自动解决冲突
- **增量同步**: 只同步有变化的数据
- **双向同步**: 客户端和服务器数据智能合并

### 🔐 安全可靠
- **API Key 认证**: 每个用户使用独立的 API Key
- **HTTPS 加密**: 数据传输全程加密
- **隔离存储**: 用户数据完全隔离

### ⚡ 便捷易用
- **一键配置**: 简单的配置界面
- **自动同步**: 支持定时自动同步
- **状态显示**: 实时显示同步状态

## 界面展示

### 同步状态栏
在主界面顶部，你会看到同步状态栏：

```
同步: [成功] 上次: 2分钟前 [同步] [配置]
```

- **状态指示器**: 显示当前同步状态（空闲/同步中/成功/错误）
- **上次同步时间**: 显示最后一次同步的时间
- **同步按钮**: 手动触发同步
- **配置按钮**: 打开同步配置界面

### 配置界面
点击配置按钮后，会打开详细的配置界面：

#### 基本配置
- **Worker URL**: 你的 Cloudflare Worker 地址
- **API Key**: 用于身份验证的密钥（可自动生成）
- **启用同步**: 开启/关闭同步功能
- **自动同步**: 开启定时自动同步
- **同步间隔**: 设置自动同步的时间间隔

#### 操作按钮
- **测试连接**: 验证配置是否正确
- **保存配置**: 保存设置到 Chrome 同步存储
- **立即同步**: 手动执行一次同步
- **重置配置**: 清除所有配置

#### 状态信息
- **同步状态**: 当前同步状态
- **配置状态**: 是否已正确配置
- **上次同步**: 最后同步时间
- **错误信息**: 如果有错误，显示详细信息

## 使用流程

### 首次设置

1. **部署 Worker**
   ```bash
   # 复制 docs/cloudflare-worker-template.js 的代码
   # 在 Cloudflare Dashboard 中创建 Worker
   # 创建 KV 命名空间并绑定
   ```

2. **配置插件**
   - 打开 AI Mate 插件
   - 点击同步状态栏的"配置"按钮
   - 填入 Worker URL
   - 生成或输入 API Key
   - 启用同步功能

3. **测试连接**
   - 点击"测试连接"按钮
   - 确认显示"连接测试成功"
   - 保存配置

4. **首次同步**
   - 点击"立即同步"按钮
   - 等待同步完成

### 日常使用

#### 手动同步
- 在任何时候点击"同步"按钮
- 查看状态栏了解同步结果

#### 自动同步
- 启用自动同步后，插件会按设定间隔自动同步
- 可以在配置中调整同步间隔（5-1440分钟）

#### 多设备同步
1. 在第一台设备上完成设置和首次同步
2. 在第二台设备上安装插件
3. 使用相同的 Worker URL 和 API Key 配置
4. 执行同步，数据会自动合并

## 同步逻辑详解

### 数据结构
```typescript
interface SyncData {
  records: Record[]      // 所有记录
  prompts: Prompt[]      // 所有提示词
  settings: AppSettings  // 应用设置
  lastSyncTime: number   // 最后同步时间
}
```

### 合并算法
1. **记录合并**: 按 `id` 匹配，保留 `updatedAt` 最新的版本
2. **提示词合并**: 按 `id` 匹配，保留 `updatedAt` 最新的版本
3. **设置合并**: 通常采用客户端版本（设置变更频率低）

### 冲突解决
- **时间戳比较**: 自动选择最新版本
- **新增项目**: 直接添加到合并结果
- **删除处理**: 通过时间戳判断是否应该删除

## 故障排除

### 常见问题

#### 连接测试失败
```
❌ 连接失败: HTTP 404
```
**解决方案**: 检查 Worker URL 是否正确，确保 Worker 已部署

#### 同步失败
```
❌ 同步失败: Missing or invalid API key
```
**解决方案**: 检查 API Key 是否正确，重新生成并保存

#### 数据不一致
**解决方案**: 
1. 检查设备时间是否正确
2. 手动执行同步
3. 如有必要，重置配置重新设置

### 调试技巧

1. **查看浏览器控制台**: 检查是否有 JavaScript 错误
2. **检查 Worker 日志**: 在 Cloudflare Dashboard 中查看 Worker 日志
3. **验证 KV 数据**: 在 Cloudflare KV 界面查看存储的数据

## 最佳实践

### 安全建议
- 定期更换 API Key
- 不要在公共场所分享配置信息
- 使用强密码保护 Cloudflare 账户

### 使用建议
- 启用自动同步以保持数据最新
- 在重要操作前手动同步一次
- 定期导出数据作为备份

### 性能优化
- 合理设置自动同步间隔（推荐30分钟）
- 避免频繁手动同步
- 清理不需要的旧数据

## 技术细节

### API 端点
```
POST /sync
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "records": [...],
  "prompts": [...],
  "settings": {...},
  "lastSyncTime": 1234567890
}
```

### 响应格式
```json
{
  "success": true,
  "data": {
    "records": [...],
    "prompts": [...],
    "settings": {...},
    "lastSyncTime": 1234567890
  },
  "message": "Sync completed successfully"
}
```

### 存储位置
- **配置信息**: Chrome 同步存储 (`chrome.storage.sync`)
- **状态信息**: Chrome 本地存储 (`chrome.storage.local`)
- **数据内容**: Chrome 本地存储 + Cloudflare KV

这样的设计确保了配置信息在 Chrome 账户间同步，而状态信息保持本地，数据内容通过自定义同步服务同步。
