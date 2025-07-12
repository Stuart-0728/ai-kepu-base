#!/usr/bin/env python3
"""
示例数据生成脚本
"""

import os
import sys
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from flask import Flask
from models.database import db, User, News, Activity, Appointment, TimeSlotConfig

# 创建Flask应用
app = Flask(__name__)

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(os.path.dirname(__file__), "ai_science_base.db")}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
db.init_app(app)

def create_sample_data():
    """创建示例数据"""
    with app.app_context():
        # 清空现有数据
        db.drop_all()
        db.create_all()
        
        # 创建管理员用户
        admin_user = User(
            username='admin',
            email='admin@cqnu.edu.cn',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin_user)
        db.session.commit()  # 先提交以获取ID
        
        # 创建普通用户
        normal_user = User(
            username='user1',
            email='user1@example.com',
            password_hash=generate_password_hash('user123'),
            role='user'
        )
        db.session.add(normal_user)
        db.session.commit()  # 先提交以获取ID
        
        # 创建示例新闻
        news_data = [
            {
                'title': '重庆市人工智能科普基地正式启动',
                'content': '经过精心筹备，重庆市人工智能科普基地在重庆师范大学正式启动。基地将致力于推广人工智能和物理科学知识，为公众提供优质科普教育服务。',
                'category': 'general',
                'author': 'admin',
                'published_at': datetime.now() - timedelta(days=7),
                'image_url': '/assets/news1.jpg'
            },
            {
                'title': 'AI技术在教育领域的应用前景',
                'content': '人工智能技术正在深刻改变教育行业，从个性化学习到智能评估，AI为教育带来了前所未有的机遇。本文将探讨AI在教育领域的最新应用和发展趋势。',
                'category': 'ai',
                'author': 'admin',
                'published_at': datetime.now() - timedelta(days=5),
                'image_url': '/assets/news2.jpg'
            },
            {
                'title': '物理实验室开放日活动圆满结束',
                'content': '上周末举办的物理实验室开放日活动吸引了众多市民参与。参观者通过亲身体验各种物理实验，深入了解了物理学的奥秘。',
                'category': 'physics',
                'author': 'admin',
                'published_at': datetime.now() - timedelta(days=3),
                'image_url': '/assets/news3.jpg'
            },
            {
                'title': '机器学习基础知识科普讲座预告',
                'content': '本月底将举办机器学习基础知识科普讲座，邀请知名专家为大家讲解机器学习的基本概念、算法原理和实际应用。欢迎广大市民报名参加。',
                'category': 'activity',
                'author': 'admin',
                'published_at': datetime.now() - timedelta(days=1),
                'image_url': '/assets/news4.jpg'
            }
        ]
        
        for news_item in news_data:
            news = News(**news_item)
            db.session.add(news)
        db.session.commit()
        
        # 创建示例活动
        activities_data = [
            {
                'title': 'AI编程体验营',
                'description': '面向青少年的AI编程体验活动，通过简单易懂的编程练习，让孩子们了解人工智能的基本原理。',
                'category': 'ai',
                'start_time': datetime.now() + timedelta(days=10),
                'end_time': datetime.now() + timedelta(days=10, hours=3),
                'location': '重庆师范大学AI实验室',
                'capacity': 30,
                'registration_deadline': datetime.now() + timedelta(days=8),
                'speaker': 'admin',
                'status': 'active',
                'image_url': '/assets/activity1.jpg'
            },
            {
                'title': '物理实验探索之旅',
                'description': '通过有趣的物理实验，让参与者亲身体验物理学的魅力，了解日常生活中的物理现象。',
                'category': 'physics',
                'start_time': datetime.now() + timedelta(days=15),
                'end_time': datetime.now() + timedelta(days=15, hours=2),
                'location': '重庆师范大学物理实验室',
                'capacity': 25,
                'registration_deadline': datetime.now() + timedelta(days=13),
                'speaker': 'admin',
                'status': 'active',
                'image_url': '/assets/activity2.jpg'
            },
            {
                'title': '机器人制作工坊',
                'description': '动手制作简单的机器人，学习机器人的基本构造和编程控制，培养创新思维和动手能力。',
                'category': 'general',
                'start_time': datetime.now() + timedelta(days=20),
                'end_time': datetime.now() + timedelta(days=20, hours=4),
                'location': '重庆师范大学创客空间',
                'capacity': 20,
                'registration_deadline': datetime.now() + timedelta(days=18),
                'speaker': 'admin',
                'status': 'active',
                'image_url': '/assets/activity3.jpg'
            }
        ]
        
        for activity_item in activities_data:
            activity = Activity(**activity_item)
            db.session.add(activity)
        db.session.commit()
        
        # 创建示例预约
        appointments_data = [
            {
                'user_id': normal_user.id,  # 确保使用已提交的用户ID
                'appointment_date': (datetime.now() + timedelta(days=5)).date(),
                'appointment_time_slot': '上午 9:00-11:00',
                'visitors_count': 15,
                'contact_name': '张老师',
                'contact_phone': '13812345678',
                'organization': '重庆市第一中学',
                'purpose': '组织学生参观学习人工智能知识',
                'status': 'pending'
            },
            {
                'user_id': normal_user.id,  # 确保使用已提交的用户ID
                'appointment_date': (datetime.now() + timedelta(days=12)).date(),
                'appointment_time_slot': '下午 2:00-4:00',
                'visitors_count': 8,
                'contact_name': '李女士',
                'contact_phone': '13987654321',
                'organization': '重庆科技爱好者协会',
                'purpose': '了解最新的AI技术发展趋势',
                'status': 'confirmed'
            }
        ]
        
        for appointment_item in appointments_data:
            appointment = Appointment(**appointment_item)
            db.session.add(appointment)
        db.session.commit()
            
        # 创建预约时间段配置
        time_slots = [
            {'time_slot': '上午 9:00-11:00', 'max_visitors': 30, 'is_active': True, 'weekday_only': True},
            {'time_slot': '下午 2:00-4:00', 'max_visitors': 30, 'is_active': True, 'weekday_only': True},
            {'time_slot': '上午 10:00-12:00', 'max_visitors': 20, 'is_active': True, 'weekday_only': False},
            {'time_slot': '下午 3:00-5:00', 'max_visitors': 20, 'is_active': True, 'weekday_only': False}
        ]
        
        for slot in time_slots:
            time_slot = TimeSlotConfig(**slot)
            db.session.add(time_slot)
        
        # 提交所有更改
        db.session.commit()
        print("示例数据创建成功！")
        print(f"管理员账号: admin / admin123")
        print(f"普通用户账号: user1 / user123")

if __name__ == '__main__':
    create_sample_data()

