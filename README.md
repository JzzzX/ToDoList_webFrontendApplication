# React AI Todo List

这是一个基于 React 生态系统构建的现代化待办事项管理应用。该项目不仅实现了标准的 CRUD 功能，还通过集成 Google Gemini API 引入了生成式 AI 能力，实现了智能任务规划与拆解。项目采用严格的工程化规范开发，支持多级任务嵌套与数据持久化。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)](https://vitejs.dev/)

## 在线演示

**Live Demo:** [https://to-do-list-web-frontend-application-seven.vercel.app/](https://to-do-list-web-frontend-application-seven.vercel.app/)

> 注意：由于采用纯前端架构，所有数据（包括 API Key）仅存储在用户浏览器的 LocalStorage 或内存中，刷新页面可能会导致部分临时状态重置。

## 功能特性

### 1. 核心任务管理
* **多维度数据录入**：支持设置任务标题、详细描述、分类（工作/学习/生活）、优先级（高/中/低）及截止日期。
* **树形结构管理**：支持无限层级的父子任务关联。父任务可折叠/展开，删除父任务时会自动级联删除所有子任务。
* **数据持久化**：利用 LocalStorage 实现数据自动同步，防止页面刷新导致数据丢失。

### 2. AI 智能辅助 (Agent Integration)
集成 Google Gemini 1.5 Flash 模型，实现任务自动规划：
* **智能拆解**：用户输入概括性任务，AI 自动将其拆解为 3-5 个可执行的具体子任务。
* **上下文关联**：生成的子任务会自动挂载至当前父任务节点下。
* **安全机制 (BYOK)**：采用 "Bring Your Own Key" 模式，API Key 仅在运行时存储于内存，确保用户隐私安全。支持 Mock 模式以便在无 Key 状态下演示。

### 3. 高级交互与筛选
* **组合过滤**：支持同时按“完成状态”和“关键词”进行过滤。
* **多维排序**：支持按“优先级权重”或“截止日期”对任务列表进行动态排序。
* **批量操作**：提供一键清除所有已完成任务的功能。
* **原生通知**：集成 Web Notification API，在创建高优先级任务或任务过期时提供系统级提醒。

## 技术栈

* **核心框架**: React 18 (Functional Components, Hooks)
* **语言标准**: TypeScript (Strict Mode)
* **构建工具**: Vite
* **样式方案**: Tailwind CSS (Utility-first CSS framework)
* **图标库**: SVG Icons
* **部署平台**: Vercel

## 本地开发指南

### 前置要求
* Node.js >= 16.0.0
* npm 或 yarn

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone [https://github.com/你的用户名/你的仓库名.git](https://github.com/你的用户名/你的仓库名.git)
    cd 你的仓库名
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    启动后访问 `http://localhost:5173` 即可预览。

4.  **构建生产版本**
    ```bash
    npm run build
    ```

## 项目文档

本项目包含详细的设计文档与架构复盘，详细说明了从 MVP 到最终版本的演进过程、Git 分支策略以及 AI Agent 的设计思路。

请参阅：[DOC.md](./DOC.md)

## 许可证

本项目采用 MIT 许可证。