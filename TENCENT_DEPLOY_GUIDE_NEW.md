# 腾讯云部署指南 (更新版)

## 1. 准备工作

### 1.1 服务器环境
- 操作系统: Ubuntu 22.04 LTS
- Python: 3.10+
- Node.js: 18+
- PostgreSQL: 14+
- Nginx: 最新稳定版

### 1.2 域名和SSL证书
- 如果有域名，请提前准备好
- SSL证书可以使用Let's Encrypt免费申请

## 2. 服务器初始化

### 2.1 更新系统
```bash
sudo apt update
sudo apt upgrade -y
```

### 2.2 安装基础软件
```bash
sudo apt install -y git curl wget vim build-essential
```

### 2.3 安装Python环境
```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 2.4 安装Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.5 安装PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2.6 安装Nginx
```bash
sudo apt install -y nginx
```

## 3. 配置PostgreSQL数据库

### 3.1 创建数据库和用户
```bash
sudo -u postgres psql -c "CREATE USER aikepu WITH PASSWORD 'aikepu123';"
sudo -u postgres psql -c "CREATE DATABASE aikepu OWNER aikepu;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aikepu TO aikepu;"
```

### 3.2 配置远程访问(可选)
编辑PostgreSQL配置文件:
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

修改监听地址:
```
listen_addresses = '*'
```

编辑访问控制文件:
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

添加以下行允许远程访问:
```
host    all             all             0.0.0.0/0               md5
```

重启PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 4. 部署应用

### 4.1 克隆代码
```bash
cd /home/ubuntu
git clone https://github.com/yourusername/ai-kepu-base.git
cd ai-kepu-base
```

### 4.2 配置后端

创建Python虚拟环境:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

创建环境变量文件:
```bash
cp .env.example .env
```

编辑环境变量:
```bash
nano .env
```

修改以下内容:
```
FLASK_ENV=production
SECRET_KEY=your_strong_secret_key_here
DATABASE_URL=postgresql://aikepu:aikepu123@localhost/aikepu
```

初始化数据库:
```bash
python src/init_db.py
```

### 4.3 配置前端

安装依赖:
```bash
cd ../frontend
npm install
```

构建前端:
```bash
npm run build
```

## 5. 配置Nginx

### 5.1 创建Nginx配置文件
```bash
sudo nano /etc/nginx/sites-available/aikepu
```

添加以下内容:
```nginx
server {
    listen 80;
    server_name _;  # 替换为你的域名或使用_表示接受所有请求

    # 增加上传文件大小限制
    client_max_body_size 50M;

    location /api {
        proxy_pass http://localhost:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        proxy_pass http://localhost:5002/static;
    }

    location / {
        root /home/ubuntu/ai-kepu-base/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.2 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/aikepu /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # 删除默认配置
sudo nginx -t  # 测试配置是否有语法错误
sudo systemctl restart nginx
```

### 5.3 设置文件权限
确保Nginx可以访问前端文件:
```bash
chmod -R 755 /home/ubuntu/ai-kepu-base/frontend/dist
```

## 6. 配置系统服务

### 6.1 创建后端服务
```bash
sudo nano /etc/systemd/system/aikepu.service
```

添加以下内容:
```
[Unit]
Description=AI Science Base API Service
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ai-kepu-base/backend
Environment="PATH=/home/ubuntu/ai-kepu-base/backend/venv/bin"
Environment="FLASK_ENV=production"
Environment="SECRET_KEY=your_strong_secret_key_here"
Environment="DATABASE_URL=postgresql://aikepu:aikepu123@localhost/aikepu"
ExecStart=/home/ubuntu/ai-kepu-base/backend/venv/bin/python src/main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 6.2 启用服务
```bash
sudo systemctl daemon-reload
sudo systemctl enable aikepu.service
sudo systemctl start aikepu.service
```

### 6.3 检查服务状态
```bash
sudo systemctl status aikepu.service
```

## 7. 配置SSL证书(可选)

### 7.1 安装Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 获取证书
```bash
sudo certbot --nginx -d yourdomain.com
```

### 7.3 自动续期
Certbot会自动添加续期任务，可以测试:
```bash
sudo certbot renew --dry-run
```

## 8. 常见问题解决

### 8.1 会话持久性问题
如果遇到登录后刷新页面自动退出的问题，请检查后端配置:

1. 修改Flask会话配置:
```python
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # 在HTTP环境下使用Cookie
    SESSION_COOKIE_SAMESITE=None, # 允许跨站请求发送Cookie
    SESSION_COOKIE_DOMAIN=None,   # 不限制域名
    SESSION_COOKIE_PATH="/",
)
```

2. 修改CORS配置:
```python
CORS(app,
    resources={r"/*": {"origins": ["http://yourdomain.com", "https://yourdomain.com"]}}, # 具体域名列表
    supports_credentials=True  # 允许跨域请求携带凭证
)
```

3. 设置固定的SECRET_KEY环境变量，确保服务重启后会话仍然有效。

### 8.2 文件上传大小限制
如果上传大文件时遇到413错误(Request Entity Too Large)，需要修改Nginx配置:

1. 编辑Nginx配置文件:
```bash
sudo nano /etc/nginx/sites-available/aikepu
```

2. 在server块中添加以下配置:
```nginx
server {
    # 增加上传文件大小限制到50MB
    client_max_body_size 50M;
    
    # 其他配置...
}
```

3. 重启Nginx:
```bash
sudo systemctl restart nginx
```

### 8.3 权限错误
如果遇到403或401错误，请确保:

1. 前端请求包含凭证:
```javascript
// 在config.js中添加
import axios from 'axios';
axios.defaults.withCredentials = true;
```

2. 检查后端权限验证逻辑是否正确

## 9. 维护

### 9.1 日志查看
```bash
# 查看后端服务日志
sudo journalctl -u aikepu.service

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 9.2 备份数据库
```bash
# 创建备份目录
mkdir -p ~/backups

# 备份数据库
pg_dump -U aikepu -h localhost aikepu > ~/backups/aikepu_$(date +%Y%m%d).sql
```

### 9.3 更新应用
```bash
cd /home/ubuntu/ai-kepu-base
git pull

# 更新后端
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart aikepu.service

# 更新前端
cd ../frontend
npm install
npm run build

# 重启Nginx
sudo systemctl restart nginx
```

## 10. 总结

完成以上步骤后，你的应用应该已经成功部署到腾讯云服务器上。可以通过服务器IP或域名访问应用。

如果遇到问题，请检查:
1. 服务状态: `sudo systemctl status aikepu.service`
2. Nginx状态: `sudo systemctl status nginx`
3. 日志文件: `/var/log/nginx/error.log` 和 `journalctl -u aikepu.service` 