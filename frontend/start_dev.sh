#!/bin/bash

# 检查是否有已运行的前端开发服务器
echo "检查是否有已运行的前端服务器进程..."
if lsof -i :5173 > /dev/null; then
    echo "端口5173已被占用，尝试终止进程..."
    lsof -ti :5173 | xargs kill -9
    echo "进程已终止"
fi

# 启动前端开发服务器
echo "启动前端开发服务器..."
npm run dev 