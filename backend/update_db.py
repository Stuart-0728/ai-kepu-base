import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from src.models.database import db
from sqlalchemy import text

# 创建Flask应用
app = Flask(__name__)

# 配置数据库连接
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://luoyixin:@localhost/kepu'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

# 添加字段
with app.app_context():
    try:
        # 添加users表的updated_at字段
        db.session.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        print('添加users.updated_at字段成功')
        
        # 添加activities表的created_at字段
        db.session.execute(text('ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        print('添加activities.created_at字段成功')
        
        # 添加activities表的updated_at字段
        db.session.execute(text('ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        print('添加activities.updated_at字段成功')
        
        db.session.commit()
    except Exception as e:
        print(f'添加字段失败: {str(e)}')
        db.session.rollback() 