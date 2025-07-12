from flask import Blueprint, request, jsonify, session, current_app
from src.models.database import db, News
from datetime import datetime
import math
import traceback
import uuid
import pytz

news_bp = Blueprint('news', __name__)

# 获取北京时间
def get_beijing_time():
    utc_now = datetime.utcnow()
    beijing_tz = pytz.timezone('Asia/Shanghai')
    return utc_now.replace(tzinfo=pytz.utc).astimezone(beijing_tz)

def require_admin():
    """检查是否为管理员"""
    if 'user_id' not in session or session.get('user_role') != 'admin':
        return False
    return True

@news_bp.route('/news', methods=['GET'])
def get_news_list():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        
        # 构建查询 - 不过滤published字段，获取所有新闻
        query = News.query
        
        if category and hasattr(News, 'category'):
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(News.title.contains(search))
        
        # 按发布时间倒序排列
        query = query.order_by(News.createdAt.desc())
        
        # 分页
        total = query.count()
        news_list = query.offset((page - 1) * per_page).limit(per_page).all()
        
        current_app.logger.info(f"获取新闻列表成功: 总数={total}, 页数={page}, 每页={per_page}")
        
        return jsonify({
            'news': [{
                'id': news.id,
                'title': news.title,
                'content': news.content[:200] + '...' if len(news.content) > 200 else news.content,
                'author': news.author,
                'category': news.category,
                'published_at': news.createdAt.isoformat(),
                'image_url': news.imageUrl
            } for news in news_list],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        error_msg = f"获取新闻列表失败: {str(e)}"
        stack_trace = traceback.format_exc()
        current_app.logger.error(f"{error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@news_bp.route('/news/<news_id>', methods=['GET'])
def get_news_detail(news_id):
    try:
        # 不过滤published字段，获取所有新闻
        news = News.query.filter_by(id=news_id).first()
        if not news:
            return jsonify({'error': '新闻不存在'}), 404
        
        return jsonify({
            'news': {
                'id': news.id,
                'title': news.title,
                'content': news.content,
                'author': news.author,
                'category': news.category,
                'published_at': news.createdAt.isoformat(),
                'updated_at': news.updatedAt.isoformat(),
                'image_url': news.imageUrl,
                'video_url': news.video_url,
                'video_source': news.video_source
            }
        }), 200
        
    except Exception as e:
        error_msg = f"获取新闻详情失败: {str(e)}"
        stack_trace = traceback.format_exc()
        current_app.logger.error(f"{error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@news_bp.route('/admin/news', methods=['GET'])
def admin_get_news_list():
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        
        # 构建查询（管理员可以看到所有新闻，包括未发布的）
        query = News.query
        
        if category and hasattr(News, 'category'):
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(News.title.contains(search))
        
        # 按更新时间倒序排列
        query = query.order_by(News.updatedAt.desc())
        
        # 分页
        total = query.count()
        news_list = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'news': [{
                'id': news.id,
                'title': news.title,
                'content': news.content[:200] + '...' if len(news.content) > 200 else news.content,
                'author': news.author,
                'category': news.category,
                'published_at': news.createdAt.isoformat(),
                'updated_at': news.updatedAt.isoformat(),
                'is_published': news.published,
                'image_url': news.imageUrl
            } for news in news_list],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        error_msg = f"获取管理员新闻列表失败: {str(e)}"
        stack_trace = traceback.format_exc()
        current_app.logger.error(f"{error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@news_bp.route('/admin/news', methods=['POST'])
def admin_create_news():
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field}是必填字段'}), 400
        
        # 创建新闻对象，使用北京时间
        beijing_now = get_beijing_time()
        new_id = str(uuid.uuid4())
        news = News()
        news.id = new_id
        news.title = data['title'].strip()
        news.content = data['content']
        news.author = data.get('author', '管理员')  # 保存作者信息，默认为"管理员"
        news.category = data.get('category', 'general')  # 保存类别信息
        news.published = data.get('is_published', True)
        news.imageUrl = data.get('image_url', '')
        news.video_url = data.get('video_url', '')
        news.video_source = data.get('video_source', '')
        news.createdAt = beijing_now
        news.updatedAt = beijing_now
        
        db.session.add(news)
        db.session.commit()
        
        return jsonify({
            'message': '新闻创建成功',
            'news': {
                'id': news.id,
                'title': news.title,
                'is_published': news.published
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        error_msg = f"创建新闻失败: {str(e)}"
        stack_trace = traceback.format_exc()
        current_app.logger.error(f"{error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@news_bp.route('/admin/news/<news_id>', methods=['PUT'])
def admin_update_news(news_id):
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        news = News.query.get(news_id)
        if not news:
            return jsonify({'error': '新闻不存在'}), 404
        
        data = request.get_json()
        
        # 更新字段
        if 'title' in data:
            news.title = data['title'].strip()
        if 'content' in data:
            news.content = data['content']
        if 'author' in data:
            news.author = data['author']
        if 'category' in data:
            news.category = data['category']
        if 'image_url' in data:
            news.imageUrl = data['image_url']
        if 'video_url' in data:
            news.video_url = data['video_url']
        if 'video_source' in data:
            news.video_source = data['video_source']
        if 'is_published' in data:
            news.published = data['is_published']
        
        # 使用北京时间更新
        news.updatedAt = get_beijing_time()
        
        db.session.commit()
        
        return jsonify({
            'message': '新闻更新成功',
            'news': {
                'id': news.id,
                'title': news.title,
                'is_published': news.published
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        error_msg = f"更新新闻失败: {str(e)}"
        stack_trace = traceback.format_exc()
        current_app.logger.error(f"{error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@news_bp.route('/admin/news/<news_id>', methods=['DELETE'])
def admin_delete_news(news_id):
    if not require_admin():
        return jsonify({'error': '权限不足'}), 403
    
    try:
        news = News.query.get(news_id)
        if not news:
            return jsonify({'error': '新闻不存在'}), 404
        
        db.session.delete(news)
        db.session.commit()
        
        return jsonify({'message': '新闻删除成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        error_msg = f"删除新闻失败: {str(e)}"
        stack_trace = traceback.format_exc()
        current_app.logger.error(f"{error_msg}\n{stack_trace}")
        return jsonify({'error': error_msg}), 500

@news_bp.route('/news/categories', methods=['GET'])
def get_news_categories():
    try:
        # 返回与前端期望格式一致的分类数据
        categories = [
            {'value': 'general', 'label': '综合新闻'},
            {'value': 'physics', 'label': '物理科普'},
            {'value': 'ai', 'label': '人工智能'},
            {'value': 'activity', 'label': '活动资讯'}
        ]
        return jsonify({'categories': categories}), 200
    except Exception as e:
        error_msg = f"获取新闻分类失败: {str(e)}"
        current_app.logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

