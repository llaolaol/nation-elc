<template>
  <div id="app">
    <el-container style="height: 100vh">
      <!-- 左侧导航栏 -->
      <el-aside width="220px" style="background-color: #304156">
        <div class="logo-container">
          <h2 style="color: white; text-align: center; padding: 20px 0">
            故障诊断系统
          </h2>
        </div>
        
        <el-menu
          :default-active="$route.path"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          :unique-opened="true"
        >
          <el-menu-item index="/documents">
            <el-icon><Document /></el-icon>
            <span>文档管理</span>
          </el-menu-item>
          
          <el-menu-item index="/fault-tree">
            <el-icon><Share /></el-icon>
            <span>故障树预览</span>
          </el-menu-item>

          <el-menu-item index="/test1">
            <el-icon><TrendCharts /></el-icon>
            <span>故障树展示</span>
          </el-menu-item>

          <el-menu-item index="/fault-tree-management">
            <el-icon><Management /></el-icon>
            <span>故障树管理</span>
          </el-menu-item>
          
          <el-menu-item index="/diagnosis">
            <el-icon><Operation /></el-icon>
            <span>故障推理</span>
          </el-menu-item>

          <el-menu-item index="/image-diagnosis">
            <el-icon><Camera /></el-icon>
            <span>图像诊断</span>
          </el-menu-item>

          <el-menu-item index="/history">
            <el-icon><Histogram /></el-icon>
            <span>诊断历史</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main style="padding: 20px; background-color: #f0f2f5">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
// 导入Element Plus图标组件
import { Document, Share, Operation, Histogram, Camera, TrendCharts, Management } from '@element-plus/icons-vue'
</script>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.logo-container {
  border-bottom: 1px solid #263445;
}

.el-menu {
  border-right: none;
}

.el-main {
  overflow-y: auto;
  padding: 20px;
  background-color: #f0f2f5;
}

/* 确保el-container占满全屏 */
.el-container {
  width: 100% !important;
  height: 100vh !important;
}

/* 确保aside固定宽度 */
.el-aside {
  width: 220px !important;
  background-color: #304156 !important;
  flex-shrink: 0;
}
</style>
