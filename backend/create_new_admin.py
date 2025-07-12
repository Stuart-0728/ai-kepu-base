#!/usr/bin/env python3
"""
创建新的管理员账户脚本
"""

import os
import sys
from werkzeug.security import generate_password_hash

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入所需模块
from src.api_server import create_app
from src.models.database import db, User

# 创建Flask应用
app = create_app('development')

def create_admin():
    """创建新的管理员账户"""
    with app.app_context():
        # 检查是否已存在admin账户
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print(f"管理员账户已存在: {admin.username}")
            # 更新密码
            admin.password_hash = generate_password_hash('admin123')
            db.session.commit()
            print("已更新管理员密码")
        else:
            # 创建新的管理员账户
            new_admin = User(
                username='admin',
                email='admin@example.com',
                role='admin'
            )
            new_admin.password_hash = generate_password_hash('admin123')
            
            db.session.add(new_admin)
            db.session.commit()
            print("新管理员账户已创建")
        
        # 显示管理员信息
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print(f"管理员信息:")
            print(f"ID: {admin.id}, 用户名: {admin.username}, 角色: {admin.role}")
            print(f"邮箱: {admin.email}")
            print(f"密码: admin123")
        else:
            print("警告：未能查询到刚创建的管理员账户！")

if __name__ == '__main__':
    create_admin() 