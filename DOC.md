# Todo List 项目说明文档

## 1. 技术选型

- **编程语言**：**TypeScript**
  - **理由**：相比 JavaScript，TypeScript 提供了静态类型检查，能在编译阶段发现潜在错误（如 `Todo` 对象字段拼写错误、`undefined` 引用等），极大提升了代码的可维护性和健壮性。对于本项目涉及的多状态管理（Priority, Category, Date）和复杂数据流转，Interface 定义起到了“契约”的作用。
- **框架/库**：**React 18 + Vite**
  - **理由**：
    - **React**：组件化思想非常适合构建交互复杂的 UI（如嵌套的任务列表、模态框）。Hook 机制（`useState`, `useEffect`, Custom Hooks）让状态逻辑复用变得简单。
    - **Vite**：替代 Webpack，提供了极速的冷启动和热更新（HMR）体验，大幅提升开发效率。
- **样式方案**：**Tailwind CSS**
  - **理由**：原子化 CSS 避免了传统 CSS 的命名冲突困扰，且能够快速构建响应式布局。其内置的设计系统（颜色、间距、阴影）能让非设计背景的开发者也能产出高保真的现代化 UI（如 Glassmorphism 毛玻璃效果）。
- **数据存储**：**LocalStorage (Browser API)**
  - **理由**：本项目定位为纯前端应用，无需复杂的后端数据库。LocalStorage 能够满足单机数据持久化的需求，且 API 简单直接（`getItem`/`setItem`）。
  - **替代方案对比**：曾考虑 **IndexedDB**，虽然容量更大且支持事务，但对于 Todo List 这种简单的 JSON 结构化数据，IndexedDB 的 API 过于繁琐，且引入额外库（如 `idb`）会增加项目体积，LocalStorage 性价比最高。

## 2. 项目结构设计

本项目采用 **Feature-based** 与 **Hook-based** 相结合的架构设计，强调逻辑与视图的分离.

### 目录结构示例

```
src/
├── hooks/                  # 自定义 Hooks (核心业务逻辑)
│   └── useAITaskSplitter.ts  # 封装 AI 调用、Loading 状态与错误处理
├── App.tsx                 # 主视图组件 (UI 渲染与交互入口)
├── main.tsx                # 应用入口文件
└── index.css               # 全局样式 (Tailwind 指令)
```

### 模块职责说明

- **View Layer (`App.tsx`)**: 负责 UI 的声明式渲染。采用 **单一数据源 (Single Source of Truth)** 原则，通过 `todos` 原始状态派生出过滤、排序后的视图数据 (`rootTodos`, `children`)，并负责处理用户交互事件。
- **Logic Layer (`hooks/`)**: 将复杂的副作用逻辑（如 AI API 调用、Loading 状态管理、错误捕获）从 UI 组件中剥离，实现关注点分离（Separation of Concerns），使组件代码更纯粹。
- **Data Model**: 使用 TypeScript Interface 定义 `Todo` 数据结构，确保全应用类型一致，防止字段缺失。

## 3. 需求细节与决策

- **输入处理**：
  - **必填校验**：任务标题 (`title`) 为必填项。若为空字符串，提交时会被拦截，防止产生无效数据。
  - **可选描述**：为了满足题目要求，专门重构了数据结构，增加了 `description` 字段，支持多行文本，用于补充任务细节。
- **已完成的任务显示**：
  - **视觉降噪**：已完成的任务会降低不透明度 (Opacity: 0.5) 并增加删除线，以弱化视觉干扰，让用户聚焦于待办事项。
  - **批量操作**：仅当列表中存在已完成任务时，底部才会动态显示“清除已完成”按钮，避免误操作，优化列表管理体验。
- **任务排序逻辑**：
  - 实现了多维度的动态排序，用户可随时切换：
    - **按创建时间**（默认）：隐含在数组顺序中（新任务默认插入顶部或父任务下方）。
    - **按优先级 (Priority)**：引入权重映射机制 (`{ high: 3, medium: 2, low: 1 }`)，实现 High > Medium > Low 的排序。
    - **按截止日期 (Date)**：临近日期优先，无日期的任务置底。
- **扩展功能设计思路**：
  - **树形结构与折叠**：针对 AI 生成的子任务，设计了 `parentId` 字段进行关联。UI 采用**递归式渲染逻辑**：仅在父任务卡片内部渲染其子任务，并支持折叠/展开。这样既保持了列表的整洁，又体现了任务间的层级关系。
  - **数据持久化**：利用 `useEffect` 监听 `todos` 变化，自动同步写入 `localStorage`。为了应对数据结构升级（如新增字段），采用了 **Key Versioning** 策略（`my-todo-app-data` -> `my-todo-app-data-v2`），避免旧数据导致应用崩溃。

