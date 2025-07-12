import os
import sys
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from src.api_server import create_app
    from src.models.database import db, User
except ImportError:
    print("尝试调整导入路径...")
    # 如果直接导入失败，尝试调整路径
    sys.path.insert(0, os.path.dirname(current_dir))
    from src.api_server import create_app
    from src.models.database import db, User

def init_db():
    """初始化数据库"""
    print("开始初始化数据库...")
    app = create_app('production')
    
    with app.app_context():
        # 创建所有表
        db.create_all()
        
        print("已创建数据库表结构")
        
        # 检查是否已存在管理员用户
        if not User.query.filter_by(username='admin').first():
            # 创建管理员用户
            admin = User(
                username='admin',
                email='admin@example.com',
                role='admin'
            )
            admin.password_hash = generate_password_hash('admin123')
            db.session.add(admin)
            
            # 创建测试用户
            test_user = User(
                username='test',
                email='test@example.com',
                role='user'
            )
            test_user.password_hash = generate_password_hash('test123')
            db.session.add(test_user)
            
            # 提交所有更改
            db.session.commit()
            
            print("已创建初始用户")
            print(f"管理员账号: admin / admin123")
            print(f"测试用户: test / test123")
        else:
            print("数据库中已存在用户，跳过初始化")

if __name__ == '__main__':
    try:
        init_db()
        print("数据库初始化完成")
    except Exception as e:
        print(f"初始化数据库时出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 