#!/usr/bin/env python3
"""
主要的Flask应用创建函数
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import create_app
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建应用实例
app = create_app(os.environ.get('FLASK_ENV', 'production'))

if __name__ == '__main__':
    # 获取端口，默认5000
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"启动API服务器，端口: {port}")
    app.run(host='0.0.0.0', port=port) 