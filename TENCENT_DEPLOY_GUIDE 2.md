# 科普基地网站 - 腾讯云轻量服务器部署指南

本指南将帮助您在腾讯云轻量服务器上部署科普基地网站。

## 准备工作

1. 购买腾讯云轻量服务器
   - 推荐配置：2核4GB或更高
   - 操作系统：Ubuntu 22.04 LTS

## 部署方法

### 方法一：使用自动部署脚本（推荐）

1. 登录到您的服务器
   ```bash
   ssh root@您的服务器IP
   ```

2. 下载部署脚本
   ```bash
   wget https://raw.githubusercontent.com/Stuart-0728/ai-kepu-base/main/deploy_to_tencent.sh
   ```

3. 添加执行权限
   ```bash
   chmod +x deploy_to_tencent.sh
   ```

4. 运行部署脚本
   ```bash
   ./deploy_to_tencent.sh
   ```

5. 脚本会自动完成所有配置，最后会显示访问网站的地址和默认账户信息。

### 方法二：手动部署

如果您希望手动部署，请按照以下步骤操作：

1. 更新系统
   ```bash
   apt update && apt upgrade -y
   ```

2. 安装必要软件
   ```bash
   apt install -y git python3 python3-pip python3-venv nginx curl
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   apt install -y postgresql postgresql-contrib
   ```

3. 配置PostgreSQL数据库
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE ai_science_base;"
   sudo -u postgres psql -c "CREATE USER ai_user WITH PASSWORD 'your_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_science_base TO ai_user;"
   ```

4. 克隆代码
   ```bash
   mkdir -p /var/www/ai-science-base
   cd /var/www/ai-science-base
   git clone https://github.com/Stuart-0728/ai-kepu-base.git .
   ```

5. 配置后端
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn psycopg2-binary
   
   # 创建环境变量文件
   cat > .env << EOF
   FLASK_ENV=production
   SECRET_KEY=$(openssl rand -hex 16)
   DATABASE_URL=postgresql://ai_user:your_password@localhost:5432/ai_science_base
   EOF
   ```

6. 构建前端
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

7. 创建系统服务
   ```bash
   cat > /etc/systemd/system/ai-science-base.service << EOF
   [Unit]
   Description=AI Science Base Web Application
   After=network.target postgresql.service

   [Service]
   User=root
   WorkingDirectory=/var/www/ai-science-base/backend
   Environment="PATH=/var/www/ai-science-base/backend/venv/bin"
   EnvironmentFile=/var/www/ai-science-base/backend/.env
   ExecStart=/var/www/ai-science-base/backend/venv/bin/gunicorn src.api_server:app --bind 0.0.0.0:5000 --workers 3
   Restart=always

   [Install]
   WantedBy=multi-user.target
   EOF
   
   systemctl daemon-reload
   systemctl start ai-science-base
   systemctl enable ai-science-base
   ```

8. 配置Nginx
   ```bash
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
   systemctl restart nginx
   ```

9. 初始化数据库
   ```bash
   cd /var/www/ai-science-base/backend
   source venv/bin/activate
   python init_db.py  # 确保您已创建此文件
   ```

## 配置域名（可选）

如果您有自己的域名，可以按照以下步骤配置：

1. 在腾讯云控制台中将域名解析到您的服务器IP

2. 修改Nginx配置
   ```bash
   nano /etc/nginx/sites-available/ai-science-base
   ```

3. 将`server_name _;`修改为`server_name your-domain.com;`

4. 重启Nginx
   ```bash
   systemctl restart nginx
   ```

## 配置HTTPS（可选但推荐）

1. 安装Certbot
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. 获取并安装证书
   ```bash
   certbot --nginx -d your-domain.com
   ```

## 访问您的网站

部署完成后，您可以通过服务器IP或域名访问您的网站：

```
http://您的服务器IP
```

或

```
http://your-domain.com
```

默认账户：
- 管理员账号：admin / admin123
- 测试用户：test / test123

**重要提示**：请尽快登录后台修改默认密码！

## 故障排除

如果遇到问题，可以查看日志文件：

```bash
# 查看应用日志
journalctl -u ai-science-base

# 查看Nginx日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## 备份数据库

定期备份数据库是个好习惯：

```bash
# 创建备份目录
mkdir -p /var/backups/ai-science-base

# 备份数据库
pg_dump -U ai_user ai_science_base > /var/backups/ai-science-base/backup_$(date +%Y%m%d).sql
```

## 更新应用

当您需要更新应用时，可以按照以下步骤操作：

```bash
cd /var/www/ai-science-base
git pull

# 更新前端
cd frontend
npm install
npm run build

# 更新后端
cd ../backend
source venv/bin/activate
pip install -r requirements.txt

# 重启服务
systemctl restart ai-science-base
``` 