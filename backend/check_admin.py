#!/usr/bin/env python3
"""
检查管理员账户脚本
"""

import os
import sys
from flask import Flask
from werkzeug.security import check_password_hash

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

def check_admin():
    """检查管理员账户"""
    with app.app_context():
        # 查找管理员账户
        admin = User.query.filter_by(username='admin').first()
        
        if not admin:
            print("找不到管理员账户")
            return
        
        print(f"管理员账户信息:")
        print(f"用户名: {admin.username}")
        print(f"邮箱: {admin.email}")
        print(f"角色: {admin.role}")
        print(f"密码哈希: {admin.password_hash}")
        
        # 测试密码
        test_password = 'admin123'
        is_correct = check_password_hash(admin.password_hash, test_password)
        print(f"密码 '{test_password}' 是否正确: {is_correct}")

if __name__ == '__main__':
    check_admin() 