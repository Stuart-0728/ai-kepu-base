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
    
    // 使用 setTimeout 确保在DOM更新后执行滚动
    setTimeout(() => {
      // 将窗口滚动到顶部
      window.scrollTo(0, 0);
      
      // iOS设备可能需要额外处理
      if (isIOS) {
        // 使用多种方法确保滚动生效
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        // 再次尝试滚动，确保生效
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      }
    }, 0);
  }, [pathname]); // 依赖项是 pathname

  // 这个组件没有视觉输出，它只是一个功能性组件
  return null;
};

export default ScrollToTop; 