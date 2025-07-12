import os
from urllib.parse import urlparse

class Config:

    # 设置PostgreSQL时区为Asia/Shanghai
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'options': '-c timezone=Asia/Shanghai'
        }
    }
    
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_key_please_change_in_production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # 添加会话持久性配置
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = 86400  # 24小时
    # 会话Cookie配置
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # 在HTTP环境下使用Cookie
    SESSION_COOKIE_SAMESITE = None  # 允许跨站请求发送Cookie
    SESSION_COOKIE_DOMAIN = None  # 不限制域名
    SESSION_COOKIE_PATH = "/"

    @staticmethod
    def get_database_url(url):
        """处理可能的Heroku风格数据库URL"""
        if url and url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql://', 1)
        return url

class DevelopmentConfig(Config):
    DEBUG = True
    # 使用PostgreSQL数据库
    SQLALCHEMY_DATABASE_URI = Config.get_database_url(
        os.environ.get('DATABASE_URL', 'postgresql://luoyixin:@localhost/kepu')
    )
    
class ProductionConfig(Config):
    DEBUG = False
    # 处理生产环境数据库URL
    SQLALCHEMY_DATABASE_URI = Config.get_database_url(
        os.environ.get('DATABASE_URL', 'postgresql://aikepu:aikepu123@localhost/aikepu')
    )
    
class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///instance/test.db'

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 