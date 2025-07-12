import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Link, useLocation, useParams, useOutletContext, Outlet } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  Settings, 
  Users, 
  Calendar, 
  FileText,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Home,
  LogOut,
  User,
  AlertCircle,
  Download,
  Loader2,
  Clock,
  Lock,
  CheckCircle,
  Menu,
  Trash,
  Video,
  Upload,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../ui/alert-dialog'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { formatDate, formatTime } from '../../utils/dateUtils'
import { API_BASE_URL } from '../../lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Input } from '../ui/input'

// 导入管理组件
import NewsForm from './NewsForm'
import ActivityForm from './ActivityForm'
import AppointmentDetail from './AppointmentDetail'
import BackgroundVideoManagement from './BackgroundVideoManagement'

// 活动报名详情页面
const ActivityRegistrationsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchActivityDetails()
    fetchRegistrations()
  }, [id])

  const fetchActivityDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/${id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setActivity(data.activity)
      } else {
        setError('获取活动详情失败')
      }
    } catch (error) {
      console.error('获取活动详情失败:', error)
      setError('获取活动详情失败')
    }
  }

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/activities/${id}/registrations`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations || [])
      } else {
        setError('获取报名信息失败')
      }
    } catch (error) {
      console.error('获取报名信息失败:', error)
      setError('获取报名信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      window.location.href = `${API_BASE_URL}/api/admin/activities/${id}/export`
    } catch (error) {
      console.error('导出报名表失败:', error)
      toast.error('导出报名表失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">活动报名详情</h1>
            <p className="text-muted-foreground">查看活动报名情况</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/activities')}>
            返回活动列表
          </Button>
        </div>
        
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">活动报名详情</h1>
          <p className="text-muted-foreground">
            查看 "{activity?.title || '活动'}" 的报名情况
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/admin/activities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <Button variant="outline" onClick={() => navigate(`/admin/activities/edit/${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            编辑活动
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出报名表
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">活动信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">活动名称</h3>
              <p>{activity?.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">活动时间</h3>
              <p>{formatDate(activity?.start_time)} {formatTime(activity?.start_time)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">活动地点</h3>
              <p>{activity?.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">报名人数</h3>
              <p>{activity?.registered_count || 0} / {activity?.capacity || '不限'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">报名截止</h3>
              <p>{formatDate(activity?.registration_deadline)} {formatTime(activity?.registration_deadline)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">报名列表</CardTitle>
            <Badge variant="outline">{registrations.length} 人已报名</Badge>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无报名</h3>
                <p className="text-muted-foreground">
                  该活动目前还没有人报名
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户名</TableHead>
                      <TableHead>联系方式</TableHead>
                      <TableHead>报名时间</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>{reg.user_name}</TableCell>
                        <TableCell>{reg.contact_info || '未提供'}</TableCell>
                        <TableCell>{formatDate(reg.registration_time)} {formatTime(reg.registration_time)}</TableCell>
                        <TableCell>
                          <Badge variant={reg.status === 'registered' ? 'default' : 'outline'}>
                            {reg.status === 'registered' ? '已报名' : '已取消'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 管理员仪表盘
const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    total_users: 0,
    total_news: 0,
    total_activities: 0,
    pending_appointments: 0
  })
  const [users, setUsers] = useState([])
  const [news, setNews] = useState([])
  const [activities, setActivities] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'news' or 'activity'
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [appointmentCounts, setAppointmentCounts] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    total: 0
  })

  useEffect(() => {
    // 根据路径设置活跃标签
    const path = location.pathname
    if (path.includes('/admin/news')) {
      setActiveTab('news')
    } else if (path.includes('/admin/activities')) {
      setActiveTab('activities')
    } else if (path.includes('/admin/appointments')) {
      setActiveTab('appointments')
    } else if (path.includes('/admin/users')) {
      setActiveTab('users')
    } else if (path.includes('/admin/profile')) {
      setActiveTab('profile')
    } else if (path.includes('/admin/change-password')) {
      setActiveTab('change-password')
    } else if (path.includes('/admin/videos')) {
      setActiveTab('videos')
    } else {
      setActiveTab('dashboard')
    }
    
    fetchAdminData()
  }, [location.pathname])

  // 隐藏页脚
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = 'none';
    }
    
    return () => {
      if (footer) {
        footer.style.display = 'block';
      }
    };
  }, []);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: 'include'
      })
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }
  
  // 获取新闻列表
  const fetchNews = async () => {
    try {
      const newsResponse = await fetch(`${API_BASE_URL}/api/news?per_page=5`, {
        credentials: 'include'
      })
      if (newsResponse.ok) {
        const data = await newsResponse.json()
        setNews(data.news)
      }
    } catch (error) {
      console.error('获取新闻列表失败:', error)
    }
  }
  
  // 获取活动列表
  const fetchActivities = async () => {
    try {
      const activitiesResponse = await fetch(`${API_BASE_URL}/api/activities?per_page=5`, {
        credentials: 'include'
      })
      if (activitiesResponse.ok) {
        const data = await activitiesResponse.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('获取活动列表失败:', error)
    }
  }
  
  // 获取预约列表
  const fetchAppointments = async (status) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (status && status !== 'all') {
        queryParams.append('status', status)
      }
      
      queryParams.append('per_page', 20)
      
      const response = await fetch(`${API_BASE_URL}/api/appointments?${queryParams.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        
        // 更新各状态预约数量
        if (data.counts) {
          setAppointmentCounts(data.counts)
        }
      } else {
        console.error('获取预约列表失败: 服务器响应错误')
        toast.error('获取预约列表失败')
        setAppointments([])
      }
    } catch (error) {
      console.error('获取预约列表失败:', error)
      toast.error('获取预约列表失败')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchNews(),
        fetchActivities(),
        fetchAppointments()
      ])
    } catch (error) {
      console.error('获取管理员数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }
  
  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // 更新用户列表
        setUsers(users.filter(user => user.id !== userId));
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        toast.success('用户已删除');
      } else {
        toast.error('删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除用户失败');
    }
  };

  const handleDeleteNews = async (newsId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/news/${newsId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // 更新新闻列表
        setNews(news.filter(item => item.id !== newsId));
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        toast.success('新闻已删除');
      } else {
        toast.error('删除新闻失败');
      }
    } catch (error) {
      console.error('删除新闻失败:', error);
      toast.error('删除新闻失败');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/activities/${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // 更新活动列表
        setActivities(activities.filter(item => item.id !== activityId));
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        toast.success('活动已删除');
      } else {
        toast.error('删除活动失败');
      }
    } catch (error) {
      console.error('删除活动失败:', error);
      toast.error('删除活动失败');
    }
  };
  
  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users?per_page=5`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('获取用户失败:', error);
    }
  };
  
  const openDeleteDialog = (item, type) => {
    setItemToDelete(item)
    setDeleteType(type)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!itemToDelete || !deleteType) return
    
    try {
      setDeleteLoading(true)
      
      let url;
      if (deleteType === 'news') {
        url = `${API_BASE_URL}/api/admin/news/${itemToDelete.id}`;
      } else if (deleteType === 'activity') {
        url = `${API_BASE_URL}/api/admin/activities/${itemToDelete.id}`;
      } else if (deleteType === 'user') {
        url = `${API_BASE_URL}/api/admin/users/${itemToDelete.id}`;
      }
      
      console.log(`尝试删除${deleteType}，ID: ${itemToDelete.id}，URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        console.error('解析响应JSON失败:', err);
      }
      
      if (response.ok) {
        let successMessage = '';
        if (deleteType === 'news') {
          successMessage = '新闻已删除';
          window.dispatchEvent(new Event('news-deleted'));
          // 刷新新闻列表
          fetchNews();
        } else if (deleteType === 'activity') {
          successMessage = '活动已删除';
          window.dispatchEvent(new Event('activity-deleted'));
          // 刷新活动列表
          fetchActivities();
        } else if (deleteType === 'user') {
          successMessage = '用户已删除';
          // 刷新用户列表
          fetchUsers();
          // 触发用户删除事件
          window.dispatchEvent(new Event('user-deleted'));
        }
        // 刷新统计数据
        fetchStats();
        toast.success(successMessage);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        console.error(`删除${deleteType}失败:`, data);
        toast.error(data.error || `删除${deleteType}失败，请稍后重试`);
      }
    } catch (error) {
      console.error(`删除${deleteType}时出错:`, error);
      toast.error(`删除${deleteType}失败，请稍后重试`);
    } finally {
      setDeleteLoading(false);
    }
  }

  // 如果不是管理员，重定向到首页
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-4">权限不足</h1>
        <p className="text-muted-foreground mb-6">您没有访问管理后台的权限</p>
        <Button onClick={() => navigate('/')} className="glow-effect">
          返回首页
        </Button>
      </div>
    )
  }

  // 侧边栏项目
  const sidebarItems = [
    { id: 'dashboard', name: '控制面板', icon: <BarChart3 className="h-6 w-6" />, path: '/admin' },
    { id: 'news', name: '新闻管理', icon: <FileText className="h-6 w-6" />, path: '/admin/news' },
    { id: 'activities', name: '活动管理', icon: <Calendar className="h-6 w-6" />, path: '/admin/activities' },
    { id: 'appointments', name: '预约管理', icon: <Calendar className="h-6 w-6" />, path: '/admin/appointments' },
    { id: 'users', name: '用户管理', icon: <Users className="h-6 w-6" />, path: '/admin/users' },
    { id: 'profile', name: '个人资料', icon: <User className="h-6 w-6" />, path: '/admin/profile' },
    { id: 'change-password', name: '修改密码', icon: <Lock className="h-6 w-6" />, path: '/admin/change-password' },
    { id: 'videos', name: '背景视频', icon: <Video className="h-6 w-6" />, path: '/admin/videos' },
  ]

  // 全局添加一个自定义样式类
  const actionButtonClass = "h-12 w-12 md:h-12 md:w-12 p-2 text-base";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* 移动端顶部导航 */}
      <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.username}</div>
            <div className="text-xs text-muted-foreground">管理员</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="admin-action-button md:h-10 md:w-10"
            >
              <Menu className="admin-action-icon md:h-5 md:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>管理菜单</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sidebarItems.map((item) => (
              <DropdownMenuItem 
                key={item.id} 
                onClick={() => {
                  navigate(item.path);
                  setActiveTab(item.id);
                }}
                className={activeTab === item.id ? "bg-primary/10 text-primary" : ""}
              >
                <div className="mr-2 flex items-center justify-center">
                  {React.cloneElement(item.icon, { className: "h-6 w-6" })}
                </div>
                <span className="text-base">{item.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/')} className="py-2">
              <Home className="h-6 w-6 mr-2" />
              <span className="text-base">返回首页</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="py-2">
              <LogOut className="h-6 w-6 mr-2" />
              <span className="text-base">退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 侧边栏 - 桌面端 */}
      <div className="hidden md:flex w-64 bg-card border-r border-border flex-col h-screen fixed">
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user?.username}</div>
              <div className="text-xs text-muted-foreground">管理员</div>
            </div>
          </div>
        </div>
        
        {/* 侧边栏菜单 */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="space-y-1 px-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm relative transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <div className="mr-3">
                  {item.icon}
                </div>
                <span>{item.name}</span>
                {activeTab === item.id && (
                  <motion.div
                    className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                    layoutId="sidebar-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                {activeTab === item.id && (
                  <motion.div
                    className="absolute inset-0 border-2 border-primary rounded-md"
                    layoutId="sidebar-frame"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-center mt-2"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="md:ml-64 flex-1 min-h-screen">
        <div className="p-4 md:p-8 pb-20">
          <Routes>
            <Route index element={
              <DashboardHome 
                stats={stats} 
                users={users} 
                news={news} 
                activities={activities} 
                appointments={appointments} 
                loading={loading} 
              />
            } />
            <Route path="/news" element={<NewsManagement openDeleteDialog={openDeleteDialog} />} />
            <Route path="/news/create" element={<NewsForm />} />
            <Route path="/news/edit/:id" element={<NewsForm />} />
            <Route path="/activities" element={<ActivitiesManagement openDeleteDialog={openDeleteDialog} />} />
            <Route path="/activities/create" element={<ActivityForm />} />
            <Route path="/activities/edit/:id" element={<ActivityForm />} />
            <Route path="/activities/registrations/:id" element={<ActivityRegistrationsDetail />} />
            <Route path="/appointments" element={<AppointmentsManagement />} />
            <Route path="/appointments/:id" element={<AppointmentDetail />} />
            <Route path="/users" element={<UsersManagement openDeleteDialog={openDeleteDialog} />} />
            <Route path="/users/edit/:id" element={<UserForm />} />
            <Route path="/profile" element={<AdminProfile user={user} />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/videos" element={<BackgroundVideoManagement />} />
          </Routes>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        // 如果正在加载，不允许关闭对话框
        if (deleteLoading && !open) return;
        setDeleteDialogOpen(open);
      }}>
        <AlertDialogContent className="bg-background border-2 shadow-lg p-6 backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-2">
              {deleteType === 'news' && '您确定要删除这篇新闻吗？此操作无法撤销。'}
              {deleteType === 'activity' && '您确定要删除这个活动吗？此操作无法撤销，且会删除所有相关的报名记录。'}
              {deleteType === 'user' && '您确定要删除这个用户吗？此操作无法撤销。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={deleteLoading} className="bg-background">取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 控制面板首页
const DashboardHome = ({ stats, users, news, activities, appointments, loading }) => {
  const navigate = useNavigate()
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">控制面板</h1>
        <p className="text-muted-foreground">管理您的网站内容和用户</p>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <Users className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">用户总数</p>
            <h3 className="text-3xl font-bold">{stats.total_users}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">新闻总数</p>
            <h3 className="text-3xl font-bold">{stats.total_news}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">活动总数</p>
            <h3 className="text-3xl font-bold">{stats.total_activities}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">待处理预约</p>
            <h3 className="text-3xl font-bold">{stats.pending_appointments}</h3>
          </CardContent>
        </Card>
      </div>
      
      {/* 最近用户 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>最近用户</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
              查看全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div className="ml-4 space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              暂无用户数据
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {user.role === 'admin' ? '管理员' : '用户'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// 用户管理
const UsersManagement = ({ openDeleteDialog }) => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUsers()
    
    // 添加事件监听器，监听用户删除事件
    const handleUserDeleted = () => {
      fetchUsers()
    }
    
    window.addEventListener('user-deleted', handleUserDeleted)
    
    return () => {
      window.removeEventListener('user-deleted', handleUserDeleted)
    }
  }, [])
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/users?per_page=5`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('获取用户失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">用户管理</h1>
          <p className="text-muted-foreground">管理网站用户</p>
        </div>
        {/* 移除创建用户按钮，因为没有实际功能 */}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无用户</h3>
              <p className="text-muted-foreground mb-4">
                系统中还没有注册用户
              </p>
              {/* 移除创建用户按钮 */}
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="p-4 flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium">{user.username}</h4>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Badge variant="outline" className="mr-2">
                        {user.role === 'admin' ? '管理员' : '用户'}
                      </Badge>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(`/admin/users/edit/${user.id}`)} 
                      className="admin-action-button"
                    >
                      <Edit className="admin-action-icon" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => openDeleteDialog(user, 'user')}
                      className="admin-action-button destructive"
                    >
                      <Trash className="admin-action-icon" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// 预约管理组件
const AppointmentsManagement = () => {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [counts, setCounts] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  })
  
  useEffect(() => {
    fetchAppointments(activeTab)
  }, [activeTab])
  
  const fetchAppointments = async (status) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      if (status && status !== 'all') {
        queryParams.append('status', status)
      }
      
      queryParams.append('per_page', 20)
      
      const response = await fetch(`${API_BASE_URL}/api/appointments?${queryParams.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        
        // 更新各状态预约数量
        if (data.counts) {
          setCounts(data.counts)
        }
      } else {
        console.error('获取预约列表失败: 服务器响应错误')
        toast.error('获取预约列表失败')
        setAppointments([])
      }
    } catch (error) {
      console.error('获取预约列表失败:', error)
      toast.error('获取预约列表失败')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">待审批</Badge>
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">待接待</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">已完成</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">已取消</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">预约管理</h1>
          <p className="text-muted-foreground">管理参观预约申请</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="pending" className="relative">
            待审批
            {counts.pending > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="relative">
            待接待
            {counts.confirmed > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                {counts.confirmed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            已完成
            {counts.completed > 0 && (
              <Badge className="ml-2 bg-green-500 text-white absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                {counts.completed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
              ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无{activeTab === 'pending' ? '待审批' : activeTab === 'confirmed' ? '待接待' : '已完成'}预约</h3>
              <p className="text-muted-foreground mb-4">
                    {activeTab === 'pending' 
                      ? '当前没有需要审批的预约申请' 
                      : activeTab === 'confirmed' 
                        ? '当前没有待接待的预约' 
                        : '当前没有已完成的预约记录'}
                  </p>
            </div>
          ) : (
            <div className="divide-y">
                  {appointments.map((item) => (
                <div key={item.id} className="p-4 flex items-center">
                  <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium mr-2">{item.contact_name}</h4>
                          {getStatusBadge(item.status)}
                    </div>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>预约日期: {formatDate(item.date)}</span>
                  </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>时间段: {item.time_slot}</span>
                  </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>参观人数: {item.visitor_count}人</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/appointments/${item.id}`)}>
                        查看详情
                      </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </Tabs>
    </div>
  )
}

