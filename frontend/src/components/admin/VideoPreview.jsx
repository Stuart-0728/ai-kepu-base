import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, RefreshCw, Volume2, VolumeX, Film, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import axios from 'axios';

/**
 * 视频预览组件
 * @param {Object} props
 * @param {Object} props.video 视频对象，包含url和filename
 * @param {Function} props.onClose 关闭回调
 * @param {Function} props.onDelete 删除回调
 */
const VideoPreview = ({ video, onClose, onDelete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 处理视频加载完成
  const handleVideoLoaded = () => {
    console.log("视频加载成功");
    setIsLoading(false);
    setError(false);
  };

  // 处理视频加载错误
  const handleVideoError = (e) => {
    console.error("视频加载失败:", e);
    setIsLoading(false);
    setError(true);
  };

  // 重试加载视频
  const retryLoading = () => {
    setIsLoading(true);
    setError(false);
    setRetryCount(prev => prev + 1);
    
    // 重新创建视频元素
    if (videoRef.current) {
      const videoElement = videoRef.current;
      const src = videoElement.src;
      videoElement.src = '';
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = src;
          videoRef.current.load();
        }
      }, 500);
    }
  };

  // 切换静音状态
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  // 处理视频删除
  const handleDeleteVideo = async () => {
    if (!video || !video.filename) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/videos/${video.filename}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success('删除成功', {
          description: `视频 ${video.filename} 已成功删除`
        });
      }
      
      // 关闭确认对话框
      setShowDeleteConfirm(false);
      
      // 调用删除回调
      if (onDelete) {
        onDelete(video);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('删除视频失败:', error);
      toast.error('删除失败', {
        description: error.response?.data?.error || "请稍后再试"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 构建完整的视频URL
  const getFullVideoUrl = () => {
    if (!video) return '';
    
    // 确保使用绝对路径
    let videoUrl = video.url;
    if (!videoUrl) {
      // 如果没有url属性，尝试从filename构建
      if (video.filename) {
        videoUrl = `/static/videos/${video.filename}`;
      } else {
        return '';
      }
    }
    
    // 确保URL是绝对路径
    if (!videoUrl.startsWith('http') && !videoUrl.startsWith(API_BASE_URL)) {
      videoUrl = `${API_BASE_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;
    }
    
    // 添加缓存破坏参数
    const fullUrl = `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
    console.log("预览视频URL:", fullUrl);
    return fullUrl;
  };

  useEffect(() => {
    // 当视频对象变化时，重置状态
    setIsLoading(true);
    setError(false);
    setRetryCount(0);
    
    console.log("视频预览组件接收到视频对象:", video);
  }, [video]);

  if (!video) {
    return null;
  }

  return (
    <>
      <Dialog open={!!video} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-md rounded-lg border shadow-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>视频预览</DialogTitle>
            <DialogDescription>查看和管理视频</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            {/* 视频播放区域 */}
            <div className="relative aspect-video bg-black overflow-hidden">
              {/* 加载状态 */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              
              {/* 错误状态 */}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                  <Film className="h-12 w-12 text-destructive mb-2" />
                  <p className="text-white mb-4">视频加载失败</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryLoading}
                    className="bg-background/20 backdrop-blur-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> 重试加载
                  </Button>
                </div>
              )}
              
              {/* 视频播放器 */}
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                autoPlay
                muted={isMuted}
                onLoadedData={handleVideoLoaded}
                onError={handleVideoError}
                crossOrigin="anonymous"
                src={getFullVideoUrl()}
              >
                您的浏览器不支持视频播放
              </video>
              
              {/* 静音切换按钮 */}
              {!isLoading && !error && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 bg-background/20 backdrop-blur-sm hover:bg-background/40 z-20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            {/* 视频信息区域 - YouTube风格 */}
            <div className="p-4 bg-background text-foreground">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-lg line-clamp-2 text-foreground">{video.filename}</h3>
                  <p className="text-sm text-muted-foreground">
                    模式: {video.mode === 'light' ? '明亮模式' : '暗黑模式'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* 删除按钮 - 如果是默认视频则禁用 */}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={video.is_default}
                    title={video.is_default ? "默认视频不能删除" : "删除视频"}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                  <Button variant="outline" onClick={() => onClose()}>关闭</Button>
                </div>
              </div>
              
              {/* 视频详细信息 */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">文件名</span>
                    <span className="font-medium truncate text-foreground">{video.filename}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">类型</span>
                    <span className="font-medium text-foreground">{video.mode === 'light' ? '明亮模式背景' : '暗黑模式背景'}</span>
                  </div>
                  {video.size && (
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">文件大小</span>
                      <span className="font-medium text-foreground">{Math.round(video.size / 1024 / 1024 * 100) / 100} MB</span>
                    </div>
                  )}
                  {video.created && (
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">上传时间</span>
                      <span className="font-medium text-foreground">{new Date(video.created).toLocaleString()}</span>
                    </div>
                  )}
                  {video.is_default && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-muted-foreground">状态</span>
                      <span className="font-medium text-primary">当前默认视频（不能删除）</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除视频 "{video.filename}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVideo}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VideoPreview; 