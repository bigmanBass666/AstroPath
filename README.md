# 智途 AstroPath — 智能留学规划平台

> 一站式智能留学规划平台，集成 AI 智能推荐、院校数据库、申请材料管理等功能

## 项目简介

AstroPath（智途）是一个面向留学生的智能规划平台，荣获人工智能学院第四届科创节网页设计大赛参赛项目。平台整合了院校信息库、专业方向分析、AI 智能推荐等核心功能。

### 核心特性

- **AI 智能推荐** — 基于学生背景智能匹配院校与专业
- **院校数据库** — 收录全球知名院校信息，多维度筛选
- **专业详情** — 课程设置、录取要求、就业前景
- **申请时间线** — 可视化展示申请各阶段节点
- **材料管理** — 一站式管理留学申请材料
- **AI 对话助手** — 实时解答留学相关疑问

## 技术架构

### 核心技术栈

| 技术 | 说明 |
|------|------|
| **Vue 3** | 渐进式 JavaScript 框架 |
| **Vite 5** | 新一代前端构建工具 |
| **Element Plus** | Vue 3 UI 组件库 |
| **TypeScript** | JavaScript 超集 |
| **ECharts** | 数据可视化图表库 |
| **GSAP** | 高性能动画引擎 |

### AI 能力

| 技术 | 说明 |
|------|------|
| **智谱 AI (BigModel)** | AI 对话与推荐服务 |
| **流式响应** | SSE 流式输出 |
| **Marked + DOMPurify** | Markdown 渲染与安全过滤 |

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
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览构建产物
npm run lint         # ESLint 检查并自动修复
npm run typecheck    # TypeScript 类型检查
```

### AI 功能配置

1. 免费申请 API Key：[智谱 AI 平台](https://www.bigmodel.cn/apikey/platform)
2. 在 `AIConfig.vue` 或环境变量中配置 Key
3. **请勿将 API Key 提交到 Git 仓库**

## 页面功能

| 页面 | 功能 |
|------|------|
| 首页 | 平台主入口 |
| 院校数据库 | 多维度筛选与详情展示 |
| 专业详情 | 课程、录取标准、就业分析 |
| 学校推荐 | 智能推荐与匹配度分析 |
| AI 对话 | 流式输出，Markdown 渲染 |
| 测评 | 留学意向测评 |
| 时间线 | 申请进度可视化 |
| 材料管理 | 材料清单与导出 |

## 部署

### Cloudflare Pages

```bash
npx wrangler pages deploy dist
```

### Netlify

```bash
netlify deploy --prod --dir=dist
```

## 比赛信息

| 项目 | 说明 |
|------|------|
| 赛事 | 人工智能学院第四届科创节网页设计大赛 |
| 日期 | 2026 年 4 月 |

## 作者

- **GitHub**: [bigmanBass666](https://github.com/bigmanBass666)

---

*Private - 本项目仅供学习交流使用*
