import { Link, useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Footer = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  
  // 处理导航点击，滚动到顶部并导航
  const handleNavigation = (path) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      navigate(path);
    }, 300); // 给滚动一点时间再导航
  };
  
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/images/logo2.png" 
                alt="重庆市沙坪坝区人工智能科普基地" 
                className={`h-8 w-auto ${theme === 'dark' ? 'filter invert' : ''}`}
              />
              <span className="font-bold text-lg gradient-text">
                重庆市沙坪坝区<br/>
                人工智能科普基地
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              重庆市沙坪坝区人工智能科普基地致力于推广人工智能和物理科学知识，
              为公众提供优质的科普教育服务。
            </p>
            <div className="text-xs text-muted-foreground">
              重庆科技局授牌 · 重庆师范大学主办
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 flex flex-col items-start">
            <h3 className="font-semibold text-foreground mb-2">快速导航</h3>
            <nav className="w-full">
            <ul className="space-y-2 text-sm">
              <li>
                  <button 
                    onClick={() => handleNavigation('/about')}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  基地介绍
                  </button>
              </li>
              <li>
                  <button 
                    onClick={() => handleNavigation('/news')}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  新闻动态
                  </button>
              </li>
              <li>
                  <button 
                    onClick={() => handleNavigation('/activities')}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  活动中心
                  </button>
              </li>
              <li>
                  <button 
                    onClick={() => handleNavigation('/appointment')}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  参观预约
                  </button>
              </li>
            </ul>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-2">联系我们</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>重庆市沙坪坝区大学城中路37号</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>023-65362000</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>ai-base@cqnu.edu.cn</span>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground mb-2">相关链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.cqnu.edu.cn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>重庆师范大学</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://kjj.cq.gov.cn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>重庆市科技局</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.most.gov.cn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>科技部</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} 重庆市沙坪坝区人工智能科普基地. 保留所有权利.
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="text-muted-foreground">
                隐私政策
              </span>
              <span>|</span>
              <span className="text-muted-foreground">
                使用条款
              </span>
              <span>|</span>
              <span>渝ICP备xxxxxxxx号</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

