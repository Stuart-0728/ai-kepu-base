from src.models.database import db
from src.main import app
from sqlalchemy import text

with app.app_context():
    try:
        # 添加updated_at字段
        db.session.execute(text('ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
        print("成功添加updated_at字段")
    except Exception as e:
        print(f"添加updated_at字段失败: {e}")
    
    try:
        # 添加admin_notes字段
        db.session.execute(text('ALTER TABLE appointments ADD COLUMN admin_notes TEXT'))
        print("成功添加admin_notes字段")
    except Exception as e:
        print(f"添加admin_notes字段失败: {e}")
    
    # 提交事务
    db.session.commit() 