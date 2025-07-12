import os
import sqlite3
from datetime import datetime, timedelta

# 确保实例目录存在
instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
if not os.path.exists(instance_dir):
    os.makedirs(instance_dir)
    print(f"创建实例目录: {instance_dir}")

# 数据库路径
db_path = os.path.join(instance_dir, 'ai_science_base.db')
print(f"数据库路径: {db_path}")

# 创建数据库连接
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # 创建用户表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 创建预约表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time_slot TEXT NOT NULL,
        visitor_count INTEGER NOT NULL DEFAULT 1,
        contact_name TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # 创建时间段配置表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS time_slot_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_slot TEXT NOT NULL,
        max_visitors INTEGER NOT NULL DEFAULT 30,
        is_active BOOLEAN DEFAULT 1,
        weekday_only BOOLEAN DEFAULT 0
    )
    ''')
    
    # 检查是否已有管理员用户
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
    admin_count = cursor.fetchone()[0]
    
    if admin_count == 0:
        # 创建默认管理员用户
        from werkzeug.security import generate_password_hash
        admin_password_hash = generate_password_hash('admin123')
        
        cursor.execute('''
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
        ''', ('admin', 'admin@example.com', admin_password_hash, 'admin'))
        
        print("创建默认管理员用户: admin / admin123")
    
    # 检查是否已有时间段配置
    cursor.execute("SELECT COUNT(*) FROM time_slot_configs")
    slot_count = cursor.fetchone()[0]
    
    if slot_count == 0:
        # 创建默认时间段配置
        default_slots = [
            ('09:00-10:00', 30, 1, 0),
            ('10:00-11:00', 30, 1, 0),
            ('11:00-12:00', 30, 1, 0),
            ('13:00-14:00', 30, 1, 0),
            ('14:00-15:00', 30, 1, 0),
            ('15:00-16:00', 30, 1, 0),
            ('16:00-17:00', 30, 1, 0)
        ]
        
        cursor.executemany('''
        INSERT INTO time_slot_configs (time_slot, max_visitors, is_active, weekday_only)
        VALUES (?, ?, ?, ?)
        ''', default_slots)
        
        print(f"创建{len(default_slots)}个默认时间段配置")
    
    # 提交更改
    conn.commit()
    print("数据库初始化成功")

except Exception as e:
    conn.rollback()
    print(f"初始化数据库失败: {e}")

finally:
    conn.close() 