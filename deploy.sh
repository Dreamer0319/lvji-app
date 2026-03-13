#!/bin/bash
# 律己 App 一键部署脚本
# 适用于任何 Linux/Mac 环境

set -e

echo "=========================================="
echo "   律己 App - 自律，是男人最顶级的修行"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 16+"
    echo "   Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    echo "   Mac: brew install node"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 进入后端目录
cd "$(dirname "$0")/backend"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo ""
echo "🚀 启动律己 App..."
echo ""
echo "=========================================="
echo "  访问地址: http://localhost:3001"
echo "=========================================="
echo ""

node server.js
