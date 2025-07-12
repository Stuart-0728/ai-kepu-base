import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Calendar, Clock, Users, MapPin, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../lib/utils'
import { toast } from 'sonner'

const Appointment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoggedIn } = useAuth()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [formData, setFormData] = useState({
    visitors_count: 1,
    contact_name: '',
    contact_phone: '',
    organization: '',
    purpose: ''
  })

  // 组件挂载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact_name: user.username,
        contact_phone: user.phone || ''
      }))
    }
  }, [user])

  // 当选择日期时，获取可用的时间段
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots(selectedDate);
    } else {
      setAvailableTimeSlots([]);
      setSelectedTimeSlot('');
    }
  }, [selectedDate]);

  // 获取指定日期的可用时间段
  const fetchAvailableTimeSlots = async (date) => {
    setLoadingTimeSlots(true);
    setSelectedTimeSlot('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/available-slots?date=${date}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTimeSlots(data.available_slots || []);
        
        if (data.available_slots && data.available_slots.length === 0) {
          toast.warning('该日期没有可用的时间段');
        }
      } else {
        console.error('获取可用时间段失败');
        toast.error('获取可用时间段失败');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('获取可用时间段失败:', error);
      toast.error('获取可用时间段失败，请检查网络连接');
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedDate || !selectedTimeSlot) {
      toast.error('请选择预约日期和时间段');
      return
    }

    setSubmitting(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          appointment_date: selectedDate,
          appointment_time_slot: selectedTimeSlot,
          visitors_count: formData.visitors_count,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          organization: formData.organization || ''
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('预约提交成功！请等待审核。');
        navigate('/profile')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '预约失败');
      }
    } catch (error) {
      console.error('预约失败:', error)
      toast.error('预约失败，请稍后重试');
    } finally {
      setSubmitting(false)
    }
  }

  // 格式化日期时间，使用中国时区
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    // 创建日期对象并指定为北京时间
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      timeZone: 'Asia/Shanghai',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 生成未来30天的日期选项（包括周末）
  const getAvailableDates = () => {
    const dates = []
    // 使用北京时间
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    
    // 从明天开始，生成未来30天的日期选项
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // 包括所有日期，不再排除周末
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('zh-CN', { 
          timeZone: 'Asia/Shanghai',
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })
      })
    }
    
    return dates
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <Calendar className="h-12 w-12 text-primary float-effect" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            预约参观
          </h1>
          <p className="text-xl text-muted-foreground">
            欢迎个人、家庭和团体预约参观科普基地，体验前沿科技魅力
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="tech-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-medium">开放时间</div>
              <div className="text-sm text-muted-foreground">
                周一至周日<br />9:00-17:00
              </div>
            </CardContent>
          </Card>
          
          <Card className="tech-border">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-medium">参观方式</div>
              <div className="text-sm text-muted-foreground">
                免费参观<br />需提前预约
              </div>
            </CardContent>
          </Card>
          
          <Card className="tech-border">
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-medium">参观地点</div>
              <div className="text-sm text-muted-foreground">
                重庆师范大学<br />重庆市沙坪坝区人工智能科普基地
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="tech-border">
            <CardHeader>
              <CardTitle className="gradient-text">预约信息</CardTitle>
              <CardDescription>
                请填写以下信息完成预约，我们会在1个工作日内审核您的申请
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label htmlFor="date">预约日期 *</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择预约日期" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDates().map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-2">
                  <Label htmlFor="timeSlot">时间段 *</Label>
                  <Select 
                    value={selectedTimeSlot} 
                    onValueChange={setSelectedTimeSlot}
                    disabled={!selectedDate || loadingTimeSlots || availableTimeSlots.length === 0}
                  >
                    <SelectTrigger>
                      {loadingTimeSlots ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>加载中...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={!selectedDate ? "请先选择日期" : availableTimeSlots.length === 0 ? "该日期无可用时间段" : "选择时间段"} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot.time_slot} value={slot.time_slot}>
                          {slot.time_slot} (剩余名额: {slot.available_count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visitors Count */}
                <div className="space-y-2">
                  <Label htmlFor="visitors_count">参观人数 *</Label>
                  <Input
                    id="visitors_count"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.visitors_count}
                    onChange={(e) => {
                      // 确保输入值是有效的正整数
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        handleInputChange('visitors_count', value);
                      } else if (e.target.value === '') {
                        // 允许清空输入框
                        handleInputChange('visitors_count', '');
                      }
                    }}
                    placeholder="请输入参观人数"
                    required
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">联系人姓名 *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      placeholder="请输入联系人姓名"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">联系电话 *</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="请输入联系电话"
                      required
                    />
                  </div>
                </div>

                {/* Organization */}
                <div className="space-y-2">
                  <Label htmlFor="organization">所属单位/学校</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="请输入所属单位或学校（选填）"
                  />
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">参观目的</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    placeholder="请简要说明参观目的（选填）"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {isLoggedIn ? (
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      disabled={submitting || !selectedDate || !selectedTimeSlot}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>提交中...</span>
                        </>
                      ) : (
                        <>
                          提交预约
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      onClick={() => navigate('/login')}
                      className="glow-effect flex-1 border-2 border-primary/50 shadow-lg"
                    >
                      登录后预约
                    </Button>
                  )}
                </div>

                {/* Notice */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <div className="font-medium mb-1">预约须知：</div>
                      <ul className="space-y-1">
                        <li>• 预约成功后，我们会在1个工作日内电话确认</li>
                        <li>• 参观当天请携带有效身份证件</li>
                        <li>• 请提前10分钟到达基地入口</li>
                        <li>• 如需取消或修改预约，请提前1天联系我们</li>
                        <li>• 联系电话：023-65362000</li>
                      </ul>
                    </div>
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

export default Appointment

