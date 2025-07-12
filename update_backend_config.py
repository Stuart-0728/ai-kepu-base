#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import re

def update_config_file(config_path, db_user, db_password, db_name, host='localhost'):
    """更新配置文件，确保使用PostgreSQL数据库"""
    if not os.path.exists(config_path):
        print(f"错误: 配置文件 {config_path} 不存在")
        return False

    with open(config_path, 'r') as f:
        content = f.read()

    # 检查是否已经使用PostgreSQL
    if 'postgresql://' in content:
        print("配置文件已使用PostgreSQL数据库")
    else:
        # 替换SQLite连接字符串为PostgreSQL
        content = re.sub(
            r"SQLALCHEMY_DATABASE_URI\s*=\s*['\"]sqlite:///.*?['\"]",
            f"SQLALCHEMY_DATABASE_URI = 'postgresql://{db_user}:{db_password}@{host}/{db_name}'",
            content
        )
        print("已将SQLite连接字符串替换为PostgreSQL")

    # 确保设置了SESSION_PERMANENT
    if 'SESSION_PERMANENT = True' not in content:
        # 在Config类中添加SESSION_PERMANENT
        content = content.replace('class Config:', 'class Config:\n    SESSION_PERMANENT = True')
        print("已添加SESSION_PERMANENT = True")

    # 添加时区设置
    if 'SQLALCHEMY_ENGINE_OPTIONS' not in content:
        timezone_config = """
    # 设置PostgreSQL时区为Asia/Shanghai
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'options': '-c timezone=Asia/Shanghai'
        }
    }
    """
        content = content.replace('class Config:', f'class Config:\n{timezone_config}')
        print("已添加时区设置")

    # 写回文件
    with open(config_path, 'w') as f:
        f.write(content)

    print(f"配置文件 {config_path} 已更新")
    return True

def update_main_file(main_path):
    """更新主应用文件，添加时区设置"""
    if not os.path.exists(main_path):
        print(f"错误: 主应用文件 {main_path} 不存在")
        return False

    with open(main_path, 'r') as f:
        content = f.read()

    # 检查是否已经导入pytz
    if 'import pytz' not in content:
        # 添加pytz导入
        content = 'import pytz\n' + content
        print("已添加pytz导入")

    # 检查是否需要添加时区设置代码
    if 'pytz.timezone' not in content:
        # 添加时区设置代码
        timezone_code = """
# 设置默认时区为北京时间
import os
os.environ['TZ'] = 'Asia/Shanghai'
try:
    import time
    time.tzset()
except AttributeError:
    # Windows不支持tzset
    pass
"""
        # 在创建app之前添加
        if 'app = ' in content:
            content = content.replace('app = ', timezone_code + '\napp = ')
            print("已添加时区设置代码")

    # 写回文件
    with open(main_path, 'w') as f:
        f.write(content)

    print(f"主应用文件 {main_path} 已更新")
    return True

def main():
    """主函数"""
    print("===== 更新后端配置 =====")

    # 配置参数
    db_user = 'aikepu'
    db_password = 'aikepu123'
    db_name = 'aikepu'
    host = 'localhost'

    # 更新配置文件
    config_path = os.path.join('backend', 'src', 'config.py')
    update_config_file(config_path, db_user, db_password, db_name, host)

    # 更新主应用文件
    main_path = os.path.join('backend', 'src', 'main.py')
    update_main_file(main_path)

    print("\n===== 配置更新完成 =====")
    print("请重启应用以应用更改")

if __name__ == "__main__":
    main() 