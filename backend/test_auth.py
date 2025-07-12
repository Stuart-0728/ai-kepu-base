#!/usr/bin/env python3
"""
测试用户登录和会话的脚本
"""
import os
import sys
import requests
import json
from pprint import pprint

# 设置API URL
API_URL = 'http://localhost:5002'

def test_login():
    """测试登录功能"""
    print("\n===== 测试登录 =====")
    
    # 测试硬编码管理员账户
    admin_creds = {"username": "admin123", "password": "admin123"}
    print(f"尝试登录: {admin_creds}")
    
    session = requests.Session()
    response = session.post(f"{API_URL}/api/auth/login", json=admin_creds)
    
    print(f"登录响应: 状态码={response.status_code}")
    
    if response.status_code == 200:
        print("登录成功!")
        pprint(response.json())
        cookies = session.cookies.get_dict()
        print(f"会话Cookie: {cookies}")
        return session
    else:
        print("登录失败:")
        try:
            pprint(response.json())
        except:
            print(response.text)
        return None

def test_profile(session):
    """测试获取用户信息"""
    print("\n===== 测试获取用户信息 =====")
    
    if not session:
        print("没有有效会话，跳过测试")
        return
    
    response = session.get(f"{API_URL}/api/user/profile")
    print(f"获取用户信息响应: 状态码={response.status_code}")
    
    if response.status_code == 200:
        print("获取用户信息成功!")
        pprint(response.json())
    else:
        print("获取用户信息失败:")
        try:
            pprint(response.json())
        except:
            print(response.text)

def test_admin_access(session):
    """测试管理员权限"""
    print("\n===== 测试管理员权限 =====")
    
    if not session:
        print("没有有效会话，跳过测试")
        return
    
    # 测试管理员统计信息接口
    response = session.get(f"{API_URL}/api/admin/stats")
    print(f"管理员统计信息响应: 状态码={response.status_code}")
    
    if response.status_code == 200:
        print("访问管理员接口成功!")
        pprint(response.json())
    else:
        print("访问管理员接口失败:")
        try:
            pprint(response.json())
        except:
            print(response.text)

def test_admin_users(session):
    """测试管理员用户列表接口"""
    print("\n===== 测试管理员用户列表 =====")
    
    if not session:
        print("没有有效会话，跳过测试")
        return
    
    # 测试管理员用户列表接口
    response = session.get(f"{API_URL}/api/admin/users?per_page=5")
    print(f"管理员用户列表响应: 状态码={response.status_code}")
    
    if response.status_code == 200:
        print("获取用户列表成功!")
        pprint(response.json())
    else:
        print("获取用户列表失败:")
        try:
            pprint(response.json())
        except:
            print(response.text)

def main():
    """主函数"""
    print("开始测试用户登录和会话...")
    
    # 测试登录
    session = test_login()
    
    # 测试获取用户信息
    test_profile(session)
    
    # 测试管理员权限
    test_admin_access(session)
    
    # 测试管理员用户列表
    test_admin_users(session)
    
    print("\n测试完成!")

if __name__ == "__main__":
    main() 