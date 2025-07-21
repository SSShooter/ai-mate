# 软删除机制说明

## 问题背景

在多设备同步场景中，如果简单地从本地存储中删除数据，会导致以下问题：

1. **删除数据复活**: 用户在设备A删除了一条记录，同步后，设备B上的相同记录会重新出现在设备A上
2. **删除状态丢失**: 无法区分某个数据是新增的还是之前被删除过的
3. **同步冲突**: 删除操作无法通过时间戳进行冲突解决

## 解决方案：软删除

### 核心思想

不直接删除数据，而是给数据添加删除标记：

```typescript
interface Record {
  id: string
  content: string
  // ... 其他字段
  deleted?: boolean      // 删除标记
  deletedAt?: number     // 删除时间戳
  updatedAt: number      // 更新时间戳（删除时也会更新）
}
```

### 工作流程

#### 1. 删除操作
```typescript
// 原来的删除逻辑（有问题）
records = records.filter(r => r.id !== recordId)

// 新的软删除逻辑
records = records.map(r => {
  if (r.id === recordId) {
    return {
      ...r,
      deleted: true,
      deletedAt: Date.now(),
      updatedAt: Date.now()
    }
  }
  return r
})
```

#### 2. 查询操作
```typescript
// 获取可见数据时过滤掉已删除的项目
const visibleRecords = allRecords.filter(r => !r.deleted)
```

#### 3. 同步操作
```typescript
// 同步时包含所有数据（包括已删除的）
const syncData = {
  records: allRecords, // 包含 deleted: true 的项目
  prompts: allPrompts,
  settings: settings
}
```

#### 4. 合并逻辑
```typescript
// 服务器端合并时，删除标记也会参与时间戳比较
if (!existing || record.updatedAt > existing.updatedAt) {
  allRecords.set(record.id, record) // 可能是删除标记
}
```

## 实现细节

### 存储服务修改

1. **deleteRecord/deletePrompt**: 改为设置删除标记
2. **getAllRecords/getAllPrompts**: 过滤掉已删除的项目
3. **exportAllDataForSync**: 新增方法，导出所有数据（包括已删除的）
4. **cleanupDeletedItems**: 定期清理超过30天的已删除项目

### 同步服务修改

1. **sync方法**: 使用 `exportAllDataForSync` 而不是 `exportData`
2. **导入数据**: 直接导入所有数据，包括删除标记
3. **定期清理**: 同步时有10%概率执行清理操作

### Worker端修改

合并逻辑保持不变，因为删除标记也有 `updatedAt` 时间戳，会正确参与 Last-Write-Wins 比较。

## 优势

### 1. 删除状态同步
- 设备A删除记录 → 设置 `deleted: true, updatedAt: now`
- 同步到服务器 → 服务器保存删除状态
- 设备B同步 → 获取到删除状态，本地记录也被标记为删除
- 结果：两个设备都不显示该记录

### 2. 冲突解决
```typescript
// 场景：设备A删除了记录，设备B修改了同一记录
// 设备A: { id: "1", deleted: true, updatedAt: 100 }
// 设备B: { id: "1", content: "new", updatedAt: 200 }
// 结果：保留设备B的修改（时间戳更新）

// 场景：设备A修改了记录，设备B删除了同一记录
// 设备A: { id: "1", content: "new", updatedAt: 100 }
// 设备B: { id: "1", deleted: true, updatedAt: 200 }
// 结果：记录被删除（删除操作更新）
```

### 3. 数据恢复
如果需要，可以通过清除删除标记来恢复数据：
```typescript
record.deleted = false
record.updatedAt = Date.now()
```

## 清理机制

### 为什么需要清理
- 已删除的数据会一直占用存储空间
- 同步时会传输不必要的数据
- 长期积累会影响性能

### 清理策略
- **时间阈值**: 删除超过30天的项目才会被物理删除
- **触发时机**: 每次同步时有10%概率执行清理
- **安全性**: 30天足够确保所有设备都已同步删除状态

### 清理逻辑
```typescript
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
const cleanedRecords = allRecords.filter(record => {
  // 保留未删除的记录
  if (!record.deleted) return true
  
  // 保留删除时间不足30天的记录
  if (record.deletedAt && record.deletedAt > thirtyDaysAgo) return true
  
  // 物理删除超过30天的记录
  return false
})
```

## 使用注意事项

### 1. 数据迁移
如果从旧版本升级，需要确保：
- 现有数据不会被误标记为删除
- 添加必要的时间戳字段

### 2. 性能考虑
- 查询时需要过滤删除标记，可能略微影响性能
- 定期清理可以缓解存储空间问题

### 3. 调试
- 可以通过查看原始存储数据来调试删除状态
- 删除标记使得数据恢复成为可能

## 测试场景

### 基本删除同步
1. 设备A删除记录X
2. 设备A同步
3. 设备B同步
4. 验证：设备B上记录X不可见

### 删除冲突解决
1. 设备A删除记录X（时间T1）
2. 设备B修改记录X（时间T2，T2 > T1）
3. 两设备同步
4. 验证：记录X显示设备B的修改

### 清理机制
1. 删除记录X
2. 等待30天（或手动修改时间戳）
3. 触发清理
4. 验证：记录X从存储中完全消失

这个软删除机制确保了删除操作能够在多设备间正确同步，同时保持了数据的一致性和可恢复性。
