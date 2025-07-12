#!/bin/bash

# 科普基地前后端一键启动脚本

echo "启动重庆市沙坪坝区人工智能科普基地系统..."

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

echo -e "${BLUE}项目根目录: ${PROJECT_ROOT}${NC}"

# 确保端口没有被占用
cleanup() {
  echo -e "${YELLOW}清理之前可能存在的进程...${NC}"
  
  # 查找并终止占用前端端口(5173-5180)的进程
  for port in 5173 5174 5175 5176 5177 5178 5179 5180; do
    pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
      echo -e "${YELLOW}终止端口 $port 上的进程 (PID: $pid)${NC}"
      kill -9 $pid
    fi
  done
  
  # 查找并终止占用后端端口(5002)的进程
  backend_pid=$(lsof -ti:5002)
  if [ ! -z "$backend_pid" ]; then
    echo -e "${YELLOW}终止端口 5002 上的进程 (PID: $backend_pid)${NC}"
    kill -9 $backend_pid
  fi
  
  # 可能的Python进程
  pkill -f "python3 backend/simple_server.py" > /dev/null 2>&1
  
  sleep 1
}

# 检查并创建必要的目录
setup_directories() {
  echo -e "${GREEN}设置必要的目录...${NC}"
  
  # 确保静态目录存在
  mkdir -p "$BACKEND_DIR/static/images"
  mkdir -p "$BACKEND_DIR/static/videos"
  mkdir -p "$BACKEND_DIR/static/assets"
  mkdir -p "$BACKEND_DIR/instance"
  
  echo -e "${GREEN}✓ 目录设置完成${NC}"
}

# 启动后端服务
start_backend() {
  echo -e "${GREEN}启动后端服务...${NC}"
  cd "$BACKEND_DIR"
  
  # 设置环境变量
  export FLASK_ENV=development
  export DATABASE_URL="postgresql://luoyixin:@localhost/kepu"
  
  # 启动后端服务，使用python3而不是python
  python3 src/main.py &
  
  # 等待后端启动
  echo -e "${YELLOW}等待后端服务启动...${NC}"
  sleep 3
  
  # 检查后端是否正常启动
  if curl -s http://localhost:5002/api/test > /dev/null; then
    echo -e "${GREEN}✓ 后端服务已启动: http://localhost:5002${NC}"
  else
    echo -e "${RED}✗ 后端服务启动失败${NC}"
    echo "请检查日志获取更多信息"
    exit 1
  fi
}

# 启动前端服务
start_frontend() {
  echo -e "${GREEN}启动前端服务...${NC}"
  cd "$FRONTEND_DIR"
  
  # 设置环境变量
  export VITE_API_URL="http://localhost:5002"
  
  # 启动前端服务
  npm run dev &
  
  # 等待前端启动
  echo -e "${YELLOW}等待前端服务启动...${NC}"
  sleep 5
  
  echo -e "${GREEN}✓ 前端服务应该已经启动，请检查控制台输出的URL${NC}"
}

# 清理之前的进程
cleanup

# 设置目录
setup_directories

# 启动服务
start_backend
start_frontend

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}重庆市沙坪坝区人工智能科普基地系统已启动${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "后端地址: ${BLUE}http://localhost:5002${NC}"
echo -e "前端地址: ${BLUE}http://localhost:5175${NC}"
echo -e "管理员登录: 用户名 ${YELLOW}admin${NC} 密码 ${YELLOW}admin123${NC}"
echo -e "${GREEN}=======================================${NC}"
echo "按 Ctrl+C 停止所有服务"

# 等待用户终止
wait % 