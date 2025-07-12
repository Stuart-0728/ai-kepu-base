#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import psycopg2
from psycopg2 import sql
import time

def check_postgres_connection(host, port, dbname, user, password):
    """检查PostgreSQL连接"""
    print(f"正在测试连接到PostgreSQL数据库: {host}:{port}/{dbname}")
    
    try:
        # 连接到PostgreSQL数据库
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        
        # 创建游标
        cursor = conn.cursor()
        
        # 获取PostgreSQL版本
        cursor.execute("SELECT version();")
        version_result = cursor.fetchone()
        version = version_result[0] if version_result else "未知"
        print(f"PostgreSQL版本: {version}")
        
        # 获取当前时间
        cursor.execute("SELECT NOW();")
        now_result = cursor.fetchone()
        now = now_result[0] if now_result else "未知"
        print(f"数据库当前时间: {now}")
        
        # 获取时区
        cursor.execute("SHOW timezone;")
        timezone_result = cursor.fetchone()
        timezone = timezone_result[0] if timezone_result else "未知"
        print(f"数据库时区: {timezone}")
        
        # 获取当前连接信息
        cursor.execute("SELECT current_database(), current_user;")
        db_info = cursor.fetchone()
        if db_info:
            print(f"当前数据库: {db_info[0]}, 当前用户: {db_info[1]}")
        else:
            print("无法获取当前连接信息")
        
        # 获取表列表
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"数据库中的表: {len(tables)}个")
        for i, table in enumerate(tables):
            if table:
                table_name = table[0]
                print(f"  {i+1}. {table_name}")
                
                # 获取表的行数
                try:
                    cursor.execute(sql.SQL("SELECT COUNT(*) FROM {};").format(sql.Identifier(table_name)))
                    count_result = cursor.fetchone()
                    count = count_result[0] if count_result else 0
                    print(f"     行数: {count}")
                except Exception as e:
                    print(f"     无法获取行数: {e}")
        
        # 关闭游标和连接
        cursor.close()
        conn.close()
        
        print("数据库连接测试成功!")
        return True
        
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False

def main():
    """主函数"""
    print("===== PostgreSQL连接测试工具 =====")
    
    # 从环境变量或默认值获取连接信息
    host = os.environ.get('DB_HOST', 'localhost')
    port = os.environ.get('DB_PORT', '5432')
    dbname = os.environ.get('DB_NAME', 'aikepu')
    user = os.environ.get('DB_USER', 'aikepu')
    password = os.environ.get('DB_PASSWORD', 'aikepu123')
    
    # 如果有命令行参数，覆盖默认值
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        port = sys.argv[2]
    if len(sys.argv) > 3:
        dbname = sys.argv[3]
    if len(sys.argv) > 4:
        user = sys.argv[4]
    if len(sys.argv) > 5:
        password = sys.argv[5]
    
    # 尝试连接
    start_time = time.time()
    success = check_postgres_connection(host, port, dbname, user, password)
    end_time = time.time()
    
    print(f"连接测试耗时: {end_time - start_time:.2f}秒")
    
    if success:
        print("数据库连接正常，可以用于生产环境")
        sys.exit(0)
    else:
        print("数据库连接失败，请检查配置和网络")
        sys.exit(1)

if __name__ == "__main__":
    main() 