#!/usr/bin/env python3
"""
简单的数据库初始化脚本
"""
import os
import sys
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from flask import Flask

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_dir = os.path.dirname(backend_dir)
sys.path.insert(0, backend_dir)

app = Flask(__name__)

# 设置数据库路径为当前目录
db_path = os.path.join(backend_dir, 'ai_science_base.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

print(f"数据库路径: {db_path}")

# 导入数据库模型
from src.models.database import db, User, News, Activity, TimeSlotConfig

# 初始化数据库
db.init_app(app)

def init_db():
    """初始化数据库"""
    with app.app_context():
        # 创建所有表
        db.drop_all()  # 警告：这会删除所有现有数据
        db.create_all()
        
        print("已创建数据库表结构")
        
        # 创建管理员用户
        admin = User(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        
        # 创建测试用户
        test_user = User(
            username='test',
            email='test@example.com',
            password='test123',
            role='user'
        )
        
        db.session.add(admin)
        db.session.add(test_user)
        
        # 提交所有更改
        db.session.commit()
        
        print("已创建初始数据")
        print(f"管理员账号: admin / admin123")
        print(f"测试用户: test / test123")

if __name__ == '__main__':
    init_db() 