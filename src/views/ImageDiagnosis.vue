<template>
  <div class="image-diagnosis">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <el-icon class="title-icon"><camera /></el-icon>
            图像诊断
          </h1>
          <p class="page-description">
            上传局部放电图像，通过AI智能分析识别设备故障
          </p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalTasks }}</span>
            <span class="stat-label">总任务</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ activeTasks.length }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ completedTasks.length }}</span>
            <span class="stat-label">已完成</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <el-row :gutter="24">
        <!-- 左侧：上传和配置区域 -->
        <el-col :lg="10" :md="12" :sm="24">
          <div class="left-panel">
            <!-- 设备信息配置 -->
            <el-card class="config-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>设备信息</span>
                  <el-button 
                    type="text" 
                    size="small"
                    @click="resetForm"
                  >
                    重置
                  </el-button>
                </div>
              </template>

              <el-form 
                ref="formRef"
                :model="diagnosisForm" 
                :rules="formRules"
                label-width="100px"
                class="diagnosis-form"
              >
                <el-form-item label="设备编号" prop="device_id" required>
                  <el-input 
                    v-model="diagnosisForm.device_id"
                    placeholder="请输入设备编号"
                    clearable
                  />
                </el-form-item>

                <el-form-item label="设备类型" prop="device_type" required>
                  <el-select 
                    v-model="diagnosisForm.device_type"
                    placeholder="请选择设备类型"
                    style="width: 100%"
                  >
                    <el-option label="主变压器" value="main_transformer" />
                    <el-option label="配电变压器" value="distribution_transformer" />
                    <el-option label="开关柜" value="switchgear" />
                    <el-option label="断路器" value="circuit_breaker" />
                    <el-option label="互感器" value="instrument_transformer" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-form-item>

                <el-form-item label="设备位置" prop="location" required>
                  <el-input 
                    v-model="diagnosisForm.location"
                    placeholder="请输入设备位置"
                    clearable
                  />
                </el-form-item>

                <el-form-item label="图像类型" prop="image_type" required>
                  <el-radio-group v-model="diagnosisForm.image_type" class="image-type-group">
                    <el-radio value="PRPD">PRPD图</el-radio>
                    <el-radio value="UHF">UHF图</el-radio>
                    <el-radio value="TEV">TEV图</el-radio>
                    <el-radio value="AE">AE图</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="识别敏感度" prop="sensitivity">
                  <el-radio-group v-model="diagnosisForm.sensitivity" class="sensitivity-group">
                    <el-radio value="low">低</el-radio>
                    <el-radio value="medium">中</el-radio>
                    <el-radio value="high">高</el-radio>
                  </el-radio-group>
                  <div class="sensitivity-help">
                    <small>敏感度越高，检测越精细但可能产生误报</small>
                  </div>
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 图像上传组件 -->
            <ImageUploader 
              ref="uploaderRef"
              @files-change="handleFilesChange"
              @files-clear="handleFilesClear"
              class="uploader-section"
            />

            <!-- 诊断控制 -->
            <el-card class="control-card" shadow="hover">
              <div class="control-content">
                <div class="control-info">
                  <div v-if="uploadedFiles.length === 0" class="no-files-hint">
                    <el-icon class="hint-icon"><warning /></el-icon>
                    <span>请先上传图像文件</span>
                  </div>
                  <div v-else class="files-ready">
                    <el-icon class="ready-icon"><circle-check /></el-icon>
                    <span>已准备 {{ uploadedFiles.length }} 个文件</span>
                  </div>
                </div>
                
                <el-button 
                  type="primary" 
                  size="large"
                  @click="startDiagnosis"
                  :disabled="!canStartDiagnosis"
                  :loading="isSubmitting"
                  class="diagnosis-btn"
                >
                  <el-icon v-if="!isSubmitting"><data-analysis /></el-icon>
                  {{ isSubmitting ? '提交中...' : '开始诊断' }}
                </el-button>
              </div>
            </el-card>
          </div>
        </el-col>

        <!-- 右侧：任务状态和结果区域 -->
        <el-col :lg="14" :md="12" :sm="24">
          <div class="right-panel">
            <!-- 任务管理组件 -->
            <TaskManager 
              :tasks="tasks"
              :current-task-id="currentTaskId"
              @task-select="handleTaskSelect"
              @task-retry="handleTaskRetry"
              @task-remove="handleTaskRemove"
              @tasks-clear-completed="handleClearCompletedTasks"
              class="task-manager-section"
            />

            <!-- 结果展示组件 -->
            <ResultDisplay 
              :result="currentResult"
              @export-result="handleExportResult"
              class="result-section"
            />
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Camera, 
  Warning, 
  CircleCheck, 
  DataAnalysis 
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

// 组件导入
import ImageUploader from '@/components/image/ImageUploader.vue';
import TaskManager from '@/components/image/TaskManager.vue';
import ResultDisplay from '@/components/image/ResultDisplay.vue';

