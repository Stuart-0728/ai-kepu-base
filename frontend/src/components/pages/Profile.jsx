import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import { AlertCircle, User, Mail, Phone, Calendar, Edit, Upload, Loader2, ServerCrash, Info, X, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../lib/utils'
import { toast } from 'sonner'
import { Badge } from '../ui/badge'

const statusMap = {
  'pending': { label: '待审核', color: 'outline' },
  'confirmed': { label: '已确认', color: 'default' },
  'cancelled': { label: '已取消', color: 'destructive' },
  'completed': { label: '已完成', color: 'success' }
}

const Profile = () => {
  const navigate = useNavigate()
  const { user, isLoggedIn, apiAvailable, updateUserProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [appointmentDetailLoading, setAppointmentDetailLoading] = useState(false)
  const [cancellingAppointment, setCancellingAppointment] = useState(false)
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    avatar: null
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isLoggedIn && user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: null
      })
      setAvatarPreview(user.avatar || '')
    } else if (!isLoggedIn) {
      navigate('/login')
    }
  }, [isLoggedIn, user, navigate])

  useEffect(() => {
    if (isLoggedIn && apiAvailable) {
      fetchAppointments()
    }
  }, [isLoggedIn, apiAvailable])

  const fetchAppointments = async () => {
    setAppointmentsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/appointments`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        setError(null)
      } else {
        console.error('获取预约记录失败: 服务器响应错误')
        setError('获取预约记录失败，请稍后重试')
        setAppointments([])
      }
    } catch (error) {
      console.error('获取预约记录失败:', error)
      setError('获取预约记录失败，请检查网络连接')
      setAppointments([])
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const fetchAppointmentDetail = async (appointmentId) => {
    setAppointmentDetailLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedAppointment(data);
      } else {
        toast.error('获取预约详情失败');
        console.error('获取预约详情失败: 服务器响应错误');
      }
    } catch (error) {
      toast.error('获取预约详情失败');
      console.error('获取预约详情失败:', error);
    } finally {
      setAppointmentDetailLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    setCancellingAppointment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('预约已成功取消');
        // 更新预约列表
        fetchAppointments();
        // 如果当前正在查看该预约的详情，关闭详情
        if (selectedAppointment && selectedAppointment.id === appointmentId) {
          setSelectedAppointment(null);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '取消预约失败');
      }
    } catch (error) {
      console.error('取消预约失败:', error);
      toast.error('取消预约失败，请稍后重试');
    } finally {
      setCancellingAppointment(false);
    }
  };

  const closeAppointmentDetail = () => {
    setSelectedAppointment(null);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfileData(prev => ({
        ...prev,
        avatar: file
      }))
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('username', profileData.username)
      formData.append('email', profileData.email)
      formData.append('phone', profileData.phone)
      
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar)
      }
      
      const result = await updateUserProfile(formData)
      
      if (result.success) {
        alert('个人资料更新成功')
      } else {
        alert(result.message || '更新失败，请稍后重试')
      }
    } catch (error) {
      console.error('更新个人资料失败:', error)
      alert('更新失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '未知时间'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">待审核</span>
      case 'approved':
      case 'confirmed':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">已通过</span>
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500">已拒绝</span>
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">已取消</span>
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500">已完成</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">未知状态</span>
    }
  }

  if (!isLoggedIn) {
    return null // 已在useEffect中处理重定向
  }

  if (!apiAvailable) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <ServerCrash className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">无法连接到服务器</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            当前无法连接到后端服务器，请检查网络连接或联系管理员。
          </p>
          <Button onClick={() => window.location.reload()}>
            重新加载页面
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">个人中心</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="appointments">预约记录</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
            <CardHeader>
                <CardTitle>个人资料</CardTitle>
                <CardDescription>查看和更新您的个人信息</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview} />
                        <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarChange}
                      />
                </div>
                    <p className="text-sm text-muted-foreground">点击图标更换头像</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-card/70 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="用户名"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">电子邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="电子邮箱"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">手机号码</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="手机号码（选填）"
                      />
                            </div>
                            
                    <div className="space-y-2">
                      <Label>注册时间</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-background">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {user?.created_at ? formatDate(user.created_at) : '未知'}
                        </span>
                            </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存更改'
                      )}
                    </Button>
                  </div>
                </form>
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>预约记录</CardTitle>
                <CardDescription>查看您的参观预约记录</CardDescription>
                </CardHeader>
                <CardContent>
                {appointmentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={fetchAppointments} 
                      className="mt-4"
                    >
                      重新加载
                    </Button>
                    </div>
                  ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无预约记录</h3>
                      <p className="text-muted-foreground mb-4">
                      您还没有提交过参观预约申请
                      </p>
                    <Button onClick={() => navigate('/appointment')}>
                      立即预约
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                      <Card key={appointment.id} className="overflow-hidden">
                        <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                {appointment.appointment_date} {appointment.appointment_time_slot}
                              </div>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                参观人数: {appointment.visitors_count} 人
                              </div>
                              <div className="flex items-center mt-1">
                                <User className="h-4 w-4 mr-2" />
                                联系人: {appointment.contact_name}
                              </div>
                              <div className="flex items-center mt-1">
                                <Phone className="h-4 w-4 mr-2" />
                                联系电话: {appointment.contact_phone}
                              </div>
                              {appointment.organization && (
                                <div className="flex items-center mt-1">
                                  <Mail className="h-4 w-4 mr-2" />
                                  所属单位: {appointment.organization}
                              </div>
                            )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              提交时间: {formatDate(appointment.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 self-end">
                            {appointment.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={cancellingAppointment}
                                onClick={() => {
                                  if (confirm('确定要取消此预约吗？')) {
                                    cancelAppointment(appointment.id);
                                  }
                                }}
                              >
                                {cancellingAppointment ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    取消中...
                                  </>
                                ) : '取消预约'}
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => fetchAppointmentDetail(appointment.id)}
                            >
                              查看详情
                            </Button>
                          </div>
                        </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      {/* 预约详情弹窗 */}
      {selectedAppointment && (
        <AppointmentDetailModal appointment={selectedAppointment} onClose={closeAppointmentDetail} />
      )}
    </div>
  )
}

const AppointmentDetailModal = ({ appointment, onClose }) => {
  if (!appointment) return null;

  // 获取状态对应的样式
  const status = statusMap[appointment.status] || { label: appointment.status, color: 'outline' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl my-8 overflow-hidden border border-border">
        <div className="p-6 bg-white">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-xl font-bold">预约详情</h3>
            <Badge variant={status.color}>
              {status.label}
            </Badge>
          </div>
          
          <div className="space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-md border">
              <div>
                <p className="text-sm text-muted-foreground">联系人</p>
                <p className="font-medium mt-1">{appointment.contact_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">联系电话</p>
                <p className="font-medium mt-1">{appointment.contact_phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">预约日期</p>
                <p className="font-medium mt-1">{appointment.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">预约时间段</p>
                <p className="font-medium mt-1">{appointment.time_slot}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">参观人数</p>
                <p className="font-medium mt-1">{appointment.visitor_count} 人</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="font-medium mt-1">{new Date(appointment.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            {appointment.admin_notes && (
              <div className="p-4 bg-white rounded-md border">
                <h4 className="font-medium mb-2">管理员备注</h4>
                <p className="text-sm">{appointment.admin_notes}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={onClose}
            >
              关闭
            </Button>
            
            {appointment.status === 'pending' && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm('确定要取消此预约吗？')) {
                    cancelAppointment(appointment.id);
                    onClose();
                  }
                }}
              >
                取消预约
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile


