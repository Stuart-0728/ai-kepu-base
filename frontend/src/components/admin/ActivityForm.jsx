import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { AlertCircle, Calendar, Clock, Upload, CheckCircle, ArrowLeft, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { Calendar as CalendarComponent } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { format, parseISO } from 'date-fns'
import { cn, API_BASE_URL } from '../../lib/utils'
import { Switch } from '../ui/switch'
import { toast } from 'sonner'
import axios from 'axios'

const ActivityForm = ({ activityId = null, onSuccess }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: activityIdFromParams } = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '18:00',
    location: '',
    speaker: '',
    capacity: 30,
    registration_deadline_date: '',
    registration_deadline_time: '23:59',
    category: 'general',
    customCategory: '',
    allow_registration: true
  })

  useEffect(() => {
    fetchCategories()
    if (activityIdFromParams) {
      fetchActivityDetails()
    }
  }, [activityIdFromParams])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/categories`)
      if (response.ok) {
        const data = await response.json()
        // 将英文类别转换为中文显示
        const translatedCategories = data.categories.map(cat => ({
          ...cat,
          label: translateCategory(cat.label || cat.value)
        }))
        setCategories(translatedCategories)
      }
    } catch (error) {
      console.error('获取活动分类失败:', error)
    }
  }

  // 类别翻译函数
  const translateCategory = (category) => {
    const translations = {
      'general': '通用',
      'workshop': '工作坊',
      'lecture': '讲座',
      'exhibition': '展览',
      'competition': '比赛',
      'other': '其他'
    }
    return translations[category] || category
  }

  const fetchActivityDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${API_BASE_URL}/api/activities/${activityIdFromParams}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const activity = data.activity
        
        console.log('获取到活动数据:', activity);
        
        // 格式化日期和时间
        const formatDate = (isoString) => {
          if (!isoString) return ''
          const date = new Date(isoString)
          return date.toISOString().split('T')[0] // 格式为 YYYY-MM-DD
        }
        
        const formatTime = (isoString) => {
          if (!isoString) return ''
          const date = new Date(isoString)
          return date.toTimeString().slice(0, 5) // 格式为 HH:MM
        }
        
        // 检查是否是自定义类别
        const isCustomCategory = categories.length > 0 && !categories.some(cat => cat.value === activity.category);
        
        setFormData({
          title: activity.title || '',
          description: activity.description || '',
          start_date: formatDate(activity.start_time),
          start_time: formatTime(activity.start_time),
          end_date: formatDate(activity.end_time),
          end_time: formatTime(activity.end_time),
          location: activity.location || '',
          speaker: activity.speaker || '',
          capacity: activity.capacity || 30,
          registration_deadline_date: formatDate(activity.registration_deadline),
          registration_deadline_time: formatTime(activity.registration_deadline),
          category: isCustomCategory ? 'custom' : activity.category,
          customCategory: isCustomCategory ? activity.category : '',
          allow_registration: activity.status !== 'inactive'
        })
        
        if (activity.image_url) {
          setImagePreview(`${API_BASE_URL}${activity.image_url}`)
        }
      } else {
        setError('获取活动详情失败')
        toast.error('获取活动详情失败')
      }
    } catch (error) {
      console.error('获取活动详情失败:', error)
      setError('获取活动详情失败')
      toast.error('获取活动详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleDateChange = (name, date) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, [name]: formattedDate }))
    }
  }
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }
  
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      
      // 验证表单
      if (!formData.title.trim()) {
        setError('请输入活动标题')
        toast.error('请输入活动标题')
        return
      }
      
      if (!formData.description.trim()) {
        setError('请输入活动描述')
        toast.error('请输入活动描述')
        return
      }
      
      if (!formData.start_date) {
        setError('请选择开始日期')
        toast.error('请选择开始日期')
        return
      }
      
      if (!formData.end_date) {
        setError('请选择结束日期')
        toast.error('请选择结束日期')
        return
      }
      
      if (!formData.location) {
        setError('请输入活动地点')
        toast.error('请输入活动地点')
        return
      }
      
      // 处理类别
      const categoryValue = formData.category === 'custom' ? formData.customCategory : formData.category
      
      // 准备提交数据 - 使用JSON格式
      const jsonData = {
        title: formData.title,
        description: formData.description,
        start_time: `${formData.start_date}T${formData.start_time}:00`,
        end_time: `${formData.end_date}T${formData.end_time}:00`,
        location: formData.location,
        speaker: formData.speaker,
        capacity: parseInt(formData.capacity),
        registration_deadline: `${formData.registration_deadline_date}T${formData.registration_deadline_time}:00`,
        category: categoryValue,
        allow_registration: formData.allow_registration
      }
      
      // 如果有图片，先上传图片
      if (imageFile) {
        try {
          const formData = new FormData()
          formData.append('image', imageFile)
          
          const uploadResponse = await axios.post(`${API_BASE_URL}/api/admin/upload/activity/image`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
          })
          
          if (uploadResponse.data && uploadResponse.data.image && uploadResponse.data.image.url) {
            jsonData.image_url = uploadResponse.data.image.url
          }
        } catch (error) {
          console.error('上传图片失败:', error)
          toast.error('上传图片失败', {
            description: error.response?.data?.error || '请稍后重试'
          })
          // 继续提交其他数据，即使图片上传失败
        }
      }
      
      // 发送请求
      const url = activityIdFromParams 
        ? `${API_BASE_URL}/api/admin/activities/${activityIdFromParams}`
        : `${API_BASE_URL}/api/admin/activities`
      
      const method = activityIdFromParams ? 'PUT' : 'POST'
      
      const response = await axios({
        method,
        url,
        data: jsonData,
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      
      if (response.status === 200 || response.status === 201) {
        toast.success(activityIdFromParams ? '活动更新成功' : '活动创建成功')
        
        if (onSuccess) {
          onSuccess(response.data.activity_id)
        } else {
          navigate('/admin/activities')
        }
      } else {
        setError(response.data.error || '提交失败')
        toast.error(response.data.error || '提交失败')
      }
    } catch (error) {
      console.error('提交活动表单失败:', error)
      setError(error.response?.data?.error || '提交失败，请稍后重试')
      toast.error(error.response?.data?.error || '提交失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto tech-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{activityIdFromParams ? '编辑活动' : '创建活动'}</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGoBack} 
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> 返回
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">活动标题</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="请输入活动标题"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">活动描述</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入活动描述"
              rows={6}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(new Date(formData.start_date), 'yyyy年MM月dd日') : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => handleDateChange('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start_time">开始时间</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="start_time"
                name="start_time"
                  type="time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(new Date(formData.end_date), 'yyyy年MM月dd日') : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.end_date ? new Date(formData.end_date) : undefined}
                    onSelect={(date) => handleDateChange('end_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">结束时间</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="end_time"
                name="end_time"
                  type="time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">活动地点</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="请输入活动地点"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speaker">主讲人</Label>
              <Input
                id="speaker"
                name="speaker"
                value={formData.speaker}
                onChange={handleChange}
                placeholder="请输入主讲人（可选）"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">人数上限</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">活动类别</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger className="bg-background border-2 shadow-sm">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 shadow-md z-50">
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value} className="hover:bg-accent">
                      {category.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="hover:bg-accent">自定义类别</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.category === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">自定义类别</Label>
                <Input
                  id="customCategory"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  placeholder="请输入自定义类别"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2 border-2 border-primary/20 rounded-md p-3 bg-primary/5">
            <div className="flex items-center justify-between">
              <Label htmlFor="allow_registration" className="text-base font-medium flex items-center">
                {formData.allow_registration ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                )}
                可否报名
              </Label>
              <Switch
                id="allow_registration"
                checked={formData.allow_registration}
                onCheckedChange={(checked) => handleSwitchChange('allow_registration', checked)}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formData.allow_registration ? "用户可以报名参加此活动" : "用户无法报名参加此活动"}
            </p>
          </div>
          
          {formData.allow_registration && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>报名截止日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.registration_deadline_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.registration_deadline_date ? format(new Date(formData.registration_deadline_date), 'yyyy年MM月dd日') : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.registration_deadline_date ? new Date(formData.registration_deadline_date) : undefined}
                      onSelect={(date) => handleDateChange('registration_deadline_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
          </div>
          
          <div className="space-y-2">
                <Label htmlFor="registration_deadline_time">报名截止时间</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
                    id="registration_deadline_time"
                    name="registration_deadline_time"
                    type="time"
                    value={formData.registration_deadline_time}
              onChange={handleChange}
                    required={formData.allow_registration}
            />
          </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="image">活动图片</Label>
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
            <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="max-w-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview('')
                  }}
                  disabled={!imagePreview}
                >
                  清除
                </Button>
              </div>
              
              {imagePreview && (
                <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md border">
                  <img
                    src={imagePreview}
                    alt="活动图片预览"
                    className="h-full w-full object-cover"
            />
                </div>
              )}
            </div>
          </div>
          
          <CardFooter className="px-0 pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="glow-effect bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? '提交中...' : activityIdFromParams ? '更新活动' : '创建活动'}
              <Upload className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}

export default ActivityForm 