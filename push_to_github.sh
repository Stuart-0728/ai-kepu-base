#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}正在提交代码到GitHub...${NC}"

# 添加所有修改的文件
git add .

# 提交更改
git commit -m "修复系统问题：
1. 修复数据库连接问题，将postgres用户改为luoyixin
2. 修复管理员登录问题，创建正确的admin账户
3. 添加/api/admin/appointments/counts端点
4. 完善/api/admin/videos管理接口
5. 统一启动脚本，使用start_all.sh替代分散的脚本
6. 删除临时登录账号"

# 推送到远程仓库
git push origin main

if [ $? -eq 0 ]; then
  echo -e "${GREEN}代码已成功推送到GitHub仓库${NC}"
else
  echo -e "${RED}推送失败，请检查GitHub凭证和网络连接${NC}"
  exit 1
fi

echo -e "${YELLOW}正在重启服务...${NC}"

# 重启服务
bash start_all.sh 