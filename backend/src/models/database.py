from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
from werkzeug.security import generate_password_hash

db = SQLAlchemy()
migrate = Migrate()

# 用户表
class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, username, email, password=None, phone=None, role='user'):
        self.username = username
        self.email = email
        if password:
            self.password_hash = generate_password_hash(password)
        else:
            self.password_hash = ''
        self.phone = phone
        self.role = role
        
    def __repr__(self):
        return f'<User {self.username}>'
    
    # 关系
    registrations = db.relationship('Registration', backref='user', lazy=True)
    appointments = db.relationship('Appointment', backref='user', lazy=True)

# 新闻动态表 - 适应PostgreSQL数据库结构
class News(db.Model):
    __tablename__ = 'News'  # PostgreSQL中使用大写表名
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.String(36), primary_key=True)  # PostgreSQL中使用UUID作为ID
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100), nullable=False, default="管理员")
    category = db.Column(db.String(50), default='general')  # 'general', 'physics', 'ai', 'activity'
    imageUrl = db.Column(db.String(255), nullable=True)
    published = db.Column(db.Boolean, default=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    imageId = db.Column(db.String(36), nullable=True)
    video_url = db.Column(db.String(255), nullable=True)  # 存储视频URL或文件路径
    video_source = db.Column(db.String(50), nullable=True)  # 'local'表示本地上传, 'embed'表示嵌入外部链接
    
    # 兼容SQLite模型的属性
    @property
    def image_url(self):
        return self.imageUrl
    
    @property
    def is_published(self):
        return self.published
    
    @property
    def published_at(self):
        return self.createdAt

# 活动表
class Activity(db.Model):
    __tablename__ = 'activities'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    speaker = db.Column(db.String(100), nullable=True)
    capacity = db.Column(db.Integer, nullable=False, default=50)
    registered_count = db.Column(db.Integer, default=0)
    registration_deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active')  # 'active', 'cancelled', 'completed'
    category = db.Column(db.String(50), default='general')  # 'ai', 'physics', 'general'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    image_url = db.Column(db.String(255), nullable=True)
    
    # 关系
    registrations = db.relationship('Registration', backref='activity', lazy=True)

# 活动报名表
class Registration(db.Model):
    __tablename__ = 'registrations'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activities.id'), nullable=False)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='confirmed')  # 'confirmed', 'cancelled', 'attended'
    notes = db.Column(db.Text, nullable=True)

# 参观预约表
class Appointment(db.Model):
    __tablename__ = 'appointments'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time_slot = db.Column(db.String(20), nullable=False)  # '09:00-10:00', '10:00-11:00', etc.
    visitor_count = db.Column(db.Integer, nullable=False, default=1)
    contact_name = db.Column(db.String(100), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'cancelled', 'completed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    admin_notes = db.Column(db.Text, nullable=True)
    
    # 兼容性属性
    @property
    def appointment_date(self):
        return self.date
        
    @property
    def appointment_time_slot(self):
        return self.time_slot
        
    @property
    def visitors_count(self):
        return self.visitor_count
        
    @property
    def organization(self):
        return None
        
    @property
    def purpose(self):
        return None

# 基地介绍表
class BaseInfo(db.Model):
    __tablename__ = 'base_info'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    section = db.Column(db.String(50), nullable=False)  # 'introduction', 'mission', 'achievements', etc.
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    order_index = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 宣传页面表
class PromotionalPage(db.Model):
    __tablename__ = 'promotional_pages'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)  # URL友好的标识符
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 预约时间段配置表
class TimeSlotConfig(db.Model):
    __tablename__ = 'time_slot_configs'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    time_slot = db.Column(db.String(20), nullable=False)  # '09:00-10:00'
    max_visitors = db.Column(db.Integer, nullable=False, default=30)
    is_active = db.Column(db.Boolean, default=True)
    weekday_only = db.Column(db.Boolean, default=True)  # 是否仅工作日开放

