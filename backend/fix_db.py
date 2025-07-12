import os
import sys
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
from src.config import config as app_config

# 确保当前目录在sys.path中
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# 数据库连接参数
db_params = {
    'dbname': 'kepu',
    'user': 'luoyixin',
    'password': '',
    'host': 'localhost'
}

def get_db_connection():
    """获取PostgreSQL数据库连接"""
    try:
        # 获取开发环境的数据库配置
        db_config = app_config['development']
        db_url = db_config.SQLALCHEMY_DATABASE_URI
        
        print(f"数据库URL: {db_url}")
        
        # 解析数据库URL
        result = urlparse(db_url)
        username = result.username
        password = result.password
        database = result.path[1:] if result.path else "aikepu"
        hostname = result.hostname or "localhost"
        port = result.port or 5432
        
        # 连接到PostgreSQL数据库
        conn = psycopg2.connect(
            dbname=database,
            user=username,
            password=password,
            host=hostname,
            port=port
        )
        
        print("成功连接到PostgreSQL数据库")
        return conn
    except Exception as e:
        print(f"连接数据库失败: {str(e)}")
        return None

def fix_appointments_table():
    """修复appointments表，确保有admin_notes和updated_at列"""
    print("尝试修复appointments表...")
    
    conn = get_db_connection()
    if not conn:
        print("无法连接到数据库，修复失败")
        return False
    
    cursor = conn.cursor()
    
    try:
        # 检查appointments表是否存在
        cursor.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments')")
        if not cursor.fetchone()[0]:
            print("appointments表不存在")
            conn.close()
            return False
            
        # 检查admin_notes列是否存在
        cursor.execute("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'admin_notes')")
        if not cursor.fetchone()[0]:
            print("添加admin_notes列...")
            cursor.execute("ALTER TABLE appointments ADD COLUMN admin_notes TEXT")
            print("admin_notes列添加成功")
        else:
            print("admin_notes列已存在")
        
        # 检查updated_at列是否存在
        cursor.execute("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'updated_at')")
        if not cursor.fetchone()[0]:
            print("添加updated_at列...")
            cursor.execute("ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            print("updated_at列添加成功")
        else:
            print("updated_at列已存在")
        
        # 提交更改
        conn.commit()
        print("数据库修复成功")
        return True
    except Exception as e:
        print(f"修复数据库时出错: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

def update_time_slots():
    """更新时间段配置，允许周末预约"""
    conn = get_db_connection()
    if not conn:
        print("无法连接到数据库，更新失败")
        return False
    
    cursor = conn.cursor()
    
    try:
        # 更新所有时间段，允许周末预约
        cursor.execute("UPDATE time_slot_configs SET weekday_only = FALSE")
        updated_rows = cursor.rowcount
        conn.commit()
        print(f"已更新{updated_rows}个时间段配置，允许周末预约")
        return True
    except Exception as e:
        print(f"更新时间段配置时出错: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

def fix_registrations_table():
    """修复registrations表，添加缺少的notes字段"""
    try:
        # 连接到PostgreSQL数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 检查notes字段是否存在
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'registrations' AND column_name = 'notes';
        """)
        
        if cursor.fetchone() is None:
            print("添加notes字段到registrations表...")
            cursor.execute("""
                ALTER TABLE registrations 
                ADD COLUMN notes TEXT;
            """)
            conn.commit()
            print("notes字段添加成功")
        else:
            print("notes字段已存在，无需添加")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"修复registrations表时出错: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("开始修复数据库...")
    # 修复appointments表
    fix_appointments_table()
    # 更新时间段配置
    update_time_slots()
    # 修复registrations表
    success = fix_registrations_table()
    
    if success:
        print("数据库修复完成")
    else:
        print("数据库修复失败") 