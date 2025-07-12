import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Eye, Edit, Trash2, Plus, Calendar } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'

const ActivitiesManagement = ({ openDeleteDialog }) => {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchActivities()
  }, [])
  
  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('获取活动失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 添加刷新活动列表的方法，供父组件调用
  useEffect(() => {
    // 创建一个事件监听器，监听活动删除事件
    const handleActivityDeleted = () => {
      fetchActivities()
    }
    
    window.addEventListener('activity-deleted', handleActivityDeleted)
    
    return () => {
      window.removeEventListener('activity-deleted', handleActivityDeleted)
    }
  }, [])
  
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
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">活动管理</h1>
          <p className="text-muted-foreground">创建和管理科普活动</p>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => navigate('/admin/activities/create')} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>创建活动</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无活动</h3>
              <p className="text-muted-foreground mb-4">
                开始创建您的第一个活动
              </p>
              <Button onClick={() => navigate('/admin/activities/create')}>
                <Plus className="mr-2 h-4 w-4" /> 创建活动
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((item) => (
                <div key={item.id} className="p-4 flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                      <Badge variant="outline" className="mr-2">
                        {translateCategory(item.category)}
                      </Badge>
                      <span>{formatDate(item.start_time)}</span>
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(`/activities/${item.id}`)}
                      className="admin-action-button"
                    >
                      <Eye className="admin-action-icon" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate(`/admin/activities/edit/${item.id}`)}
                      className="admin-action-button"
                    >
                      <Edit className="admin-action-icon" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openDeleteDialog(item)}
                      className="admin-action-button destructive"
                    >
                      <Trash2 className="admin-action-icon" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ActivitiesManagement 