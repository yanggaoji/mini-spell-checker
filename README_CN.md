# 迷你拼写检查器

一个专为旧版 Visual Studio Code 和类 VSCode 编辑器设计的轻量级拼写检查扩展。

## 主要优势

- 兼容较低版本的 VSCode 引擎 (1.45.0+)
- 支持类 VSCode 编辑器（如微信开发者工具）
- 极少的依赖项和轻量级实现
- 适用于无法安装主流拼写检查器的环境

## 功能特性

- 实时英文单词拼写检查
- 内置词典支持
- 自定义用户词典
- 支持多种文件类型（纯文本、Markdown、JavaScript、TypeScript）
- 未知单词快速修复建议

## 安装方法

1. 从发布页面下载 .vsix 文件
2. 通过命令安装：`code --install-extension mini-spell-checker-1.0.0.vsix`
3. 重新加载 VS Code

## 使用说明

- 插件会自动检查您输入的内容
- 未知单词会以警告形式下划线标注
- 点击带下划线的单词可以：
  - 将其添加到用户词典
  - 查看建议

## 可用命令

- `Spell Checker: Reload Dictionary`: 重新加载主词典
- `Add Word to User Dictionary`: 将选中单词添加到用户词典

## 配置选项

```json
{
  "spellChecker.enabled": true,
  "spellChecker.languages": [
    "plaintext",
    "markdown",
    "javascript",
    "typescript"
  ]
}
```

## 词典格式

拼写检查器使用简单的文本文件（`.txt`）作为词典格式，每行一个单词。

- `dictionary.txt`: 主词典文件
- `userDictionary.txt`: 用户自定义词典

## 词典数据来源

默认词典数据来自 [high-frequency-vocabulary](https://github.com/arstgit/high-frequency-vocabulary) 项目，该项目包含按频率排序的 30,000 个最常用英语单词：

- 基于 Peter Norvig 编撰的 1/3 百万最常用英语单词
- 包含每个单词的词典解释

### 词典数据许可

开源且可自由用于任何用途。

## 兼容性

- Visual Studio Code v1.45.0 及以上版本
- 基于 VSCode 的编辑器，包括：
  - 微信开发者工具
  - 其他使用 VSCode 引擎的编辑器

## 已知限制

- 仅支持英文拼写检查
- 无外部 API 依赖
- 使用基础词典方案以保证最大兼容性

## 开源协议

MIT
