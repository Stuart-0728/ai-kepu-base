import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { AlertCircle, Upload, ArrowLeft, Video, Link as LinkIcon, X } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../lib/utils'
import axios from 'axios'

const NewsForm = ({ newsId = null, onSuccess }) => {
  const navigate = useNavigate()
  const { id: newsIdParam } = useParams() // Renamed to avoid conflict with component prop
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [videoTab, setVideoTab] = useState('none') // 'none', 'upload', 'embed'
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const videoFileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    category: 'general',
    customCategory: '',
    is_published: true,
    video_url: '',
    video_source: ''
  })

  useEffect(() => {
    fetchCategories()
    if (newsIdParam) {
      fetchNewsDetails()
    }
  }, [newsIdParam])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/news/categories`)
      if (response.ok) {
        const data = await response.json()
        // 将英文类别转换为中文显示
        const translatedCategories = data.categories.map(cat => ({
          value: cat.id || cat.value,
          label: translateCategory(cat.name || cat.label || cat.id || cat.value)
        }))
        setCategories(translatedCategories)
        console.log('获取到的新闻分类:', translatedCategories)
      }
    } catch (error) {
      console.error('获取新闻分类失败:', error)
    }
  }

  // 类别翻译函数
  const translateCategory = (category) => {
    const translations = {
      'general': '综合新闻',
      'physics': '物理科普',
      'ai': '人工智能',
      'activity': '活动资讯',
      'announcement': '公告',
      'event': '活动',
      'news': '新闻',
      'research': '研究',
      'other': '其他'
    }
    return translations[category] || category
  }

  const fetchNewsDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${API_BASE_URL}/api/news/${newsIdParam}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const news = data.news
        
        console.log('获取到新闻数据:', news);
        
        // 检查是否是自定义类别
        const isCustomCategory = categories.length > 0 && !categories.some(cat => cat.id === news.category);
        
        setFormData({
          title: news.title || '',
          content: news.content || '',
          author: news.author || '', // 确保获取作者信息
          category: isCustomCategory ? 'custom' : news.category,
          customCategory: isCustomCategory ? news.category : '',
          is_published: news.is_published || true, // 确保 is_published 有默认值
          video_url: news.video_url || '',
          video_source: news.video_source || ''
        })
        
        if (news.image_url) {
          setImagePreview(`${API_BASE_URL}${news.image_url}`)
        }

        // 处理视频相关数据
        if (news.video_url) {
          if (news.video_source === 'local') {
            setVideoTab('upload')
            setVideoPreview(`${API_BASE_URL}${news.video_url}`)
          } else if (news.video_source === 'embed') {
            setVideoTab('embed')
            setVideoUrl(news.video_url)
          }
        }
      } else {
        setError('获取新闻详情失败')
        toast.error('获取新闻详情失败')
      }
    } catch (error) {
      console.error('获取新闻详情失败:', error)
      setError('获取新闻详情失败')
      toast.error('获取新闻详情失败')
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

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 检查文件类型
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!validTypes.includes(file.type)) {
      toast.error('不支持的文件类型', {
        description: '请上传MP4、WebM或Ogg格式的视频'
      })
      return
    }

    // 检查文件大小 (50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('文件过大', {
        description: '视频文件大小不能超过50MB'
      })
      return
    }

    setVideoFile(file)
    
    // 创建预览
    const videoURL = URL.createObjectURL(file)
    setVideoPreview(videoURL)
  }

  const uploadVideo = async () => {
    if (!videoFile) return null

    setIsUploadingVideo(true)
    setVideoUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', videoFile)

      const response = await axios.post(`${API_BASE_URL}/api/admin/upload/news/video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setVideoUploadProgress(percentCompleted)
        }
      })

      toast.success('视频上传成功')
      return response.data.video.url
    } catch (error) {
      console.error('视频上传失败:', error)
      toast.error('视频上传失败', {
        description: error.response?.data?.error || '请稍后重试'
      })
      return null
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const handleVideoUrlChange = (e) => {
    setVideoUrl(e.target.value)
  }

  const clearVideo = () => {
    setVideoFile(null)
    setVideoPreview('')
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      
      // 验证表单
      if (!formData.title.trim()) {
        setError('请输入新闻标题')
        toast.error('请输入新闻标题')
        return
      }
      
      if (!formData.content.trim()) {
        setError('请输入新闻内容')
        toast.error('请输入新闻内容')
        return
      }
      
      // 处理类别
      const categoryValue = formData.category === 'custom' ? formData.customCategory : formData.category
      
      // 准备提交数据 - 使用JSON格式
      const jsonData = {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        category: categoryValue,
        is_published: formData.is_published
      }

      // 处理视频
      if (videoTab === 'upload' && videoFile) {
        // 上传视频文件
        const videoUrl = await uploadVideo()
        if (videoUrl) {
          jsonData.video_url = videoUrl
          jsonData.video_source = 'local'
        }
      } else if (videoTab === 'embed' && videoUrl) {
        // 使用嵌入视频URL
        jsonData.video_url = videoUrl
        jsonData.video_source = 'embed'
      } else if (videoTab === 'none') {
        // 清除视频
        jsonData.video_url = ''
        jsonData.video_source = ''
      } else if (formData.video_url) {
        // 保持原有视频
        jsonData.video_url = formData.video_url
        jsonData.video_source = formData.video_source
      }
      
      // 如果有图片，先上传图片
      if (imageFile) {
        try {
          const formData = new FormData()
          formData.append('image', imageFile)
          
          const uploadResponse = await axios.post(`${API_BASE_URL}/api/admin/upload/news/image`, formData, {
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
      const url = newsIdParam 
        ? `${API_BASE_URL}/api/admin/news/${newsIdParam}`
        : `${API_BASE_URL}/api/admin/news`
      
      const method = newsIdParam ? 'PUT' : 'POST' // 使用 PUT 进行更新
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData),
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(newsIdParam ? '新闻更新成功' : '新闻创建成功')
        
        if (onSuccess) {
          onSuccess(data.news_id)
        } else {
          navigate('/admin/news')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || '提交失败')
        toast.error(errorData.error || '提交失败')
      }
    } catch (error) {
      console.error('提交新闻表单失败:', error)
      setError('提交失败，请稍后重试')
      toast.error('提交失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto tech-border">
      <CardHeader>
        <CardTitle>{newsIdParam ? '编辑新闻' : '发布新闻'}</CardTitle>
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
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="请输入新闻标题"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="请输入新闻内容"
              rows={10}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">作者</Label>
              <Input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="请输入作者"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger className="bg-background border-2 shadow-sm">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 shadow-md z-50">
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value} className="hover:bg-accent">
                      {category.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="hover:bg-accent">自定义分类</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.category === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">自定义分类</Label>
                <Input
                  id="customCategory"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  placeholder="请输入自定义分类"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">封面图片</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="bg-background border-2 shadow-sm"
                />
              </div>
              {imagePreview && (
                <div className="relative h-20 w-20 rounded-md overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="预览" 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 视频上传/嵌入选项 */}
          <div className="space-y-2">
            <Label>视频</Label>
            <Tabs 
              value={videoTab} 
              onValueChange={setVideoTab} 
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="none">无视频</TabsTrigger>
                <TabsTrigger value="upload">上传视频</TabsTrigger>
                <TabsTrigger value="embed">嵌入链接</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        ref={videoFileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={handleVideoChange}
                        className="bg-background border-2 shadow-sm"
                      />
                    </div>
                    {videoPreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={clearVideo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {videoPreview && (
                    <div className="aspect-video w-full max-h-[300px] bg-black/10 rounded-md overflow-hidden">
                      <video 
                        src={videoPreview} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {isUploadingVideo && (
                    <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${videoUploadProgress}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <p>支持MP4、WebM、Ogg格式，最大50MB</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="embed" className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={videoUrl}
                      onChange={handleVideoUrlChange}
                      placeholder="请输入视频链接 (例如: https://www.bilibili.com/video/BV...)"
                      className="flex-1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>支持哔哩哔哩、优酷等主流视频网站的分享链接</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/news')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  提交中...
                </>
              ) : (
                '提交'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default NewsForm 