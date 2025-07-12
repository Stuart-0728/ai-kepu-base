import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User, 
  LogOut,
  Settings,
  Brain,
  Zap,
  Monitor,
  Home,
  Newspaper,
  Calendar,
  Clock,
  Info
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const { theme, themeMode, toggleTheme, THEME_MODES } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // 获取主题图标
  const getThemeIcon = () => {
    switch (themeMode) {
      case THEME_MODES.LIGHT:
        return <Sun className="h-10 w-10 md:h-6 md:w-6" />;
      case THEME_MODES.DARK:
        return <Moon className="h-10 w-10 md:h-6 md:w-6" />;
      case THEME_MODES.SYSTEM:
        return <Monitor className="h-10 w-10 md:h-6 md:w-6" />;
      default:
        return <Sun className="h-10 w-10 md:h-6 md:w-6" />;
    }
  };

  // 获取主题模式文本
  const getThemeModeText = () => {
    switch (themeMode) {
      case THEME_MODES.LIGHT:
        return '明亮模式';
      case THEME_MODES.DARK:
        return '暗黑模式';
      case THEME_MODES.SYSTEM:
        return '跟随系统';
      default:
        return '明亮模式';
    }
  };

  // 导航菜单项配置，包含图标
  const navItems = [
    { name: '首页', path: '/', icon: Home },
    { name: '新闻动态', path: '/news', icon: Newspaper },
    { name: '活动', path: '/activities', icon: Calendar },
    { name: '预约参观', path: '/appointment', icon: Clock },
    { name: '关于我们', path: '/about', icon: Info },
  ]

  // 关闭菜单的函数
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 点击页面其他区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu-container') && !event.target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  // 路由变化时关闭菜单
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 md:h-16 items-center px-3 md:px-4">
        {/* 使用固定宽度的布局，确保导航栏始终居中 */}
        <div className="flex w-full items-center justify-between">
          {/* Logo - 固定宽度 */}
          <div className="w-auto md:w-[240px] sm:w-auto">
            <Link to="/" className="flex items-center gap-1 md:gap-2">
              <img 
                src="/images/logo2.png" 
                alt="重庆市沙坪坝区人工智能科普基地" 
                className={`h-8 md:h-10 w-auto ${theme === 'dark' ? 'filter invert' : ''}`}
                onError={(e) => {
                  console.log('Logo加载失败，使用备用图片');
                  e.target.onerror = null;
                  e.target.src = '/images/logo.png';
                }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-xs md:text-sm whitespace-nowrap">重庆市沙坪坝区</span>
                <span className="font-bold text-xs md:text-sm whitespace-nowrap">人工智能科普基地</span>
              </div>
            </Link>
          </div>

          {/* 导航菜单 - 桌面端 - 始终居中 */}
          <nav className="hidden md:flex items-center justify-center space-x-6 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 右侧操作区 - 固定宽度 */}
          <div className="flex items-center justify-end gap-2 md:gap-3 md:w-[240px] w-auto">
            {/* 主题切换 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full h-14 w-14 md:h-16 md:w-16 flex items-center justify-center"
              aria-label={`切换主题: ${getThemeModeText()}`}
              title={getThemeModeText()}
            >
              {getThemeIcon()}
            </Button>

            {/* 用户菜单 */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-14 w-14 md:h-16 md:w-16 flex items-center justify-center"
                    aria-label="用户菜单"
                  >
                    <User className="h-8 w-8" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="flex items-center gap-2 p-2">
                    <div className="rounded-full bg-primary/10 p-1">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="py-2">
                      <User className="h-6 w-6 mr-2" />
                      <span className="text-base">个人中心</span>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="py-2">
                      <Settings className="h-6 w-6 mr-2" />
                      <span className="text-base">管理后台</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="py-2">
                    <LogOut className="h-6 w-6 mr-2" />
                    <span className="text-base">退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                {/* 桌面端显示登录/注册按钮 */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/login')}
                    className="px-3 py-2 text-base md:text-sm"
                  >
                    登录
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')}
                    className="px-3 py-2 text-base md:text-sm"
                  >
                    注册
                  </Button>
                </div>
                
                {/* 移动端显示用户图标 */}
                <div className="sm:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-14 w-14 md:h-16 md:w-16 flex items-center justify-center"
                    onClick={() => navigate('/login')}
                    aria-label="登录"
                  >
                    <User className="h-8 w-8" />
                  </Button>
                </div>
              </div>
            )}

            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-14 w-14 md:h-16 md:w-16 menu-button flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              {isMenuOpen ? (
                <X className="h-8 w-8" />
              ) : (
                <Menu className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 - 使用AnimatePresence实现动画 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden border-t mobile-menu-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <nav className="flex flex-col p-4 space-y-4">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors hover:bg-muted ${
                        location.pathname === item.path ? 'text-primary bg-primary/10' : 'text-foreground/80'
                      }`}
                      onClick={closeMenu}
                    >
                      <Icon className="h-8 w-8 mobile-nav-icon" />
                      <span className="text-base font-medium">
                        {item.name}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header