// 类型导入
import type { 
  ImageDiagnosisParams, 
  ImageDiagnosisTask, 
  ImageDiagnosisResult,
  EquipmentInfo,
  ImageType,
  SensitivityLevel
} from '@/types';

// 服务导入
import ImageDiagnosisService from '@/services/imageDiagnosis';

// 表单数据
interface DiagnosisForm {
  device_id: string;
  device_type: string;
  location: string;
  image_type: ImageType;
  sensitivity: SensitivityLevel;
}

// Refs
const formRef = ref<FormInstance>();
const uploaderRef = ref<InstanceType<typeof ImageUploader>>();
const uploadedFiles = ref<File[]>([]);
const tasks = ref<ImageDiagnosisTask[]>([]);
const currentTaskId = ref<string>('');
const isSubmitting = ref(false);
const taskPollingInterval = ref<number | null>(null);

// 表单数据
const diagnosisForm = ref<DiagnosisForm>({
  device_id: '',
  device_type: '',
  location: '',
  image_type: 'PRPD',
  sensitivity: 'medium'
});

// 表单验证规则
const formRules: FormRules = {
  device_id: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
    { min: 2, max: 50, message: '设备编号长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  device_type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入设备位置', trigger: 'blur' },
    { min: 2, max: 100, message: '设备位置长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  image_type: [
    { required: true, message: '请选择图像类型', trigger: 'change' }
  ]
};

// 计算属性
const canStartDiagnosis = computed(() => {
  return uploadedFiles.value.length > 0 && 
         diagnosisForm.value.device_id.trim() !== '' &&
         diagnosisForm.value.device_type !== '' &&
         diagnosisForm.value.location.trim() !== '' &&
         !isSubmitting.value;
});

const activeTasks = computed(() => {
  return tasks.value.filter(task => 
    ['pending', 'uploading', 'processing'].includes(task.status)
  );
});

const completedTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'completed');
});

const totalTasks = computed(() => tasks.value.length);

const currentTask = computed(() => {
  return currentTaskId.value 
    ? tasks.value.find(task => task.task_id === currentTaskId.value)
    : activeTasks.value[0] || null;
});

const currentResult = computed(() => {
  return currentTask.value?.result || null;
});

// 组件挂载
onMounted(() => {
  loadTasks();
  startTaskPolling();
});

// 组件卸载
onUnmounted(() => {
  stopTaskPolling();
});

// 加载任务列表
const loadTasks = () => {
  const storedTasks = ImageDiagnosisService.getAllTasks();
  
  // 智能合并任务状态，避免覆盖正在提交的任务
  const updatedTasks = [...tasks.value];
  
  storedTasks.forEach(storedTask => {
    const existingIndex = updatedTasks.findIndex(t => t.task_id === storedTask.task_id);
    if (existingIndex >= 0) {
      // 如果任务已存在，只在存储的任务状态更新时才覆盖
      const existingTask = updatedTasks[existingIndex];
      if (storedTask.updated_at > existingTask.updated_at) {
        updatedTasks[existingIndex] = storedTask;
      }
    } else {
      // 新任务直接添加
      updatedTasks.push(storedTask);
    }
  });
  
  tasks.value = updatedTasks;
  
  // 如果有进行中的任务且没有当前任务，设置为当前任务
  const activeTask = activeTasks.value[0];
  if (activeTask && !currentTaskId.value) {
    currentTaskId.value = activeTask.task_id;
  }
};

// 开始任务轮询
const startTaskPolling = () => {
  taskPollingInterval.value = window.setInterval(() => {
    loadTasks();
  }, 2000); // 每2秒更新一次
};

// 停止任务轮询
const stopTaskPolling = () => {
  if (taskPollingInterval.value) {
    clearInterval(taskPollingInterval.value);
    taskPollingInterval.value = null;
  }
};

// 文件变更处理
const handleFilesChange = (files: File[]) => {
  uploadedFiles.value = files;
};

// 文件清空处理
const handleFilesClear = () => {
  uploadedFiles.value = [];
};

// 重置表单
const resetForm = () => {
  diagnosisForm.value = {
    device_id: '',
    device_type: '',
    location: '',
    image_type: 'PRPD',
    sensitivity: 'medium'
  };
  formRef.value?.clearValidate();
};

