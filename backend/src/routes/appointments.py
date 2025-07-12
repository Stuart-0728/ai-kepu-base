from flask import Blueprint, jsonify, request, session
from src.models.database import db, Appointment, TimeSlotConfig, User
from src.routes.auth import require_login, require_admin, is_admin
from datetime import datetime, timedelta, time, date
import math
import pytz
from sqlalchemy import text

appointments_bp = Blueprint('appointments', __name__)

# 初始化时间段配置
def init_time_slots():
    try:
        # 检查是否已有时间段配置
        existing_slots = TimeSlotConfig.query.count()
        if existing_slots == 0:
            print("初始化预约时间段配置...")
            # 创建默认的时间段配置
            default_slots = [
                {'time_slot': '09:00-10:00', 'max_visitors': 30, 'is_active': True},
                {'time_slot': '10:00-11:00', 'max_visitors': 30, 'is_active': True},
                {'time_slot': '11:00-12:00', 'max_visitors': 30, 'is_active': True},
                {'time_slot': '13:00-14:00', 'max_visitors': 30, 'is_active': True},
                {'time_slot': '14:00-15:00', 'max_visitors': 30, 'is_active': True},
                {'time_slot': '15:00-16:00', 'max_visitors': 30, 'is_active': True},
                {'time_slot': '16:00-17:00', 'max_visitors': 30, 'is_active': True}
            ]
            
            for slot_data in default_slots:
                slot = TimeSlotConfig(
                    time_slot=slot_data['time_slot'],
                    max_visitors=slot_data['max_visitors'],
                    is_active=slot_data['is_active'],
                    weekday_only=False  # 允许周末预约
                )
                db.session.add(slot)
            
            db.session.commit()
            print(f"成功创建{len(default_slots)}个默认时间段")
        else:
            # 更新现有时间段配置，允许周末预约
            time_slots = TimeSlotConfig.query.all()
            for slot in time_slots:
                slot.weekday_only = False
            db.session.commit()
            print(f"已更新{len(time_slots)}个时间段配置，允许周末预约")
    except Exception as e:
        db.session.rollback()
        print(f"初始化时间段配置失败: {str(e)}")

# 获取北京时间
def get_beijing_time():
    utc_now = datetime.utcnow()
    beijing_tz = pytz.timezone('Asia/Shanghai')
    return utc_now.replace(tzinfo=pytz.utc).astimezone(beijing_tz)

# 获取北京时间的当前日期
def get_beijing_date():
    return get_beijing_time().date()

def require_admin():
    """检查是否为管理员"""
    if 'user_id' not in session or session.get('user_role') != 'admin':
        return False
    return True

def require_login():
    """检查是否已登录"""
    return 'user_id' in session

@appointments_bp.route('/appointments/available-slots', methods=['GET'])
def get_available_slots():
    try:
        date_str = request.args.get('date')
        if not date_str:
            return jsonify({'error': '请提供日期参数'}), 400
        
        try:
            appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': '日期格式错误，请使用YYYY-MM-DD格式'}), 400
        
        # 检查日期是否为过去
        if appointment_date < get_beijing_date():
            return jsonify({'error': '不能预约过去的日期'}), 400
        
        # 检查是否为工作日（周一到周五）
        if appointment_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
            return jsonify({'available_slots': []}), 200
        
        # 获取时间段配置
        time_slots = TimeSlotConfig.query.filter_by(is_active=True).all()
        
        available_slots = []
        for slot_config in time_slots:
            # 计算该时间段已预约人数
            booked_count = db.session.query(db.func.sum(Appointment.visitor_count)).filter(
                Appointment.date == appointment_date,
                Appointment.time_slot == slot_config.time_slot,
                Appointment.status.in_(['pending', 'confirmed'])
            ).scalar() or 0
            
            available_count = slot_config.max_visitors - booked_count
            
            if available_count > 0:
                available_slots.append({
                    'time_slot': slot_config.time_slot,
                    'max_visitors': slot_config.max_visitors,
                    'booked_count': booked_count,
                    'available_count': available_count
                })
        
        return jsonify({'available_slots': available_slots}), 200
        
    except Exception as e:
        return jsonify({'error': '获取可用时间段失败'}), 500

