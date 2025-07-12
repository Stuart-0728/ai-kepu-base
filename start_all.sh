#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== 启动AI科普基地系统 =====${NC}"

# 确保当前目录是项目根目录
cd "$(dirname "$0")"

# 检查操作系统类型
OS="$(uname -s)"
PYTHON_CMD="python3"
if [[ "$OS" == "MINGW"* ]] || [[ "$OS" == "MSYS"* ]] || [[ "$OS" == "CYGWIN"* ]]; then
    # Windows系统
    PYTHON_CMD="python"
fi

# 启动后端服务
echo -e "${BLUE}启动后端服务...${NC}"
cd backend
if [ -f "start_server.sh" ]; then
    chmod +x start_server.sh
    ./start_server.sh &
else
    echo -e "${YELLOW}使用默认命令启动后端...${NC}"
    export FLASK_ENV=production
    $PYTHON_CMD -m src.api_server &
fi
BACKEND_PID=$!
cd ..

# 等待后端启动
echo -e "${YELLOW}等待后端启动...${NC}"
sleep 3

# 启动前端服务
echo -e "${BLUE}启动前端服务...${NC}"
cd frontend
if [ -f "start_dev.sh" ]; then
    chmod +x start_dev.sh
    ./start_dev.sh &
else
    echo -e "${YELLOW}使用默认命令启动前端...${NC}"
    npm run dev &
fi
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}===== 系统已启动 =====${NC}"
echo -e "${YELLOW}后端进程ID: ${BACKEND_PID}${NC}"
echo -e "${YELLOW}前端进程ID: ${FRONTEND_PID}${NC}"
echo -e "${GREEN}前端地址: http://localhost:5175${NC}"
echo -e "${GREEN}后端API地址: http://localhost:5002/api${NC}"
echo -e "${YELLOW}按Ctrl+C停止服务${NC}"

# 捕获中断信号
trap "echo -e '${RED}正在停止服务...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 等待子进程
wait 