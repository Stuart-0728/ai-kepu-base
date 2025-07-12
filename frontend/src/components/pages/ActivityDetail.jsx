import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../lib/utils'
import { formatDate, formatTime, formatDateTime } from '../../utils/dateUtils'

const ActivityDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState(null)
  
  // 判断当前用户是否为管理员
  const isAdmin = user && user.role === 'admin'

  useEffect(() => {
    fetchActivityDetail()
    // 页面加载时滚动到顶部
    window.scrollTo(0, 0)
  }, [id])

  const fetchActivityDetail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/${id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('获取活动详情成功:', data)
        console.log('活动报名状态:', data.activity.is_registered)
        setActivity(data.activity)
      } else if (response.status === 404) {
        setError('活动不存在')
      } else {
        setError('获取活动详情失败')
      }
    } catch (error) {
      console.error('获取活动详情失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnUrl: `/activities/${id}` } })
      return
    }

    setRegistering(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          activity_id: id
        })
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('报名失败:', data.error)
        toast.error(data.error || '报名失败')
        setRegistering(false)
        return
      }
      
      toast.success('报名成功！')
      
      // 刷新活动信息以更新报名状态
      console.log('报名成功，刷新活动信息...')
      setTimeout(() => {
        fetchActivityDetail()
      }, 500) // 添加短暂延迟，确保后端数据更新完成
    } catch (error) {
      console.error('报名失败:', error)
      toast.error('报名失败，请稍后重试')
    } finally {
      setRegistering(false)
    }
  }

  const handleCancelRegistration = async () => {
    if (!confirm('确定要取消报名吗？')) {
      return
    }

    setRegistering(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/${id}/cancel-registration`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('取消报名成功！')
        console.log('取消报名成功，刷新活动信息...')
        setTimeout(() => {
          fetchActivityDetail()
        }, 500) // 添加短暂延迟，确保后端数据更新完成
      } else {
        console.error('取消报名失败:', data.error)
        toast.error(data.error || '取消报名失败')
      }
    } catch (error) {
      console.error('取消报名失败:', error)
      toast.error('取消报名失败，请稍后重试')
    } finally {
      setRegistering(false)
    }
  }

  const getCategoryLabel = (category) => {
    const categories = {
      'general': '综合活动',
      'ai': '人工智能',
      'physics': '物理科普',
      'workshop': '实践工坊',
      'lecture': '专题讲座'
    }
    return categories[category] || category
  }

  // 使用自定义的日期格式化函数
  const getFormattedDateTime = (dateString) => {
    if (!dateString) return { date: '未知', time: '未知', full: '未知时间' };
    
    try {
      return {
        date: formatDate(dateString),
        time: formatTime(dateString),
        full: formatDateTime(dateString)
      }
    } catch (error) {
      console.error('日期格式化错误:', error);
      return { date: '未知', time: '未知', full: '未知时间' };
    }
  }

  const getActivityStatus = () => {
    if (!activity) return null

    const now = new Date()
    const startTime = new Date(activity.start_time)
    const endTime = new Date(activity.end_time)
    const registrationDeadline = new Date(activity.registration_deadline)

    if (activity.status === 'cancelled') {
      return { type: 'cancelled', text: '活动已取消', icon: XCircle, color: 'bg-destructive/20 text-destructive' }
    }

    if (endTime < now) {
      return { type: 'ended', text: '活动已结束', icon: XCircle, color: 'bg-muted/50 text-muted-foreground' }
    }

    if (startTime <= now && endTime >= now) {
      return { type: 'ongoing', text: '活动进行中', icon: Sparkles, color: 'bg-green-500/20 text-green-500' }
    }

    if (registrationDeadline < now) {
      return { type: 'deadline_passed', text: '报名已截止', icon: AlertCircle, color: 'bg-orange-500/20 text-orange-500' }
    }

    if (activity.registered_count >= activity.capacity) {
      return { type: 'full', text: '名额已满', icon: AlertCircle, color: 'bg-orange-500/20 text-orange-500' }
    }

    return { type: 'open', text: '可以报名', icon: CheckCircle, color: 'bg-green-500/20 text-green-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <Button onClick={() => navigate('/activities')} className="glow-effect">
            返回活动列表
          </Button>
        </div>
      </div>
    )
  }

  if (!activity) {
    return null
  }

  // 调试输出
  console.log('当前活动状态:', activity);
  console.log('是否已报名:', activity?.is_registered);

  const status = getActivityStatus()
  const startDateTime = getFormattedDateTime(activity?.start_time)
  const endDateTime = getFormattedDateTime(activity?.end_time)
  const registrationDeadline = getFormattedDateTime(activity?.registration_deadline)

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={() => navigate('/activities')} className="tech-border">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回活动列表
          </Button>
        </motion.div>

        {/* Activity Detail */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="tech-border">
            {/* Featured Image */}
            {activity.image_url && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img
                  src={activity.image_url ? `${API_BASE_URL}${activity.image_url}` : '/images/activities/default.jpg'}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/activities/default.jpg'
                  }}
                />
              </div>
            )}

            <CardHeader className="pb-6">
              {/* Category and Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <Badge variant="secondary" className="text-sm">
                  {getCategoryLabel(activity.category)}
                </Badge>
                <div className={`flex items-center text-sm font-medium px-3 py-1 rounded-full ${status.color}`}>
                  <status.icon className="h-4 w-4 mr-1" />
                  {status.text}
                </div>
              </div>

              {/* Title */}
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4 gradient-text leading-tight">
                {activity.title}
              </CardTitle>

              {/* Speaker */}
              {activity.speaker && (
                <div className="flex items-center text-muted-foreground mb-4">
                  <User className="h-4 w-4 mr-2" />
                  <span>主讲人: {activity.speaker}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Activity Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <h4 className="font-medium">活动时间</h4>
                      <p className="text-sm text-muted-foreground">
                        {startDateTime.date} {startDateTime.time} - {endDateTime.date !== startDateTime.date ? `${endDateTime.date} ` : ''}{endDateTime.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <h4 className="font-medium">活动地点</h4>
                      <p className="text-sm text-muted-foreground">{activity.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <h4 className="font-medium">参与人数</h4>
                      <p className="text-sm text-muted-foreground">
                        已报名 {activity.registered_count || 0}/{activity.capacity} 人
                      </p>
                    </div>
                  </div>

                  {activity.registration_deadline && (
                  <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-3 text-primary" />
                    <div>
                        <h4 className="font-medium">报名截止</h4>
                        <p className="text-sm text-muted-foreground">
                          {registrationDeadline.date} {registrationDeadline.time}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">活动介绍</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{activity.description}</p>
                </div>
              </div>

              {/* Registration Status */}
              <div className="pt-6 border-t">
                <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    {activity.is_registered ? (
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">您已报名此活动</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {status.type === 'open' ? (
                          <span className="font-medium">可以报名参加</span>
                        ) : (
                          <span className="font-medium text-muted-foreground">{status.text}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                {isAdmin ? (
                  <Button 
                    onClick={() => navigate(`/admin/activities/edit/${activity.id}`)}
                    className="glow-effect tech-border"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    管理活动
                  </Button>
                ) : activity.is_registered ? (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelRegistration}
                    disabled={registering || status.type === 'ended'}
                    className="border-destructive text-destructive hover:bg-destructive/10 tech-border"
                  >
                    {registering ? '处理中...' : '取消报名'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRegister}
                    disabled={registering || status.type !== 'open'}
                    className="glow-effect tech-border"
                  >
                    {registering ? '处理中...' : '立即报名'}
                  </Button>
                )}
              </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ActivityDetail

