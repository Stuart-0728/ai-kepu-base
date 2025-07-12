#!/bin/bash
set -e

echo "===== 科普基地网站 - 腾讯云部署脚本 ====="
echo "此脚本将帮助您在腾讯云轻量服务器上部署科普基地网站"
echo ""

# 检查是否以root用户运行
if [ "$(id -u)" != "0" ]; then
   echo "此脚本需要以root用户运行" 1>&2
   exit 1
fi

# 更新系统
echo "正在更新系统..."
apt update && apt upgrade -y

# 安装必要软件
echo "正在安装必要软件..."
apt install -y git python3 python3-pip python3-venv nginx curl
apt install -y python3-dev libjpeg-dev zlib1g-dev libpng-dev libfreetype6-dev  # Pillow依赖

# 安装Node.js
echo "正在安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装pnpm
echo "正在安装pnpm..."
npm install -g pnpm

# 安装PostgreSQL
echo "正在安装PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 创建数据库和用户
echo "正在配置PostgreSQL数据库..."
DB_PASSWORD="aikepu123"
DB_USER="aikepu"
DB_NAME="aikepu"

# 创建用户和数据库
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER WITH SUPERUSER;"

# 修改PostgreSQL认证方式
echo "修改PostgreSQL认证配置..."
PG_HBA_CONF=$(sudo -u postgres psql -t -c "SHOW hba_file;" | xargs)
echo "PostgreSQL配置文件路径: $PG_HBA_CONF"

# 备份原配置
cp $PG_HBA_CONF ${PG_HBA_CONF}.bak

# 修改认证方式为md5
sed -i 's/peer/md5/g' $PG_HBA_CONF
sed -i 's/ident/md5/g' $PG_HBA_CONF

# 重启PostgreSQL服务
systemctl restart postgresql

echo "数据库配置完成！"
echo "数据库名称: $DB_NAME"
echo "数据库用户: $DB_USER"
echo "数据库密码: $DB_PASSWORD"
echo "请记住这些信息！"

# 创建应用目录
echo "正在创建应用目录..."
APP_DIR="/var/www/ai-science-base"
mkdir -p $APP_DIR
cd $APP_DIR

# 克隆代码或复制本地代码
echo "正在设置代码..."
if [ -d "/tmp/ai-kepu-base" ]; then
  echo "使用本地代码..."
  cp -r /tmp/ai-kepu-base/* .
else
  echo "从GitHub克隆代码..."
  git clone https://github.com/Stuart-0728/ai-kepu-base.git .
fi

# 配置后端
echo "正在配置后端..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary python-dotenv

# 创建环境变量文件
SECRET_KEY=$(openssl rand -hex 16)
cat > .env << EOF
FLASK_ENV=production
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF

# 确保静态目录存在
mkdir -p static/images
mkdir -p static/videos
mkdir -p static/assets

# 构建前端
echo "正在构建前端..."
cd ../frontend
pnpm install
pnpm run build

# 复制构建文件到静态目录
echo "复制前端构建文件到静态目录..."
cp -r dist/* ../backend/static/

# 创建系统服务
echo "正在创建系统服务..."
cat > /etc/systemd/system/ai-science-base.service << EOF
[Unit]
Description=AI Science Base Web Application
After=network.target postgresql.service

[Service]
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/venv/bin/gunicorn simple_server:app --bind 0.0.0.0:5002 --workers 3
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 配置Nginx
echo "正在配置Nginx..."
cat > /etc/nginx/sites-available/ai-science-base << EOF
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;
    
    # 所有请求转发到后端
    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # 静态文件缓存
    location /static/ {
        alias $APP_DIR/backend/static/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # 日志配置
    access_log /var/log/nginx/ai-science-access.log;
    error_log /var/log/nginx/ai-science-error.log;
}
EOF

ln -sf /etc/nginx/sites-available/ai-science-base /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 设置文件权限
echo "设置文件权限..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# 初始化数据库
echo "正在初始化数据库..."
cd $APP_DIR/backend
source venv/bin/activate

# 启动服务
echo "正在启动服务..."
systemctl daemon-reload
systemctl start ai-science-base
systemctl enable ai-science-base
systemctl restart nginx

# 配置防火墙
echo "正在配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    echo "y" | ufw enable
else
    echo "未找到ufw，跳过防火墙配置"
fi

# 获取服务器IP
SERVER_IP=$(curl -s http://ifconfig.me)

echo "===== 部署完成！ ====="
echo "您的网站已经成功部署！"
echo "网站地址: http://$SERVER_IP"
echo ""
echo "默认账户:"
echo "- 管理员: admin / admin123"
echo "- 测试用户: test / test123"
echo ""
echo "重要提示: 请尽快登录后台修改默认密码！"
echo ""
echo "数据库信息:"
echo "- 数据库名称: $DB_NAME"
echo "- 数据库用户: $DB_USER"
echo "- 数据库密码: $DB_PASSWORD"
echo ""
echo "如果需要配置域名，请编辑 /etc/nginx/sites-available/ai-science-base 文件"
echo "将 server_name _ 修改为您的域名，然后重启Nginx: systemctl restart nginx" 