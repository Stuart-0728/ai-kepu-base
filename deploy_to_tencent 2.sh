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

# 安装Node.js
echo "正在安装Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装PostgreSQL
echo "正在安装PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 创建数据库和用户
echo "正在配置PostgreSQL数据库..."
DB_PASSWORD=$(openssl rand -hex 8)
sudo -u postgres psql -c "CREATE DATABASE ai_science_base;"
sudo -u postgres psql -c "CREATE USER ai_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_science_base TO ai_user;"

echo "数据库配置完成！"
echo "数据库名称: ai_science_base"
echo "数据库用户: ai_user"
echo "数据库密码: $DB_PASSWORD"
echo "请记住这些信息！"

# 创建应用目录
echo "正在创建应用目录..."
APP_DIR="/var/www/ai-science-base"
mkdir -p $APP_DIR
cd $APP_DIR

# 克隆代码
echo "正在克隆代码..."
git clone https://github.com/Stuart-0728/ai-kepu-base.git .

# 配置后端
echo "正在配置后端..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# 创建环境变量文件
SECRET_KEY=$(openssl rand -hex 16)
cat > .env << EOF
FLASK_ENV=production
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://ai_user:$DB_PASSWORD@localhost:5432/ai_science_base
EOF

# 构建前端
echo "正在构建前端..."
cd ../frontend
npm install
npm run build

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
ExecStart=$APP_DIR/backend/venv/bin/gunicorn src.api_server:app --bind 0.0.0.0:5000 --workers 3
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

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -s /etc/nginx/sites-available/ai-science-base /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 初始化数据库
echo "正在初始化数据库..."
cd $APP_DIR/backend
source venv/bin/activate

cat > init_db.py << EOF
import os
from src.api_server import create_app
from src.models.database import db, User
from werkzeug.security import generate_password_hash

app = create_app('production')

with app.app_context():
    db.create_all()
    
    # 检查是否已存在管理员用户
    if not User.query.filter_by(username='admin').first():
        # 创建管理员用户
        admin = User()
        admin.username = 'admin'
        admin.email = 'admin@example.com'
        admin.role = 'admin'
        admin.password_hash = generate_password_hash('admin123')
        db.session.add(admin)
        
        # 创建测试用户
        test_user = User()
        test_user.username = 'test'
        test_user.email = 'test@example.com'
        test_user.role = 'user'
        test_user.password_hash = generate_password_hash('test123')
        db.session.add(test_user)
        
        # 提交所有更改
        db.session.commit()
        print("已创建初始用户")
    else:
        print("数据库中已存在用户，跳过初始化")
EOF

python init_db.py

# 启动服务
echo "正在启动服务..."
systemctl daemon-reload
systemctl start ai-science-base
systemctl enable ai-science-base
systemctl restart nginx

# 配置防火墙
echo "正在配置防火墙..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
echo "y" | ufw enable

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
echo "- 数据库名称: ai_science_base"
echo "- 数据库用户: ai_user"
echo "- 数据库密码: $DB_PASSWORD"
echo ""
echo "如果需要配置域名，请编辑 /etc/nginx/sites-available/ai-science-base 文件"
echo "将 server_name _ 修改为您的域名，然后重启Nginx: systemctl restart nginx" 