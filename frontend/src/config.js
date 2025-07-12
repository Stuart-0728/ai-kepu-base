/**
 * API基础URL配置
 * 在开发环境中，使用本地后端服务地址
 * 在生产环境中，由于前后端部署在同一服务器，使用相对路径
 */
// 检查是否存在环境变量中的API URL
const isDevelopment = import.meta.env.MODE === 'development';
// 默认使用相对路径，在开发环境中使用完整URL
const apiUrl = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:5002' : '');
export const API_BASE_URL = apiUrl;

/**
 * 应用程序配置
 */
export const APP_CONFIG = {
  name: '重庆市沙坪坝区人工智能科普基地',
  description: '重庆市沙坪坝区人工智能科普基地管理系统',
  version: '1.0.0',
};

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
};

/**
 * 上传配置
 */
export const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  acceptedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}; 