from flask import Blueprint, request, jsonify, current_app, send_file, session, url_for
import os
import shutil
import time
import uuid
import io
from werkzeug.utils import secure_filename
from datetime import datetime
from functools import wraps
from flask import send_from_directory

# 尝试导入PIL库，用于生成缩略图
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

videos_bp = Blueprint('videos', __name__)

# 检查是否为管理员
def requires_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"检查管理员权限: session={session}")
        if 'user_id' not in session or session.get('user_role') != 'admin':
            print("未登录或非管理员，拒绝访问")
            return jsonify({"error": "未授权访问"}), 401
        print(f"权限验证通过: user_id={session.get('user_id')}, role={session.get('user_role')}")
        return f(*args, **kwargs)
    return decorated_function

# 检查是否已登录
def requires_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "请先登录"}), 401
        return f(*args, **kwargs)
    return decorated_function

# 获取所有视频文件
@videos_bp.route('/videos', methods=['GET'])
@requires_admin
def get_videos():
    videos_dir = os.path.join(current_app.root_path, '..', 'static', 'videos')
    if not os.path.exists(videos_dir):
        os.makedirs(videos_dir)
    
    videos = []
    
    # 读取当前默认视频配置
    default_light = None
    default_dark = None
    
    try:
        light_file_path = os.path.join(videos_dir, 'light.mp4')
        dark_file_path = os.path.join(videos_dir, 'dark.mp4')
        
        if os.path.exists(light_file_path):
            default_light = os.path.basename(os.path.realpath(light_file_path))
        
        if os.path.exists(dark_file_path):
            default_dark = os.path.basename(os.path.realpath(dark_file_path))
    except Exception as e:
        current_app.logger.error(f"Error reading default videos: {str(e)}")
    
    # 遍历视频目录
    for filename in os.listdir(videos_dir):
        if filename.lower().endswith(('.mp4', '.webm', '.ogg')):
            file_path = os.path.join(videos_dir, filename)
            file_stats = os.stat(file_path)
            
            # 确定是否为默认视频
            is_default = False
            mode = 'light' if 'light' in filename.lower() else 'dark'
            
            if (mode == 'light' and filename == default_light) or (mode == 'dark' and filename == default_dark):
                is_default = True
            
            videos.append({
                'filename': filename,
                'url': f'/static/videos/{filename}',
                'size': file_stats.st_size,
                'created': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                'is_default': is_default,
                'mode': mode
            })
    
    # 按创建时间排序，最新的在前面
    videos.sort(key=lambda x: x['created'], reverse=True)
    
    return jsonify(videos)

