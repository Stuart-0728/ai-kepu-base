#!/bin/bash

# 设置环境变量
export VITE_API_URL="http://localhost:5002"

# 确保当前目录是前端目录
cd "$(dirname "$0")"

echo "启动AI科普基地前端开发服务器..."
echo "API URL: $VITE_API_URL"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 启动开发服务器
echo "启动开发服务器..."
npm run dev 