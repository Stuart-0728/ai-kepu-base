import os
import sys
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.api_server import create_app
from src.models.database import db, User, News, Activity, TimeSlotConfig

def init_db():
    """初始化数据库"""
    app = create_app('development')
    
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
        
        # 创建示例新闻
        news1 = News(
            title='AI科普基地正式启用',
            content='我们很高兴地宣布，AI科普基地已正式启用，欢迎大家参观学习。',
            author='管理员',
            category='general'
        )
        
        news2 = News(
            title='人工智能发展最新动态',
            content='近期人工智能领域有许多突破性进展，包括...',
            author='AI研究员',
            category='ai'
        )
        
        db.session.add(news1)
        db.session.add(news2)
        
        # 创建示例活动
        now = datetime.now()
        
        activity1 = Activity(
            title='AI入门讲座',
            description='面向初学者的人工智能基础知识讲座',
            start_time=now + timedelta(days=7),
            end_time=now + timedelta(days=7, hours=2),
            location='科普基地多功能厅',
            speaker='张教授',
            capacity=50,
            registration_deadline=now + timedelta(days=6),
            category='ai'
        )
        
        activity2 = Activity(
            title='人工智能与未来发展论坛',
            description='探讨AI技术的未来发展趋势和社会影响',
            start_time=now + timedelta(days=14),
            end_time=now + timedelta(days=14, hours=3),
            location='科普基地报告厅',
            speaker='李博士',
            capacity=100,
            registration_deadline=now + timedelta(days=13),
            category='ai'
        )
        
        db.session.add(activity1)
        db.session.add(activity2)
        
        # 创建预约时间段
        time_slots = [
            ('09:00-10:00', 30),
            ('10:00-11:00', 30),
            ('11:00-12:00', 30),
            ('14:00-15:00', 30),
            ('15:00-16:00', 30),
            ('16:00-17:00', 30)
        ]
        
        for slot, max_visitors in time_slots:
            time_slot = TimeSlotConfig(
                time_slot=slot,
                max_visitors=max_visitors,
                is_active=True,
                weekday_only=True
            )
            db.session.add(time_slot)
        
        # 提交所有更改
        db.session.commit()
        
        print("已创建初始数据")
        print(f"管理员账号: admin / admin123")
        print(f"测试用户: test / test123")

if __name__ == '__main__':
    init_db() 