from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from src.models.database import db, User

# 为User类添加方法
def add_user_methods():
    # 设置密码
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    # 检查密码
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    # 转换为字典
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    # 检查是否为管理员
    def is_admin(self):
        return self.role == 'admin'
    
    # 添加方法到User类
    User.set_password = set_password
    User.check_password = check_password
    User.to_dict = to_dict
    User.is_admin = is_admin

# 调用函数添加方法
add_user_methods()
