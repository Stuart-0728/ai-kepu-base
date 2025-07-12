import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // 监听滚动事件，控制按钮显示/隐藏
  useEffect(() => {
    const toggleVisibility = () => {
      // 当页面滚动超过300px时显示按钮
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    // 组件卸载时移除事件监听
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // 滚动到顶部的函数
  const scrollToTop = () => {
    // 检测是否是iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 使用平滑滚动
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // iOS设备需要额外处理
    if (isIOS) {
      // 使用setTimeout确保滚动生效
      setTimeout(() => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 100);
    }
  };

  return (
    <button
      className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="回到顶部"
    >
      <ChevronUp size={24} />
    </button>
  );
} 