# AI科普基地网站 - PostgreSQL后端版本

本文档介绍了如何使用基于PostgreSQL数据库的新版后端系统。

## 系统要求

- Python 3.8+
- PostgreSQL 12+
- Node.js 16+
- npm 或 pnpm

## 后端设置

### 1. 安装PostgreSQL

如果您尚未安装PostgreSQL，请按照以下步骤安装：

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建数据库

登录到PostgreSQL并创建数据库：

```bash
sudo -u postgres psql
```

在PostgreSQL命令行中执行：

```sql
CREATE DATABASE ai_science_base;
CREATE USER ai_science WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_science_base TO ai_science;
\q
```

### 3. 配置后端

1. 进入后端目录：
```bash
cd backend
```

2. 创建并激活虚拟环境：
```bash
python -m venv venv
source venv/bin/activate  # 在Windows上使用 venv\Scripts\activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 设置环境变量：
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_science_base
export FLASK_APP=src/api_server.py
export FLASK_ENV=development
```

5. 初始化数据库：
```bash
python init_db.py
```

6. 启动后端服务：
```bash
python -m src.api_server
```

或者，您可以使用提供的脚本一键启动：
```bash
chmod +x start_postgres.sh
./start_postgres.sh
```

## 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
# 或者
pnpm install
```

3. 启动开发服务器：
```bash
npm run dev
# 或者
pnpm run dev
```

## 默认账户

初始化数据库后，系统会创建以下默认账户：

- 管理员账号：
  - 用户名：admin
  - 密码：admin123

- 测试用户：
  - 用户名：test
  - 密码：test123

## API端点

### 认证相关

- 注册：POST `/api/auth/register`
- 登录：POST `/api/auth/login`
- 登出：POST `/api/auth/logout`
- 检查登录状态：GET `/api/auth/check`

### 用户相关

- 获取个人资料：GET `/api/user/profile`
- 更新个人资料：PUT `/api/user/profile`
- 测试API：GET `/api/user/test`

### 管理员相关

- 获取统计数据：GET `/api/admin/dashboard`
- 获取用户列表：GET `/api/admin/users`
- 创建用户：POST `/api/admin/users`
- 更新用户：PUT `/api/admin/users/:id`
- 删除用户：DELETE `/api/admin/users/:id`

## 故障排除

### 数据库连接问题

1. 确保PostgreSQL服务正在运行：
```bash
pg_isready
```

2. 验证数据库连接字符串是否正确：
```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_science_base
```

3. 检查数据库是否存在：
```bash
psql -U postgres -c "\l" | grep ai_science_base
```

### API连接问题

1. 确保后端服务正在运行：
```bash
curl http://localhost:5002/api/test
```

2. 检查前端代理配置（vite.config.js）是否正确指向后端服务。

3. 查看后端日志：
```bash
tail -f backend/backend.log
```

### 前端登录问题

1. 清除浏览器缓存和Cookie。

2. 使用浏览器开发工具检查网络请求和响应。

3. 确保API请求包含正确的凭据（credentials: 'include'）。

## 联系支持

如有任何问题，请联系技术支持团队。 