# Requirements Document

## Introduction

这是一个基于Plasmo的浏览器插件功能，旨在为用户提供快速记录和智能提示功能。该功能包括划线快速记录、智能prompt调用、prompt管理和记录管理四个核心模块，帮助用户高效地收集信息和使用预设的提示模板。

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望能够通过划线和快捷键快速记录内容到不同分组，以便高效地收集和分类信息。

#### Acceptance Criteria

1. WHEN 用户在网页上选中文本 THEN 系统 SHALL 显示右键菜单选项用于快速记录
2. WHEN 用户使用快捷键 THEN 系统 SHALL 将选中的文本记录到对应的分组中
3. WHEN 记录成功 THEN 系统 SHALL 显示简短的成功提示
4. WHEN 系统初始化 THEN 系统 SHALL 提供4个分组：灵感、待办、信条、其他

### Requirement 2

**User Story:** 作为用户，我希望在输入框中输入特定字符时能够快速调出预设的prompt，以便提高工作效率。

#### Acceptance Criteria

1. WHEN 用户在任意输入框中输入"/pmt:"格式的文本 THEN 系统 SHALL 检测到触发条件
2. WHEN 检测到触发条件 THEN 系统 SHALL 解析冒号后的key值
3. WHEN key值匹配用户配置的prompt THEN 系统 SHALL 自动将"/pmt:key"文本替换为对应的prompt内容
4. WHEN key值不匹配任何配置的prompt THEN 系统 SHALL 保持原文本不变

### Requirement 3

**User Story:** 作为用户，我希望有一个专门的页面来管理我的prompt模板，以便添加、编辑和删除自定义的提示内容。

#### Acceptance Criteria

1. WHEN 用户打开prompt管理页面 THEN 系统 SHALL 显示所有已保存的prompt列表
2. WHEN 用户点击添加按钮 THEN 系统 SHALL 显示新建prompt的表单
3. WHEN 用户填写prompt信息并保存 THEN 系统 SHALL 验证key的唯一性并保存数据
4. WHEN 用户点击编辑按钮 THEN 系统 SHALL 显示编辑表单并预填充现有数据
5. WHEN 用户点击删除按钮 THEN 系统 SHALL 显示确认对话框
6. WHEN 用户确认删除 THEN 系统 SHALL 删除对应的prompt并更新列表
7. WHEN prompt的key重复 THEN 系统 SHALL 显示错误提示并阻止保存

### Requirement 4

**User Story:** 作为用户，我希望有一个专门的页面来管理我的快速记录，以便查看、编辑和删除已保存的记录内容。

#### Acceptance Criteria

1. WHEN 用户打开记录管理页面 THEN 系统 SHALL 显示四个分组标签：灵感、待办、信条、其他
2. WHEN 系统初始化记录管理页面 THEN 系统 SHALL 按分组显示所有记录
3. WHEN 用户选择特定分组标签 THEN 系统 SHALL 只显示该分组下的记录
4. WHEN 某个分组没有记录 THEN 系统 SHALL 在该分组下显示友好的空状态提示
5. WHEN 用户点击记录项 THEN 系统 SHALL 显示记录的详细内容和来源信息
6. WHEN 用户点击编辑按钮 THEN 系统 SHALL 允许修改记录内容和分组归属
7. WHEN 用户点击删除按钮 THEN 系统 SHALL 显示确认对话框
8. WHEN 用户确认删除 THEN 系统 SHALL 删除对应记录并更新列表
9. WHEN 用户搜索记录 THEN 系统 SHALL 根据关键词在当前选中分组内过滤显示结果
10. WHEN 用户在分组间切换 THEN 系统 SHALL 保持搜索状态并在新分组内应用搜索条件