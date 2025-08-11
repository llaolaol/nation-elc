<template>
  <div class="diagnosis-history-page">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <h1>诊断历史记录</h1>
      <p class="page-description">查看、搜索和管理所有已保存的故障诊断记录。</p>
    </el-card>

    <!-- 搜索与操作区域 -->
    <el-card style="margin-top: 20px">
      <el-row :gutter="20" justify="space-between">
        <el-col :span="16">
          <el-input
            v-model="searchQuery"
            placeholder="按故障类型或诊断详情搜索..."
            prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="8" style="text-align: right;">
          <el-button type="danger" @click="clearHistory" :icon="Delete">
            清空所有记录
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 历史记录列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>历史记录列表 ({{ filteredHistory.length }})</span>
      </template>
      <el-table :data="filteredHistory" style="width: 100%" v-loading="loading">
        <el-table-column type="expand">
          <template #default="props">
            <div class="record-details">
              <h4>诊断输入参数</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item v-for="(value, key) in props.row.params" :key="key" :label="key">
                  {{ value }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="result.fault_type" label="故障类型" width="180">
           <template #default="{ row }">
            <el-tag :type="getFaultTypeColor(row.result.fault_type)">
              {{ row.result.fault_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result.diagnosis" label="诊断详情" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="timestamp" label="诊断时间" width="200">
          <template #default="{ row }">
            {{ new Date(row.timestamp).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewDetails(row)">查看</el-button>
            <el-button size="small" type="danger" text @click="deleteRecord(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
       <el-empty v-if="filteredHistory.length === 0" description="暂无历史记录或匹配结果"></el-empty>
    </el-card>

     <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="诊断记录详情" direction="rtl" size="50%">
      <div v-if="selectedRecord" class="drawer-content">
        <h4><el-icon><DocumentChecked /></el-icon> 诊断结果</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="故障类型">
            <el-tag :type="getFaultTypeColor(selectedRecord.result.fault_type)">{{ selectedRecord.result.fault_type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="置信度">{{ (selectedRecord.result.confidence * 100).toFixed(1) }}%</el-descriptions-item>
          <el-descriptions-item label="诊断详情">{{ selectedRecord.result.diagnosis }}</el-descriptions-item>
          <el-descriptions-item label="建议措施">
             <el-alert :title="selectedRecord.result.recommendation" type="warning" :closable="false" show-icon />
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 30px;"><el-icon><DataAnalysis /></el-icon> 诊断输入参数</h4>
        <el-descriptions :column="2" border size="small">
           <el-descriptions-item v-for="(value, key) in selectedRecord.params" :key="key" :label="key">
              {{ value }}
            </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Delete, DocumentChecked, DataAnalysis } from '@element-plus/icons-vue';

interface HistoryRecord {
  id: string;
  timestamp: string;
  params: any;
  result: any;
}

const history = ref<HistoryRecord[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const drawerVisible = ref(false);
const selectedRecord = ref<HistoryRecord | null>(null);

const filteredHistory = computed(() => {
  if (!searchQuery.value) {
    return history.value;
  }
  const query = searchQuery.value.toLowerCase();
  return history.value.filter(record =>
    record.result.fault_type.toLowerCase().includes(query) ||
    record.result.diagnosis.toLowerCase().includes(query)
  );
});

const loadHistory = () => {
  loading.value = true;
  try {
    const data = localStorage.getItem('diagnosisHistory');
    history.value = data ? JSON.parse(data) : [];
  } catch (e) {
    ElMessage.error('加载历史记录失败');
    history.value = [];
  } finally {
    loading.value = false;
  }
};

const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有历史记录吗？此操作不可撤销。', '警告', {
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localStorage.removeItem('diagnosisHistory');
    history.value = [];
    ElMessage.success('所有历史记录已清空');
  });
};

const deleteRecord = (id: string) => {
  history.value = history.value.filter(record => record.id !== id);
  localStorage.setItem('diagnosisHistory', JSON.stringify(history.value));
  ElMessage.success('该条记录已删除');
};

const viewDetails = (record: HistoryRecord) => {
  selectedRecord.value = record;
  drawerVisible.value = true;
};

const getFaultTypeColor = (faultType: string) => {
  if (faultType.includes('过热')) return 'danger';
  if (faultType.includes('放电')) return 'warning';
  return 'info';
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.diagnosis-history-page {
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
.record-details {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
.drawer-content h4 {
    margin-top: 20px;
    margin-bottom: 10px;
    font-size: 16px;
    display: flex;
    align-items: center;
}
.drawer-content .el-icon {
    margin-right: 8px;
}
</style>
