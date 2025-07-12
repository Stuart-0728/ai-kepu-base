// 导入必要的库
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from 'axios';
// 删除重复导入
// import { API_BASE_URL } from '@/config';

// API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
console.log('API_BASE_URL:', API_BASE_URL);

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 * @param {string|Date} date 日期字符串或Date对象
 * @param {string} format 格式化字符串，默认为'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  // 使用北京时间
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    console.log('无效日期格式:', date);
    return '';
  }
  
  // 转换为北京时间
  const beijingDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  
  const year = beijingDate.getFullYear();
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getDate()).padStart(2, '0');
  const hours = String(beijingDate.getHours()).padStart(2, '0');
  const minutes = String(beijingDate.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * 视频工具函数
 */
export const videoUtils = {
  /**
   * 添加缓存破坏参数
   * @param {string} url 视频URL
   * @returns {string} 添加缓存破坏参数后的URL
   */
  addCacheBuster: (url) => {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  },
  
  /**
   * 获取视频缩略图URL
   * @param {string} videoUrl 视频URL或文件名
   * @returns {string} 缩略图URL
   */
  getThumbnailUrl: (videoUrl) => {
    if (!videoUrl) return `${API_BASE_URL}/static/images/video-thumbnail.jpg`;
    
    // 如果只是文件名，构建完整路径
    let fullPath = videoUrl;
    if (!videoUrl.startsWith('/') && !videoUrl.startsWith('http')) {
      fullPath = `/static/videos/${videoUrl}`;
    }
    
    // 添加时间戳参数防止缓存问题
    const timestamp = Date.now();
    
    // 使用后端的视频缩略图API，确保正确编码URL参数
    return `${API_BASE_URL}/api/videos/thumbnail?url=${encodeURIComponent(fullPath)}&t=${timestamp}`;
  },
  
  /**
   * 从视频文件名获取安全的视频URL
   * @param {string} filename 视频文件名
   * @returns {string} 安全的视频URL
   */
  getSafeVideoUrl: (filename) => {
    if (!filename) return '';
    
    // 构建绝对路径
    const videoPath = `/static/videos/${filename}`;
    const fullUrl = `${API_BASE_URL}${videoPath}`;
    
    // 处理文件名中可能存在的空格
    return fullUrl.replace(/ /g, '%20');
  },
  
  /**
   * 检查视频文件是否存在
   * @param {string} videoUrl 视频URL
   * @returns {Promise<boolean>} 视频是否存在
   */
  checkVideoExists: async (videoUrl) => {
    if (!videoUrl) return false;
    
    // 确保使用绝对路径
    const fullUrl = videoUrl.startsWith('http') ? 
      videoUrl : 
      `${API_BASE_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;
    
    try {
      const response = await fetch(fullUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        credentials: 'same-origin',
        mode: 'cors'
      });
      
      return response.ok;
    } catch (error) {
      console.error('检查视频文件失败:', error);
      return false;
    }
  },
  
  /**
   * 获取视频模式名称
   * @param {string} mode 模式标识符
   * @returns {string} 模式名称
   */
  getModeName: (mode) => {
    return mode === 'dark' ? '暗黑模式' : '明亮模式';
  },
  
  /**
   * 获取完整的视频URL，包括API_BASE_URL
   * @param {string} url 相对或绝对URL
   * @returns {string} 完整的视频URL
   */
  getFullVideoUrl: (url) => {
    if (!url) return '';
    
    // 如果已经是完整URL，直接返回
    if (url.startsWith('http')) return url;
    
    // 确保以斜杠开头
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${API_BASE_URL}${normalizedUrl}`;
  }
};

// 格式化日期时间函数
export function formatDateTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 将时间戳转换为可读时间
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  const secondsAgo = Math.floor((now - date) / 1000);
  
  if (secondsAgo < 60) {
    return '刚刚';
  } else if (secondsAgo < 3600) {
    return `${Math.floor(secondsAgo / 60)}分钟前`;
  } else if (secondsAgo < 86400) {
    return `${Math.floor(secondsAgo / 3600)}小时前`;
  } else if (secondsAgo < 2592000) {
    return `${Math.floor(secondsAgo / 86400)}天前`;
  } else {
    return formatDate(timestamp);
  }
}

// 截断文本
export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 从HTML中提取纯文本
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

// 生成随机ID
export function generateId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// 检查用户权限
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  
  // 管理员拥有所有权限
  if (user.role === 'admin') return true;
  
  // 其他角色根据具体权限判断
  const permissions = {
    user: ['view_content', 'create_appointment'],
    editor: ['view_content', 'create_appointment', 'edit_content'],
    // 可以根据需要添加更多角色和权限
  };
  
  return permissions[user.role]?.includes(permission) || false;
}

// 处理API错误
export function handleApiError(error) {
  console.error('API错误:', error);
  
  if (error.response) {
    // 服务器返回了错误状态码
    return {
      message: error.response.data?.message || '服务器错误',
      status: error.response.status
    };
  } else if (error.request) {
    // 请求已发送但没有收到响应
    return {
      message: '无法连接到服务器，请检查您的网络连接',
      status: 0
    };
  } else {
    // 请求设置时发生错误
    return {
      message: error.message || '发送请求时出错',
      status: 0
    };
  }
}

