import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Eye, EyeOff, AlertTriangle, ServerCrash, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useIsMobile } from '../../hooks/use-mobile'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, apiAvailable, error: apiError } = useAuth()
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  // 当API可用状态或API错误变化时更新错误信息
  useEffect(() => {
    if (apiError) {
      setError(apiError)
    } else if (apiAvailable === false) {
      setError('后端服务连接失败，请检查服务器是否已启动')
    }
  }, [apiAvailable, apiError])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError('请填写用户名和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await login(formData.username, formData.password)
      
      if (result.success) {
        navigate(from, { replace: true })
      } else {
        setError(result.message || '用户名或密码错误')
      }
    } catch (error) {
      console.error('登录失败:', error)
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-20 ${theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-indigo-100' : 'particles-bg gradient-bg'}`}>
      <div className="container mx-auto px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className={`tech-border shadow-lg ${theme === 'light' ? 'bg-white/90 backdrop-blur-sm' : ''}`}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src="/images/logo2.png" 
                  alt="重庆市沙坪坝区人工智能科普基地" 
                  className={`h-12 w-auto`}
                  style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
                />
              </div>
              <div className="flex flex-col items-center mb-2">
                <span className="font-bold text-sm">重庆市沙坪坝区</span>
                <span className="font-bold text-sm">人工智能科普基地</span>
              </div>
              <CardTitle className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'gradient-text'}`}>
                登录账户
              </CardTitle>
              <CardDescription className={`${theme === 'light' ? 'text-gray-600' : 'text-foreground/80'}`}>
                登录您的账户以访问更多功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 text-sm rounded-md flex items-start gap-2 ${
                      apiAvailable === false 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {apiAvailable === false ? (
                      <ServerCrash className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="space-y-2 login-input-container">
                  <Label htmlFor="username" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>用户名或邮箱</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="请输入用户名或邮箱"
                    required
                    className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} login-input`}
                    disabled={!apiAvailable}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>

                <div className="space-y-2 login-input-container">
                  <Label htmlFor="password" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>密码</Label>
                  <div className="relative" style={{ isolation: 'isolate' }}>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="请输入密码"
                      required
                      className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} pr-10 login-input`}
                      disabled={!apiAvailable}
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!apiAvailable}
                      style={{ position: 'absolute', zIndex: 30, right: 0, top: 0 }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'glow-effect tech-border'}`}
                  disabled={loading || !apiAvailable}
                  style={{ 
                    minHeight: isMobile ? '44px' : undefined,
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>

                <div className="text-center space-y-2">
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-foreground/80'}`}>
                    还没有账户？{' '}
                    <Link 
                      to="/register" 
                      className={`${theme === 'light' ? 'text-blue-600 hover:text-blue-800' : 'text-primary hover:text-primary/80'} font-medium`}
                      style={{ position: 'relative', zIndex: 15 }}
                    >
                      立即注册
                    </Link>
                  </p>
                  
                  <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-foreground/70'}`}>
                    登录即表示您同意我们的{' '}
                    <span className={`${theme === 'light' ? 'text-blue-600' : 'text-primary'} cursor-default`}>
                      使用条款
                    </span>
                    {' '}和{' '}
                    <span className={`${theme === 'light' ? 'text-blue-600' : 'text-primary'} cursor-default`}>
                      隐私政策
                    </span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Login

