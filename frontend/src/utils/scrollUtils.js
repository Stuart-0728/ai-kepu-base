/**
 * 滚动到页面顶部的工具函数，特别优化了iOS设备上的滚动行为
 * @param {number} offset - 可选的偏移量，默认为0（页面顶部）
 */
export const scrollToTop = (offset = 0) => {
  // 检测是否是iOS设备
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // 使用requestAnimationFrame确保在DOM更新后执行滚动
  requestAnimationFrame(() => {
    // 保持平滑滚动
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // 使用平滑滚动到目标位置
    window.scrollTo({
      top: offset,
      behavior: 'smooth'
    });
    
    // iOS设备需要额外处理
    if (isIOS) {
      console.log("iOS设备平滑滚动到位置:", offset);
      
      // 使用setTimeout确保在页面渲染后执行额外的滚动
      setTimeout(() => {
        // 如果滚动位置不正确，再次尝试滚动
        if (window.pageYOffset !== offset) {
          window.scrollTo({
            top: offset,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  });
};

/**
 * 滚动到指定元素的工具函数，特别优化了iOS设备上的滚动行为
 * @param {string} selector - 目标元素的CSS选择器
 * @param {number} offsetAdjustment - 可选的偏移量调整，默认为-100（向上偏移100px）
 */
export const scrollToElement = (selector, offsetAdjustment = -100) => {
  const element = document.querySelector(selector);
  if (!element) return;
  
  const offset = element.offsetTop + offsetAdjustment;
  scrollToTop(offset);
}; 