import { createContext, useContext, useEffect, useState } from 'react';

// 定义主题模式常量
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 存储当前主题模式
  const [themeMode, setThemeMode] = useState(() => {
    const savedThemeMode = localStorage.getItem('themeMode');
    return savedThemeMode || THEME_MODES.SYSTEM; // 默认使用系统主题
  });

  // 从localStorage获取主题设置，如果没有则根据主题模式决定
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // 如果是系统主题模式，则检查系统偏好
    if (themeMode === THEME_MODES.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // 否则使用对应的主题模式
    return themeMode;
  });

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (themeMode === THEME_MODES.SYSTEM) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // 切换主题
  const toggleTheme = () => {
    setThemeMode(prevMode => {
      let newMode;
      if (prevMode === THEME_MODES.LIGHT) {
        newMode = THEME_MODES.DARK;
      } else if (prevMode === THEME_MODES.DARK) {
        newMode = THEME_MODES.SYSTEM;
      } else {
        newMode = THEME_MODES.LIGHT;
      }
      
      localStorage.setItem('themeMode', newMode);
      
      // 根据模式设置实际主题
      if (newMode === THEME_MODES.SYSTEM) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
        localStorage.setItem('theme', systemTheme);
      } else {
        setTheme(newMode);
        localStorage.setItem('theme', newMode);
      }
      
      return newMode;
    });
  };

  // 应用主题到文档
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeMode, THEME_MODES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 