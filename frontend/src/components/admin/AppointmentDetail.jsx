import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { AlertCircle, CheckCircle2, XCircle, Users, ClipboardList } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../lib/utils'
import { formatDate, formatDateTime } from '../../utils/dateUtils'

const statusMap = {
  'pending': { label: '待审核', color: 'outline' },
  'confirmed': { label: '已确认', color: 'default' },
  'cancelled': { label: '已取消', color: 'destructive' },
  'completed': { label: '已完成', color: 'success' }
}

const AppointmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [status, setStatus] = useState('pending')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('获取预约详情失败')
        }
        
        const data = await response.json()
        console.log('预约详情数据:', data)
        setAppointment(data.appointment)
        setStatus(data.appointment.status)
        setAdminNotes(data.appointment.admin_notes || '')
        setLoading(false)
      } catch (err) {
        console.error('获取预约详情错误:', err)
        setError(err.message)
        setLoading(false)
      }
    }
    
    fetchAppointment()
  }, [id])

  const handleStatusChange = async () => {
    setUpdating(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          admin_notes: adminNotes
        })
      })
      
      if (!response.ok) {
        throw new Error('更新预约状态失败')
      }
      
      toast.success('预约状态已更新')
      // 不跳转，而是显示成功消息
      const updatedResponse = await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        credentials: 'include'
      })
      
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setAppointment(data.appointment)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p>加载中...</p>
    </div>
  )
  
  if (error) return (
    <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
  
  if (!appointment) return (
    <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>未找到预约信息</AlertDescription>
    </Alert>
  )
  
  const currentStatus = statusMap[appointment.status] || { label: appointment.status, color: 'outline' }
  
  return (
    <div className="container max-w-4xl py-8">
      <Card className="bg-white shadow-lg border-border">
        <CardHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">预约详情</CardTitle>
            <Badge variant={currentStatus.color}>{currentStatus.label}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 bg-white">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">联系人</h3>
                <p className="text-lg font-medium">{appointment.contact_name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">联系电话</h3>
                <p className="text-lg font-medium">{appointment.contact_phone}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">{appointment.visitor_count} 人</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">预约日期</h3>
                <p className="text-lg font-medium">{formatDate(appointment.date)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">时间段</h3>
                <p className="text-lg font-medium">{appointment.time_slot}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">预约时间</h3>
                <p className="text-lg font-medium">{appointment.created_at ? formatDateTime(appointment.created_at) : '无'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="status">预约状态</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md"
                disabled={updating}
              >
                <option value="pending">待审核</option>
                <option value="confirmed">已确认</option>
                <option value="cancelled">已取消</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="admin-notes">管理员备注</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="添加备注信息..."
                className="mt-1"
                rows={4}
                disabled={updating}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4 mt-6 bg-white">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/appointments')}
            disabled={updating}
          >
            返回
          </Button>
          
          <Button
            onClick={handleStatusChange}
            disabled={updating}
          >
            {updating ? '更新中...' : '更新状态'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AppointmentDetail 