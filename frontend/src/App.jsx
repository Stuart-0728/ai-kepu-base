import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

// 组件导入
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/pages/Home'
import About from './components/pages/About'
import News from './components/pages/News'
import NewsDetail from './components/pages/NewsDetail'
import Activities from './components/pages/Activities'
import ActivityDetail from './components/pages/ActivityDetail'
import Appointment from './components/pages/Appointment'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import Profile from './components/pages/Profile'
import AdminDashboard from './components/pages/AdminDashboard'

function App() {
  const [apiStatus, setApiStatus] = useState(null)
  const [apiCheckAttempted, setApiCheckAttempted] = useState(false)

  // 测试API连接
  useEffect(() => {
    const testApiConnection = async () => {
      if (apiCheckAttempted) return; // 只尝试一次API连接检查
      
      try {
        setApiCheckAttempted(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch('/api/test', { 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setApiStatus({ connected: true, message: data.message });
          console.log('API连接成功:', data);
        } else {
          setApiStatus({ connected: false, message: '服务器响应错误' });
          console.error('API连接失败: 服务器响应错误');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          setApiStatus({ connected: false, message: '连接超时' });
          console.error('API连接失败: 连接超时');
        } else {
          setApiStatus({ connected: false, message: error.message });
          console.error('API连接失败:', error);
        }
      }
    };

    testApiConnection();
  }, [apiCheckAttempted]);

  return (
        <div className={`min-h-screen flex flex-col`}>
            <Header />
          
          {apiStatus && !apiStatus.connected && (
            <div className="bg-destructive/20 p-2 text-center">
              <p className="text-destructive text-sm">
                无法连接到API服务器: {apiStatus.message}。请确保后端服务已启动。
              </p>
            </div>
          )}
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/activities/:id" element={<ActivityDetail />} />
              <Route path="/appointment" element={<Appointment />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
  )
}

export default App

