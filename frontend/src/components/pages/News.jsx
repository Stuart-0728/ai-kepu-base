import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Newspaper, ServerCrash, Search, Filter, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { API_BASE_URL } from '../../lib/utils'

const News = () => {
  const { apiAvailable } = useAuth()
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // 组件挂载时滚动到顶部 - 使用更可靠的方法
  useEffect(() => {
    // 检测是否是iOS设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 使用setTimeout确保在DOM更新后执行滚动
    setTimeout(() => {
      // 将窗口滚动到顶部
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // iOS设备可能需要额外处理
      if (isIOS) {
        // 使用多种方法确保滚动生效
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        // 再次尝试滚动，确保生效
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      }
    }, 0);
  }, []);

  useEffect(() => {
    fetchCategories()
    fetchNews()
  }, [])

  // 当类别、页码或搜索条件变化时，重新获取数据
  useEffect(() => {
    if (apiAvailable) {
      fetchNews()
    }
  }, [selectedCategory, currentPage, apiAvailable])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/news/categories`)
      if (response.ok) {
        const data = await response.json()
        console.log('获取到的新闻分类:', data.categories)
        setCategories(data.categories || [])
      } else {
        console.error('获取分类失败: 服务器响应错误')
        setError('获取分类失败，请稍后重试')
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      setError('获取分类失败，请检查网络连接')
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    try {
      let url = `${API_BASE_URL}/api/news?page=${currentPage}&per_page=9`
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }

      console.log('发送新闻请求URL:', url)
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('获取新闻数据:', data)
        setNews(data.news || [])
        setTotalPages(data.pagination?.pages || 1)
        setError(null)
      } else {
        console.error('获取新闻失败: 服务器响应错误')
        setError('获取新闻失败，请稍后重试')
        setNews([])
      }
    } catch (error) {
      console.error('获取新闻失败:', error)
      setError('获取新闻失败，请检查网络连接')
      setNews([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchNews()
  }

  const handleCategoryChange = (value) => {
    console.log('触发新闻类别筛选，类别:', value)
    setSelectedCategory(value)
    setCurrentPage(1)
    // 不再使用setTimeout，通过useEffect监听selectedCategory变化来触发fetchNews
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNews()
  }

  const getCategoryLabel = (value) => {
    const categoryMap = {
      'general': '综合新闻',
      'ai': '人工智能',
      'physics': '物理科普',
      'activity': '活动通知'
    }
    
    // 先尝试从映射中获取
    if (categoryMap[value]) {
      return categoryMap[value]
    }
    
    // 再尝试从已加载的分类中获取
    const category = categories.find(cat => cat.value === value)
    return category ? category.label : (value || '未分类')
  }

  // 格式化日期为北京时间
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Shanghai'
    })
  }

  if (error && !loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <ServerCrash className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">获取新闻失败</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={() => fetchNews()}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  // 渲染新闻列表
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">新闻动态</h1>
          <p className="text-muted-foreground">
            了解重庆市沙坪坝区人工智能科普基地的最新动态和科技资讯
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none search-icon" style={{display: 'none'}} />
                <Input
                  placeholder="搜索新闻..."
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
                onClick={handleRefresh}
                disabled={refreshing}
                className="ml-2 hidden md:flex"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} style={{width: '1.25rem', height: '1.25rem'}} />
                刷新
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="ml-2 md:hidden"
                size="icon"
                style={{width: '2.5rem', height: '2.5rem', padding: '0.5rem'}}
              >
                <RefreshCw className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`} style={{width: '1.5rem', height: '1.5rem'}} />
              </Button>
            </form>
          </div>
          <div className="w-full md:w-64">
            <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="所有分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={`category-${index}-${category.value || 'default'}`} value={category.value || 'default'}>
                    {getCategoryLabel(category.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 新闻列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
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
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-card/50 rounded-lg p-8 border border-border">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-bold mb-2">暂无新闻</h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory && selectedCategory !== 'all' ? '该分类下暂无新闻' : '暂无新闻内容'}
            </p>
            {selectedCategory && selectedCategory !== 'all' && (
              <Button onClick={() => setSelectedCategory('all')}>
                查看所有新闻
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
              <motion.div
                key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Link to={`/news/${item.id}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer tech-border">
                      <div className="relative h-48 overflow-hidden">
                        {/* 使用内部容器来控制图片缩放，确保不会超出圆角 */}
                        <div className="absolute inset-0 overflow-hidden rounded-t-lg">
                          <img
                            src={item.image_url ? `${API_BASE_URL}${item.image_url}` : '/images/news/default.jpg'} 
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.target.src = '/images/news/default.jpg'
                            }}
                          />
                        </div>
                        {/* 类别标签放在图片左上角，使用半透明磨砂效果 */}
                        <Badge 
                          variant="outline" 
                          className="absolute top-3 left-3 bg-white/70 backdrop-blur-sm border border-primary/30 text-primary px-2 py-0.5 text-xs"
                        >
                          {getCategoryLabel(item.category) || '未分类'}
                        </Badge>
                      </div>
                      <CardHeader>
                        <div className="flex items-center justify-end mb-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.published_at)}
                          </span>
                        </div>
                        <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {item.content?.replace(/<[^>]*>/g, '') || '暂无内容'}
                        </p>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          <span>{item.author || '管理员'}</span>
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(item.published_at)}</span>
                    </div>
                      </CardFooter>
                </Card>
                  </Link>
              </motion.div>
            ))}
          </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
            <Button
              variant="outline"
                    size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
            >
              上一页
            </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
            <Button
              variant="outline"
                    size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
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

export default News

