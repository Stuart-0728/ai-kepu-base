#!/usr/bin/env python3
"""
创建管理员账户脚本
"""

import os
import sys
from werkzeug.security import generate_password_hash
from flask import Flask

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# 创建Flask应用
app = Flask(__name__)

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://luoyixin:@localhost/kepu')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 导入数据库模型
from src.models.database import db, User

# 初始化数据库
db.init_app(app)

def create_admin():
    """创建管理员账户"""
    with app.app_context():
        # 检查是否已存在管理员账户
        admin = User.query.filter_by(username='admin').first()
        
        if admin:
            print(f"管理员账户已存在: {admin.username}")
            choice = input("是否重置密码? (y/n): ").lower()
            
            if choice == 'y':
                new_password = input("请输入新密码 (默认为 admin123): ") or "admin123"
                admin.password_hash = generate_password_hash(new_password)
                db.session.commit()
                print(f"管理员密码已重置为: {new_password}")
            return
        
        # 创建新的管理员账户
        username = input("请输入管理员用户名 (默认为 admin): ") or "admin"
        password = input("请输入管理员密码 (默认为 admin123): ") or "admin123"
        email = input("请输入管理员邮箱 (默认为 admin@example.com): ") or "admin@example.com"
        
        try:
            admin = User(
                username=username,
                email=email,
                password=password,
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print(f"管理员账户创建成功!")
            print(f"用户名: {username}")
            print(f"密码: {password}")
            print(f"邮箱: {email}")
        except Exception as e:
            db.session.rollback()
            print(f"创建管理员账户失败: {str(e)}")

def create_admin_noninteractive():
    """非交互式创建管理员账户"""
    with app.app_context():
        # 检查是否已存在管理员账户
        admin = User.query.filter_by(username='admin').first()
        
        if admin:
            print(f"管理员账户已存在: {admin.username}")
            return
        
        # 创建新的管理员账户
        try:
            admin = User(
                username="admin",
                email="admin@example.com",
                password="admin123",
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print(f"管理员账户创建成功!")
            print(f"用户名: admin")
            print(f"密码: admin123")
            print(f"邮箱: admin@example.com")
        except Exception as e:
            db.session.rollback()
            print(f"创建管理员账户失败: {str(e)}")

if __name__ == '__main__':
    # 检查命令行参数
    if len(sys.argv) > 1 and sys.argv[1] == '--noninteractive':
        create_admin_noninteractive()
    else:
        create_admin()

