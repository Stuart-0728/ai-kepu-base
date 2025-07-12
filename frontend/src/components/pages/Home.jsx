// src/pages/Home.jsx (已修复语法错误的最终版)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL, formatDate } from '../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Play, Pause, ChevronDown } from 'lucide-react';
import { Badge } from '../ui/badge';
import staticBg from '../../assets/back.jpeg';

// --- 子组件定义 ---
const SkeletonCard = ({ isActivity = false }) => (
  <Card className="overflow-hidden"><div className={isActivity ? "aspect-video bg-muted" : "aspect-[16/9] bg-muted"}><Skeleton className="w-full h-full" /></div><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
);
const NoData = ({ type }) => <div className="col-span-full text-center py-8 text-muted-foreground">暂无{type}</div>;
const NewsCard = ({ item, getCategoryLabel }) => (
  <Link to={`/news/${item.id}`} className="block group"><Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl"><div className="relative aspect-[16/9] overflow-hidden"><img src={item.image_url ? `${API_BASE_URL}${item.image_url}` : '/images/news/default.jpg'} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.target.src = '/images/news/default.jpg'; }} /><Badge variant="outline" className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm">{getCategoryLabel(item.category)}</Badge></div><CardHeader><CardTitle className="line-clamp-2 text-xl">{item.title}</CardTitle><p className="text-sm text-muted-foreground">{formatDate(item.published_at)}</p></CardHeader><CardContent><p className="line-clamp-3 text-muted-foreground">{item.content || '暂无内容摘要'}</p></CardContent></Card></Link>
);
const ActivityCard = ({ item, getActivityCategoryLabel, getActivityStatus }) => (
  <Link to={`/activities/${item.id}`} className="block group"><Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl"><div className="relative aspect-video overflow-hidden"><img src={item.image_url ? `${API_BASE_URL}${item.image_url}` : '/images/activities/default.jpg'} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.target.src = '/images/activities/default.jpg'; }} />{item.category && <Badge variant="outline" className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm">{getActivityCategoryLabel(item.category)}</Badge>}</div><CardHeader><CardTitle className="line-clamp-2 text-xl">{item.title}</CardTitle><div className="flex items-center text-sm text-muted-foreground mt-2 space-x-4"><Badge variant={getActivityStatus(item).variant}>{getActivityStatus(item).label}</Badge><div className="flex items-center"><Calendar className="mr-1 h-4 w-4" />{formatDate(item.start_time, 'MM月DD日 HH:mm')}</div></div></CardHeader><CardContent><p className="line-clamp-3 text-muted-foreground mb-4">{item.description || '暂无活动描述'}</p><div className="flex items-center text-sm text-muted-foreground"><MapPin className="mr-1 h-4 w-4" />{item.location}</div></CardContent></Card></Link>
);