## 4. AI 使用说明与工程化思考

本项目集成了 **Google Gemini 1.5 Flash** 模型，不仅作为应用内的核心功能，也作为开发过程中的辅助工具。我将其定位为**“结对编程伙伴 (Pair Programmer)”**，而非单纯的代码生成器。

* **是否使用 AI 工具**：是（Google Gemini）。
* **使用 AI 的环节与思考**：
    * **核心功能开发 (Agent Integration)**：
        * **设计思路**：为了实现差异化功能，我构思了 "Magic Wand" 智能拆解功能。
        * **Prompt Engineering**：在调试 AI 输出时，发现默认输出常包含 Markdown 标记导致解析失败。我主动优化了 System Prompt，增加了`“只返回纯 JSON 数组”`和`“不要包含 Markdown”`的强约束，大幅提升了响应的稳定性。
    * **代码辅助与重构**：
        * **样式生成**：利用 AI 快速生成了 Tailwind CSS 的复杂样式（如 Glassmorphism 毛玻璃效果、关键帧动画），随后我根据实际 UI 效果进行了微调（如调整透明度和阴影参数）。
        * **类型定义**：参考 AI 生成的 TypeScript 接口初稿，但我根据业务需求增加了 `parentId` 和 `category` 字段，并将其从 `string` 收窄为联合类型以增强类型安全。
    * **Bug 定位与修复**：
        * **场景**：在开发 `getCategoryEmoji` 函数时遇到了 TypeScript 索引签名报错 (`Element implicitly has an 'any' type`)。
        * **解决**：虽然 AI 提示了问题原因，但我并没有直接忽略类型检查（`any`），而是深入理解了 TS 的索引类型机制，最终通过修改函数参数类型定义（`string` -> `Todo['category']`）彻底解决了类型不匹配问题，保证了代码库的严谨性。
* **AI 输出如何修改**：
    * **逻辑适配**：AI 生成的原始数据仅包含 `title` 和 `description`。我在前端逻辑中编写了适配器（Adapter），自动补充了 `id` (时间戳)、`parentId` (关联当前任务)、`dueDate` (默认为当天) 等业务字段，确保 AI 生成的数据能无缝融入现有的树形结构中。

## 5. 运行与测试方式

### 本地运行

1. **环境要求**：Node.js v16+

2. **安装依赖**：

   ```
   npm install
   ```

3. **启动开发服务器**：

   ```
   npm run dev
   ```

   启动后访问 `http://localhost:5173` 即可预览。

4. **构建生产版本**：

   ```
   npm run build
   ```

### 已测试环境

- macOS 26.1 / Chrome 142.0.7444.162 / Safari 26.1

### 已知问题与不足

- **API Key 安全性**：目前采用 **Client-Side (BYOK)** 调用方式，API Key 仅存储在内存中，刷新即焚。虽然保障了用户隐私，但在生产环境中，更理想的做法是通过后端 Proxy 转发请求以彻底隐藏 API Key 逻辑。
- **递归层级限制**：目前的 UI 设计主要针对两层结构（父任务 -> 子任务）进行了优化，对于无限层级的嵌套，UI 缩进可能会导致显示空间不足。

## 6. 总结与反思

### 如果有更多时间，我会如何改进？

- **全局状态管理**：引入 **Zustand** 或 **React Context**。目前的状态通过 Props 传递，虽然层级不深，但随着功能增加（如跨组件的 Theme 切换），全局状态管理会更清晰。
- **拖拽排序 (Drag and Drop)**：引入 `dnd-kit` 或 `react-beautiful-dnd`，允许用户通过拖拽来改变任务顺序或改变父子关系，提升交互直觉性。
- **单元测试**：编写 **Vitest** 测试用例，特别是针对 `useAITaskSplitter` 的异步逻辑和 `processedTodos` 的排序过滤逻辑进行覆盖，确保核心业务的稳定性。

### 这个实现的最大亮点是什么？

1. **AI Agent 的工程化落地**：不仅仅是调用 API，而是通过 **Prompt Engineering** 和 **Custom Hooks** 封装，将 AI 能力无缝融入了传统的 CRUD 流程中，实现了“智能任务拆解”这一差异化功能。
2. **工程化思维与架构演进**：项目并非一次性写成，而是经历了从“静态页面”到“数据驱动”，再到“复杂树形结构”的完整演进。使用了 **Git 分支策略** (`main` / `advanced-features`) 来管理不同阶段的交付物，体现了对软件工程流程的尊重。
3. **极致的 UI 细节**：打破了传统 Todo List 的刻板印象，实现了 **树形结构渲染**、**折叠/展开动画**、**毛玻璃特效** 以及 **移动端适配**，在满足功能的同时提供了优秀的视觉体验。