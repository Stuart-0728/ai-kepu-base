// src/components/common/ScrollToTop.js

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // 使用 useLocation hook 来获取当前路由信息
  const { pathname } = useLocation();

  // 设置一个 effect，每当路由路径 (pathname) 发生变化时执行
  useEffect(() => {
    // 检测是否是iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    const scrollToTopWithFallbacks = () => {
      // 尝试使用平滑滚动
      try {
        window.scrollTo({
          top: 0,
          behavior: 'auto' // 在iOS上使用'auto'而不是'smooth'以确保立即滚动
        });
      } catch (e) {
        // 回退到传统方法
        window.scrollTo(0, 0);
      }
      
      // iOS设备需要额外处理
      if (isIOS) {
        // 使用多种方法确保滚动生效
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        // 多次尝试滚动，确保生效
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        }, 50);
        
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        }, 150);
      }
    };
    
    // 立即执行一次
    scrollToTopWithFallbacks();
    
    // 再次延迟执行，确保在DOM更新后滚动
    setTimeout(scrollToTopWithFallbacks, 0);
    
  }, [pathname]); // 依赖项是 pathname

  // 这个组件没有视觉输出，它只是一个功能性组件
  return null;
};

export default ScrollToTop; 