import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ServerCrash,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../lib/utils'

const Activities = () => {
  const { apiAvailable } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)

  // 组件挂载时滚动到顶部 - 使用更可靠的方法
  useEffect(() => {
    // 检测是否是iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    const scrollToTopWithFallbacks = () => {
      // 尝试使用平滑滚动
      try {
        window.scrollTo({
          top: 0,
          behavior: 'auto' // 在iOS上使用'auto'而不是'smooth'以确保立即滚动
        });
      } catch (e) {
        // 回退到传统方法
        window.scrollTo(0, 0);
      }
      
      // iOS设备需要额外处理
      if (isIOS) {
        // 使用多种方法确保滚动生效
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        // 多次尝试滚动，确保生效
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        }, 50);
        
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        }, 150);
      }
    };
    
    // 立即执行一次
    scrollToTopWithFallbacks();
    
    // 再次延迟执行，确保在DOM更新后滚动
    setTimeout(scrollToTopWithFallbacks, 0);
  }, []);

  useEffect(() => {
    fetchCategories()
    fetchActivities()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        console.error('获取分类失败: 服务器响应错误')
        setError('获取分类失败，请稍后重试')
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      setError('获取分类失败，请检查网络连接')
    }
  }

  // 移除useEffect依赖项中的activeTab和selectedCategory，防止重复触发
  useEffect(() => {
    if (apiAvailable) {
      console.log('活动数据依赖项变化，重新获取数据:', { currentPage })
      // 只在页码变化时自动获取数据
    }
  }, [currentPage, apiAvailable])

  // 初始加载数据
  useEffect(() => {
    if (apiAvailable) {
      fetchActivities()
    }
  }, [apiAvailable])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchActivities()
  }

  const handleTabChange = (value) => {
    console.log('切换活动标签:', value)
    // 先设置状态
    setActiveTab(value)
    setCurrentPage(1)
    
    // 使用setTimeout确保状态更新后再获取数据
    setTimeout(() => {
      // 这里直接传递新的value而不是依赖状态变量
      fetchActivities(value, selectedCategory)
    }, 50)
  }

  const handleCategoryChange = (value) => {
    const categoryValue = value === 'all' ? '' : value
    // 先设置状态
    setSelectedCategory(categoryValue)
    setCurrentPage(1)
    
    // 使用setTimeout确保状态更新后再获取数据
    setTimeout(() => {
      // 这里直接传递新的value而不是依赖状态变量
      fetchActivities(activeTab, categoryValue)
    }, 50)
  }

  // 确保正确处理活动状态
  const getActivityStatus = (activity) => {
    if (!activity) return 'unknown';
    
    const now = new Date();
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);
    
    if (endTime < now) {
      return 'past';
    }
    
    if (startTime <= now && endTime >= now) {
      return 'ongoing';
    }
    
    return 'upcoming';
  }

  // 修改fetchActivities函数，确保正确筛选即将开始和进行中的活动
  const fetchActivities = async (tabValue = activeTab, categoryValue = selectedCategory) => {
    setLoading(true)
    try {
      let url = `${API_BASE_URL}/api/activities?page=${currentPage}&per_page=6`
      
      // 根据不同的标签，计算不同的筛选条件
      if (tabValue === 'upcoming') {
        const now = new Date().toISOString();
        url += `&status=upcoming&after=${encodeURIComponent(now)}`;
      } else if (tabValue === 'ongoing') {
        const now = new Date().toISOString();
        url += `&status=ongoing&current=${encodeURIComponent(now)}`;
      } else if (tabValue === 'past') {
        const now = new Date().toISOString();
        url += `&status=past&before=${encodeURIComponent(now)}`;
      }
      
      if (categoryValue) {
        url += `&category=${categoryValue}`
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }

      console.log('发送活动请求URL:', url)
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('获取活动数据:', data)
        setActivities(data.activities || [])
        setTotalPages(data.pagination?.pages || 1)
        setError(null)
      } else {
        console.error('获取活动失败: 服务器响应错误')
        setError('获取活动失败，请稍后重试')
        setActivities([])
      }
    } catch (error) {
      console.error('获取活动失败:', error)
      setError('获取活动失败，请检查网络连接')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = searchQuery
    ? activities.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities

  const getCategoryLabel = (value) => {
    const category = categories.find(cat => cat.value === value)
    return category ? category.label : value
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 修改getStatusBadge函数，确保正确显示活动状态
  const getStatusBadge = (activity) => {
    if (!activity) return { variant: 'outline', label: '未知状态' }
    
    const now = new Date()
    const startTime = new Date(activity.start_time)
    const endTime = new Date(activity.end_time)
    const registrationDeadline = activity.registration_deadline ? new Date(activity.registration_deadline) : null
    
    if (endTime < now) {
      return { variant: 'secondary', label: '已结束' }
    }
    
    if (startTime <= now && endTime >= now) {
      return { variant: 'success', label: '进行中' }
    }
    
    if (registrationDeadline && registrationDeadline < now) {
      return { variant: 'outline', label: '报名已截止' }
    }
    
    return { variant: 'default', label: '报名中' }
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

  // 渲染错误状态
  if (error && !loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <Calendar className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">获取活动失败</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={() => fetchActivities()}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">活动中心</h1>
          <p className="text-muted-foreground">
            参与沙坪坝区人工智能科普基地举办的各类科普活动和讲座
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none search-icon" style={{display: 'none'}} />
                <Input
                  placeholder="搜索活动..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-4 md:pr-10 text-base h-11 search-input"
                  style={{paddingLeft: '1rem'}}
                />
              </div>
              <Button type="submit" className="whitespace-nowrap">搜索</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fetchActivities(activeTab, selectedCategory)}
                className="ml-2 hidden md:flex"
              >
                <RefreshCw className="h-5 w-5 mr-2" style={{width: '1.25rem', height: '1.25rem'}} />
                刷新
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fetchActivities(activeTab, selectedCategory)}
                className="ml-2 md:hidden"
                size="icon"
                style={{width: '2.5rem', height: '2.5rem', padding: '0.5rem'}}
              >
                <RefreshCw className="h-6 w-6" style={{width: '1.5rem', height: '1.5rem'}} />
              </Button>
            </form>
          </div>
          <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="all">全部活动</TabsTrigger>
              <TabsTrigger value="upcoming">即将开始</TabsTrigger>
              <TabsTrigger value="ongoing">进行中</TabsTrigger>
            </TabsList>
          </Tabs>
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value || 'default'}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* 活动列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden tech-border">
                <div className="h-48 bg-muted animate-pulse"></div>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded animate-pulse w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold mb-2">暂无活动</h3>
            <p className="text-muted-foreground mb-6">
              {activeTab !== 'all' ? '该状态下暂无活动' : '暂无活动内容'}
            </p>
            {activeTab !== 'all' && (
              <Button onClick={() => setActiveTab('all')}>
                查看所有活动
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link to={`/activities/${activity.id}`} className="block">
                    <Card className="h-full tech-border hover:shadow-lg transition-all duration-300">
                      <div className="relative aspect-video overflow-hidden rounded-t-lg">
                        {/* 使用内部容器来控制图片缩放，确保不会超出圆角 */}
                        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
                          <img
                            src={activity.image_url ? `${API_BASE_URL}${activity.image_url}` : '/images/activities/default.jpg'} 
                            alt={activity.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.target.src = '/images/activities/default.jpg'
                            }}
                          />
                        </div>
                        {/* 类别标签放在图片左上角，使用半透明磨砂效果 */}
                        {activity.category && (
                          <Badge 
                            variant="category" 
                            className="absolute top-3 left-3 px-2 py-0.5 text-xs"
                          >
                            {getCategoryLabel(activity.category)}
                          </Badge>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{activity.title}</CardTitle>
                        {/* 状态标签放在卡片内部 */}
                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                          <Badge 
                            className={`px-2 py-0.5 text-xs shadow-sm ${
                              getStatusBadge(activity).variant === 'secondary' ? 'bg-secondary text-secondary-foreground' :
                              getStatusBadge(activity).variant === 'outline' ? 'bg-white border border-muted text-foreground' : 
                              getStatusBadge(activity).variant === 'success' ? 'bg-green-500 text-white' :
                              'bg-primary text-primary-foreground'
                            }`}
                          >
                            {getStatusBadge(activity).label}
                          </Badge>
                        </div>
                      </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground line-clamp-3">
                          {activity.description || '暂无描述'}
                        </p>
                      
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-primary" />
                            <span>{activity.start_time ? formatDate(activity.start_time) : '待定'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <span>{activity.time || '待定'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span>{activity.location || '待定'}</span>
                          </div>
                        </div>
                    </CardContent>
                      <CardFooter>
                        <Button className="w-full">查看详情</Button>
                      </CardFooter>
                  </Card>
                  </Link>
                </motion.div>
              ))}
          </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
                  <div className="flex items-center px-4">
                    第 {currentPage} 页，共 {totalPages} 页
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Activities

