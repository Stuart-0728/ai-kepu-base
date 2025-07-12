#!/usr/bin/env python3
"""
检查管理员账户信息脚本
"""

import os
import sys
from werkzeug.security import check_password_hash

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入所需模块
from src.api_server import create_app
from src.models.database import db, User

# 创建Flask应用
app = create_app('development')

def check_admin_info():
    """检查管理员账户信息"""
    with app.app_context():
        # 查询所有用户
        print("所有用户信息:")
        users = User.query.all()
        for user in users:
            print(f"ID: {user.id}, 用户名: {user.username}, 角色: {user.role}")
            print(f"  邮箱: {user.email}")
            print(f"  密码哈希: {user.password_hash}")
            
            # 尝试验证密码
            test_password = "admin123"
            is_valid = check_password_hash(user.password_hash, test_password)
            print(f"  密码 'admin123' 验证结果: {is_valid}")
            
            print("-" * 50)
        
        # 专门查询admin用户
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print("\n管理员账户信息:")
            print(f"ID: {admin.id}, 用户名: {admin.username}, 角色: {admin.role}")
            print(f"邮箱: {admin.email}")
            print(f"密码哈希: {admin.password_hash}")
            
            # 尝试验证密码
            test_password = "admin123"
            is_valid = check_password_hash(admin.password_hash, test_password)
            print(f"密码 'admin123' 验证结果: {is_valid}")
        else:
            print("\n未找到管理员账户!")

if __name__ == '__main__':
    check_admin_info() 