// 开始诊断
const startDiagnosis = async () => {
  try {
    // 表单验证
    await formRef.value?.validate();
    
    if (uploadedFiles.value.length === 0) {
      ElMessage.warning('请先上传图像文件');
      return;
    }

    isSubmitting.value = true;

    // 构造诊断参数
    const equipmentInfo: EquipmentInfo = {
      device_id: diagnosisForm.value.device_id,
      device_type: diagnosisForm.value.device_type,
      location: diagnosisForm.value.location
    };

    const params: ImageDiagnosisParams = {
      equipment_info: equipmentInfo,
      image_files: uploadedFiles.value,
      image_type: diagnosisForm.value.image_type,
      sensitivity: diagnosisForm.value.sensitivity
    };

    // 提交诊断任务
    const task = await ImageDiagnosisService.submitDiagnosisTask(params);
    
    // 更新任务列表 - 将新任务添加到列表开头
    const existingTaskIndex = tasks.value.findIndex(t => t.task_id === task.task_id);
    if (existingTaskIndex >= 0) {
      tasks.value[existingTaskIndex] = task;
    } else {
      tasks.value.unshift(task);
    }
    
    // 设置当前任务ID
    currentTaskId.value = task.task_id;

    // 根据任务状态显示对应消息
    if (task.status === 'completed') {
      ElMessage.success('诊断已完成！请查看结果');
    } else if (task.status === 'failed') {
      ElMessage.error(`诊断失败: ${task.error_message || '未知错误'}`);
    } else {
      ElMessage.success('诊断任务已提交，请等待处理结果');
    }

  } catch (error) {
    console.error('提交诊断任务失败:', error);
    ElMessage.error('提交失败，请检查网络连接后重试');
  } finally {
    isSubmitting.value = false;
  }
};

// 任务选择处理
const handleTaskSelect = (taskId: string) => {
  currentTaskId.value = taskId;
};

// 任务重试处理
const handleTaskRetry = async (taskId: string) => {
  try {
    const task = tasks.value.find(t => t.task_id === taskId);
    if (!task) return;

    // 重新提交任务
    const newTask = await ImageDiagnosisService.submitDiagnosisTask(task.params);
    
    // 更新任务列表
    const index = tasks.value.findIndex(t => t.task_id === taskId);
    if (index >= 0) {
      tasks.value[index] = newTask;
      currentTaskId.value = newTask.task_id;
    }

    ElMessage.success('任务已重新提交');
  } catch (error) {
    console.error('重试任务失败:', error);
    ElMessage.error('重试失败，请稍后再试');
  }
};

// 任务移除处理
const handleTaskRemove = (taskId: string) => {
  ImageDiagnosisService.removeTask(taskId);
  tasks.value = tasks.value.filter(task => task.task_id !== taskId);
  
  // 如果移除的是当前任务，切换到其他任务
  if (currentTaskId.value === taskId) {
    const remainingTask = activeTasks.value[0] || tasks.value[0];
    currentTaskId.value = remainingTask?.task_id || '';
  }
};

// 清理已完成任务
const handleClearCompletedTasks = () => {
  ImageDiagnosisService.clearCompletedTasks();
  tasks.value = tasks.value.filter(task => task.status !== 'completed');
  
  // 如果当前任务被清理，切换到其他任务
  const stillExists = tasks.value.some(task => task.task_id === currentTaskId.value);
  if (!stillExists) {
    const remainingTask = activeTasks.value[0] || tasks.value[0];
    currentTaskId.value = remainingTask?.task_id || '';
  }
};

// 导出结果处理
const handleExportResult = async (result: ImageDiagnosisResult) => {
  try {
    // 这里可以实现导出功能，比如生成 PDF 报告
    ElMessage.success('报告导出功能待实现');
    console.log('导出结果:', result);
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败');
  }
};
</script>

<style scoped>
.image-diagnosis {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 0;
  margin-bottom: 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.title-icon {
  font-size: 32px;
}

.page-description {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.header-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card, .control-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.diagnosis-form {
  margin-top: 8px;
}

.image-type-group, .sensitivity-group {
  width: 100%;
}

.image-type-group :deep(.el-radio) {
  margin-right: 16px;
  margin-bottom: 8px;
}

.sensitivity-group :deep(.el-radio) {
  margin-right: 20px;
}

.sensitivity-help {
  margin-top: 4px;
  color: #909399;
}

.uploader-section {
  margin-top: 20px;
}

.control-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.control-info {
  flex: 1;
}

.no-files-hint, .files-ready {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.hint-icon {
  color: #e6a23c;
}

.ready-icon {
  color: #67c23a;
}

.diagnosis-btn {
  min-width: 120px;
  height: 40px;
  font-size: 16px;
  font-weight: 500;
}

.task-manager-section, .result-section {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .header-stats {
    justify-content: center;
  }
  
  .main-content {
    padding: 0 16px;
  }
  
  .control-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .diagnosis-btn {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 20px 0;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .title-icon {
    font-size: 28px;
  }
  
  .page-description {
    font-size: 14px;
  }
  
  .header-stats {
    gap: 24px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .image-type-group :deep(.el-radio) {
    margin-right: 12px;
    margin-bottom: 12px;
  }
  
  .sensitivity-group :deep(.el-radio) {
    margin-right: 16px;
    margin-bottom: 8px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0 12px;
  }
  
  .header-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .image-type-group :deep(.el-radio) {
    display: block;
    margin-bottom: 8px;
  }
  
  .sensitivity-group :deep(.el-radio) {
    display: block;
    margin-bottom: 8px;
  }
}
</style>