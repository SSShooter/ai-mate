# Implementation Plan

- [x] 1. 建立项目基础结构和数据模型

  - 创建核心数据类型定义和接口
  - 实现基础的存储服务架构
  - _Requirements: 1.4, 2.3, 3.3, 4.2_

- [x] 2. 实现存储服务和数据管理

  - [x] 2.1 创建 StorageService 核心功能

    - 实现 Chrome Storage API 封装
    - 创建记录和 Prompt 的 CRUD 操作
    - 实现数据验证和错误处理
    - _Requirements: 1.2, 1.3, 2.3, 3.3, 3.7, 4.6, 4.8_

  - [x] 2.2 实现数据模型和验证逻辑
    - 创建 Record 和 Prompt 数据模型
    - 实现四个分组的分类逻辑（inspiration、todo、principle、other）
    - 添加数据验证和唯一性检查
    - _Requirements: 1.4, 3.7, 4.1_

- [x] 3. 开发 Content Script 核心功能

  - [x] 3.1 实现完整的快速记录功能

    - 创建文本选择检测逻辑
    - 实现右键菜单选项显示（快速记录到四个分组：inspiration、todo、principle、other）
    - 添加快捷键绑定和检测
    - 获取选中文本和页面信息（URL、标题）
    - 实现记录保存到指定分组的逻辑
    - 添加保存成功的视觉提示通知
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.2 开发 Prompt 自动替换引擎
    - 实现 "/'" 模式检测
    - 创建 key 解析和匹配逻辑
    - 实现文本自动替换功能
    - 添加输入框事件监听
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. 构建 Side panel UI 基础框架

  - [x] 4.1 创建主界面布局和导航

    - 实现 Side panel 主界面结构
    - 创建记录管理和 Prompt 管理的导航
    - 添加 Tailwind CSS 样式配置
    - _Requirements: 3.1, 4.1_

  - [x] 4.2 实现分组标签和切换功能
    - 创建四个分组标签界面（inspiration、todo、principle、other）
    - 实现分组切换逻辑
    - 添加分组状态管理
    - _Requirements: 4.1, 4.3_

- [x] 5. 开发记录管理功能

  - [x] 5.1 实现记录列表显示

    - 创建记录列表组件
    - 实现按分组过滤显示
    - 添加空状态提示界面
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 5.2 添加记录详情和编辑功能

    - 实现记录详情显示（内容、来源信息）
    - 创建记录编辑表单
    - 实现分组归属修改功能
    - _Requirements: 4.5, 4.6_

  - [x] 5.3 实现记录删除和搜索功能
    - 添加删除确认对话框
    - 实现记录删除逻辑
    - 创建搜索功能和过滤逻辑
    - 实现跨分组搜索状态保持
    - _Requirements: 4.7, 4.8, 4.9, 4.10_

- [x] 6. 开发 Prompt 管理功能

  - [x] 6.1 实现 Prompt 列表和添加功能

    - 创建 Prompt 列表显示组件
    - 实现新建 Prompt 表单
    - 添加 key 唯一性验证
    - _Requirements: 3.1, 3.2, 3.3, 3.7_

  - [x] 6.2 添加 Prompt 编辑和删除功能
    - 实现 Prompt 编辑表单和数据预填充
    - 创建删除确认对话框
    - 实现 Prompt 删除逻辑
    - _Requirements: 3.4, 3.5, 3.6_

- [x] 7. 集成和优化

  - [x] 7.1 连接 Content Script 和 Side panel UI

    - 实现用户通过 Content Script 更新记录后，Side panel UI 自动刷新
    - _Requirements: 1.2_

  - [x] 7.2 用户体验优化和最终调试
    - record列表只需显示主要内容
    - record和prompt列表排序为又新到旧
    - 为搜索功能添加防抖处理
