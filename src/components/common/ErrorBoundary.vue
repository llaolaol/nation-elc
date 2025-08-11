<!-- 错误边界组件 -->
<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-display">
      <el-result
        icon="error"
        :title="errorTitle"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="retry">
            <el-icon><Refresh /></el-icon>
            重试
          </el-button>
          <el-button @click="goHome">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
        </template>
      </el-result>
      
      <!-- 开发环境下显示错误详情 -->
      <div v-if="isDev && errorDetails" class="error-details">
        <el-collapse>
          <el-collapse-item title="错误详情" name="details">
            <pre class="error-stack">{{ errorDetails }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed, readonly } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, House } from '@element-plus/icons-vue'

interface Props {
  fallbackTitle?: string
  fallbackMessage?: string
  onError?: (error: Error, errorInfo: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: '出现了一些问题',
  fallbackMessage: '页面遇到错误，请稍后重试'
})

const emit = defineEmits<{
  error: [error: Error, errorInfo: any]
  retry: []
}>()

const router = useRouter()
const hasError = ref(false)
const errorInfo = ref<any>(null)
const error = ref<Error | null>(null)

const isDev = computed(() => import.meta.env.DEV)
const errorTitle = computed(() => props.fallbackTitle)
const errorMessage = computed(() => {
  if (error.value?.message) {
    return `${props.fallbackMessage}：${error.value.message}`
  }
  return props.fallbackMessage
})

const errorDetails = computed(() => {
  if (!error.value) return null
  
  return `错误信息: ${error.value.message}\n\n错误堆栈:\n${error.value.stack || '无堆栈信息'}`
})

// 捕获子组件错误
onErrorCaptured((err: Error, instance: any, info: string) => {
  console.error('ErrorBoundary捕获到错误:', err)
  console.error('错误信息:', info)
  
  hasError.value = true
  error.value = err
  errorInfo.value = { instance, info }
  
  // 调用外部错误处理函数
  props.onError?.(err, { instance, info })
  
  // 触发错误事件
  emit('error', err, { instance, info })
  
  // 显示错误提示
  ElMessage.error(`页面发生错误: ${err.message}`)
  
  // 阻止错误继续传播
  return false
})

// 重试功能
const retry = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = null
  emit('retry')
  
  // 刷新当前路由
  router.go(0)
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 手动设置错误状态
const setError = (err: Error, info?: any) => {
  hasError.value = true
  error.value = err
  errorInfo.value = info
}

// 清除错误状态
const clearError = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = null
}

// 暴露方法给父组件
defineExpose({
  setError,
  clearError,
  hasError: readonly(hasError)
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-display {
  padding: 40px 20px;
  text-align: center;
}

.error-details {
  margin-top: 20px;
  text-align: left;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.error-stack {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

:deep(.el-result__icon) {
  font-size: 64px;
}

:deep(.el-result__title) {
  margin-top: 20px;
  font-size: 20px;
}

:deep(.el-result__subtitle) {
  margin-top: 10px;
  font-size: 14px;
}

:deep(.el-result__extra) {
  margin-top: 30px;
}
</style>