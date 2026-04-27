# 智途 AstroPath — 智能留学规划平台

> 一站式智能留学规划平台，集成 AI 智能推荐、院校数据库、申请材料管理等功能，为留学生提供全方位的升学指导服务。

## 项目简介

AstroPath（智途）是一个面向留学生的智能规划平台，荣获人工智能学院第四届科创节网页设计大赛参赛项目。平台整合了院校信息库、专业方向分析、AI 智能推荐等核心功能，帮助学生制定个性化的留学方案。

### 核心特性

- **AI 智能推荐** — 基于学生背景智能匹配适合的院校与专业
- **院校数据库** — 收录全球知名院校信息，支持多维度筛选
- **专业详情** — 涵盖各专业课程设置、录取要求、就业前景
- **申请时间线** — 可视化展示申请各阶段节点
- **材料管理** — 一站式管理留学申请所需材料
- **AI 对话助手** — 实时解答留学相关疑问

## 技术架构

### 核心技术栈

| 技术 | 说明 |
|------|------|
| **Vue 3** | 渐进式 JavaScript 框架，组件化开发 |
| **Vite 5** | 新一代前端构建工具，快速热更新 |
| **Element Plus** | Vue 3 UI 组件库 |
| **Vue Router** | 官方路由管理 |
| **Pinia** | Vue 状态管理（按项目需求可选） |
| **TypeScript** | JavaScript 超集，提供类型支持 |
| **ECharts** | 数据可视化图表库 |
| **GSAP** | 高性能动画引擎 |

### AI 能力

| 技术 | 说明 |
|------|------|
| **智谱 AI (BigModel)** | AI 对话与推荐服务提供商 |
| **流式响应** | 支持 SSE 流式输出，实时展示 AI 回复 |
| **Marked + DOMPurify** | Markdown 渲染与安全过滤 |

### 开发与部署

| 技术 | 说明 |
|------|------|
| **Vite** | 开发服务器与生产构建 |
| **ESLint + TypeScript ESLint** | 代码质量检查 |
| **vue-tsc** | TypeScript 类型检查 |
| **Wrangler** | Cloudflare Pages 部署 |
| **Netlify** | 静态网站托管 |
| **Playwright** | E2E 测试框架 |

## 项目结构

```
Astropath/
├── public/                    # 静态资源
│   └── ...
├── src/
│   ├── assets/               # 资源文件（图片、字体等）
│   ├── components/            # 可复用组件
│   │   ├── common/           # 通用组件
│   │   ├── materials/        # 材料相关组件
│   │   ├── result/           # 结果展示组件
│   │   ├── school-rec/       # 学校推荐组件
│   │   ├── school-recommendation/
│   │   ├── story/           # 故事/时间线组件
│   │   ├── ui/              # UI 基础组件
│   │   └── university-db/    # 院校库组件
│   ├── composables/          # Vue Composition API 逻辑复用
│   │   ├── useActiveStream.ts
│   │   ├── useAIConfig.ts
│   │   ├── useAIRecommendation.ts
│   │   ├── useAIStream.ts
│   │   ├── useAnnouncements.ts
│   │   ├── useAssessmentState.ts
│   │   ├── useDatabaseState.ts
│   │   ├── useGlobalAIState.ts
│   │   ├── useGlobalRecommendationState.ts
│   │   ├── useMaterialsState.ts
│   │   ├── useScrollAnimation.ts
│   │   └── useStorage.ts
│   ├── constants.ts          # 全局常量
│   ├── data/                 # 静态数据
│   │   ├── announcements.ts  # 公告数据
│   │   ├── competition-scores.ts
│   │   ├── majors.js         # 专业数据
│   │   ├── schools.js        # 学校基础数据
│   │   ├── schoolsData.js    # 学校详细数据
│   │   └── storyData.ts      # 故事/时间线数据
│   ├── router/               # 路由配置
│   ├── store/                # 状态管理
│   ├── styles/               # 全局样式
│   ├── types/                # TypeScript 类型定义
│   ├── ui/                   # UI 组件
│   ├── utils/                # 工具函数
│   ├── views/                # 页面视图
│   │   ├── AIChat.vue        # AI 对话页面
│   │   ├── AIConfig.vue      # AI 配置页面
│   │   ├── Assessment.vue    # 测评页面
│   │   ├── Home.vue          # 首页
│   │   ├── MajorDetail.vue   # 专业详情
│   │   ├── Materials.vue     # 材料管理
│   │   ├── Result.vue        # 结果页面
│   │   ├── SchoolDetail.vue  # 学校详情
│   │   ├── SchoolRecommendation.vue  # 学校推荐
│   │   ├── Story.vue         # 故事页面
│   │   ├── Timeline.vue      # 时间线页面
│   │   └── UniversityDatabase.vue     # 院校数据库
│   ├── App.vue               # 根组件
│   └── main.js               # 应用入口
├── docs/                     # 项目文档
├── dist/                     # 生产构建产物
├── eslint.config.js          # ESLint 配置
├── index.html                # HTML 入口
├── package.json
├── tsconfig.json             # TypeScript 配置
├── vite.config.js            # Vite 配置
├── wrangler.toml             # Cloudflare Pages 配置
└── netlify.toml              # Netlify 配置
```

