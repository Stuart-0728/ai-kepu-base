#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import importlib.util
import inspect
from datetime import datetime
import pytz

def check_module_exists(module_name):
    """检查模块是否存在"""
    try:
        spec = importlib.util.find_spec(module_name)
        return spec is not None
    except ModuleNotFoundError:
        return False

def load_module(module_name, file_path):
    """从文件加载模块"""
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            print(f"无法加载模块 {module_name}: spec或loader为None")
            return None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    except Exception as e:
        print(f"加载模块 {module_name} 失败: {e}")
        return None

def check_config():
    """检查配置文件"""
    print("检查配置文件...")
    
    # 检查配置文件是否存在
    config_path = os.path.join('backend', 'src', 'config.py')
    if not os.path.exists(config_path):
        print(f"错误: 配置文件 {config_path} 不存在")
        return False
    
    # 加载配置模块
    config_module = load_module('config', config_path)
    if not config_module:
        return False
    
    # 检查配置类
    config_classes = [name for name, obj in inspect.getmembers(config_module) 
                     if inspect.isclass(obj) and name.endswith('Config')]
    
    if not config_classes:
        print("错误: 没有找到配置类")
        return False
    
    print(f"找到配置类: {', '.join(config_classes)}")
    
    # 检查数据库配置
    for class_name in config_classes:
        config_class = getattr(config_module, class_name)
        print(f"\n检查 {class_name} 配置:")
        
        # 检查数据库URI
        if hasattr(config_class, 'SQLALCHEMY_DATABASE_URI'):
            db_uri = config_class.SQLALCHEMY_DATABASE_URI
            print(f"数据库URI: {db_uri}")
            
            # 检查是否使用PostgreSQL
            if 'postgresql' in db_uri:
                print("✓ 使用PostgreSQL数据库")
            else:
                print("✗ 警告: 未使用PostgreSQL数据库，可能会导致时区问题")
        else:
            print("✗ 错误: 未定义数据库URI")
        
        # 检查会话配置
        if hasattr(config_class, 'SESSION_PERMANENT'):
            if config_class.SESSION_PERMANENT:
                print("✓ 会话持久化已启用")
            else:
                print("✗ 警告: 会话持久化未启用，可能导致登录状态丢失")
        else:
            print("✗ 警告: 未定义SESSION_PERMANENT，可能导致登录状态丢失")
        
        # 检查密钥配置
        if hasattr(config_class, 'SECRET_KEY'):
            if config_class.SECRET_KEY:
                print("✓ 密钥已配置")
            else:
                print("✗ 错误: 密钥未配置")
        else:
            print("✗ 错误: 未定义SECRET_KEY")
    
    return True

def check_main_app():
    """检查主应用文件"""
    print("\n检查主应用文件...")
    
    # 检查主应用文件是否存在
    main_path = os.path.join('backend', 'src', 'main.py')
    if not os.path.exists(main_path):
        print(f"错误: 主应用文件 {main_path} 不存在")
        return False
    
    # 检查文件内容
    with open(main_path, 'r') as f:
        content = f.read()
        
        # 检查是否创建了app实例
        if 'app =' in content:
            print("✓ 找到app实例")
        else:
            print("✗ 错误: 未找到app实例")
        
        # 检查是否设置了时区
        if 'pytz' in content and ('Asia/Shanghai' in content or 'UTC' in content):
            print("✓ 时区设置已配置")
        else:
            print("✗ 警告: 未找到时区设置，可能导致时间显示问题")
        
        # 检查是否导入了数据库模型
        if 'from src.models' in content:
            print("✓ 已导入数据库模型")
        else:
            print("✗ 警告: 未导入数据库模型")
    
    return True

def check_routes():
    """检查路由配置"""
    print("\n检查路由配置...")
    
    routes_dir = os.path.join('backend', 'src', 'routes')
    if not os.path.exists(routes_dir):
        print(f"错误: 路由目录 {routes_dir} 不存在")
        return False
    
    route_files = [f for f in os.listdir(routes_dir) if f.endswith('.py')]
    if not route_files:
        print("错误: 路由目录为空")
        return False
    
    print(f"找到路由文件: {', '.join(route_files)}")
    
    # 检查活动路由
    activities_path = os.path.join(routes_dir, 'activities.py')
    if os.path.exists(activities_path):
        print("\n检查活动路由:")
        with open(activities_path, 'r') as f:
            content = f.read()
            
            # 检查是否有报名相关路由
            if '/activities/<int:activity_id>/register' in content:
                print("✓ 找到活动报名路由")
            else:
                print("✗ 警告: 未找到活动报名路由")
            
            # 检查是否处理了时区
            if 'datetime' in content and ('pytz' in content or 'timezone' in content):
                print("✓ 路由中处理了时区")
            else:
                print("✗ 警告: 路由中可能未处理时区")
    
    # 检查管理员路由
    admin_path = os.path.join(routes_dir, 'admin.py')
    if os.path.exists(admin_path):
        print("\n检查管理员路由:")
        with open(admin_path, 'r') as f:
            content = f.read()
            
            # 检查是否有导出功能
            if '/admin/activities/<int:activity_id>/export' in content:
                print("✓ 找到活动报名导出路由")
            else:
                print("✗ 警告: 未找到活动报名导出路由")
    
    return True

def main():
    """主函数"""
    print("===== 后端配置检查工具 =====")
    print(f"当前工作目录: {os.getcwd()}")
    print(f"当前系统时间: {datetime.now()}")
    print(f"当前北京时间: {datetime.now(pytz.timezone('Asia/Shanghai'))}")
    
    # 检查必要的Python包
    required_packages = ['flask', 'sqlalchemy', 'psycopg2', 'pytz']
    print("\n检查必要的Python包:")
    for package in required_packages:
        if check_module_exists(package):
            print(f"✓ {package} 已安装")
        else:
            print(f"✗ {package} 未安装")
    
    # 检查配置
    config_ok = check_config()
    
    # 检查主应用
    main_ok = check_main_app()
    
    # 检查路由
    routes_ok = check_routes()
    
    # 总结
    print("\n===== 检查结果 =====")
    if config_ok and main_ok and routes_ok:
        print("后端配置检查完成，未发现严重问题!")
    else:
        print("后端配置检查完成，发现一些问题，请修复后再部署!")

if __name__ == "__main__":
    main() 