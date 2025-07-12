import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from src.models.database import db
from sqlalchemy import inspect

# 创建Flask应用
app = Flask(__name__)

# 配置数据库连接
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://luoyixin:@localhost/kepu'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

# 检查表结构
with app.app_context():
    try:
        inspector = inspect(db.engine)
        
        # 列出所有表
        tables = inspector.get_table_names()
        print(f"数据库中的表: {tables}")
        
        # 检查activities表
        if 'activities' in tables:
            print("\n活动表结构:")
            for column in inspector.get_columns('activities'):
                print(f"- {column['name']}: {column['type']}")
        else:
            print("\n活动表不存在!")
            
        # 检查users表
        if 'users' in tables:
            print("\n用户表结构:")
            for column in inspector.get_columns('users'):
                print(f"- {column['name']}: {column['type']}")
        else:
            print("\n用户表不存在!")
            
        # 检查appointments表
        if 'appointments' in tables:
            print("\n预约表结构:")
            for column in inspector.get_columns('appointments'):
                print(f"- {column['name']}: {column['type']}")
        else:
            print("\n预约表不存在!")
            
    except Exception as e:
        print(f"检查表结构失败: {str(e)}") 