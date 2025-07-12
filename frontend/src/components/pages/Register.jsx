import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE_URL } from '../../lib/utils'
import { useIsMobile } from '../../hooks/use-mobile'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { theme } = useTheme()
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiAvailable, setApiAvailable] = useState(true)
  const [checkingApi, setCheckingApi] = useState(true)
  
  // 检查API是否可用
  useEffect(() => {
    checkApiAvailability()
  }, [])
  
  const checkApiAvailability = async () => {
    try {
      setCheckingApi(true)
      const response = await fetch(`${API_BASE_URL}/api/test`)
      if (response.ok) {
        setApiAvailable(true)
      } else {
        setApiAvailable(false)
        setError('API服务不可用，请稍后再试')
      }
    } catch (error) {
      console.error('API检查失败:', error)
      setApiAvailable(false)
      setError('无法连接到服务器，请检查网络连接')
    } finally {
      setCheckingApi(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (error) setError('')
  }

  const validateForm = () => {
    // 用户名验证
    if (formData.username.length < 2 || formData.username.length > 20) {
      setError('用户名长度必须在2-20个字符之间')
      return false
    }

    // 邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      return false
    }

    // 手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      setError('请输入有效的手机号码')
      return false
    }

    // 密码验证
    if (formData.password.length < 6) {
      setError('密码长度不能少于6个字符')
      return false
    }

    // 确认密码验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })
      
      if (result.success) {
        navigate('/login', { 
          state: { 
            message: '注册成功，请登录', 
            type: 'success' 
          } 
        })
      } else {
        setError(result.message || '注册失败，请稍后重试')
      }
    } catch (error) {
      console.error('注册失败:', error)
      setError('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return { strength: 0, text: '', color: '' }
    
    let strength = 0
    
    // 长度检查
    if (password.length >= 6) strength += 1
    if (password.length >= 8) strength += 1
    
    // 复杂度检查
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    // 强度评估
    let text = ''
    let color = ''
    
    if (strength <= 2) {
      text = '弱'
      color = 'text-red-500'
    } else if (strength <= 4) {
      text = '中'
      color = 'text-yellow-500'
    } else {
      text = '强'
      color = 'text-green-500'
    }
    
    return { strength, text, color }
  }
  
  const passwordStrength = getPasswordStrength()

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
                创建账户
              </CardTitle>
              <CardDescription className={`${theme === 'light' ? 'text-gray-600' : 'text-foreground/80'}`}>
                注册账户以享受完整的科普体验
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2 register-input-container">
                  <Label htmlFor="username" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>用户名 *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="请输入用户名（2-20个字符）"
                    required
                    className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} register-input`}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>

                <div className="space-y-2 register-input-container">
                  <Label htmlFor="email" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>邮箱 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="请输入邮箱地址"
                    required
                    className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} register-input`}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>

                <div className="space-y-2 register-input-container">
                  <Label htmlFor="phone" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>
                    手机号 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="请输入手机号"
                    required
                    className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} register-input`}
                    disabled={loading || !apiAvailable}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>

                <div className="space-y-2 register-input-container">
                  <Label htmlFor="password" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>密码 *</Label>
                  <div className="relative" style={{ isolation: 'isolate' }}>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="请输入密码（至少6位）"
                      required
                      className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} pr-10 register-input`}
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', zIndex: 30, right: 0, top: 0 }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formData.password && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-foreground/70">密码强度:</span>
                      <span className={passwordStrength.color}>
                        {passwordStrength.text}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${
                            passwordStrength.strength <= 2 ? 'bg-red-500' :
                            passwordStrength.strength <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 register-input-container">
                  <Label htmlFor="confirmPassword" className={`${theme === 'light' ? 'text-gray-700' : 'text-foreground'}`}>确认密码 *</Label>
                  <div className="relative" style={{ isolation: 'isolate' }}>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="请再次输入密码"
                      required
                      className={`${theme === 'light' ? 'bg-white border-gray-300' : 'bg-background/50 border-border'} pr-10 register-input`}
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', zIndex: 30, right: 0, top: 0 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="flex items-center text-sm mt-1">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-500">密码匹配</span>
                        </>
                      ) : (
                          <span className="text-red-500">密码不匹配</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                <Button 
                  type="submit" 
                  className={`w-full ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'glow-effect tech-border'}`}
                  disabled={loading || checkingApi || !apiAvailable}
                  style={{ 
                    minHeight: isMobile ? '44px' : undefined,
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      注册中...
                    </span>
                  ) : checkingApi ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      检查服务...
                    </span>
                  ) : !apiAvailable ? (
                    "服务不可用"
                  ) : (
                    "注册"
                  )}
                </Button>
                </div>

                <div className="text-center">
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-foreground/80'}`}>
                    已有账户？{' '}
                    <Link 
                      to="/login" 
                      className={`${theme === 'light' ? 'text-blue-600 hover:text-blue-800' : 'text-primary hover:text-primary/80'} font-medium`}
                      style={{ position: 'relative', zIndex: 15 }}
                    >
                      立即登录
                    </Link>
                  </p>
                  
                  <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-foreground/70'}`}>
                    注册即表示您同意我们的{' '}
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

export default Register

