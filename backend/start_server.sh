#!/bin/bash

# 设置环境变量
export FLASK_ENV=production
export SECRET_KEY=${SECRET_KEY:-"ai_kepu_base_secret_key_$(date +%s)"}
export DATABASE_URL=${DATABASE_URL:-"postgresql://aikepu:aikepu123@localhost/aikepu"}

# 确保当前目录是后端目录
cd "$(dirname "$0")"

echo "启动AI科普基地后端服务..."
echo "环境: $FLASK_ENV"
echo "数据库URL: $DATABASE_URL"

# 检查是否有虚拟环境
if [ -d "venv" ]; then
    echo "使用虚拟环境..."
    source venv/bin/activate
fi

# 检查是否安装了依赖
if ! pip list | grep -q Flask; then
    echo "安装依赖..."
    pip install -r requirements.txt
fi

# 启动服务器
echo "启动服务器..."
python3 -m src.api_server

# 如果使用了虚拟环境，退出虚拟环境
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi 