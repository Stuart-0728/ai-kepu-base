#!/bin/bash

echo "===== 修复本地开发环境 ====="

# 进入后端目录并激活虚拟环境
cd backend
source venv/bin/activate

# 安装必要的依赖
echo "安装必要的依赖..."
pip install flask flask-cors flask-sqlalchemy flask-migrate gunicorn pytz python-dotenv

# 返回项目根目录
cd ..

# 启动本地开发环境
echo "启动本地开发环境..."
./start_local_dev.sh

echo "===== 环境修复完成 =====" 