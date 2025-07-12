#!/bin/bash

echo "确保安装PostgreSQL依赖..."
pip3 install psycopg2-binary

echo "正在修复数据库..."
python3 fix_db.py

echo "正在启动服务器..."
export FLASK_APP=src/main.py
python3 -m flask run --port=5002 