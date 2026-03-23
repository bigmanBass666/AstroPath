#!/usr/bin/env bash
set -euo pipefail

# ============================================
# 一站式智能留学规划与服务平台 - 初始化脚本
# ============================================

echo "=== 一站式智能留学规划平台 - 环境初始化 ==="

# 1. 检查 Node.js 环境
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js 未安装。请先安装 Node.js 18+ 版本。"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "WARNING: Node.js 版本较低，建议升级到 18+ 版本"
fi

# 2. 安装依赖
echo "📦 正在安装项目依赖..."
npm install

# 3. 停止可能存在的开发服务器
echo "🧹 清理进程..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows环境
  pkill -f "node.*vite" 2>/dev/null || true
  pkill -f "npm.*run.*dev" 2>/dev/null || true
else
  # Unix环境
  pkill -f "vite" 2>/dev/null || true
  pkill -f "node.*dev" 2>/dev/null || true
fi
sleep 1

# 4. 环境变量检查
if [ ! -f ".env" ]; then
  echo "⚠️  未找到 .env 文件，使用默认配置..."
  cp .env.example .env 2>/dev/null || true
  echo "请根据需要编辑 .env 文件配置AI API参数"
fi

# 5. 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev &
DEV_PID=$!

# 等待服务器启动（检测端口 5173 或 3000）
PORT=${VITE_PORT:-5173}
MAX_WAIT=60
WAITED=0

echo "⏳ 等待服务器就绪..."
while [ $WAITED -lt $MAX_WAIT ]; do
  if curl -sf "http://localhost:${PORT}/" > /dev/null 2>&1; then
    echo "✅ 服务器已就绪 (PID: ${DEV_PID}, Port: ${PORT})"
    echo "🌐 访问地址: http://localhost:${PORT}"
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo "❌ 启动失败：服务器在 ${MAX_WAIT} 秒内未响应"
  kill $DEV_PID 2>/dev/null || true
  exit 1
fi

# 6. 基础健康检查
echo "🔍 执行健康检查..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/")
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ 健康检查失败：HTTP ${HTTP_CODE}"
  kill $DEV_PID 2>/dev/null || true
  exit 1
fi

# 检查关键页面是否可访问
for PAGE in "/" "/background" "/school-recommendation" "/timeline" "/materials" "/ai-chat"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}${PAGE}")
  if [ "$CODE" != "200" ]; then
    echo "⚠️  页面 ${PAGE} 返回 ${CODE}（可能尚未实现）"
  fi
done

echo "✨ 初始化完成！开发服务正在运行..."
echo ""
echo "📋 可用命令："
echo "  npm run dev      - 启动开发服务器"
echo "  npm run build    - 构建生产版本"
echo "  npm run preview  - 预览构建结果"
echo ""
echo "💡 提示：按 Ctrl+C 停止服务器"

# 保持脚本运行，等待用户中断
wait $DEV_PID
