#!/bin/bash
set -e

echo "===== 开始构建流程 ====="

# 安装后端依赖
echo "安装后端依赖..."
pip install -r requirements.txt

# 进入前端目录
echo "进入前端目录..."
cd ../frontend

# 安装前端依赖
echo "安装前端依赖..."
npm install

# 构建前端
echo "构建前端..."
npm run build

# 确保dist目录存在
if [ ! -d "dist" ]; then
  echo "错误: 前端构建失败，dist目录不存在"
  exit 1
fi

echo "前端构建完成"

# 返回后端目录
cd ../backend

echo "===== 构建流程完成 =====" 