# 设置默认视频
@videos_bp.route('/videos/set-default', methods=['POST'])
@requires_admin
def set_default_video():
    data = request.json
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
        
    filename = data.get('filename')
    mode = data.get('mode', 'light')  # 默认为light模式
    
    print(f"设置默认视频: {filename}, 模式: {mode}")
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    videos_dir = os.path.join(current_app.root_path, '..', 'static', 'videos')
    source_path = os.path.join(videos_dir, filename)
    
    # 确定目标文件名（light.mp4或dark.mp4）
    target_filename = f"{mode}.mp4"
    target_path = os.path.join(videos_dir, target_filename)
    
    try:
        # 检查源文件是否存在
        if not os.path.exists(source_path):
            print(f"源文件不存在: {source_path}")
            return jsonify({'error': f'Source file {filename} not found'}), 404
        
        print(f"源文件存在: {source_path}")
        
        # 如果目标文件已存在，直接覆盖
        if os.path.exists(target_path):
            # 删除现有的目标文件
            os.remove(target_path)
            print(f"删除现有目标文件: {target_path}")
        
        # 复制源文件到目标路径
        shutil.copy2(source_path, target_path)
        print(f"复制文件: {source_path} -> {target_path}")
        
        return jsonify({'success': True, 'message': f'Default {mode} video set to {filename}'})
    
    except Exception as e:
        print(f"设置默认视频时出错: {str(e)}")
        current_app.logger.error(f"Error setting default video: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 删除视频
@videos_bp.route('/videos/<filename>', methods=['DELETE'])
@requires_admin
def delete_video(filename):
    videos_dir = os.path.join(current_app.root_path, '..', 'static', 'videos')
    file_path = os.path.join(videos_dir, filename)
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    # 检查是否为默认视频
    light_path = os.path.join(videos_dir, 'light.mp4')
    dark_path = os.path.join(videos_dir, 'dark.mp4')
    
    if os.path.samefile(file_path, light_path) or os.path.samefile(file_path, dark_path):
        return jsonify({'error': 'Cannot delete default video'}), 400
    
    try:
        os.remove(file_path)
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Error deleting video: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取视频缩略图
@videos_bp.route('/videos/thumbnail', methods=['GET'])
def get_video_thumbnail():
    video_url = request.args.get('url', '')
    print(f"获取视频缩略图请求: url={video_url}")
    
    # 默认缩略图路径（使用相对路径）
    default_thumbnail = os.path.join('static', 'images', 'video-thumbnail.jpg')
    
    if not video_url:
        print("未提供视频URL，返回默认缩略图")
        return send_file(os.path.join(current_app.root_path, '..', default_thumbnail))
    
    # 清理URL参数
    if '?' in video_url:
        video_url = video_url.split('?')[0]
        print(f"清理后的URL: {video_url}")
    
    # 确保URL解码正确，处理编码后的空格和其他特殊字符
    from urllib.parse import unquote
    video_url = unquote(video_url)
    
    print(f"解码后的URL: {video_url}")
    
    # 从URL中提取文件路径（使用相对路径）
    if video_url.startswith('/static/'):
        # 移除开头的斜杠，使用相对路径
        rel_path = video_url[1:]  # 去掉开头的斜杠
        video_path = os.path.join(current_app.root_path, '..', rel_path)
        print(f"从静态路径构建视频路径: {video_path}")
    elif video_url.startswith('http'):
        # 从URL中提取文件名
        filename = os.path.basename(video_url)
        rel_path = os.path.join('static', 'videos', filename)
        video_path = os.path.join(current_app.root_path, '..', rel_path)
        print(f"从URL构建视频路径: {video_path}")
    else:
        # 假设是文件名，构建到videos目录的相对路径
        rel_path = os.path.join('static', 'videos', os.path.basename(video_url))
        video_path = os.path.join(current_app.root_path, '..', rel_path)
        print(f"从文件名构建视频路径: {video_path}")
    
    # 检查文件是否存在
    if not os.path.exists(video_path):
        print(f"视频文件不存在: {video_path}")
        # 尝试处理可能的空格编码问题
        alternative_path = video_path.replace('%20', ' ')
        if os.path.exists(alternative_path):
            video_path = alternative_path
            print(f"找到替代路径: {video_path}")
        else:
            return send_file(os.path.join(current_app.root_path, '..', default_thumbnail))
    
    print(f"视频文件存在: {video_path}")
    
    # 生成缩略图
    # 创建缩略图目录（如果不存在）
    thumbnails_dir = os.path.join(current_app.root_path, '..', 'static', 'thumbnails')
    if not os.path.exists(thumbnails_dir):
        os.makedirs(thumbnails_dir)
    
    # 生成缩略图文件名（基于视频文件名）
    video_basename = os.path.basename(video_path)
    # 确保缩略图文件名是安全的，替换特殊字符
    safe_basename = secure_filename(video_basename)
    thumbnail_filename = f"{os.path.splitext(safe_basename)[0]}_thumb.jpg"
    thumbnail_path = os.path.join(thumbnails_dir, thumbnail_filename)
    
    print(f"缩略图路径: {thumbnail_path}")
    
    # 如果缩略图已存在且比视频文件新，直接使用
    if os.path.exists(thumbnail_path) and os.path.getmtime(thumbnail_path) > os.path.getmtime(video_path):
        print(f"使用已存在的缩略图: {thumbnail_path}")
        return send_file(thumbnail_path)
    
    print(f"需要生成新的缩略图: {thumbnail_path}")
    
    # 尝试使用ffmpeg提取视频的第一帧
    ffmpeg_success = False
    try:
        import subprocess
        import shutil
        
        # 检查ffmpeg是否可用
        if shutil.which('ffmpeg'):
            print("检测到ffmpeg可用，使用ffmpeg生成缩略图")
            
            # 构建ffmpeg命令，提取视频的第一帧
            ffmpeg_cmd = [
                'ffmpeg',
                '-i', video_path,  # 输入文件
                '-ss', '00:00:01',  # 从1秒处开始
                '-vframes', '1',    # 只提取一帧
                '-vf', 'scale=640:360',  # 缩放到指定大小
                '-q:v', '2',        # 高质量
                '-y',               # 覆盖已有文件
                thumbnail_path      # 输出文件
            ]
            
            # 执行ffmpeg命令
            result = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            if result.returncode == 0 and os.path.exists(thumbnail_path):
                print(f"成功使用ffmpeg生成缩略图: {thumbnail_path}")
                ffmpeg_success = True
            else:
                print(f"ffmpeg执行失败: {result.stderr.decode('utf-8')}")
        else:
            print("ffmpeg不可用")
    except Exception as e:
        print(f"使用ffmpeg生成缩略图时出错: {str(e)}")
    
    # 如果ffmpeg成功生成了缩略图，直接返回
    if ffmpeg_success:
        return send_file(thumbnail_path)
    
    # 如果ffmpeg失败，尝试使用PIL生成缩略图
    if HAS_PIL:
        try:
            print("使用PIL生成缩略图")
            # 创建一个彩色缩略图
            width, height = 640, 360
            img = Image.new('RGB', (width, height), color=(40, 40, 40))

            # 添加渐变背景 - 使用更加鲜明的渐变色
            for y in range(height):
                for x in range(width):
                    # 创建更加丰富的渐变效果
                    if "light" in video_basename.lower():
                        # 明亮模式使用蓝色渐变
                        r = int(20 + (x / width) * 40)
                        g = int(80 + (y / height) * 100)
                        b = int(140 + ((x + y) / (width + height)) * 115)
                    else:
                        # 暗黑模式使用深色渐变
                        r = int(20 + (x / width) * 30)
                        g = int(20 + (y / height) * 30)
                        b = int(40 + ((x + y) / (width + height)) * 60)
                    img.putpixel((x, y), (r, g, b))
            
            # 添加文本
            try:
                # 尝试创建一个绘图对象
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(img)
                
                # 尝试加载字体，如果失败则使用默认字体
                try:
                    # 尝试使用系统字体
                    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
                    if not os.path.exists(font_path):
                        font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"  # macOS
                    if not os.path.exists(font_path):
                        font_path = "/Windows/Fonts/arial.ttf"  # Windows
                    
                    title_font = ImageFont.truetype(font_path, 24)
                    info_font = ImageFont.truetype(font_path, 16)
                except Exception as e:
                    print(f"加载字体失败: {str(e)}")
                    # 如果无法加载字体，使用默认字体
                    title_font = ImageFont.load_default()
                    info_font = ImageFont.load_default()
                
                # 绘制视频文件名
                filename = os.path.basename(video_path)
                # 截断过长的文件名
                if len(filename) > 30:
                    display_name = filename[:27] + "..."
                else:
                    display_name = filename
                
                draw.text((width/2, height/2-40), display_name, fill=(255, 255, 255), 
                        font=title_font, anchor="mm")
                
                # 绘制视频类型
                video_type = "明亮模式" if "light" in filename.lower() else "暗黑模式"
                draw.text((width/2, height/2+20), f"类型: {video_type}", fill=(220, 220, 220), 
                        font=info_font, anchor="mm")
                
                # 绘制播放图标
                play_icon_size = 60
                x1, y1 = width/2 - play_icon_size/2, height/2 - play_icon_size/2 + 60
                x2, y2 = width/2 + play_icon_size/2, height/2 + play_icon_size/2 + 60
                
                # 绘制圆形背景
                draw.ellipse([x1, y1, x2, y2], fill=(0, 0, 0, 128))
                
                # 绘制三角形播放图标
                triangle_size = play_icon_size * 0.4
                triangle_x = width/2 + triangle_size/4
                triangle_y = height/2 + 60
                draw.polygon([
                    (triangle_x - triangle_size, triangle_y - triangle_size/2),
                    (triangle_x - triangle_size, triangle_y + triangle_size/2),
                    (triangle_x, triangle_y)
                ], fill=(255, 255, 255))
                
            except Exception as e:
                print(f"添加文本时出错: {str(e)}")
            
            # 保存缩略图
            img.save(thumbnail_path, 'JPEG', quality=90)
            print(f"成功使用PIL生成缩略图: {thumbnail_path}")
            return send_file(thumbnail_path)
            
        except Exception as e:
            print(f"使用PIL生成缩略图时出错: {str(e)}")
            # 出错时返回默认缩略图
    
    # 如果没有PIL或生成失败，返回默认缩略图
    print("无法生成缩略图，返回默认缩略图")
    return send_file(os.path.join(current_app.root_path, '..', default_thumbnail)) 

# 手动为特定视频生成缩略图
@videos_bp.route('/videos/generate-thumbnail/<path:filename>', methods=['GET'])
@requires_admin
def generate_thumbnail_for_video(filename):
    try:
        print(f"手动为视频生成缩略图: {filename}")
        
        # 构建视频路径
        videos_dir = os.path.join(current_app.root_path, '..', 'static', 'videos')
        video_path = os.path.join(videos_dir, filename)
        
        if not os.path.exists(video_path):
            print(f"视频文件不存在: {video_path}")
            return jsonify({"error": "视频文件不存在"}), 404
        
        # 创建缩略图目录（如果不存在）
        thumbnails_dir = os.path.join(current_app.root_path, '..', 'static', 'thumbnails')
        if not os.path.exists(thumbnails_dir):
            os.makedirs(thumbnails_dir)
        
        # 生成缩略图文件名（基于视频文件名）
        safe_basename = secure_filename(filename)
        thumbnail_filename = f"{os.path.splitext(safe_basename)[0]}_thumb.jpg"
        thumbnail_path = os.path.join(thumbnails_dir, thumbnail_filename)
        
        # 使用ffmpeg提取视频的第一帧
        success = False
        try:
            import subprocess
            import shutil
            
            # 检查ffmpeg是否可用
            if shutil.which('ffmpeg'):
                print("检测到ffmpeg可用，使用ffmpeg生成缩略图")
                
                # 构建ffmpeg命令
                ffmpeg_cmd = [
                    'ffmpeg',
                    '-i', video_path,
                    '-ss', '00:00:01',
                    '-vframes', '1',
                    '-vf', 'scale=640:360',
                    '-q:v', '2',
                    '-y',
                    thumbnail_path
                ]
                
                # 执行ffmpeg命令
                result = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                if result.returncode == 0 and os.path.exists(thumbnail_path):
                    print(f"成功使用ffmpeg生成缩略图: {thumbnail_path}")
                    success = True
                else:
                    print(f"ffmpeg执行失败: {result.stderr.decode('utf-8')}")
            else:
                print("ffmpeg不可用")
        except Exception as e:
            print(f"使用ffmpeg生成缩略图时出错: {str(e)}")
        
        # 如果ffmpeg失败，尝试使用PIL
        if not success and HAS_PIL:
            try:
                print("使用PIL生成缩略图")
                # 创建一个彩色缩略图
                width, height = 640, 360
                img = Image.new('RGB', (width, height), color=(40, 40, 40))

                # 添加渐变背景
                for y in range(height):
                    for x in range(width):
                        # 创建渐变效果
                        if "light" in filename.lower():
                            # 明亮模式使用蓝色渐变
                            r = int(20 + (x / width) * 40)
                            g = int(80 + (y / height) * 100)
                            b = int(140 + ((x + y) / (width + height)) * 115)
                        else:
                            # 暗黑模式使用深色渐变
                            r = int(20 + (x / width) * 30)
                            g = int(20 + (y / height) * 30)
                            b = int(40 + ((x + y) / (width + height)) * 60)
                        img.putpixel((x, y), (r, g, b))
                
                # 添加文本
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(img)
                
                # 尝试使用系统字体
                try:
                    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
                    if not os.path.exists(font_path):
                        font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"  # macOS
                    if not os.path.exists(font_path):
                        font_path = "/Windows/Fonts/arial.ttf"  # Windows
                    
                    title_font = ImageFont.truetype(font_path, 24)
                    info_font = ImageFont.truetype(font_path, 16)
                except Exception as e:
                    print(f"加载字体失败: {str(e)}")
                    title_font = ImageFont.load_default()
                    info_font = ImageFont.load_default()
                
                # 绘制视频文件名和类型
                display_name = filename if len(filename) <= 30 else filename[:27] + "..."
                draw.text((width/2, height/2-40), display_name, fill=(255, 255, 255), 
                        font=title_font, anchor="mm")
                
                video_type = "明亮模式" if "light" in filename.lower() else "暗黑模式"
                draw.text((width/2, height/2+20), f"类型: {video_type}", fill=(220, 220, 220), 
                        font=info_font, anchor="mm")
                
                # 保存缩略图
                img.save(thumbnail_path, 'JPEG', quality=90)
                print(f"成功使用PIL生成缩略图: {thumbnail_path}")
                success = True
                
            except Exception as e:
                print(f"使用PIL生成缩略图时出错: {str(e)}")
        
        if success:
            return jsonify({
                "success": True,
                "message": f"已成功为视频 {filename} 生成缩略图",
                "thumbnail_url": f"/static/thumbnails/{thumbnail_filename}"
            })
        else:
            return jsonify({"error": "生成缩略图失败"}), 500
            
    except Exception as e:
        print(f"生成缩略图过程中出错: {str(e)}")
        return jsonify({"error": str(e)}), 500 