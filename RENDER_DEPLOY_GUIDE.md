# AI科普基地网站 - Render部署指南

本指南将帮助您将AI科普基地网站部署到Render平台。

## 准备工作

1. 创建一个[Render账户](https://render.com/)
2. 将项目代码上传到GitHub或GitLab仓库

## 部署步骤

### 1. 创建PostgreSQL数据库

1. 登录Render控制台
2. 点击左侧菜单的"New +"按钮
3. 选择"PostgreSQL"
4. 填写以下信息：
   - Name: `ai-science-base-db`
   - Database: `ai_science_base`
   - User: 保持默认
   - Region: 选择离您最近的区域
   - PostgreSQL Version: 选择最新版本
   - Plan: 选择Free计划
5. 点击"Create Database"按钮
6. 创建完成后，记下"Internal Database URL"，这将在下一步中使用

### 2. 部署后端API

1. 在Render控制台点击左侧菜单的"New +"按钮
2. 选择"Web Service"
3. 连接您的GitHub或GitLab仓库
4. 填写以下信息：
   - Name: `ai-science-base-api`
   - Root Directory: `backend`（如果您的后端代码在backend目录下）
   - Environment: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn src.api_server:app --bind 0.0.0.0:$PORT`
   - Plan: 选择Free计划
5. 在"Environment Variables"部分，添加以下变量：
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: 生成一个随机字符串，或使用Render的"Generate"功能
   - `DATABASE_URL`: 粘贴上一步中的"Internal Database URL"
6. 点击"Create Web Service"按钮

### 3. 初始化数据库

部署完成后，我们需要初始化数据库：

1. 在Render控制台中，打开刚刚创建的Web服务
2. 点击"Shell"选项卡
3. 运行以下命令：
```bash
python init_render_db.py
```

这将创建必要的数据库表和初始用户。

### 4. 部署前端应用

1. 在Render控制台点击左侧菜单的"New +"按钮
2. 选择"Web Service"
3. 连接您的GitHub或GitLab仓库
4. 填写以下信息：
   - Name: `ai-science-base-frontend`
   - Root Directory: `frontend`（如果您的前端代码在frontend目录下）
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - Plan: 选择Free计划
5. 在"Environment Variables"部分，添加以下变量：
   - `VITE_API_URL`: `https://ai-science-base-api.onrender.com`（使用您的后端API URL）
6. 点击"Create Web Service"按钮

## 访问您的应用

部署完成后，您可以通过以下URL访问您的应用：

- 前端应用：`https://ai-science-base-frontend.onrender.com`
- 后端API：`https://ai-science-base-api.onrender.com`

## 默认账户

初始化数据库后，系统会创建以下默认账户：

- 管理员账号：
  - 用户名：admin
  - 密码：admin123

- 测试用户：
  - 用户名：test
  - 密码：test123

**重要提示**：在实际生产环境中，请务必更改默认密码！

## 故障排除

### 数据库连接问题

如果遇到数据库连接问题，请检查：

1. 环境变量`DATABASE_URL`是否正确设置
2. 数据库是否已创建并正在运行
3. 查看应用日志以获取详细错误信息

### 应用启动失败

如果应用无法启动，请检查：

1. 构建和启动命令是否正确
2. 环境变量是否正确设置
3. 查看应用日志以获取详细错误信息

### 前端无法连接到后端

如果前端无法连接到后端，请检查：

1. 环境变量`VITE_API_URL`是否正确设置
2. 后端API是否正在运行
3. CORS设置是否正确

## 更新应用

当您需要更新应用时，只需将更改推送到您的GitHub或GitLab仓库，Render将自动重新部署您的应用。 