@appointments_bp.route('/appointments', methods=['POST'])
def create_appointment():
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['appointment_date', 'appointment_time_slot', 'visitors_count', 'contact_name', 'contact_phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}是必填字段'}), 400
        
        # 解析日期
        try:
            appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': '日期格式错误'}), 400
        
        # 检查日期是否为过去
        if appointment_date < get_beijing_date():
            return jsonify({'error': '不能预约过去的日期'}), 400
        
        # 移除工作日限制，允许预约周末和节假日
        
        # 检查时间段是否有效
        time_slot_config = TimeSlotConfig.query.filter_by(
            time_slot=data['appointment_time_slot'],
            is_active=True
        ).first()
        
        if not time_slot_config:
            return jsonify({'error': '无效的时间段'}), 400
        
        visitors_count = int(data['visitors_count'])
        if visitors_count <= 0:
            return jsonify({'error': '参观人数必须大于0'}), 400
        
        # 检查该时间段是否还有足够名额
        booked_count = db.session.query(db.func.sum(Appointment.visitor_count)).filter(
            Appointment.date == appointment_date,
            Appointment.time_slot == data['appointment_time_slot'],
            Appointment.status.in_(['pending', 'confirmed'])
        ).scalar() or 0
        
        if booked_count + visitors_count > time_slot_config.max_visitors:
            return jsonify({'error': '该时间段名额不足'}), 400
        
        # 检查用户是否已有同日期的预约
        existing_appointment = Appointment.query.filter(
            Appointment.user_id == session['user_id'],
            Appointment.date == appointment_date,
            Appointment.status.in_(['pending', 'confirmed'])
        ).first()
        
        if existing_appointment:
            return jsonify({'error': '您在该日期已有预约'}), 400
        
        # 创建预约
        appointment = Appointment(
            user_id=session['user_id'],
            date=appointment_date,
            time_slot=data['appointment_time_slot'],
            visitor_count=visitors_count,
            contact_name=data['contact_name'].strip(),
            contact_phone=data['contact_phone'].strip(),
            status='pending'
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': '预约提交成功，请等待审核',
            'appointment': {
                'id': appointment.id,
                'appointment_date': appointment.date.isoformat(),
                'appointment_time_slot': appointment.time_slot,
                'status': appointment.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"预约失败: {str(e)}")
        return jsonify({'error': '预约失败，请稍后重试'}), 500

@appointments_bp.route('/user/appointments', methods=['GET'])
def get_user_appointments():
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        appointments = Appointment.query.filter_by(
            user_id=session['user_id']
        ).order_by(Appointment.date.desc()).all()
        
        return jsonify({
            'appointments': [{
                'id': appointment.id,
                'appointment_date': appointment.date.isoformat(),
                'appointment_time_slot': appointment.time_slot,
                'visitors_count': appointment.visitor_count,
                'contact_name': appointment.contact_name,
                'contact_phone': appointment.contact_phone,
                'organization': appointment.organization,
                'purpose': appointment.purpose,
                'status': appointment.status,
                'created_at': appointment.created_at.isoformat(),
                'admin_notes': appointment.admin_notes
            } for appointment in appointments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取预约记录失败'}), 500

@appointments_bp.route('/appointments/<int:appointment_id>/cancel', methods=['POST'])
def cancel_appointment(appointment_id):
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        print(f"尝试取消预约 ID: {appointment_id}, 用户 ID: {session['user_id']}")
        appointment = Appointment.query.filter_by(
            id=appointment_id,
            user_id=session['user_id']
        ).first()
        
        if not appointment:
            print(f"预约不存在或不属于当前用户: ID {appointment_id}")
            return jsonify({'error': '预约不存在'}), 404
        
        if appointment.status == 'cancelled':
            print(f"预约已经是取消状态: ID {appointment_id}")
            return jsonify({'error': '预约已取消'}), 400
        
        if appointment.status == 'completed':
            print(f"已完成的预约不能取消: ID {appointment_id}")
            return jsonify({'error': '已完成的预约不能取消'}), 400
        
        # 直接更新数据库字段
        appointment.status = 'cancelled'
        # 使用SQL更新updated_at字段
        db.session.execute(
            text("UPDATE appointments SET updated_at = :now WHERE id = :id"),
            {"now": datetime.utcnow(), "id": appointment_id}
        )
        db.session.commit()
        
        print(f"预约取消成功: ID {appointment_id}")
        return jsonify({'message': '预约已取消'}), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"取消预约失败: {str(e)}")
        return jsonify({'error': '取消预约失败，请稍后重试'}), 500

# 管理员接口
@appointments_bp.route('/admin/appointments', methods=['GET'])
def admin_get_appointments():
    if not require_admin():
        print("检查管理员权限: session={}".format(session))
        print("未登录，拒绝访问")
        return jsonify({'error': '权限不足'}), 403
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        query = db.session.query(Appointment, User).join(
            User, Appointment.user_id == User.id
        )
        
        if status:
            query = query.filter(Appointment.status == status)
        
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                query = query.filter(Appointment.date >= from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                query = query.filter(Appointment.date <= to_date)
            except ValueError:
                pass
        
        query = query.order_by(Appointment.date.desc(), Appointment.time_slot.asc())
        
        total = query.count()
        appointments = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'appointments': [{
                'id': appointment.id,
                'appointment_date': appointment.date.isoformat(),
                'appointment_time_slot': appointment.time_slot,
                'visitors_count': appointment.visitor_count,
                'contact_name': appointment.contact_name,
                'contact_phone': appointment.contact_phone,
                'organization': appointment.organization,
                'purpose': appointment.purpose,
                'status': appointment.status,
                'created_at': appointment.created_at.isoformat() if appointment.created_at else None,
                'admin_notes': appointment.admin_notes,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            } for appointment, user in appointments],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        print(f"获取预约列表失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': '获取预约列表失败'}), 500


@appointments_bp.route('/admin/appointments/counts', methods=['GET'])
def admin_get_appointment_counts():
    """获取预约数量统计信息"""
    if not require_admin():
        print("检查管理员权限: session={}".format(session))
        print("未登录，拒绝访问")
        return jsonify({'error': '权限不足'}), 401
    
    try:
        # 获取今日预约数
        today = date.today()
        today_count = Appointment.query.filter(
            Appointment.date == today,
            Appointment.status.in_(['pending', 'confirmed'])
        ).count()
        
        # 获取本周预约数
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        week_count = Appointment.query.filter(
            Appointment.date >= week_start,
            Appointment.date <= week_end,
            Appointment.status.in_(['pending', 'confirmed'])
        ).count()
        
        # 获取本月预约数
        month_start = date(today.year, today.month, 1)
        if today.month == 12:
            month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
        month_count = Appointment.query.filter(
            Appointment.date >= month_start,
            Appointment.date <= month_end,
            Appointment.status.in_(['pending', 'confirmed'])
        ).count()
        
        # 获取不同状态的预约数
        pending_count = Appointment.query.filter_by(status='pending').count()
        confirmed_count = Appointment.query.filter_by(status='confirmed').count()
        cancelled_count = Appointment.query.filter_by(status='cancelled').count()
        completed_count = Appointment.query.filter_by(status='completed').count()
        
        # 获取即将到来的预约
        upcoming_count = Appointment.query.filter(
            Appointment.date >= today,
            Appointment.status.in_(['pending', 'confirmed'])
        ).count()
        
        return jsonify({
            'today': today_count,
            'week': week_count,
            'month': month_count,
            'pending': pending_count,
            'confirmed': confirmed_count,
            'cancelled': cancelled_count,
            'completed': completed_count,
            'upcoming': upcoming_count
        }), 200
    except Exception as e:
        print(f"获取预约统计信息失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': '获取预约统计信息失败', 'details': str(e)}), 500

@appointments_bp.route('/admin/appointments/<int:appointment_id>', methods=['PUT'])
def admin_update_appointment(appointment_id):
    # 检查管理员权限
    if not require_admin():
        return jsonify({'error': '无权访问'}), 403
    
    try:
        print(f"开始更新预约 ID: {appointment_id}")
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': '预约不存在'}), 404
        
        data = request.json
        print(f"接收到的数据: {data}")
        
        if 'status' in data:
            print(f"更新状态为: {data['status']}")
            appointment.status = data['status']
        
        # 使用SQL更新admin_notes字段
        if 'admin_notes' in data:
            db.session.execute(
                text("UPDATE appointments SET admin_notes = :notes WHERE id = :id"),
                {"notes": data['admin_notes'], "id": appointment_id}
            )
        
        # 使用SQL更新updated_at字段
        db.session.execute(
            text("UPDATE appointments SET updated_at = :now WHERE id = :id"),
            {"now": datetime.utcnow(), "id": appointment_id}
        )
        
        db.session.commit()
        
        return jsonify({'message': '预约已更新'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"更新预约失败: {str(e)}")
        return jsonify({'error': '更新预约失败，请稍后重试'}), 500

@appointments_bp.route('/admin/time-slots', methods=['GET'])
def admin_get_time_slots():
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        time_slots = TimeSlotConfig.query.order_by(TimeSlotConfig.time_slot.asc()).all()
        
        return jsonify({
            'time_slots': [{
                'id': slot.id,
                'time_slot': slot.time_slot,
                'max_visitors': slot.max_visitors,
                'is_active': slot.is_active,
                'weekday_only': slot.weekday_only
            } for slot in time_slots]
        }), 200
        
    except Exception as e:
        return jsonify({'error': '获取时间段配置失败'}), 500

@appointments_bp.route('/admin/time-slots', methods=['POST'])
def admin_create_time_slot():
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        data = request.get_json()
        
        required_fields = ['time_slot', 'max_visitors']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}是必填字段'}), 400
        
        # 检查时间段是否已存在
        existing_slot = TimeSlotConfig.query.filter_by(time_slot=data['time_slot']).first()
        if existing_slot:
            return jsonify({'error': '该时间段已存在'}), 400
        
        time_slot = TimeSlotConfig(
            time_slot=data['time_slot'],
            max_visitors=int(data['max_visitors']),
            is_active=data.get('is_active', True),
            weekday_only=data.get('weekday_only', True)
        )
        
        db.session.add(time_slot)
        db.session.commit()
        
        return jsonify({'message': '时间段创建成功'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '创建时间段失败'}), 500

@appointments_bp.route('/admin/time-slots/<int:slot_id>', methods=['PUT'])
def admin_update_time_slot(slot_id):
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        time_slot = TimeSlotConfig.query.get(slot_id)
        if not time_slot:
            return jsonify({'error': '时间段不存在'}), 404
        
        data = request.get_json()
        
        if 'max_visitors' in data:
            time_slot.max_visitors = int(data['max_visitors'])
        
        if 'is_active' in data:
            time_slot.is_active = data['is_active']
        
        if 'weekday_only' in data:
            time_slot.weekday_only = data['weekday_only']
        
        db.session.commit()
        
        return jsonify({'message': '时间段更新成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': '更新时间段失败'}), 500

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
def get_appointment_detail(appointment_id):
    """获取预约详情，根据用户角色返回不同数据"""
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        user_id = session.get('user_id')
        is_admin = session.get('user_role') == 'admin'
        
        # 查询预约信息
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': '预约不存在'}), 404
        
        # 检查权限：只有管理员或预约所有者可以查看
        if not is_admin and appointment.user_id != user_id:
            return jsonify({'error': '无权限查看此预约'}), 403
        
        # 获取用户信息
        user = User.query.get(appointment.user_id)
        
        # 构建响应数据
        appointment_data = {
            'id': appointment.id,
            'date': appointment.date.isoformat(),
            'time_slot': appointment.time_slot,
            'visitor_count': appointment.visitor_count,
            'contact_name': appointment.contact_name,
            'contact_phone': appointment.contact_phone,
            'status': appointment.status,
            'created_at': appointment.created_at.isoformat() if appointment.created_at else None,
            'updated_at': appointment.updated_at.isoformat() if appointment.updated_at else None,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone if hasattr(user, 'phone') else None
            }
        }
        
        # 管理员可以看到更多信息
        if is_admin:
            appointment_data['admin_notes'] = appointment.admin_notes
        
        return jsonify({'appointment': appointment_data}), 200
        
    except Exception as e:
        print(f"获取预约详情失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': '获取预约详情失败'}), 500

@appointments_bp.route('/appointments', methods=['GET'])
def get_appointments():
    """获取预约列表，根据用户角色返回不同数据"""
    if not require_login():
        return jsonify({'error': '请先登录'}), 401
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        
        # 检查用户角色
        is_admin = session.get('user_role') == 'admin'
        user_id = session.get('user_id')
        
        # 构建查询
        if is_admin:
            # 管理员可以查看所有预约
            query = db.session.query(Appointment, User).join(
                User, Appointment.user_id == User.id
            )
            
            # 根据状态筛选
            if status:
                query = query.filter(Appointment.status == status)
                
            # 按日期和时间段排序
            query = query.order_by(Appointment.date.desc(), Appointment.time_slot.asc())
            
            # 统计各状态预约数量
            pending_count = Appointment.query.filter_by(status='pending').count()
            confirmed_count = Appointment.query.filter_by(status='confirmed').count()
            completed_count = Appointment.query.filter_by(status='completed').count()
            cancelled_count = Appointment.query.filter_by(status='cancelled').count()
            total_count = Appointment.query.count()
            
            counts = {
                'pending': pending_count,
                'confirmed': confirmed_count,
                'completed': completed_count,
                'cancelled': cancelled_count,
                'total': total_count
            }
        else:
            # 普通用户只能查看自己的预约
            query = db.session.query(Appointment, User).join(
                User, Appointment.user_id == User.id
            ).filter(Appointment.user_id == user_id)
            
            # 根据状态筛选
            if status:
                query = query.filter(Appointment.status == status)
                
            # 按日期和时间段排序
            query = query.order_by(Appointment.date.desc(), Appointment.time_slot.asc())
            
            # 统计各状态预约数量
            counts = None
        
        # 分页
        total = query.count()
        appointments = query.offset((page - 1) * per_page).limit(per_page).all()
        
        # 构建响应
        return jsonify({
            'appointments': [{
                'id': appointment.id,
                'appointment_date': appointment.date.isoformat(),
                'appointment_time_slot': appointment.time_slot,
                'visitors_count': appointment.visitor_count,
                'contact_name': appointment.contact_name,
                'contact_phone': appointment.contact_phone,
                'organization': appointment.organization,
                'purpose': appointment.purpose,
                'status': appointment.status,
                'created_at': appointment.created_at.isoformat() if appointment.created_at else None,
                'admin_notes': appointment.admin_notes if is_admin else None,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            } for appointment, user in appointments],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            },
            'counts': counts
        }), 200
        
    except Exception as e:
        print(f"获取预约列表失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': '获取预约列表失败'}), 500

