#!/bin/bash
# 律己 App 启动脚本

echo "正在启动律己 App..."

cd "$(dirname "$0")/backend"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

echo "启动服务..."
node server.js
