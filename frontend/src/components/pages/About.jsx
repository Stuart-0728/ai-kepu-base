import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { 
  Brain, 
  Target, 
  Award, 
  Users, 
  Lightbulb,
  Microscope,
  Cpu,
  Atom
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const About = () => {
  const { theme } = useTheme();
  
  // 组件挂载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const achievements = [
    {
      icon: Award,
      title: '重庆科技局授牌',
      description: '正式获得重庆市科技局认证的科普基地资质，为公众提供高质量的科普教育服务',
      year: '2020'
    },
    {
      icon: Users,
      title: '服务公众超千人',
      description: '累计为超过1000名公众提供科普服务',
      year: '2024'
    },
    {
      icon: Lightbulb,
      title: '创新科普模式',
      description: '开创性地将AI与物理科普相结合，让科学知识更加贴近生活',
      year: '2023'
    },
    {
      icon: Microscope,
      title: '先进科普设备',
      description: '配备专业科普设备，为公众提供沉浸式体验',
      year: '2024'
    }
  ]

  const missions = [
    {
      icon: Brain,
      title: '普及AI知识',
      description: '让人工智能技术走进千家万户，提升公众科学素养'
    },
    {
      icon: Atom,
      title: '物理科普教育',
      description: '通过生动有趣的方式传播物理科学知识'
    },
    {
      icon: Users,
      title: '公益服务',
      description: '坚持公益性质，为社会提供免费优质科普服务'
    },
    {
      icon: Cpu,
      title: '科技创新',
      description: '推动科普教育与现代科技的深度融合'
    }
  ]

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="flex justify-center mb-8">
            <img 
              src="/images/logo2.png" 
              alt="重庆市沙坪坝区人工智能科普基地" 
              className={`h-16 w-auto ${theme === 'dark' ? 'filter invert' : ''}`}
              onError={(e) => {
                console.log('Logo加载失败，使用备用图片');
                e.target.onerror = null;
                e.target.src = '/images/logo.png';
              }}
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            关于我们
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            重庆市沙坪坝区人工智能科普基地是由重庆师范大学主办、重庆科技局授牌的专业科普教育机构。
            我们致力于推广人工智能和物理科学知识，为公众提供高质量的科普教育服务。
          </p>
        </motion.div>

        {/* Mission Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
              我们的使命
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              通过创新的科普教育方式，让科学知识更加贴近生活，激发公众对科学的兴趣和热爱
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {missions.map((mission, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full tech-border hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <mission.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-xl gradient-text">{mission.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {mission.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Achievements Section */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
              发展历程
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              从成立至今，我们不断发展壮大，取得了一系列重要成就
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="tech-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <achievement.icon className="h-10 w-10 text-primary" />
                      <Badge variant="outline">{achievement.year}</Badge>
                    </div>
                    <CardTitle className="text-xl gradient-text">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {achievement.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Detailed Introduction */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="tech-border">
              <CardHeader>
                <CardTitle className="text-2xl gradient-text text-center">
                  基地详细介绍
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-muted-foreground">
                <div className="space-y-6">
                  <p>
                    重庆市沙坪坝区人工智能科普基地坐落于重庆师范大学物理与电子工程学院，
                    拥有现代化的科普设备、实验室、多媒体教室等设施。基地以"科技创新、教育为本"为理念，
                    致力于打造先进的的人工智能科普教育平台。
                  </p>
                  
                  <p>
                    基地设有人工智能展示区、物理实验区、互动体验区等功能区域。
                    展示区通过丰富的多媒体展示和实物模型，生动展现人工智能技术的发展历程和应用前景；
                    实验区配备了先进的物理实验设备，让参观者能够亲手操作，感受科学的魅力；
                    互动体验区通过先进技术，为参观者提供沉浸式的科学体验。
                  </p>
                  
                  <p>
                    作为公益性科普机构，基地面向社会各界免费开放，特别欢迎中小学生、教师、
                    科技工作者以及对科学感兴趣的公众前来参观学习。我们定期举办科普讲座、
                    实验演示、科技竞赛等活动，为推动全民科学素质提升贡献力量。
                  </p>
                  
                  <p>
                    未来，基地将继续秉承"普及科学知识、弘扬科学精神、传播科学思想、
                    倡导科学方法"的宗旨，不断创新科普教育形式，扩大服务范围，
                    为建设创新型国家和科技强国贡献更大力量。
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Contact Information */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 gradient-text">
              联系我们
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="tech-border">
                <CardHeader>
                  <CardTitle className="text-lg gradient-text">地址</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    重庆市沙坪坝区大学城中路37号<br />
                    重庆师范大学校内
                  </p>
                </CardContent>
              </Card>
              
              <Card className="tech-border">
                <CardHeader>
                  <CardTitle className="text-lg gradient-text">联系电话</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    023-65362000<br />
                    工作时间：9:00-17:00
                  </p>
                </CardContent>
              </Card>
              
              <Card className="tech-border">
                <CardHeader>
                  <CardTitle className="text-lg gradient-text">电子邮箱</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ai-base@cqnu.edu.cn<br />
                    欢迎咨询和建议
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

export default About

