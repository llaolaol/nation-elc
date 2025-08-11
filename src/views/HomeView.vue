<template>
  <div class="home-view">
    <!-- Page Header -->
    <el-card class="header-card" shadow="never">
      <h1>欢迎使用智能故障诊断系统</h1>
      <p class="page-description">从这里开始，管理您的文档、进行故障推理或查看历史记录。</p>
    </el-card>

    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon icon-docs"><Files /></el-icon>
            <div class="stat-text">
              <div class="stat-label">已存文档总数</div>
              <div class="stat-value">{{ documentCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon icon-history"><Histogram /></el-icon>
            <div class="stat-text">
              <div class="stat-label">历史诊断次数</div>
              <div class="stat-value">{{ historyCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Quick Actions -->
    <el-card class="actions-card" style="margin-top: 20px">
      <template #header>
        <span>快速操作</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <router-link to="/diagnosis" class="action-link">
            <el-card shadow="hover" class="action-card">
              <el-icon class="action-icon"><Operation /></el-icon>
              <div class="action-title">故障推理</div>
              <p class="action-desc">输入参数，开始一次新的故障诊断。</p>
            </el-card>
          </router-link>
        </el-col>
        <el-col :span="8">
          <router-link to="/documents" class="action-link">
            <el-card shadow="hover" class="action-card">
              <el-icon class="action-icon"><Document /></el-icon>
              <div class="action-title">文档管理</div>
              <p class="action-desc">上传、查看和管理您的故障树文档。</p>
            </el-card>
          </router-link>
        </el-col>
        <el-col :span="8">
          <router-link to="/history" class="action-link">
            <el-card shadow="hover" class="action-card">
              <el-icon class="action-icon"><Histogram /></el-icon>
              <div class="action-title">诊断历史</div>
              <p class="action-desc">回顾和分析所有已保存的诊断记录。</p>
            </el-card>
          </router-link>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Operation, Document, Histogram, Files } from '@element-plus/icons-vue';
import { mockApi } from '@/services/mockApi.v2'; // 导入mockApi以获取文档计数

const documentCount = ref(0);
const historyCount = ref(0);

const loadStats = async () => {
  try {
    // 从localStorage获取历史记录计数
    const historyData = localStorage.getItem('diagnosisHistory');
    if (historyData) {
      const historyArray = JSON.parse(historyData);
      historyCount.value = historyArray.length;
    }

    // 从mockApi获取文档计数
    const docs = await mockApi.getDocuments();
    documentCount.value = docs.length;

  } catch (e) {
    console.error("Failed to load stats:", e);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.home-view {
  padding: 20px;
  background-color: #f0f2f5;
}
.header-card {
  border: none;
  background-color: transparent;
  margin-bottom: 20px;
}
.header-card h1 {
  margin: 0;
  font-size: 24px;
}
.page-description {
  color: #606266;
  margin-top: 8px;
  font-size: 14px;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  border-radius: 8px;
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}
.stat-icon {
  font-size: 48px;
  padding: 10px;
  border-radius: 8px;
  color: #fff;
}
.icon-docs {
  background-color: #409EFF;
}
.icon-history {
  background-color: #67C23A;
}
.stat-text {
  display: flex;
  flex-direction: column;
}
.stat-label {
  font-size: 14px;
  color: #909399;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}
.actions-card {
  border-radius: 8px;
}
.action-link {
  text-decoration: none;
}
.action-card {
  text-align: center;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}
.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.action-icon {
  font-size: 36px;
  margin-bottom: 15px;
  color: #409EFF;
}
.action-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}
.action-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}
</style>