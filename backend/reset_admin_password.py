#!/usr/bin/env python3
"""
重置管理员密码脚本
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

# 配置PostgreSQL数据库
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://luoyixin:@localhost/kepu')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

print(f"使用数据库: {app.config['SQLALCHEMY_DATABASE_URI']}")

# 导入数据库模型
from src.models.database import db, User

# 初始化数据库
db.init_app(app)

def reset_admin_password():
    """重置管理员密码"""
    with app.app_context():
        # 查找管理员账户
        admin = User.query.filter_by(username='admin').first()
        
        if not admin:
            print("找不到管理员账户，请先创建管理员账户")
            return
        
        # 设置新密码
        new_password = "admin123"
        admin.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        print(f"管理员密码已重置为: {new_password}")
        print(f"用户名: {admin.username}")
        print(f"邮箱: {admin.email}")
        print(f"新密码哈希: {admin.password_hash}")
        
        # 验证密码
        from werkzeug.security import check_password_hash
        is_valid = check_password_hash(admin.password_hash, new_password)
        print(f"密码验证结果: {is_valid}")

if __name__ == '__main__':
    reset_admin_password() 