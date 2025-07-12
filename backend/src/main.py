import pytz
import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, send_from_directory, request, session
from flask_cors import CORS
from src.models.database import db, migrate
from src.models.user import add_user_methods
from src.routes.auth import auth_bp
from src.routes.user import user_bp
from src.routes.news import news_bp
from src.routes.activities import activities_bp
from src.routes.appointments import appointments_bp, init_time_slots
from src.routes.admin import admin_bp
from src.routes.videos import videos_bp
import logging
from datetime import datetime
import shutil
import time
from src.config import config as app_config

# 配置日志
logging.basicConfig(level=logging.INFO)

# 确保static_folder路径存在
static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
if not os.path.exists(static_folder):
    os.makedirs(static_folder)

def create_app(config_name='default'):
    # 设置默认时区为北京时间
    import os
    os.environ['TZ'] = 'Asia/Shanghai'
    try:
        import time
        time.tzset()
    except AttributeError:
        # Windows不支持tzset
        pass

    app = Flask(__name__, static_folder=None)  # 禁用默认的静态文件处理
    
    # 从配置对象加载配置
    app.config.from_object(app_config[config_name])
    
    # 使用PostgreSQL数据库，确保在本地开发时使用PostgreSQL
    print(f"使用PostgreSQL数据库: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # 额外配置
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False,  # 在HTTP环境下使用Cookie
        SESSION_COOKIE_SAMESITE=None, # 允许跨站请求发送Cookie
        SESSION_COOKIE_DOMAIN=None,   # 不限制域名
        SESSION_COOKIE_PATH="/",
    )
    
    # 确保添加了User模型的方法
    add_user_methods()
    
    # 配置CORS，允许特定来源的请求，包括Cookie
    allowed_origins = [
        "http://119.29.168.57", 
        "https://119.29.168.57"
    ]
    
    # 在开发环境中添加本地开发服务器
    if config_name == 'development':
        allowed_origins.extend([
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5176",
            "http://127.0.0.1:5177",
            "http://172.20.10.3:5173",
            "http://172.20.10.3:5174",
            "http://172.20.10.3:5175",
            "http://172.20.10.3:5176",
            "http://172.20.10.3:5177"
        ])
    
    CORS(app, 
         resources={r"/*": {"origins": allowed_origins}}, 
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
         expose_headers=["Content-Type", "Authorization"]
    )
    
    # 添加CORS预检请求处理
    @app.after_request
    def after_request(response):
        # 获取请求的Origin
        origin = request.headers.get('Origin')
        
        # 如果Origin在允许的列表中，设置CORS头
        if origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        return response
    
    # 初始化数据库
    db.init_app(app)
    migrate.init_app(app, db)
    
    # 在生产环境中不自动创建表，避免与已有表冲突
    if config_name == 'development':
        with app.app_context():
            db.create_all()
    
    # API测试端点
    @app.route('/api/test')
    def api_test():
        return jsonify({
            "status": "ok",
            "message": "API is working correctly"
        })
    
    # API健康检查端点
    @app.route('/api/health')
    def health_check():
        return jsonify(status="ok")
    
    # 直接处理设置默认视频的请求
    @app.route('/api/videos/set-default', methods=['POST'])
    def set_default_video():
        print("收到设置默认视频请求 - 主应用路由")
        print(f"请求方法: {request.method}")
        print(f"请求数据: {request.get_json()}")
        
        # 检查是否为管理员
        if 'user_id' not in session or session.get('user_role') != 'admin':
            print("未登录，拒绝访问")
            return jsonify({"error": "未授权访问"}), 401
        
        print(f"权限验证通过: user_id={session.get('user_id')}, role={session.get('user_role')}")
        
        try:
            data = request.get_json()
            if not data or 'filename' not in data:
                return jsonify({"error": "缺少必要参数"}), 400
            
            filename = data['filename']
            # 从请求中获取模式，默认为light
            mode = data.get('mode', 'light').lower()
            
            print(f"设置默认视频: {filename}, 模式: {mode}")
            
            if mode not in ['light', 'dark']:
                return jsonify({"error": "模式必须是 light 或 dark"}), 400
            
            # 确保视频目录存在
            videos_dir = os.path.join(static_folder, 'videos')
            if not os.path.exists(videos_dir):
                os.makedirs(videos_dir)
                
            file_path = os.path.join(videos_dir, filename)
            
            if not os.path.exists(file_path):
                return jsonify({"error": "视频文件不存在"}), 404
            
            # 获取文件扩展名
            _, ext = os.path.splitext(filename)
            
            # 设置为默认视频，使用正确的模式名称
            default_filename = f"{mode}{ext}"
            default_path = os.path.join(videos_dir, default_filename)
            
            # 直接复制文件，覆盖现有的默认视频（如果存在）
            shutil.copy2(file_path, default_path)
            
            return jsonify({
                "success": True,
                "message": f"已将 {filename} 设置为 {mode} 模式的默认背景视频"
            })
            
        except Exception as e:
            print(f"设置默认视频失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    
    # 注册蓝图 - 所有API路由
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(news_bp, url_prefix='/api')
    app.register_blueprint(activities_bp, url_prefix='/api')
    app.register_blueprint(appointments_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(videos_bp, url_prefix='/api')
    
    # 初始化时间段配置
    with app.app_context():
        init_time_slots()
    
    # 自定义静态文件处理
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        return send_from_directory(static_folder, filename)
    
    # 直接处理视频缩略图请求
    @app.route('/api/videos/thumbnail/<filename>')
    def get_video_thumbnail(filename):
        """获取视频缩略图"""
        print(f"请求视频缩略图: {filename}")
        
        # 确保缩略图目录存在
        thumbnail_dir = os.path.join(static_folder, 'images')
        if not os.path.exists(thumbnail_dir):
            os.makedirs(thumbnail_dir)
            
        # 检查是否有特定的缩略图
        specific_thumbnail = os.path.join(thumbnail_dir, f"thumbnail-{filename}.jpg")
        if os.path.exists(specific_thumbnail):
            return send_from_directory(os.path.dirname(specific_thumbnail), os.path.basename(specific_thumbnail))
            
        # 直接返回静态缩略图，避免404问题
        thumbnail_path = os.path.join(thumbnail_dir, 'video-thumbnail.jpg')
        
        # 如果默认缩略图不存在，创建一个空白图片作为默认缩略图
        if not os.path.exists(thumbnail_path):
            # 创建一个空白的默认缩略图文件
            with open(thumbnail_path, 'w') as f:
                f.write('')
                
        return send_from_directory(os.path.dirname(thumbnail_path), os.path.basename(thumbnail_path))
    
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        assets_folder = os.path.join(static_folder, 'assets')
        if not os.path.exists(assets_folder):
            os.makedirs(assets_folder)
        return send_from_directory(assets_folder, filename)
    
    @app.route('/favicon.ico')
    def serve_favicon():
        return send_from_directory(static_folder, 'favicon.ico')
    
    # 所有其他路由返回index.html
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        # 确保不会捕获API路由
        if path.startswith('api/'):
            return "Not Found", 404
    
        try:
            return send_from_directory(static_folder, 'index.html')
        except:
            return "index.html not found", 404
            
    return app

# 创建应用实例

# 设置默认时区为北京时间
import os
os.environ['TZ'] = 'Asia/Shanghai'
try:
    import time
    time.tzset()
except AttributeError:
    # Windows不支持tzset
    pass

app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # 运行服务器，使用5002端口与前端请求匹配
    app.run(host='0.0.0.0', port=5002, debug=app.config['DEBUG'])
