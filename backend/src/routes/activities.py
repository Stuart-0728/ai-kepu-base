from flask import Blueprint, request, jsonify, session
from src.models.database import db, Activity, Registration, User
from datetime import datetime, date
import math
import pytz

activities_bp = Blueprint('activities', __name__)

# 获取北京时间
def get_beijing_time():
    utc_now = datetime.utcnow()
    beijing_tz = pytz.timezone('Asia/Shanghai')
    return utc_now.replace(tzinfo=pytz.utc).astimezone(beijing_tz)

# 获取北京日期
def get_beijing_date():
    return get_beijing_time().date()

def require_admin():
    return 'user_id' in session and session.get('user_role') == 'admin'

def require_login():
    return 'user_id' in session

@activities_bp.route('/activities', methods=['GET'])
def get_activities_list():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category', '')
        status = request.args.get('status', 'all')
        search = request.args.get('search', '')
        
        # 时间参数
        after_date = request.args.get('after', None)
        before_date = request.args.get('before', None)
        current_date = request.args.get('current', None)
        
        # 转换日期字符串为datetime对象
        if after_date:
            after_date = datetime.fromisoformat(after_date.replace('Z', '+00:00'))
        if before_date:
            before_date = datetime.fromisoformat(before_date.replace('Z', '+00:00'))
        if current_date:
            current_date = datetime.fromisoformat(current_date.replace('Z', '+00:00'))
        
        # 构建查询
        query = Activity.query
        
        # 根据状态筛选
        if status != 'all':
            if status == 'active':
                query = query.filter_by(status='active')
            elif status == 'upcoming' and after_date:
                # 即将开始：开始时间在当前时间之后
                query = query.filter(Activity.start_time > after_date)
            elif status == 'ongoing' and current_date:
                # 进行中：当前时间在开始和结束时间之间
                query = query.filter(Activity.start_time <= current_date, Activity.end_time >= current_date)
            elif status == 'past' and before_date:
                # 已结束：结束时间在当前时间之前
                query = query.filter(Activity.end_time < before_date)
        
        # 类别筛选
        if category:
            query = query.filter_by(category=category)
        
        # 搜索功能
        if search:
            search_term = f"%{search}%"
            query = query.filter((Activity.title.ilike(search_term)) | 
                              (Activity.description.ilike(search_term)))
        
        # 按开始时间排序
        query = query.order_by(Activity.start_time.asc())
        
        # 分页
        total = query.count()
        activities = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # 处理活动列表
        activity_list = []
        now = get_beijing_time()
        beijing_tz = pytz.timezone('Asia/Shanghai')
        
        for activity in activities:
            # 计算活动状态
            activity_status = "upcoming"
            
            # 将数据库中的naive datetime转换为aware datetime以便比较
            # 安全地处理时区转换，确保先移除可能存在的时区信息
            start_time_naive = activity.start_time
            if start_time_naive.tzinfo is not None:
                start_time_naive = start_time_naive.replace(tzinfo=None)
            start_time_aware = beijing_tz.localize(start_time_naive)
            
            end_time_naive = activity.end_time
            if end_time_naive.tzinfo is not None:
                end_time_naive = end_time_naive.replace(tzinfo=None)
            end_time_aware = beijing_tz.localize(end_time_naive)
            
            registration_deadline_naive = activity.registration_deadline
            if registration_deadline_naive.tzinfo is not None:
                registration_deadline_naive = registration_deadline_naive.replace(tzinfo=None)
            registration_deadline_aware = beijing_tz.localize(registration_deadline_naive)
            
            if start_time_aware <= now and end_time_aware >= now:
                activity_status = "ongoing"
            elif end_time_aware < now:
                activity_status = "past"
            
            activity_list.append({
                'id': activity.id,
                'title': activity.title,
                'description': activity.description[:200] + '...' if len(activity.description) > 200 else activity.description,
                'start_time': activity.start_time.isoformat(),
                'end_time': activity.end_time.isoformat(),
                'location': activity.location,
                'speaker': activity.speaker,
                'capacity': activity.capacity,
                'registered_count': activity.registered_count,
                'registration_deadline': activity.registration_deadline.isoformat(),
                'category': activity.category,
                'image_url': activity.image_url,
                'is_registration_open': registration_deadline_aware > now and activity.registered_count < activity.capacity,
                'status': activity_status
            })
        
        return jsonify({
            'activities': activity_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': '获取活动列表失败'}), 500

@activities_bp.route('/activities/<int:activity_id>', methods=['GET'])
def get_activity_detail(activity_id):
    try:
        activity = Activity.query.get(activity_id)
        if not activity:
            return jsonify({'error': '活动不存在'}), 404
        
        # 检查用户是否已报名（如果已登录）
        is_registered = False
        if 'user_id' in session:
            registration = Registration.query.filter_by(
                user_id=session['user_id'],
                activity_id=activity_id,
                status='confirmed'
            ).first()
            is_registered = registration is not None
        
        now = get_beijing_time()
        
        # 将数据库中的naive datetime转换为aware datetime以便比较
        beijing_tz = pytz.timezone('Asia/Shanghai')
        
        # 安全地处理时区转换
        registration_deadline_naive = activity.registration_deadline
        if registration_deadline_naive.tzinfo is not None:
            registration_deadline_naive = registration_deadline_naive.replace(tzinfo=None)
        registration_deadline_aware = beijing_tz.localize(registration_deadline_naive)
        
        return jsonify({
            'activity': {
                'id': activity.id,
                'title': activity.title,
                'description': activity.description,
                'start_time': activity.start_time.isoformat(),
                'end_time': activity.end_time.isoformat(),
                'location': activity.location,
                'speaker': activity.speaker,
                'capacity': activity.capacity,
                'registered_count': activity.registered_count,
                'registration_deadline': activity.registration_deadline.isoformat(),
                'status': activity.status,
                'category': activity.category,
                'image_url': activity.image_url,
                'created_at': activity.created_at.isoformat(),
                'is_registration_open': registration_deadline_aware > now and activity.registered_count < activity.capacity,
                'is_registered': is_registered
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取活动详情失败'}), 500

@activities_bp.route('/activities/<int:activity_id>/register', methods=['POST'])
def register_activity(activity_id):
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        activity = Activity.query.get(activity_id)
        if not activity:
            return jsonify({'error': '活动不存在'}), 404
        
        # 检查活动状态
        if activity.status != 'active':
            return jsonify({'error': '活动已取消或结束'}), 400
        
        # 检查报名截止时间
        now = get_beijing_time()
        
        # 安全地处理时区转换
        beijing_tz = pytz.timezone('Asia/Shanghai')
        registration_deadline_naive = activity.registration_deadline
        if registration_deadline_naive.tzinfo is not None:
            registration_deadline_naive = registration_deadline_naive.replace(tzinfo=None)
        registration_deadline_aware = beijing_tz.localize(registration_deadline_naive)
        
        if registration_deadline_aware <= now:
            print(f"报名已截止: 当前时间={now}, 截止时间={registration_deadline_aware}")
            return jsonify({'error': '报名已截止'}), 400
        
        # 检查名额
        if activity.registered_count >= activity.capacity:
            print(f"活动名额已满: 已报名={activity.registered_count}, 容量={activity.capacity}")
            return jsonify({'error': '活动名额已满'}), 400
        
        # 检查是否已报名
        existing_registration = Registration.query.filter_by(
            user_id=session['user_id'],
            activity_id=activity_id,
            status='confirmed'
        ).first()
        
        if existing_registration:
            print(f"用户已报名此活动: user_id={session['user_id']}, activity_id={activity_id}")
            return jsonify({'error': '您已报名此活动'}), 400
        
        # 创建报名记录
        registration = Registration(
            user_id=session['user_id'],
            activity_id=activity_id,
            status='confirmed',
            notes=None
        )
        
        # 更新活动报名人数
        activity.registered_count += 1
        
        db.session.add(registration)
        db.session.commit()
        
        print(f"报名成功: user_id={session['user_id']}, activity_id={activity_id}")
        return jsonify({'message': '报名成功'}), 201
        
    except Exception as e:
        print(f"活动报名失败: {str(e)}")
        db.session.rollback()
        return jsonify({'error': '报名失败，请稍后重试'}), 500

@activities_bp.route('/activities/<int:activity_id>/cancel-registration', methods=['POST'])
def cancel_registration(activity_id):
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        registration = Registration.query.filter_by(
            user_id=session['user_id'],
            activity_id=activity_id,
            status='confirmed'
        ).first()
        
        if not registration:
            print(f"取消报名失败，未找到报名记录: user_id={session['user_id']}, activity_id={activity_id}")
            return jsonify({'error': '您未报名此活动'}), 400
        
        activity = Activity.query.get(activity_id)
        
        # 取消报名
        registration.status = 'cancelled'
        activity.registered_count -= 1
        
        db.session.commit()
        
        print(f"取消报名成功: user_id={session['user_id']}, activity_id={activity_id}")
        return jsonify({'message': '取消报名成功'}), 200
        
    except Exception as e:
        print(f"取消报名失败: {str(e)}")
        db.session.rollback()
        return jsonify({'error': '取消报名失败'}), 500

@activities_bp.route('/user/registrations', methods=['GET'])
def get_user_registrations():
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        registrations = db.session.query(Registration, Activity).join(
            Activity, Registration.activity_id == Activity.id
        ).filter(
            Registration.user_id == session['user_id'],
            Registration.status == 'confirmed'
        ).order_by(Activity.start_time.desc()).all()
        
        return jsonify({
            'registrations': [{
                'registration_id': reg.id,
                'registered_at': reg.registered_at.isoformat(),
                'activity': {
                    'id': activity.id,
                    'title': activity.title,
                    'start_time': activity.start_time.isoformat(),
                    'end_time': activity.end_time.isoformat(),
                    'location': activity.location,
                    'status': activity.status
                }
            } for reg, activity in registrations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取报名记录失败'}), 500

# 管理员接口
@activities_bp.route('/admin/activities', methods=['GET'])
def admin_get_activities():
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Activity.query.order_by(Activity.created_at.desc())
        total = query.count()
        activities = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'activities': [{
                'id': activity.id,
                'title': activity.title,
                'start_time': activity.start_time.isoformat(),
                'end_time': activity.end_time.isoformat(),
                'location': activity.location,
                'capacity': activity.capacity,
                'registered_count': activity.registered_count,
                'status': activity.status,
                'category': activity.category
            } for activity in activities],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取活动列表失败'}), 500

@activities_bp.route('/admin/activities', methods=['POST'])
def admin_create_activity():
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['title', 'description', 'start_time', 'end_time', 'location', 'capacity', 'registration_deadline']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}是必填字段'}), 400
        
        # 解析时间
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        registration_deadline = datetime.fromisoformat(data['registration_deadline'].replace('Z', '+00:00'))
        
        activity = Activity(
            title=data['title'].strip(),
            description=data['description'],
            start_time=start_time,
            end_time=end_time,
            location=data['location'].strip(),
            speaker=data.get('speaker', '').strip(),
            capacity=int(data['capacity']),
            registration_deadline=registration_deadline,
            category=data.get('category', 'general'),
            image_url=data.get('image_url', ''),
            status='active'
        )
        
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': '活动创建成功',
            'activity': {
                'id': activity.id,
                'title': activity.title
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '创建活动失败'}), 500

@activities_bp.route('/admin/activities/<int:activity_id>', methods=['PUT'])
def admin_update_activity(activity_id):
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        activity = Activity.query.get(activity_id)
        if not activity:
            return jsonify({'error': '活动不存在'}), 404
        
        data = request.get_json()
        
        # 更新字段
        if 'title' in data:
            activity.title = data['title'].strip()
        if 'description' in data:
            activity.description = data['description']
        if 'start_time' in data:
            activity.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        if 'end_time' in data:
            activity.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        if 'location' in data:
            activity.location = data['location'].strip()
        if 'speaker' in data:
            activity.speaker = data['speaker'].strip()
        if 'capacity' in data:
            activity.capacity = int(data['capacity'])
        if 'registration_deadline' in data:
            activity.registration_deadline = datetime.fromisoformat(data['registration_deadline'].replace('Z', '+00:00'))
        if 'category' in data:
            activity.category = data['category']
        if 'image_url' in data:
            activity.image_url = data['image_url']
        if 'status' in data:
            activity.status = data['status']
        
        activity.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': '活动更新成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '更新活动失败'}), 500

@activities_bp.route('/admin/activities/<int:activity_id>/registrations', methods=['GET'])
def admin_get_activity_registrations(activity_id):
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        registrations = db.session.query(Registration, User).join(
            User, Registration.user_id == User.id
        ).filter(
            Registration.activity_id == activity_id,
            Registration.status == 'confirmed'
        ).order_by(Registration.registered_at.asc()).all()
        
        return jsonify({
            'registrations': [{
                'id': reg.id,
                'registered_at': reg.registered_at.isoformat(),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'phone': user.phone
                }
            } for reg, user in registrations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取报名列表失败'}), 500

@activities_bp.route('/activities/categories', methods=['GET'])
def get_activity_categories():
    """获取活动分类列表"""
    categories = [
        {'value': 'general', 'label': '综合活动'},
        {'value': 'ai', 'label': '人工智能'},
        {'value': 'physics', 'label': '物理科普'},
        {'value': 'workshop', 'label': '实践工坊'},
        {'value': 'lecture', 'label': '专题讲座'}
    ]
    return jsonify({'categories': categories}), 200

