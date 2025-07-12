import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)
  const [error, setError] = useState(null)

  // 检查API是否可用
  useEffect(() => {
    checkApiAvailability()
  }, [])

  // 检查用户登录状态
  useEffect(() => {
    if (apiAvailable) {
    checkAuthStatus()
    } else {
      setLoading(false)
    }
  }, [apiAvailable])

  const checkApiAvailability = async () => {
    try {
      console.log('开始检查API可用性...')
      const response = await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
        credentials: 'include'
      })
      
      setApiAvailable(response.ok)
      console.log('API可用性检查:', response.ok ? '可用' : '不可用', response.status)
      
      if (!response.ok) {
        setError('API服务器连接失败，请检查后端服务是否已启动')
      } else {
        setError(null)
      }
    } catch (error) {
      console.error('API可用性检查失败:', error)
      setApiAvailable(false)
      setError('API服务器连接失败，请检查网络连接')
    }
  }

  const checkAuthStatus = async () => {
    try {
      console.log('开始检查用户登录状态...')
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
        credentials: 'include'
      })
      console.log('用户状态检查响应:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('用户数据:', data)
        setUser(data.user)
      } else {
        console.log('用户未登录或会话已过期')
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    if (!apiAvailable) {
      return { success: false, message: 'API服务器连接失败，请稍后重试' }
    }

    try {
      console.log('尝试登录:', username)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      console.log('登录响应状态:', response.status)
      const data = await response.json()

      if (response.ok) {
        console.log('登录成功:', data)
        setUser(data.user)
        return { success: true, message: data.message || '登录成功' }
      } else {
        console.error('登录失败:', data)
        return { success: false, message: data.error || '用户名或密码错误' }
      }
    } catch (error) {
      console.error('登录请求失败:', error)
      return { success: false, message: '登录失败，请检查网络连接' }
    }
  }

  const register = async (userData) => {
    if (!apiAvailable) {
      return { success: false, message: 'API服务器连接失败，请稍后重试' }
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true, message: data.message || '注册成功' }
      } else {
        return { success: false, message: data.error || '注册失败' }
      }
    } catch (error) {
      return { success: false, message: '注册失败，请检查网络连接' }
    }
  }

  const logout = async () => {
    if (!apiAvailable) {
      return { success: false, message: 'API服务器连接失败，请稍后重试' }
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      return { success: true, message: '已成功退出登录' }
    } catch (error) {
      console.error('退出登录失败:', error)
      return { success: false, message: '退出失败，请稍后重试' }
    }
  }

  const updateProfile = async (profileData) => {
    if (!apiAvailable) {
      return { success: false, message: 'API服务器连接失败，请稍后重试' }
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true, message: data.message || '更新成功' }
      } else {
        return { success: false, message: data.error || '更新失败' }
      }
    } catch (error) {
      return { success: false, message: '更新失败，请检查网络连接' }
    }
  }

  const value = {
    user,
    loading,
    apiAvailable,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

