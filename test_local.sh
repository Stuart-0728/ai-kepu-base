#!/bin/bash

# 科普基地本地测试脚本

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

echo -e "${BLUE}=== 科普基地本地测试脚本 ===${NC}"
echo -e "${BLUE}项目根目录: ${PROJECT_ROOT}${NC}"

# 检查PostgreSQL是否安装
check_postgres() {
  echo -e "${YELLOW}检查PostgreSQL...${NC}"
  if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL已安装${NC}"
    
    # 检查PostgreSQL服务是否运行
    if pg_isready &> /dev/null; then
      echo -e "${GREEN}✓ PostgreSQL服务正在运行${NC}"
    else
      echo -e "${RED}✗ PostgreSQL服务未运行${NC}"
      echo "请启动PostgreSQL服务"
      exit 1
    fi
  else
    echo -e "${RED}✗ PostgreSQL未安装${NC}"
    echo "请安装PostgreSQL数据库"
    exit 1
  fi
}

# 检查数据库是否存在
check_database() {
  echo -e "${YELLOW}检查数据库...${NC}"
  
  # 尝试连接到数据库
  if psql -lqt | cut -d \| -f 1 | grep -qw kepu; then
    echo -e "${GREEN}✓ 数据库 'kepu' 已存在${NC}"
  else
    echo -e "${RED}✗ 数据库 'kepu' 不存在${NC}"
    echo "创建数据库..."
    createdb kepu || { 
      echo -e "${RED}创建数据库失败${NC}"; 
      echo "请手动创建数据库：createdb kepu"; 
      exit 1; 
    }
    echo -e "${GREEN}✓ 数据库 'kepu' 已创建${NC}"
  fi
}

# 检查后端依赖
check_backend_deps() {
  echo -e "${YELLOW}检查后端依赖...${NC}"
  cd "$BACKEND_DIR"
  
  # 检查Python版本
  PYTHON_VERSION=$(python3 --version)
  echo -e "${GREEN}Python版本: ${PYTHON_VERSION}${NC}"
  
  # 检查必要的Python包
  pip3 install -q -r requirements.txt
  echo -e "${GREEN}✓ 后端依赖已安装${NC}"
}

# 检查前端依赖
check_frontend_deps() {
  echo -e "${YELLOW}检查前端依赖...${NC}"
  cd "$FRONTEND_DIR"
  
  # 检查Node.js版本
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}Node.js版本: ${NODE_VERSION}${NC}"
  
  # 检查npm版本
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}npm版本: ${NPM_VERSION}${NC}"
  
  # 检查是否安装了必要的依赖
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install
  fi
  
  echo -e "${GREEN}✓ 前端依赖已安装${NC}"
}

# 检查静态目录
check_static_dirs() {
  echo -e "${YELLOW}检查静态目录...${NC}"
  
  # 确保静态目录存在
  mkdir -p "$BACKEND_DIR/static/images"
  mkdir -p "$BACKEND_DIR/static/videos"
  mkdir -p "$BACKEND_DIR/static/assets"
  
  echo -e "${GREEN}✓ 静态目录已创建${NC}"
}

# 测试API连接
test_api() {
  echo -e "${YELLOW}测试API连接...${NC}"
  
  # 启动后端服务
  cd "$BACKEND_DIR"
  export FLASK_ENV=development
  export DATABASE_URL="postgresql://luoyixin:@localhost/kepu"
  
  echo -e "${YELLOW}启动后端服务...${NC}"
  python3 simple_server.py &
  PID=$!
  
  # 等待服务启动
  sleep 3
  
  # 测试API
  RESPONSE=$(curl -s http://localhost:5002/api/test)
  if [[ $RESPONSE == *"API"* ]]; then
    echo -e "${GREEN}✓ API测试成功${NC}"
  else
    echo -e "${RED}✗ API测试失败${NC}"
    echo "响应: $RESPONSE"
  fi
  
  # 停止后端服务
  kill $PID
}

# 运行检查
check_postgres
check_database
check_backend_deps
check_frontend_deps
check_static_dirs
test_api

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}本地环境检查完成${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "您可以使用以下命令启动服务:"
echo -e "${BLUE}./start_all.sh${NC}"
echo -e "${GREEN}=======================================${NC}" 