const Home = () => {
  const { theme } = useTheme();
  const [news, setNews] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const videoRef = useRef(null);
  const newsSectionRef = useRef(null);
  const navigate = useNavigate();

  // --- 辅助函数 ---
  const getCategoryLabel = (category) => ({ 'general': '综合新闻', 'ai': '人工智能', 'physics': '物理科普', 'activity': '活动通知' }[category] || category);
  const getActivityCategoryLabel = (category) => ({ 'ai': '人工智能', 'robotics': '机器人', 'physics': '物理科学', 'chemistry': '化学科学', 'biology': '生物科学', 'astronomy': '天文航天', 'technology': '前沿技术', 'general': '综合科普', 'workshop': '工作坊', 'lecture': '讲座', 'exhibition': '展览', 'competition': '竞赛', 'other': '其他' }[category] || category || '未分类');
  const getActivityStatus = (activity) => {
    const now = new Date();
    const startTime = new Date(activity.start_time);
    const endTime = new Date(activity.end_time);
    if (endTime < now) return { label: '已结束', variant: 'secondary' };
    if (startTime <= now && endTime >= now) return { label: '进行中', variant: 'success' };
    if (activity.registration_deadline && new Date(activity.registration_deadline) < now) return { label: '报名已截止', variant: 'outline' };
    return { label: '报名中', variant: 'default' };
  };

  // 视频播放逻辑
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const videoFile = theme === 'dark' ? 'dark.mp4' : 'light.mp4';
    const fullVideoUrl = `${API_BASE_URL}/static/videos/${videoFile}`;
    
    videoElement.src = fullVideoUrl;
    videoElement.load();

    const attemptPlay = () => {
        videoElement.oncanplay = () => {
          const playPromise = videoElement.play();
          if (playPromise !== undefined) {
            playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          }
        };
        videoElement.onerror = () => setIsPlaying(false);
    };

    attemptPlay();

    return () => {
      if(videoElement) {
        videoElement.oncanplay = null;
        videoElement.onerror = null;
      }
    }
  }, [theme]);

  // 数据加载逻辑
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [newsResponse, activitiesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/news?per_page=3`),
          axios.get(`${API_BASE_URL}/api/activities?per_page=3`)
        ]);
        setNews(newsResponse.data.news || []);
        setActivities(activitiesResponse.data.activities || []);
      } catch (error) {
        toast.error('获取首页数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // 滚动时隐藏箭头
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setShowScrollIndicator(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 视频播放/暂停手动控制
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // 滚动到内容区
  const scrollToContent = () => {
    // 获取新闻动态部分的位置
    if (newsSectionRef.current) {
      // 使用原生的scrollIntoView方法，这在iOS上更可靠
      newsSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // 检测是否是iOS设备
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      // iOS设备可能需要额外处理
      if (isIOS) {
        // 使用setTimeout确保在页面渲染后执行
        setTimeout(() => {
          const yOffset = newsSectionRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({
            top: yOffset,
            behavior: 'smooth'
          });
        }, 100);
      }
      
      // 隐藏滚动指示器
      setTimeout(() => setShowScrollIndicator(false), 200);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-[92vh] overflow-hidden bg-black">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-700" style={{ backgroundImage: `url(${staticBg})`, opacity: isPlaying ? 0 : 1 }} />
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{ opacity: isPlaying ? 1 : 0 }} muted loop playsInline />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <button onClick={togglePlayPause} className="absolute bottom-4 right-4 z-20 bg-black/20 text-white p-2 rounded-full backdrop-blur-sm" aria-label={isPlaying ? "暂停视频" : "播放视频"}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg flex flex-col"><span>重庆市沙坪坝区</span><span>人工智能科普基地</span></h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 drop-shadow-md">探索人工智能的奥秘，体验科技的魅力</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="outline" className="bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-background/30 hover:text-white"><Link to="/appointment">预约参观</Link></Button>
              <Button asChild size="lg" variant="outline" className="bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-background/30 hover:text-white"><Link to="/activities">查看活动</Link></Button>
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer" onClick={scrollToContent}>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center">
                <span className="text-white text-sm mb-2 drop-shadow-md">继续浏览</span>
                <ChevronDown className="text-white h-7 w-7" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section id="news-section" ref={newsSectionRef} className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">新闻动态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />) : news.length > 0 ? news.map(item => <NewsCard key={item.id} item={item} getCategoryLabel={getCategoryLabel} />) : <NoData type="新闻动态" />}
          </div>
          <div className="text-center mt-8"><Button asChild variant="outline" size="lg" className="border-2"><Link to="/news">查看更多新闻</Link></Button></div>
        </div>
      </section>
      
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">活动预告</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} isActivity />) : activities.length > 0 ? activities.map(item => <ActivityCard key={item.id} item={item} getActivityCategoryLabel={getActivityCategoryLabel} getActivityStatus={getActivityStatus} />) : <NoData type="活动预告" />}
          </div>
          <div className="text-center mt-8"><Button asChild variant="outline" size="lg" className="border-2"><Link to="/activities">查看更多活动</Link></Button></div>
        </div>
      </section>
    </div>
  );
};

export default Home;