// 管理员个人资料
const AdminProfile = ({ user }) => {
  const navigate = useNavigate()
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">个人资料</h1>
        <p className="text-muted-foreground">管理您的个人资料</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user?.username}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 修改密码组件
const ChangePassword = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 验证表单
    if (!formData.currentPassword) {
      setError('请输入当前密码')
      return
    }
    
    if (!formData.newPassword) {
      setError('请输入新密码')
      return
    }
    
    if (formData.newPassword.length < 6) {
      setError('新密码长度不能少于6位')
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        })
      })
      
      if (response.ok) {
        setSuccess(true)
        toast.success('密码修改成功')
        // 清空表单
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const data = await response.json()
        setError(data.error || '密码修改失败')
        toast.error(data.error || '密码修改失败')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      setError('修改密码失败，请稍后重试')
      toast.error('修改密码失败，请稍后重试')
    } finally {
      setLoading(false)
  }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">修改密码</h1>
          <p className="text-muted-foreground">更新您的账户密码</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          返回仪表盘
        </Button>
      </div>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>请输入您的当前密码和新密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="请输入当前密码"
              />
                  </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="请输入新密码"
              />
                </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入新密码"
              />
            </div>
            
            {error && (
              <div className="text-destructive text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
            </div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                密码修改成功
            </div>
          )}
          
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : '修改密码'}
                </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// 用户编辑表单组件
const UserForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState({
    username: '',
    email: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isSelf, setIsSelf] = useState(false)
  const [canEditRole, setCanEditRole] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取用户信息失败')
        }
        
        const data = await response.json()
        setUser(data.user)
        
        // 检查是否为当前登录用户
        if (currentUser && parseInt(id) === currentUser.id) {
          setIsSelf(true)
        }
        
        // 只有用户名为 admin 的管理员可以修改角色
        if (currentUser && currentUser.username === 'admin') {
          setCanEditRole(true)
        }
      } catch (err) {
        console.error('获取用户信息失败:', err)
        setError(err.message || '获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchUser()
    }
  }, [id, currentUser])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // 如果是自己，不允许修改角色为普通用户
    if (isSelf && name === 'role' && value === 'user') {
      toast.error('不能将自己的角色降级为普通用户')
      return
    }
    
    // 如果不是 admin 用户名，不允许修改角色
    if (name === 'role' && !canEditRole) {
      toast.error('只有 admin 账号可以修改用户角色')
      return
    }
    
    setUser(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 再次验证：如果是自己且尝试将角色改为普通用户，则阻止
    if (isSelf && user.role === 'user') {
      setError('不能将自己的角色降级为普通用户')
      toast.error('不能将自己的角色降级为普通用户')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(user)
      })
      
      if (response.ok) {
        toast.success('用户信息更新成功')
        navigate('/admin/users')
      } else {
        const data = await response.json()
        setError(data.error || '更新用户信息失败')
      }
    } catch (err) {
      console.error('更新用户信息失败:', err)
      setError('更新用户信息失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
                </div>
              </div>
              
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              ))}
                </div>
          </CardContent>
        </Card>
    </div>
  )
}

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold mb-2">编辑用户</h1>
          <p className="text-muted-foreground">更新用户信息</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回用户列表
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                value={user.username}
                onChange={handleChange}
                placeholder="请输入用户名"
                required
              />
          </div>
          
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user.email}
                onChange={handleChange}
                placeholder="请输入邮箱"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <select
                id="role"
                name="role"
                value={user.role}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                disabled={isSelf || !canEditRole} // 如果是自己或者不是admin用户，禁用角色选择
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
              {isSelf && (
                <p className="text-sm text-amber-600 mt-1">不能修改自己的角色</p>
              )}
              {!canEditRole && !isSelf && (
                <p className="text-sm text-amber-600 mt-1">只有 admin 账号可以修改用户角色</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// 新闻管理组件
const NewsManagement = ({ openDeleteDialog }) => {
  const navigate = useNavigate()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchNews()
    
    // 添加事件监听器，监听新闻删除事件
    const handleNewsDeleted = () => {
      fetchNews()
    }
    
    window.addEventListener('news-deleted', handleNewsDeleted)
    
    return () => {
      window.removeEventListener('news-deleted', handleNewsDeleted)
    }
  }, [])
  
  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/news?per_page=5`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNews(data.news)
      }
    } catch (error) {
      console.error('获取新闻失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">新闻管理</h1>
          <p className="text-muted-foreground">创建和管理网站新闻</p>
        </div>
        
        <Button onClick={() => navigate('/admin/news/create')} variant="ghost" size="icon" className="admin-action-button">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无新闻</h3>
              <p className="text-muted-foreground mb-4">
                开始创建您的第一个新闻
              </p>
              <Button onClick={() => navigate('/admin/news/create')}>
                <Plus className="h-4 w-4 mr-2" />
                创建新闻
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {news.map((newsItem) => (
                <div key={newsItem.id} className="p-4 flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium">{newsItem.title}</h4>
                    <p className="text-sm text-muted-foreground">{newsItem.summary}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(newsItem.created_at)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(`/admin/news/edit/${newsItem.id}`)} 
                      className="admin-action-button"
                    >
                      <Edit className="admin-action-icon" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => openDeleteDialog(newsItem, 'news')}
                      className="admin-action-button destructive"
                    >
                      <Trash className="admin-action-icon" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// 活动管理组件
const ActivitiesManagement = ({ openDeleteDialog }) => {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 移除这个变量，使用admin-action-button类替代
  // const actionButtonClass = "h-10 w-10 md:h-10 md:w-10 p-2 text-base";
  
  useEffect(() => {
    fetchActivities()
    
    // 添加事件监听器，监听活动删除事件
    const handleActivityDeleted = () => {
      fetchActivities()
    }
    
    window.addEventListener('activity-deleted', handleActivityDeleted)
    
    return () => {
      window.removeEventListener('activity-deleted', handleActivityDeleted)
    }
  }, [])
  
  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/activities?per_page=5`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('获取活动失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">活动管理</h1>
          <p className="text-muted-foreground">创建和管理科普活动</p>
        </div>
        
        <Button onClick={() => navigate('/admin/activities/create')} variant="ghost" size="icon" className="admin-action-button">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无活动</h3>
              <p className="text-muted-foreground mb-4">
                开始创建您的第一个活动
              </p>
              <Button onClick={() => navigate('/admin/activities/create')}>
                <Plus className="h-4 w-4 mr-2" />
                创建活动
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.start_time)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(`/admin/activities/edit/${activity.id}`)} 
                      className="admin-action-button"
                    >
                      <Edit className="admin-action-icon" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => navigate(`/admin/activities/registrations/${activity.id}`)}
                      className="admin-action-button"
                    >
                      <Users className="admin-action-icon" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => openDeleteDialog(activity, 'activity')}
                      className="admin-action-button destructive"
                    >
                      <Trash className="admin-action-icon" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard