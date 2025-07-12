import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { API_BASE_URL } from '../../lib/utils'

const NewsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [news, setNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
  }, [id]); // 当新闻ID变化时也执行
  
  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        // 先滚动到顶部，确保用户看到加载状态
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/news/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('新闻不存在')
          }
          throw new Error('获取新闻详情失败')
        }
        
        const data = await response.json()
        setNews(data.news)
        
        // 数据加载完成后再次确保滚动到顶部
        setTimeout(() => window.scrollTo(0, 0), 100);
      } catch (err) {
        console.error('获取新闻详情失败:', err)
        setError(err.message || '获取新闻详情失败')
      } finally {
        setLoading(false)
      }
    }

    fetchNewsDetail()
  }, [id])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.content.substring(0, 100) + '...',
          url: window.location.href,
        })
      } catch (error) {
        console.log('分享失败:', error)
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  // 处理视频显示
  const renderVideo = () => {
    if (!news || !news.video_url) return null;

    if (news.video_source === 'local') {
      // 本地上传的视频
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden mb-6">
          <video 
            src={`${API_BASE_URL}${news.video_url}`} 
            controls 
            className="w-full h-full"
            preload="metadata"
          />
        </div>
      );
    } else if (news.video_source === 'embed') {
      // 处理嵌入视频
      const videoUrl = news.video_url;
      
      // 处理哔哩哔哩视频链接
      if (videoUrl.includes('bilibili.com')) {
        // 从URL中提取BV号
        const bvMatch = videoUrl.match(/BV\w+/);
        if (bvMatch) {
          const bvid = bvMatch[0];
          return (
            <div className="aspect-video w-full rounded-lg overflow-hidden mb-6">
              <iframe 
                src={`//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`} 
                scrolling="no" 
                border="0" 
                frameBorder="no" 
                framespacing="0" 
                allowFullScreen={true}
                className="w-full h-full"
              />
            </div>
          );
        }
      }
      
      // 处理优酷视频链接
      if (videoUrl.includes('youku.com')) {
        const idMatch = videoUrl.match(/id_(\w+)/);
        if (idMatch && idMatch[1]) {
          return (
            <div className="aspect-video w-full rounded-lg overflow-hidden mb-6">
              <iframe 
                src={`https://player.youku.com/embed/${idMatch[1]}`}
                frameBorder="0" 
                allowFullScreen={true}
                className="w-full h-full"
              />
            </div>
          );
        }
      }
      
      // 处理腾讯视频链接
      if (videoUrl.includes('v.qq.com')) {
        const vidMatch = videoUrl.match(/\/(\w+)\.html/);
        if (vidMatch && vidMatch[1]) {
          return (
            <div className="aspect-video w-full rounded-lg overflow-hidden mb-6">
              <iframe 
                src={`https://v.qq.com/txp/iframe/player.html?vid=${vidMatch[1]}`}
                frameBorder="0" 
                allowFullScreen={true}
                className="w-full h-full"
              />
            </div>
          );
        }
      }
      
      // 其他视频网站或无法解析的链接，显示链接
      return (
        <div className="mb-6">
          <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            点击观看视频
          </a>
        </div>
      );
    }
    
    return null;
  };

  const getCategoryLabel = (category) => {
    const categories = {
      'general': '综合新闻',
      'ai': '人工智能',
      'physics': '物理科普',
      'activity': '活动通知'
    }
    return categories[category] || category
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // 返回新闻列表并滚动到顶部
  const goBackToList = () => {
    navigate('/news');
  };

  // 手动滚动到顶部的函数，使用优化的scrollUtils
  const handleScrollToTop = () => {
    window.scrollTo(0, 0);
  };

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
          <Button onClick={() => navigate('/news')} className="tech-border">
            返回新闻列表
          </Button>
        </div>
      </div>
    )
  }

  if (!news) {
    return null
  }

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
          <Button variant="ghost" onClick={goBackToList} className="tech-border">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回新闻列表
          </Button>
        </motion.div>

        {/* News Detail */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="tech-border">
            {/* 封面图片 - 始终显示 */}
            {news.image_url && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img
                  src={`${API_BASE_URL}${news.image_url}`}
                  alt={news.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('新闻详情图片加载失败:', news.image_url);
                    e.target.src = '/images/news/default.jpg'
                  }}
                />
              </div>
            )}

            <CardHeader className="pb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <Badge variant="secondary" className="text-sm">
                  {getCategoryLabel(news.category)}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(news.published_at)}</span>
                </div>
              </div>

              <CardTitle className="text-3xl md:text-4xl font-bold mb-4 gradient-text leading-tight">
                {news.title}
              </CardTitle>
              
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <User className="h-4 w-4 mr-2" />
                <span>作者: {news.author}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* 视频区域 */}
              {renderVideo()}
              
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: news.content }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <div className="flex flex-wrap justify-center items-center gap-4 pb-8">
            <Button onClick={handleShare} className="glow-effect tech-border">
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
            
            <Button asChild className="glow-effect tech-border">
              <Link to="/news">
                查看其他新闻
              </Link>
            </Button>
            
            <Button asChild className="glow-effect tech-border">
              <Link to="/activities">
                查看活动
              </Link>
            </Button>
              
            <Button asChild className="glow-effect tech-border">
              <Link to="/appointment">
                预约参观
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NewsDetail

