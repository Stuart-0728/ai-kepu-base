#!/bin/bash

echo "=== AI科普基地网站 - Render部署脚本 ==="
echo "此脚本将引导您完成Render部署过程。"
echo ""

# 检查是否已安装render-cli
if ! command -v render &> /dev/null; then
    echo "Render CLI未安装。尝试安装..."
    
    # 尝试安装render-cli
    if command -v npm &> /dev/null; then
        npm install -g @render/cli
    else
        echo "错误: 未安装npm。请先安装Node.js和npm，然后再运行此脚本。"
        exit 1
    fi
    
    # 再次检查是否已安装
    if ! command -v render &> /dev/null; then
        echo "错误: 无法安装Render CLI。请手动安装后再运行此脚本。"
        echo "安装说明: npm install -g @render/cli"
        exit 1
    fi
    
    echo "已安装Render CLI。"
fi

# 登录Render
echo "请登录Render账户..."
render login

# 检查是否登录成功
if [ $? -ne 0 ]; then
    echo "错误: 无法登录Render。请确保您有一个有效的Render账户。"
    exit 1
fi

echo "登录成功！"
echo ""

# 创建数据库
echo "创建PostgreSQL数据库..."
render db create --name ai-science-base-db --plan free

# 获取数据库URL
DB_URL=$(render db info ai-science-base-db --json | grep -o '"connectionString": "[^"]*"' | cut -d'"' -f4)

if [ -z "$DB_URL" ]; then
    echo "错误: 无法获取数据库连接URL。"
    exit 1
fi

echo "数据库已创建！"
echo ""

# 部署后端API
echo "部署后端API服务..."
render service create \
    --name ai-science-base-api \
    --type web \
    --env python \
    --dir backend \
    --build-command "pip install -r requirements.txt" \
    --start-command "gunicorn src.api_server:app --bind 0.0.0.0:\$PORT" \
    --plan free \
    --env-file <(echo -e "FLASK_ENV=production\nDATABASE_URL=$DB_URL\nSECRET_KEY=$(openssl rand -hex 16)")

# 获取API URL
API_URL=$(render service info ai-science-base-api --json | grep -o '"host": "[^"]*"' | cut -d'"' -f4)
API_URL="https://$API_URL"

if [ -z "$API_URL" ]; then
    echo "错误: 无法获取API URL。"
    exit 1
fi

echo "后端API已部署！"
echo "API URL: $API_URL"
echo ""

# 部署前端应用
echo "部署前端应用..."
render service create \
    --name ai-science-base-frontend \
    --type web \
    --env node \
    --dir frontend \
    --build-command "npm install && npm run build" \
    --start-command "npm run preview -- --host 0.0.0.0 --port \$PORT" \
    --plan free \
    --env-file <(echo -e "VITE_API_URL=$API_URL")

# 获取前端URL
FRONTEND_URL=$(render service info ai-science-base-frontend --json | grep -o '"host": "[^"]*"' | cut -d'"' -f4)
FRONTEND_URL="https://$FRONTEND_URL"

if [ -z "$FRONTEND_URL" ]; then
    echo "错误: 无法获取前端URL。"
    exit 1
fi

echo "前端应用已部署！"
echo "前端URL: $FRONTEND_URL"
echo ""

# 初始化数据库
echo "初始化数据库..."
render run ai-science-base-api "python init_render_db.py"

echo ""
echo "=== 部署完成 ==="
echo "您的应用已成功部署到Render！"
echo ""
echo "前端URL: $FRONTEND_URL"
echo "API URL: $API_URL"
echo ""
echo "默认账户:"
echo "- 管理员: admin / admin123"
echo "- 测试用户: test / test123"
echo ""
echo "重要提示: 请务必在生产环境中更改默认密码！" 