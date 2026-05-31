# CLAUDE.md

@AGENTS.md

## 项目专属补充

### AI 调用链路

```
页面组件 → useAIStream (composable)
         → useGlobalAIState (全局 AI 状态，管理并发流)
         → ai-api.js (API 调用，多 provider 适配)
         → Vite proxy /ai-proxy/ → 智谱 open.bigmodel.cn
```

- `useAIStream`：单个任务级流式调用，处理 SSE、重试、状态机
- `useGlobalAIState`：全局状态中心，管理活跃流、队列、并发控制
- `ai-api.js`：provider 适配层，统一 OpenAI 兼容接口

### 路由

Hash 模式（`createWebHashHistory`），URL 带 `#`（如 `http://localhost:3000/#/assessment`）。沉浸式页面（`/ai-chat`、`/story`、`/result`）隐藏顶栏。

### 静态数据

`src/data/` 含多版本数据（v1/v2/v3），为数据结构迭代产物。院校、专业等数据为 JS/TS 静态导出。
