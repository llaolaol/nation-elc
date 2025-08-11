import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 优化配置
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'echarts',
      'xlsx'
    ]
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'echarts': ['echarts', 'vue-echarts'],
          'xlsx': ['xlsx'],
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    },
    // 启用gzip压缩
    reportCompressedSize: true,
    // 减少打包体积
    minify: 'terser'
  },
  server: {
    // 开发服务器优化
    hmr: {
      overlay: false
    },
    host: true,
    port: 3000
  }
})
