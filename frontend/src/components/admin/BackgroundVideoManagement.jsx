import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { Loader2, Upload, Play, X, Check, AlertCircle, FileUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "../ui/alert";
import { API_BASE_URL, videoUtils } from '../../lib/utils';
import { Badge } from '../ui/badge';
import VideoPreview from './VideoPreview';
import { Skeleton } from '../ui/skeleton';

const BackgroundVideoManagement = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('light');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [deleteVideo, setDeleteVideo] = useState(null);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragAreaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingVideo, setProcessingVideo] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/videos`, {
        withCredentials: true // 确保请求带上cookie
      });
      
      const videosData = response.data.videos || [];
      
      // 为每个视频添加可靠的URL和时间戳
      const processedVideos = videosData.map(video => {
        // 构建视频路径，确保正确处理文件名中的空格
        const videoPath = `/static/videos/${video.filename}`;
        // 构建完整URL
        const url = `${API_BASE_URL}${videoPath.replace(/ /g, '%20')}`;
        
        console.log(`处理视频: ${video.filename}, 构建URL: ${url}`);
        
        return {
          ...video,
          url,
          // 确保空格和特殊字符被正确处理
          thumbnailUrl: `${API_BASE_URL}/api/videos/thumbnail?url=${encodeURIComponent(videoPath)}&t=${Date.now()}`
        };
      });
      
      setVideos(processedVideos);
      console.log('获取到视频列表:', processedVideos);
    } catch (error) {
      console.error('获取视频列表失败:', error);
      toast.error('获取视频列表失败', {
        description: error.response?.data?.error || "请稍后再试"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e, mode) => {
    const files = e.target?.files || e;
    if (!files || files.length === 0) return;
    
    const file = files[0];

    // 检查文件类型
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      toast.error('不支持的文件类型', {
        description: "请上传 MP4, WebM 或 Ogg 格式的视频"
      });
      return;
    }

    // 检查文件大小 (限制为 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('文件过大', {
        description: "视频文件大小不能超过 50MB"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('mode', mode);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/upload/video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true, // 确保请求带上cookie
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      toast.success('上传成功', {
        description: "背景视频已成功上传"
      });

      // 重新获取视频列表
      fetchVideos();
    } catch (error) {
      console.error('上传视频失败:', error);
      setUploadError(error.response?.data?.error || "上传失败，请稍后再试");
      toast.error('上传失败', {
        description: error.response?.data?.error || "请稍后再试"
      });
    } finally {
      setIsUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // 拖拽相关处理函数
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当拖拽离开整个区域时才重置状态
    const rect = dragAreaRef.current?.getBoundingClientRect();
    if (
      rect &&
      (e.clientX < rect.left || e.clientX >= rect.right || 
       e.clientY < rect.top || e.clientY >= rect.bottom)
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files, activeTab);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideo) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/videos/${deleteVideo.filename}`, {
        withCredentials: true // 确保请求带上cookie
      });
      
      toast.success('删除成功', {
        description: "背景视频已成功删除"
      });

      // 重新获取视频列表
      fetchVideos();
      // 关闭确认对话框
      setDeleteVideo(null);
    } catch (error) {
      console.error('删除视频失败:', error);
      toast.error('删除失败', {
        description: error.response?.data?.error || "请稍后再试"
      });
    }
  };

  // 设置为默认视频
  const setAsDefault = async (video, mode) => {
    try {
      setIsSettingDefault(true);
      setProcessingVideo(video.filename);
      const response = await axios.post(`${API_BASE_URL}/api/admin/videos/set`, {
        filename: video.filename,
        mode: mode
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        toast.success('设置成功', {
          description: `已将 ${video.filename} 设置为${mode === 'light' ? '明亮' : '暗黑'}模式的默认视频`
        });
        // 刷新视频列表
        fetchVideos();
      } else {
        toast.error('设置失败', {
          description: response.data.error || '未知错误'
        });
      }
    } catch (error) {
      console.error('设置默认视频失败:', error);
      toast.error('设置失败', {
        description: error.response?.data?.error || error.message || '未知错误'
      });
    } finally {
      setIsSettingDefault(false);
      setProcessingVideo(null);
    }
  };

  const filteredVideos = videos.filter(video => video.mode === activeTab);

  // 预览视频
  const handlePreviewVideo = (video) => {
    setPreviewVideo({
      ...video,
      // 确保使用正确的URL
      url: video.url
    });
  };

  // 处理视频删除后的回调
  const handleVideoDeleted = (deletedVideo) => {
    // 关闭预览对话框
    setPreviewVideo(null);
    // 刷新视频列表
    fetchVideos();
    // 显示成功提示
    toast.success('删除成功', {
      description: `视频 ${deletedVideo.filename} 已成功删除`
    });
  };
  
  // 手动触发生成缩略图（用于处理特殊情况）
  const handleGenerateThumbnail = async (video) => {
    try {
      // 显示加载状态
      toast.loading(`正在为视频 ${video.filename} 生成缩略图...`);
      
      // 调用后端API生成缩略图
      const response = await axios.get(`${API_BASE_URL}/api/videos/generate-thumbnail/${encodeURIComponent(video.filename)}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success('缩略图生成成功', {
          description: response.data.message
        });
        // 重新获取视频列表以刷新缩略图
        fetchVideos();
      } else {
        toast.error('生成缩略图失败', {
          description: response.data.error || '未知错误'
        });
      }
    } catch (error) {
      console.error('生成缩略图失败:', error);
      toast.error('生成缩略图失败', {
        description: error.response?.data?.error || error.message || '未知错误'
      });
    }
  };

  // 视频卡片组件
  const VideoCard = ({ video, onPreview, onSetDefault, isProcessing }) => {
    // 改进缩略图URL获取逻辑
    const [thumbnailError, setThumbnailError] = useState(false);
    // 确保生成唯一的缩略图URL，避免浏览器缓存
    const thumbnailUrl = video.thumbnailUrl || 
      `${API_BASE_URL}/api/videos/thumbnail?url=${encodeURIComponent(`/static/videos/${video.filename}`)}&t=${Date.now()}`;

    // 处理缩略图加载错误
    const handleThumbnailError = () => {
      console.error(`缩略图加载失败: ${thumbnailUrl} (文件名: ${video.filename})`);
      setThumbnailError(true);
      
      // 如果文件名包含空格，可能需要特殊处理
      if (video.filename.includes(' ')) {
        console.log(`检测到空格文件名: ${video.filename}，尝试特殊处理`);
        // 这里可以添加特殊处理逻辑
      }
    };

    // 打印缩略图URL用于调试
    useEffect(() => {
      console.log(`视频: ${video.filename}, 缩略图URL: ${thumbnailUrl}`);
    }, [video, thumbnailUrl]);

    return (
      <Card className="overflow-hidden transition-all hover:shadow-md group">
        <div className="relative">
          {/* 缩略图区域 */}
          <div 
            className="aspect-video bg-muted cursor-pointer overflow-hidden relative"
            onClick={() => onPreview(video)}
          >
            {!thumbnailError ? (
              <img 
                src={thumbnailUrl} 
                alt={video.filename} 
                className="w-full h-full object-cover transition-transform hover:scale-105"
                loading="lazy"
                onError={handleThumbnailError}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-2">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  {video.filename}
                </p>
                {/* 添加重试生成缩略图按钮 */}
                <Button 
                  size="sm" 
                  variant="outline"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateThumbnail(video);
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重新生成缩略图
                </Button>
              </div>
            )}
            
            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                <Play className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            {/* 视频时长标签 - 可以根据实际情况添加 */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
              视频
            </div>
            
            {/* 默认标记 */}
            {video.is_default && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                当前默认
              </div>
            )}

            {/* 删除按钮 */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteVideo(video);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* 视频信息 */}
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-2">
              <h3 className="font-medium text-sm line-clamp-1" title={video.filename}>
                {video.filename}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {video.mode === 'light' ? '明亮模式' : '暗黑模式'}
              </p>
            </div>
            
            {/* 设为默认按钮 */}
            <Button
              variant={video.is_default ? "ghost" : "outline"}
              size="sm"
              onClick={() => onSetDefault(video, activeTab)}
              disabled={isProcessing || video.is_default}
              className="whitespace-nowrap"
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {video.is_default ? "默认" : "设为默认"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>背景视频管理</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 功能说明 */}
        <div className="mb-6 p-4 border rounded-md bg-muted/20">
          <h3 className="text-base font-medium mb-2">功能说明</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>您可以为明亮模式和暗黑模式分别上传背景视频</li>
            <li>点击<Play className="inline-block h-3 w-3 mx-1" />按钮可预览视频</li>
            <li>点击<Check className="inline-block h-3 w-3 mx-1" />按钮可将视频设为当前模式的默认背景</li>
            <li>点击<X className="inline-block h-3 w-3 mx-1" />按钮可删除不需要的视频</li>
            <li>视频支持拖放上传，推荐尺寸比例为16:9，格式为MP4</li>
          </ul>
        </div>

        <Tabs defaultValue="light" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="light">明亮模式</TabsTrigger>
            <TabsTrigger value="dark">暗黑模式</TabsTrigger>
          </TabsList>

          {/* 上传部分 - 支持拖拽 */}
          <div 
            ref={dragAreaRef}
            className={`mb-6 bg-muted/30 p-6 rounded-lg border-2 border-dashed ${isDragging ? 'border-primary bg-primary/10' : 'border-border'} transition-colors duration-200`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <h3 className="text-lg font-medium mb-4">{activeTab === 'light' ? '上传明亮模式视频' : '上传暗黑模式视频'}</h3>
            
            <div className="flex flex-col items-center justify-center py-6">
              <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-center mb-4">
                将视频文件拖放到此处，或
              </p>
              
              <div>
                <Label htmlFor={`upload-${activeTab}`} className="cursor-pointer">
                  <div className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                    <Upload className="h-4 w-4" />
                    <span>选择视频文件</span>
                  </div>
                  <input
                    id={`upload-${activeTab}`}
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, activeTab)}
                    disabled={isUploading}
                  />
                </Label>
              </div>
              
              {isUploading && (
                <div className="flex items-center gap-2 py-4 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>上传中 {uploadProgress}%</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-sm text-muted-foreground text-center">
              支持的格式: MP4, WebM, Ogg • 最大文件大小: 50MB
            </div>

            {uploadError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* 视频列表 - 明亮模式 */}
          <TabsContent value="light" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // 加载中的骨架屏
                Array(3).fill().map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <VideoCard
                    key={video.filename}
                    video={video}
                    onPreview={handlePreviewVideo}
                    onSetDefault={setAsDefault}
                    isProcessing={processingVideo === video.filename}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  暂无明亮模式背景视频
                </div>
              )}
            </div>
          </TabsContent>

          {/* 视频列表 - 暗黑模式 */}
          <TabsContent value="dark" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // 加载中的骨架屏
                Array(3).fill().map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <VideoCard
                    key={video.filename}
                    video={video}
                    onPreview={handlePreviewVideo}
                    onSetDefault={setAsDefault}
                    isProcessing={processingVideo === video.filename}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  暂无暗黑模式背景视频
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 使用新的视频预览组件 */}
        {previewVideo && (
          <VideoPreview 
            video={previewVideo} 
            onClose={() => setPreviewVideo(null)} 
            onDelete={handleVideoDeleted}
          />
        )}

        {/* 删除确认对话框 */}
        {deleteVideo && (
          <AlertDialog open={!!deleteVideo} onOpenChange={(open) => !open && setDeleteVideo(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除视频 "{deleteVideo.filename}" 吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteVideo}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
};

export default BackgroundVideoManagement;