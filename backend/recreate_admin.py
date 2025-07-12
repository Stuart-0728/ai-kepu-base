#!/usr/bin/env python3
"""
重新创建管理员账户脚本
"""

import os
import sys
from werkzeug.security import generate_password_hash
from flask import Flask

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 创建Flask应用
app = Flask(__name__)

# 配置数据库
db_path = os.path.join(current_dir, 'ai_science_base.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

print(f"使用数据库: {db_path}")

# 导入数据库模型
from src.models.database import db, User

# 初始化数据库
db.init_app(app)

def recreate_admin():
    """重新创建管理员账户"""
    with app.app_context():
        # 删除现有管理员账户
        admin = User.query.filter_by(username='admin').first()
        if admin:
            print(f"删除现有管理员账户: {admin.username}")
            db.session.delete(admin)
            db.session.commit()
        
        # 创建新的管理员账户
        new_password = "admin123"
        new_admin = User(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        
        # 确保密码正确设置
        new_admin.password_hash = generate_password_hash(new_password)
        
        db.session.add(new_admin)
        db.session.commit()
        
        print(f"新管理员账户已创建")
        print(f"用户名: {new_admin.username}")
        print(f"邮箱: {new_admin.email}")
        print(f"密码: {new_password}")
        print(f"密码哈希: {new_admin.password_hash}")
        
        # 验证密码
        from werkzeug.security import check_password_hash
        is_valid = check_password_hash(new_admin.password_hash, new_password)
        print(f"密码验证结果: {is_valid}")

if __name__ == '__main__':
    recreate_admin() 