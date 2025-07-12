# 重庆市沙坪坝区人工智能科普基地管理系统

本项目是重庆市沙坪坝区人工智能科普基地的管理系统，包含前端和后端代码。

## 系统要求

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

## 本地开发环境设置

### 1. 检查环境并初始化

运行测试脚本检查本地环境：

```bash
./test_local.sh
```

该脚本将检查：
- PostgreSQL安装和服务状态
- 数据库是否存在
- 后端依赖
- 前端依赖
- 静态目录
- API连接

### 2. 启动本地开发服务

```bash
./start_all.sh
```

启动后可以访问：
- 前端：http://localhost:5175
- 后端API：http://localhost:5002

默认管理员账户：
- 用户名：admin
- 密码：admin123

## 部署到腾讯云

### 1. 准备工作

确保您有一台腾讯云服务器（推荐Ubuntu 20.04+），并具有root权限。

### 2. 部署步骤

1. 将代码上传到服务器或直接在服务器上克隆仓库

2. 运行部署脚本：

```bash
sudo ./deploy_to_tencent.sh
```

该脚本将自动：
- 安装必要的软件（PostgreSQL、Node.js等）
- 配置数据库
- 构建前端
- 设置Nginx
- 配置系统服务
- 初始化数据库

### 3. 部署后检查

部署完成后，您可以通过服务器IP访问网站。

## 常见问题解决

### 数据库连接问题

如果遇到数据库连接问题，请检查：
- PostgreSQL服务是否运行
- 数据库用户权限是否正确
- pg_hba.conf配置是否允许MD5认证

### 会话持久性问题

如果登录后很快被登出，请检查：
- 浏览器Cookie设置
- 后端SESSION_PERMANENT配置
- 确保session.permanent = True在登录时被设置

### 文件权限问题

如果上传文件失败或静态文件无法访问：
- 检查目录权限：`sudo chown -R www-data:www-data /var/www/ai-science-base`
- 检查Nginx配置中的路径是否正确

## 联系方式

如有问题，请联系项目维护者。

