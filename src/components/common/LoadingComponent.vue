<!-- 通用加载组件 -->
<template>
  <div 
    v-loading="loading" 
    :element-loading-text="loadingText"
    :element-loading-spinner="spinner"
    element-loading-background="rgba(0, 0, 0, 0.6)"
    class="loading-container"
    :class="{ 'full-screen': fullScreen }"
  >
    <slot v-if="!loading" />
    
    <!-- 自定义加载状态 -->
    <div v-if="loading && customLoader" class="custom-loader">
      <div class="loader-animation">
        <div class="loader-circle"></div>
        <div class="loader-circle"></div>
        <div class="loader-circle"></div>
      </div>
      <p class="loader-text">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading: boolean
  loadingText?: string
  fullScreen?: boolean
  customLoader?: boolean
  spinner?: string
}

withDefaults(defineProps<Props>(), {
  loadingText: '加载中...',
  fullScreen: false,
  customLoader: false,
  spinner: 'el-icon-loading'
})
</script>

<style scoped>
.loading-container {
  position: relative;
  min-height: 200px;
}

.loading-container.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loader-animation {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}

.loader-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: loader-bounce 1.4s ease-in-out infinite both;
}

.loader-circle:nth-child(1) { animation-delay: -0.32s; }
.loader-circle:nth-child(2) { animation-delay: -0.16s; }
.loader-circle:nth-child(3) { animation-delay: 0; }

.loader-text {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

@keyframes loader-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>