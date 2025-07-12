from flask import Blueprint, request, jsonify, session
import re
from src.models.database import db
from src.models.user import User
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    pattern = r'^1[3-9]\d{9}$'
    return re.match(pattern, phone) is not None

def require_login():
    """检查用户是否已登录"""
    if 'user_id' not in session:
        return False
    return True

def is_admin():
    """检查当前用户是否为管理员"""
    print(f"检查管理员权限: session={session}")
    if 'user_id' not in session or session.get('user_role') != 'admin':
        return False
    print(f"权限验证通过: user_id={session.get('user_id')}, role={session.get('user_role')}")
    return True

def require_admin():
    """检查是否为管理员，如果不是则返回False"""
    return is_admin()

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['username', 'email', 'password', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}是必填字段'}), 400
        
        # 验证邮箱格式
        if not validate_email(data['email']):
            return jsonify({'error': '邮箱格式不正确'}), 400
        
        # 验证手机号格式
        if data.get('phone') and not validate_phone(data['phone']):
            return jsonify({'error': '手机号格式不正确'}), 400
        
        # 检查用户名是否已存在
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': '用户名已被使用'}), 400
        
        # 检查邮箱是否已存在
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': '邮箱已被注册'}), 400
        
        # 创建新用户 - 直接使用手动SQL方式创建用户，避免ORM模型字段不匹配问题
        try:
            from datetime import datetime
            from werkzeug.security import generate_password_hash
            
            # 使用SQLAlchemy的text函数来构建SQL
            from sqlalchemy import text
            
            sql = text("""
            INSERT INTO users (username, email, phone, password_hash, role, created_at)
            VALUES (:username, :email, :phone, :password_hash, :role, :created_at)
            """)
            
            params = {
                'username': data['username'],
                'email': data['email'],
                'phone': data.get('phone'),
                'password_hash': generate_password_hash(data['password']),
                'role': 'user',
                'created_at': datetime.utcnow()
            }
            
            db.session.execute(sql, params)
            db.session.commit()
            
            # 获取新创建的用户
            user = User.query.filter_by(username=data['username']).first()
            if not user:
                raise Exception("用户创建成功但无法获取用户信息")
                
        except Exception as e:
            db.session.rollback()
            print(f"创建用户失败: {str(e)}")
            raise e
        
        # 返回成功信息
        return jsonify({
            'message': '注册成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"注册失败: {str(e)}")
        return jsonify({'error': '注册失败', 'details': str(e)}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"收到登录请求: {data}")
        
        # 验证必填字段
        if not data.get('username') or not data.get('password'):
            print("用户名或密码为空")
            return jsonify({'error': '用户名和密码是必填字段'}), 400
        
        # 查找用户
        user = User.query.filter_by(username=data['username']).first()
        
        # 验证用户名和密码
        if not user:
            print(f"找不到用户: {data['username']}")
            return jsonify({'error': '用户名或密码错误'}), 401
        
        print(f"找到用户: {user.username}, 密码哈希: {user.password_hash}")
        
        # 直接使用werkzeug.security.check_password_hash
        if not check_password_hash(user.password_hash, data['password']):
            print(f"密码校验失败: 用户={user.username}, 提供的密码={data['password']}")
            return jsonify({'error': '用户名或密码错误'}), 401
        
        print(f"密码校验成功")
        
        # 设置会话
        session['user_id'] = user.id
        session['user_role'] = user.role
        # 确保会话持久性
        session.permanent = True
        
        print(f"会话已设置: user_id={user.id}, role={user.role}, permanent={session.permanent}")
        
        # 返回成功信息
        return jsonify({
            'message': '登录成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        }), 200
        
    except Exception as e:
        print(f"登录失败，发生异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': '登录失败', 'details': str(e)}), 500

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    # 清除会话
    session.pop('user_id', None)
    session.pop('user_role', None)

    return jsonify({'message': '已成功退出登录'}), 200

@auth_bp.route('/auth/check', methods=['GET'])
def check_auth():
    """检查用户是否已登录"""
    if 'user_id' not in session:
        print("会话中没有user_id，未认证")
        return jsonify({'authenticated': False}), 200
    
    try:
        # 处理数据库中的用户
        user = User.query.get(session['user_id'])
        if not user:
            print(f"找不到会话中的用户ID: {session['user_id']}")
            # 清除无效会话
            session.pop('user_id', None)
            session.pop('user_role', None)
            return jsonify({'authenticated': False}), 200
        
        print(f"用户已认证: id={user.id}, username={user.username}, role={user.role}")
        
        return jsonify({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        }), 200
    except Exception as e:
        print(f"验证用户状态失败: {str(e)}")
        return jsonify({'authenticated': False, 'error': str(e)}), 500