## 页面功能

### 首页 (Home)
平台主入口，展示核心功能入口与平台介绍。

### 院校数据库 (UniversityDatabase)
- 多维度院校筛选（地区、排名、专业方向等）
- 院校详情展示（录取要求、费用、专业设置）
- 可视化数据图表

### 专业详情 (MajorDetail)
- 专业课程介绍
- 录取标准与要求
- 就业前景分析

### 学校推荐 (SchoolRecommendation)
- 基于学生背景的智能推荐
- 推荐理由与匹配度分析
- 一键添加到申请列表

### AI 对话 (AIChat)
- 流式输出 AI 回复
- Markdown 渲染支持
- 多轮对话上下文

### 测评 (Assessment)
- 留学意向测评
- 个性化方案生成
- 结果存档与分析

### 时间线 (Timeline)
- 申请进度可视化
- 重要节点提醒
- 状态追踪

### 材料管理 (Materials)
- 申请材料清单
- PDF/文档生成导出
- 材料上传与管理

## 开发指南

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 生产构建
npm run preview      # 预览构建产物
npm run lint          # ESLint 检查并自动修复
npm run typecheck    # TypeScript 类型检查
```

### AI 功能配置

使用 AI 功能需要配置智谱 API Key：

1. 免费申请 API Key：[智谱 AI 平台](https://www.bigmodel.cn/apikey/platform)
2. 在 `AIConfig.vue` 或环境变量中配置 Key
3. **注意**：请勿将 API Key 提交到 Git 仓库

### 环境变量

项目根目录下的 `.env` 和 `.env.development` 文件用于配置环境变量：

```bash
# AI API 配置
VITE_AI_API_KEY=your_api_key_here
```

## 设计规范

### 配色系统

| 用途 | 颜色 | 说明 |
|------|------|------|
| 主色 | `#0F172A` | Slate-900，唯一交互色 |
| 强调色 | `#D97706` | Amber-600，唯一彩色点缀 |
| 背景 | `#FFFFFF` | 白色为主 |

### 字体规范

- 数据/数字/标签：JetBrains Mono
- 禁止使用：Inter / Roboto / Arial / Helvetica

### 动画规范

- 入场动画：`cubic-bezier(0.16, 1, 0.3, 1)` (Expo Out)
- 悬停微交互：`cubic-bezier(0.34, 1.56, 0.64, 1)` (Back Out)
- **无障碍支持**：所有动画需添加 `prefers-reduced-motion` 媒体查询

## 部署

### Cloudflare Pages

使用 Wrangler 部署到 Cloudflare Pages：

```bash
npx wrangler pages deploy dist
```

### Netlify

使用 Netlify CLI 部署：

```bash
netlify deploy --prod --dir=dist
```

### 代理配置

Vite 开发服务器配置了 AI 代理，解决跨域问题：

```javascript
proxy: {
  '/ai-proxy/': {
    target: 'https://open.bigmodel.cn/api/paas/v4',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/ai-proxy\//, '')
  }
}
```

## 比赛信息

| 项目 | 说明 |
|------|------|
| 赛事 | 人工智能学院第四届科创节网页设计大赛 |
| 日期 | 2026 年 4 月 7 日 |
| 评分标准 | 设计 40 + 功能 30 + 创新 30（AI 交互） + 展示 10 |

## License

Private - 本项目仅供学习交流使用
