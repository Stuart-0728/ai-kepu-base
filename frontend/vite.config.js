import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  const apiUrl = env.VITE_API_URL || 'http://localhost:5002'
  
  console.log(`当前环境: ${mode}, API URL: ${apiUrl}`)
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          timeout: 30000, // 增加超时时间到30秒
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              console.log('代理错误:', err);
              
              // 如果响应头已发送，则无法再发送错误响应
              if (!res || res.headersSent) {
                console.error('无法发送错误响应，响应头已发送或响应对象不存在');
                return;
              }
              
              try {
                // 返回JSON格式的错误信息
                const statusCode = err.code === 'ECONNREFUSED' ? 503 : 500;
                
                res.writeHead(statusCode, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Credentials': 'true',
                });
                
                const errorResponse = {
                  error: true,
                  message: `代理请求失败: ${err.message}`,
                  code: err.code
                };
                
                res.end(JSON.stringify(errorResponse));
              } catch (writeError) {
                console.error('发送错误响应时发生错误:', writeError);
              }
            });
            
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`发送请求到目标服务器: ${req.method} ${req.url}`);
              // 确保cookie正确传递
              if (req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
              }
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`收到目标服务器响应: ${proxyRes.statusCode} ${req.url}`);
              
              // 记录非成功状态码
              if (proxyRes.statusCode >= 400) {
                console.error(`API请求失败: ${req.url}, 状态码: ${proxyRes.statusCode}`);
              }
            });
          },
        },
        '/static': {
          target: apiUrl,
          changeOrigin: true,
        }
      },
      // 添加更多服务器配置
      host: '0.0.0.0',  // 允许局域网访问
      port: 5175,       // 更改默认端口
      strictPort: false, // 如果端口被占用，尝试下一个可用端口
      open: false,      // 启动时不自动打开浏览器
      cors: true,       // 启用CORS
      hmr: {
        overlay: true,  // 启用热更新错误覆盖
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development', // 仅在开发环境启用sourcemap
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // 生产环境删除console
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs']
          }
        }
      }
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
    },
  }
})
