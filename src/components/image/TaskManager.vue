<template>
  <div class="task-manager">
    <el-card class="task-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>任务状态</span>
          <div class="header-actions">
            <el-badge 
              v-if="activeTasks.length > 0" 
              :value="activeTasks.length" 
              type="primary"
            >
              <el-button 
                type="text" 
                size="small"
                @click="toggleTaskList"
              >
                {{ showTaskList ? '收起' : '展开' }}
              </el-button>
            </el-badge>
            <el-button 
              v-if="completedTasks.length > 0"
              type="text" 
              size="small"
              @click="clearCompletedTasks"
              class="clear-btn"
            >
              清理已完成
            </el-button>
          </div>
        </div>
      </template>

      <!-- 当前活动任务 -->
      <div v-if="currentTask" class="current-task">
        <div class="task-header">
          <div class="task-title">
            <el-icon class="task-icon" :class="getTaskIconClass(currentTask.status)">
              <component :is="getTaskIcon(currentTask.status)" />
            </el-icon>
            <span class="task-name">{{ getTaskDisplayName(currentTask) }}</span>
            <el-tag 
              :type="getStatusTagType(currentTask.status)" 
              size="small"
              class="status-tag"
            >
              {{ getStatusText(currentTask.status) }}
            </el-tag>
          </div>
          <div class="task-time">
            {{ formatRelativeTime(currentTask.created_at) }}
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <el-progress 
            :percentage="currentTask.progress" 
            :status="getProgressStatus(currentTask.status)"
            :show-text="true"
            :stroke-width="8"
            class="task-progress"
          />
          <div v-if="currentTask.current_step" class="current-step">
            当前步骤: {{ currentTask.current_step }}
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="currentTask.status === 'failed' && currentTask.error_message" class="error-info">
          <el-alert 
            :title="currentTask.error_message" 
            type="error" 
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="error-actions">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="retryTask(currentTask.task_id)"
                  :loading="retryLoading"
                >
                  重试
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="removeTask(currentTask.task_id)"
                >
                  移除
                </el-button>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 任务完成信息 -->
        <div v-if="currentTask.status === 'completed'" class="completion-info">
          <el-alert 
            title="诊断完成" 
            type="success" 
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="completion-details">
                <p>处理耗时: {{ formatDuration(currentTask) }}</p>
                <p v-if="currentTask.result">
                  发现问题: {{ currentTask.result.image_analysis.discharge_type }}
                </p>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 无任务状态 -->
      <div v-else class="no-task">
        <div class="no-task-content">
          <el-icon class="no-task-icon"><document /></el-icon>
          <p class="no-task-text">暂无进行中的任务</p>
          <p class="no-task-hint">上传图像并开始诊断</p>
        </div>
      </div>

      <!-- 任务列表 -->
      <el-collapse-transition>
        <div v-show="showTaskList && tasks.length > 0" class="task-list">
          <el-divider content-position="left">
            <span class="divider-text">任务历史 ({{ tasks.length }})</span>
          </el-divider>
          
          <div class="task-items">
            <div 
              v-for="task in tasks.slice().reverse()" 
              :key="task.task_id"
              class="task-item"
              :class="{ 'task-active': task.task_id === currentTask?.task_id }"
              @click="selectTask(task.task_id)"
            >
              <div class="task-item-header">
                <div class="task-item-info">
                  <el-icon class="task-item-icon" :class="getTaskIconClass(task.status)">
                    <component :is="getTaskIcon(task.status)" />
                  </el-icon>
                  <span class="task-item-name">{{ getTaskDisplayName(task) }}</span>
                  <el-tag 
                    :type="getStatusTagType(task.status)" 
                    size="small"
                  >
                    {{ getStatusText(task.status) }}
                  </el-tag>
                </div>
                <div class="task-item-actions">
                  <el-button 
                    v-if="task.status === 'failed'"
                    type="text" 
                    size="small"
                    @click.stop="retryTask(task.task_id)"
                    :loading="retryLoading"
                  >
                    重试
                  </el-button>
                  <el-button 
                    type="text" 
                    size="small"
                    @click.stop="removeTask(task.task_id)"
                    class="remove-btn"
                  >
                    移除
                  </el-button>
                </div>
              </div>
              
              <div class="task-item-details">
                <div class="task-item-time">{{ formatTime(task.created_at) }}</div>
                <div v-if="task.status === 'processing' || task.status === 'uploading'" class="task-item-progress">
                  <el-progress 
                    :percentage="task.progress" 
                    :show-text="false"
                    :stroke-width="4"
                    :status="getProgressStatus(task.status)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-transition>

      <!-- 统计信息 -->
      <div v-if="tasks.length > 0" class="task-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">总任务</span>
            <span class="stat-value">{{ tasks.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">进行中</span>
            <span class="stat-value">{{ activeTasks.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已完成</span>
            <span class="stat-value">{{ completedTasks.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">失败</span>
            <span class="stat-value">{{ failedTasks.length }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Loading, 
  CircleCheck, 
  CircleClose, 
  Clock, 
  Document,
  Upload,
  Setting
} from '@element-plus/icons-vue';
import type { ImageDiagnosisTask, ImageTaskStatus } from '@/types';

// Props
interface Props {
  tasks: ImageDiagnosisTask[];
  currentTaskId?: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'task-select': [taskId: string];
  'task-retry': [taskId: string];
  'task-remove': [taskId: string];
  'tasks-clear-completed': [];
}>();

// Refs
const showTaskList = ref(false);
const retryLoading = ref(false);

// 计算属性
const currentTask = computed(() => {
  if (props.currentTaskId) {
    return props.tasks.find(task => task.task_id === props.currentTaskId);
  }
  return props.tasks.find(task => ['pending', 'uploading', 'processing'].includes(task.status));
});

const activeTasks = computed(() => {
  return props.tasks.filter(task => ['pending', 'uploading', 'processing'].includes(task.status));
});

const completedTasks = computed(() => {
  return props.tasks.filter(task => task.status === 'completed');
});

const failedTasks = computed(() => {
  return props.tasks.filter(task => task.status === 'failed');
});

// 监听任务变化，自动展开任务列表
watch(() => props.tasks.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    showTaskList.value = true;
  }
});

// 获取任务显示名称
const getTaskDisplayName = (task: ImageDiagnosisTask): string => {
  const deviceInfo = task.params.equipment_info;
  return `${deviceInfo.device_id} - ${task.params.image_type} 诊断`;
};

// 获取状态文本
const getStatusText = (status: ImageTaskStatus): string => {
  const statusMap = {
    pending: '等待中',
    uploading: '上传中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status] || status;
};

// 获取状态标签类型
const getStatusTagType = (status: ImageTaskStatus) => {
  const typeMap = {
    pending: 'info',
    uploading: 'warning',
    processing: 'primary',
    completed: 'success',
    failed: 'danger'
  };
  return typeMap[status] || 'info';
};

// 获取进度条状态
const getProgressStatus = (status: ImageTaskStatus) => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'exception';
  return undefined;
};

// 获取任务图标
const getTaskIcon = (status: ImageTaskStatus) => {
  const iconMap = {
    pending: Clock,
    uploading: Upload,
    processing: Setting,
    completed: CircleCheck,
    failed: CircleClose
  };
  return iconMap[status] || Clock;
};

// 获取任务图标样式类
const getTaskIconClass = (status: ImageTaskStatus): string => {
  const classMap = {
    pending: 'icon-pending',
    uploading: 'icon-uploading',
    processing: 'icon-processing',
    completed: 'icon-completed',
    failed: 'icon-failed'
  };
  return classMap[status] || '';
};

// 格式化相对时间
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
};

// 格式化时间
const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化持续时间
const formatDuration = (task: ImageDiagnosisTask): string => {
  if (!task.started_at || !task.completed_at) return '未知';
  
  const start = new Date(task.started_at).getTime();
  const end = new Date(task.completed_at).getTime();
  const duration = Math.floor((end - start) / 1000);
  
  if (duration < 60) return `${duration}秒`;
  
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}分${seconds}秒`;
};

// 切换任务列表显示
const toggleTaskList = () => {
  showTaskList.value = !showTaskList.value;
};

// 选择任务
const selectTask = (taskId: string) => {
  emit('task-select', taskId);
};

// 重试任务
const retryTask = async (taskId: string) => {
  try {
    retryLoading.value = true;
    emit('task-retry', taskId);
    ElMessage.success('任务已重新开始');
  } catch (error) {
    ElMessage.error('重试失败');
  } finally {
    retryLoading.value = false;
  }
};

// 移除任务
const removeTask = async (taskId: string) => {
  try {
    await ElMessageBox.confirm(
      '确认要移除这个任务吗？',
      '确认移除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    
    emit('task-remove', taskId);
    ElMessage.success('任务已移除');
  } catch {
    // 用户取消，不执行任何操作
  }
};

// 清理已完成的任务
const clearCompletedTasks = async () => {
  try {
    await ElMessageBox.confirm(
      `确认要清理 ${completedTasks.value.length} 个已完成的任务吗？`,
      '确认清理',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    
    emit('tasks-clear-completed');
    ElMessage.success('已清理完成的任务');
  } catch {
    // 用户取消，不执行任何操作
  }
};
</script>

<style scoped>
.task-manager {
  width: 100%;
}

.task-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  color: #f56c6c;
}

.clear-btn:hover {
  color: #f78989;
}

.current-task {
  margin-bottom: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.task-icon {
  font-size: 18px;
}

.icon-pending { color: #909399; }
.icon-uploading { color: #e6a23c; }
.icon-processing { color: #409eff; animation: spin 2s linear infinite; }
.icon-completed { color: #67c23a; }
.icon-failed { color: #f56c6c; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.task-name {
  font-weight: 500;
  color: #303133;
}

.status-tag {
  margin-left: 8px;
}

.task-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.progress-section {
  margin-bottom: 16px;
}

.task-progress {
  margin-bottom: 8px;
}

.current-step {
  font-size: 12px;
  color: #606266;
  text-align: center;
}

.error-info {
  margin-bottom: 16px;
}

.error-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.completion-info {
  margin-bottom: 16px;
}

.completion-details p {
  margin: 4px 0;
  font-size: 13px;
}

.no-task {
  text-align: center;
  padding: 40px 20px;
}

.no-task-content {
  color: #909399;
}

.no-task-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-task-text {
  font-size: 16px;
  margin: 0 0 8px 0;
}

.no-task-hint {
  font-size: 12px;
  margin: 0;
}

.task-list {
  margin-top: 20px;
}

.divider-text {
  font-size: 12px;
  color: #909399;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.task-item:hover {
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.task-item.task-active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.task-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.task-item-icon {
  font-size: 14px;
}

.task-item-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.task-item-actions {
  display: flex;
  gap: 4px;
}

.remove-btn {
  color: #f56c6c;
}

.remove-btn:hover {
  color: #f78989;
}

.task-item-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-item-time {
  font-size: 11px;
  color: #909399;
}

.task-item-progress {
  flex: 1;
  margin-left: 12px;
  max-width: 100px;
}

.task-stats {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .task-title {
    flex-wrap: wrap;
  }
  
  .task-time {
    align-self: flex-end;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .task-item-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .task-item-actions {
    align-self: flex-end;
  }
}
</style>