#!/bin/bash

# 检查git是否已安装
if ! command -v git &> /dev/null; then
    echo "错误: 未安装Git。请先安装Git。"
    exit 1
fi

echo "=== AI科普基地网站 - GitHub设置脚本 ==="
echo "此脚本将帮助您将项目上传到GitHub。"
echo ""

# 检查是否已初始化git仓库
if [ ! -d ".git" ]; then
    echo "初始化Git仓库..."
    git init
    echo "已初始化Git仓库。"
else
    echo "Git仓库已存在。"
fi

# 创建.gitignore文件
echo "创建.gitignore文件..."
cat > .gitignore << EOL
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
venv/
.env
.env.*
!.env.example

# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
.pnpm-debug.log
.pnpm-store/
.npm
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store
EOL
echo "已创建.gitignore文件。"

# 添加所有文件到暂存区
echo "添加文件到Git..."
git add .
echo "已添加文件。"

# 提交更改
echo "提交更改..."
git commit -m "初始提交 - AI科普基地网站"
echo "已提交更改。"

# 询问GitHub仓库URL
echo ""
echo "请在GitHub上创建一个新的仓库，然后输入仓库URL："
read -p "GitHub仓库URL: " repo_url

# 添加远程仓库
echo "添加远程仓库..."
git remote add origin $repo_url
echo "已添加远程仓库。"

# 推送到GitHub
echo "推送到GitHub..."
git push -u origin master || git push -u origin main
echo "已推送到GitHub。"

echo ""
echo "=== 设置完成 ==="
echo "您的项目已上传到GitHub。"
echo "现在您可以按照RENDER_DEPLOY_GUIDE.md中的说明部署到Render。" 