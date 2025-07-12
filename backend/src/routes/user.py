from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash
from src.models.database import db, User

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    
    data = request.json
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/user/profile', methods=['GET'])
def get_profile():
    # 检查用户是否已登录
    if 'user_id' not in session:
        return jsonify({'error': '未登录'}), 401
    
    try:
        # 获取用户信息
        user = User.query.get(session['user_id'])
            
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        # 返回用户信息
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone if hasattr(user, 'phone') else None,
                'role': user.role,
                'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else None
            }
        }), 200

    except Exception as e:
        print(f"获取用户信息失败: {str(e)}")
        return jsonify({'error': '获取用户信息失败'}), 500

@user_bp.route('/user/profile', methods=['PUT'])
def update_profile():
    # 检查用户是否已登录
    if 'user_id' not in session:
        return jsonify({'error': '未登录'}), 401
    
    try:
        data = request.json
        user = User.query.get(session['user_id'])
        
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        # 更新用户信息
        if data and 'email' in data:
            # 检查邮箱是否已被其他用户使用
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': '邮箱已被其他用户使用'}), 400
            user.email = data['email']
        
        if data and 'phone' in data and hasattr(user, 'phone'):
            user.phone = data['phone']
        
        if data and 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': '用户信息更新成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone if hasattr(user, 'phone') else None,
                'role': user.role
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"更新用户信息失败: {str(e)}")
        return jsonify({'error': '更新用户信息失败'}), 500

# 测试API接口
@user_bp.route('/user/test', methods=['GET'])
def test_user_api():
    return jsonify({
        'status': 'ok',
        'message': '用户API正常工作'
    })
