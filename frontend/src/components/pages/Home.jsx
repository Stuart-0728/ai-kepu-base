import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL, videoUtils } from '../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, Play, Pause, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/badge';

// 导入静态背景图片作为视频加载前的占位图
import staticBg from '../../assets/back.jpeg'

const Home = () => {
  const { theme } = useTheme();
  const [news, setNews] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)
  const [videoSrc, setVideoSrc] = useState('')
  const [videoError, setVideoError] = useState(true) // 默认显示静态背景
  const [showScrollIndicator, setShowScrollIndicator] = useState(true) // 控制滚动指示箭头的显示

  // 将英文类别转为中文
  const getCategoryLabel = (category) => {
    const categories = {
      'general': '综合新闻',
      'ai': '人工智能',
      'physics': '物理科普',
      'activity': '活动通知'
    }
    return categories[category] || category
  }
  
  // 获取活动类别中文标签
  const getActivityCategoryLabel = (category) => {
    const categoryMap = {
      'ai': '人工智能',
      'robotics': '机器人',
      'physics': '物理科学',
      'chemistry': '化学科学',
      'biology': '生物科学',
      'astronomy': '天文航天',
      'technology': '前沿技术',
      'general': '综合科普',
      'workshop': '工作坊',
      'lecture': '讲座',
      'exhibition': '展览',
      'competition': '竞赛',
      'other': '其他'
    }
    
    return categoryMap[category] || category || '未分类'
  }
  
  // 获取活动状态
  const getActivityStatus = (activity) => {
    const now = new Date()
    const startTime = new Date(activity.start_time)
    const endTime = new Date(activity.end_time)
    const registrationDeadline = activity.registration_deadline ? new Date(activity.registration_deadline) : null
    
    if (endTime < now) {
      return { label: '已结束', variant: 'secondary' }
    }
    
    if (startTime <= now && endTime >= now) {
      return { label: '进行中', variant: 'success' }
    }
    
    if (registrationDeadline && registrationDeadline < now) {
      return { label: '报名已截止', variant: 'outline' }
    }
    
    return { label: '报名中', variant: 'default' }
  }

  // 加载背景视频
  const loadBackgroundVideo = async () => {
    try {
      const isDarkMode = theme === 'dark';
      const videoFile = isDarkMode ? 'dark.mp4' : 'light.mp4';
      
      // 使用绝对URL，确保视频能够正确加载
      const videoPath = `/static/videos/${videoFile}`;
      const videoUrl = `${API_BASE_URL}${videoPath}`;
      const videoUrlWithCache = `${videoUrl}?v=${Date.now()}`;
      
      console.log(`尝试加载背景视频: 模式=${isDarkMode ? '暗黑' : '明亮'}, 文件=${videoFile}, URL=${videoUrlWithCache}`);
      
      // 先检查视频是否存在
      const exists = await videoUtils.checkVideoExists(videoPath);
      console.log(`视频存在检查结果: ${exists ? '存在' : '不存在'}, URL=${videoUrl}`);
      
      if (!exists) {
        throw new Error('视频文件不存在');
      }
      
      // 视频存在，设置视频源
      setVideoSrc(videoUrlWithCache);
      setVideoError(false);
    } catch (error) {
      console.error('视频加载失败，使用静态背景', error);
      setVideoError(true);
    }
  };

  // 处理视频错误
  const handleVideoError = (e) => {
    console.log(" 视频加载失败，使用静态背景", e);
    console.log("当前视频URL:", videoSrc);
    setVideoError(true);
  };

  // 处理视频加载成功
  const handleVideoLoaded = () => {
    console.log("视频加载成功");
    setVideoError(false);
    
    // 尝试自动播放视频
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn("自动播放失败:", err);
          setIsPlaying(false);
        });
    }
  };

  // 根据主题加载对应的背景视频
  useEffect(() => {
    loadBackgroundVideo();
  }, [theme]);

  // 加载新闻和活动数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取新闻列表
        const newsResponse = await axios.get(`${API_BASE_URL}/api/news?per_page=3`);
        console.log('新闻API响应:', newsResponse.data);
        setNews(newsResponse.data.news || []);
        
        // 获取活动列表
        const activitiesResponse = await axios.get(`${API_BASE_URL}/api/activities?per_page=3`);
        console.log('活动API响应:', activitiesResponse.data);
        setActivities(activitiesResponse.data.activities || []);
        
        console.log('获取到的新闻数据:', newsResponse.data.news);
        console.log('获取到的活动数据:', activitiesResponse.data.activities);
      } catch (error) {
        console.error('获取首页数据失败:', error);
        toast.error('获取数据失败', {
          description: '无法加载最新新闻和活动信息'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 切换视频播放状态
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // 监听滚动事件，当用户滚动页面时隐藏指示箭头
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 处理点击向下箭头的事件
  const scrollToContent = () => {
    // 获取新闻动态部分的位置，并减去一些上边距，避免遮挡标题
    const newsSection = document.querySelector('section:nth-child(2)');
    if (newsSection) {
      const offset = newsSection.offsetTop - 100; // 减去100px的偏移，确保标题可见
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    } else {
      // 如果无法获取确切位置，使用基本的滚动逻辑
      window.scrollTo({
        top: window.innerHeight - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* 英雄区域 - 带背景视频 */}
      <section className="relative h-[92vh] overflow-hidden">
        {/* 背景视频或图片 */}
        <div className="absolute inset-0 w-full h-full">
          {videoError ? (
            // 显示静态背景图
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${staticBg})` }}
            />
          ) : (
            // 显示视频背景
            <video
              ref={videoRef}
              className="video-background"
              autoPlay
              muted
              loop
              playsInline
              onError={handleVideoError}
              onLoadedData={handleVideoLoaded}
              src={videoSrc}
              crossOrigin="anonymous"
            >
              您的浏览器不支持视频播放
            </video>
          )}
          
          {/* 暗色遮罩 */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        {/* 播放/暂停按钮 */}
        {!videoError && (
          <button 
            onClick={togglePlayPause}
            className="absolute bottom-4 right-4 z-20 bg-background/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-background/30"
            aria-label={isPlaying ? "暂停背景视频" : "播放背景视频"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}

        {/* 英雄区域内容 */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg flex flex-col">
              <span>重庆市沙坪坝区</span>
              <span>人工智能科普基地</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow-md">
              探索人工智能的奥秘，体验科技的魅力
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-background/30 hover:text-white"
              >
                <Link to="/appointment">
                  预约参观
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-background/30 hover:text-white"
              >
                <Link to="/activities">
                  查看活动
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* 向下滚动指示箭头 */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer scroll-indicator"
              onClick={scrollToContent}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <span className="text-white text-sm mb-2 scroll-indicator-text">继续浏览</span>
                <ChevronDown className="text-white h-7 w-7" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 新闻动态部分 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">新闻动态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // 加载中的骨架屏
              Array(3).fill().map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-[16/9] bg-muted">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : news.length > 0 ? (
              // 新闻列表
              news.map((item) => (
                <Link key={item.id} to={`/news/${item.id}`} className="block">
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img 
                        src={item.image_url ? `${API_BASE_URL}${item.image_url}` : `/images/news/default.jpg`} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          console.log('新闻图片加载失败:', item.image_url);
                          e.target.src = `/images/news/default.jpg`;
                        }}
                      />
                      {/* 类别标签放在图片左上角，使用半透明磨砂效果 */}
                      <Badge 
                        variant="outline" 
                        className="absolute top-3 left-3 bg-white/70 backdrop-blur-sm border border-primary/30 text-primary px-2 py-0.5 text-xs"
                      >
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-xl">{item.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{formatDate(item.published_at)}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-muted-foreground mb-4">{item.content}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              // 无数据提示
              <div className="col-span-full text-center py-8 text-muted-foreground">
                暂无新闻动态
              </div>
            )}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg" className="border-2">
              <Link to="/news">查看更多新闻</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 活动预告部分 */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">活动预告</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // 加载中的骨架屏
              Array(3).fill().map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : activities.length > 0 ? (
              // 活动列表
              activities.map((item) => (
                <Link key={item.id} to={`/activities/${item.id}`} className="block">
                  <Card className="h-full transition-all hover:shadow-lg">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      {/* 使用一个内部容器来控制图片缩放，确保不会超出圆角 */}
                      <div className="absolute inset-0 overflow-hidden rounded-t-lg">
                        <img
                          src={item.image_url ? `${API_BASE_URL}${item.image_url}` : '/images/activities/default.jpg'} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.target.src = '/images/activities/default.jpg'
                          }}
                        />
                      </div>
                      {/* 类别标签放在图片左上角，使用半透明磨砂效果 */}
                      {item.category && (
                        <Badge 
                          variant="outline" 
                          className="absolute top-3 left-3 bg-white/70 backdrop-blur-sm border border-primary/30 text-primary px-2 py-0.5 text-xs"
                        >
                          {getActivityCategoryLabel(item.category)}
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-xl">{item.title}</CardTitle>
                      {/* 状态标签放在卡片内部 */}
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <Badge 
                          variant={getActivityStatus(item).variant} 
                          className={`px-2 py-0.5 text-xs shadow-sm ${
                            getActivityStatus(item).variant === 'success' ? 'bg-green-500 text-white' : 
                            getActivityStatus(item).variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : 
                            getActivityStatus(item).variant === 'outline' ? 'bg-white border border-muted text-foreground' : 
                            'bg-primary text-primary-foreground'
                          }`}
                        >
                          {getActivityStatus(item).label}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        {formatDate(item.start_time, 'MM月DD日 HH:mm')}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <MapPin className="mr-1 h-4 w-4" />
                        {item.location}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              // 无数据提示
              <div className="col-span-full text-center py-8 text-muted-foreground">
                暂无活动预告
              </div>
            )}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg" className="border-2">
              <Link to="/activities">查看更多活动</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

