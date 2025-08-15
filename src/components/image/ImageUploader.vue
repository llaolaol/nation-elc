<template>
  <div class="image-uploader">
    <el-card class="upload-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>图像上传</span>
          <el-button 
            v-if="uploadedFiles.length > 0" 
            type="text" 
            @click="clearAllFiles"
            class="clear-btn"
          >
            清空所有
          </el-button>
        </div>
      </template>

      <!-- 拖拽上传区域 -->
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          :file-list="fileList"
          :auto-upload="false"
          :multiple="true"
          :limit="5"
          :accept="acceptedTypes"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :on-exceed="handleExceed"
          drag
        >
          <div class="upload-content">
            <el-icon class="upload-icon"><camera /></el-icon>
            <div class="upload-text">
              <p class="primary-text">将图片拖到此处，或点击选择文件</p>
              <p class="secondary-text">
                支持 JPEG、PNG、BMP 格式<br>
                单文件 ≤ 10MB，最多 5 张图片
              </p>
            </div>
          </div>
        </el-upload>
      </div>

      <!-- 文件列表 -->
      <div v-if="uploadedFiles.length > 0" class="file-list">
        <div class="file-list-header">
          <span>已上传文件 ({{ uploadedFiles.length }}/5)</span>
        </div>
        
        <div class="file-items">
          <div 
            v-for="(file, index) in uploadedFiles" 
            :key="file.uid"
            class="file-item"
            :class="{ 'file-error': file.status === 'fail' }"
          >
            <!-- 文件预览 -->
            <div class="file-preview">
              <img 
                v-if="file.url" 
                :src="file.url" 
                :alt="file.name"
                class="preview-image"
                @click="previewImage(file)"
              />
              <div v-else class="preview-placeholder">
                <el-icon><picture /></el-icon>
              </div>
            </div>

            <!-- 文件信息 -->
            <div class="file-info">
              <div class="file-name" :title="file.name">
                {{ file.name }}
              </div>
              <div class="file-size">
                {{ formatFileSize(file.size || 0) }}
              </div>
              <div v-if="file.status === 'fail'" class="file-error-msg">
                上传失败
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="file-actions">
              <el-button 
                type="text" 
                size="small"
                @click="previewImage(file)"
                :disabled="!file.url"
              >
                预览
              </el-button>
              <el-button 
                type="text" 
                size="small"
                @click="removeFile(index)"
                class="remove-btn"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 总体状态信息 -->
      <div v-if="uploadedFiles.length > 0" class="upload-summary">
        <div class="summary-item">
          <span class="label">总大小:</span>
          <span class="value">{{ formatFileSize(totalSize) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">文件数量:</span>
          <span class="value">{{ uploadedFiles.length }}/5</span>
        </div>
      </div>
    </el-card>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="80%"
      :before-close="closePreview"
    >
      <div class="preview-content">
        <img 
          v-if="previewImageUrl" 
          :src="previewImageUrl" 
          :alt="previewImageName"
          class="preview-full-image"
        />
      </div>
      <template #footer>
        <el-button @click="closePreview">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Camera, Picture } from '@element-plus/icons-vue';
import type { UploadFile, UploadFiles, UploadProps, UploadInstance } from 'element-plus';

// Props
interface Props {
  maxSize?: number; // 最大文件大小 (MB)
  maxCount?: number; // 最大文件数量
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 10,
  maxCount: 5
});

// Emits
const emit = defineEmits<{
  'files-change': [files: File[]];
  'file-remove': [index: number];
  'files-clear': [];
}>();

// Refs
const uploadRef = ref<UploadInstance>();
const fileList = ref<UploadFiles>([]);
const uploadedFiles = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewImageUrl = ref('');
const previewImageName = ref('');

// 接受的文件类型
const acceptedTypes = '.jpg,.jpeg,.png,.bmp';
const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp'];

// 计算属性
const totalSize = computed(() => {
  return uploadedFiles.value.reduce((total, file) => {
    return total + (file.size || 0);
  }, 0);
});

// 文件大小格式化
const formatFileSize = (size: number): string => {
  if (size === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 文件上传前验证
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 检查文件类型
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('只支持 JPEG、PNG、BMP 格式的图片');
    return false;
  }

  // 检查文件大小
  const maxSizeBytes = props.maxSize * 1024 * 1024;
  if (rawFile.size > maxSizeBytes) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
    return false;
  }

  return true;
};

// 文件状态改变处理
const handleFileChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  // 更新文件列表
  uploadedFiles.value = uploadFiles;
  
  // 为新上传的文件创建预览URL
  if (uploadFile.status === 'ready' && uploadFile.raw) {
    uploadFile.url = URL.createObjectURL(uploadFile.raw);
  }

  // 发出文件变更事件
  const files = uploadFiles
    .filter(file => file.raw && file.status !== 'fail')
    .map(file => file.raw!);
  
  emit('files-change', files);
};

// 文件移除处理
const handleFileRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  // 清理预览URL
  if (uploadFile.url && uploadFile.url.startsWith('blob:')) {
    URL.revokeObjectURL(uploadFile.url);
  }
  
  uploadedFiles.value = uploadFiles;
  
  // 发出文件移除事件
  const files = uploadFiles
    .filter(file => file.raw && file.status !== 'fail')
    .map(file => file.raw!);
  
  emit('files-change', files);
};

// 超出文件数量限制处理
const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning(`最多只能上传 ${props.maxCount} 个文件`);
};

// 移除特定文件
const removeFile = (index: number) => {
  const file = uploadedFiles.value[index];
  if (file.url && file.url.startsWith('blob:')) {
    URL.revokeObjectURL(file.url);
  }
  
  uploadedFiles.value.splice(index, 1);
  fileList.value.splice(index, 1);
  
  const files = uploadedFiles.value
    .filter(file => file.raw && file.status !== 'fail')
    .map(file => file.raw!);
  
  emit('files-change', files);
  emit('file-remove', index);
};

// 清空所有文件
const clearAllFiles = async () => {
  try {
    await ElMessageBox.confirm(
      '确认要清空所有已上传的文件吗？',
      '确认清空',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );

    // 清理所有预览URL
    uploadedFiles.value.forEach(file => {
      if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    });

    uploadedFiles.value = [];
    fileList.value = [];
    uploadRef.value?.clearFiles();
    
    emit('files-change', []);
    emit('files-clear');
    
    ElMessage.success('已清空所有文件');
  } catch {
    // 用户取消，不执行任何操作
  }
};

// 预览图片
const previewImage = (file: UploadFile) => {
  if (file.url) {
    previewImageUrl.value = file.url;
    previewImageName.value = file.name;
    previewVisible.value = true;
  }
};

// 关闭预览
const closePreview = () => {
  previewVisible.value = false;
  previewImageUrl.value = '';
  previewImageName.value = '';
};

// 组件卸载时清理资源
onUnmounted(() => {
  uploadedFiles.value.forEach(file => {
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }
  });
});

// 暴露方法给父组件
defineExpose({
  clearFiles: clearAllFiles,
  getFiles: () => uploadedFiles.value.filter(file => file.raw).map(file => file.raw!)
});
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.clear-btn {
  color: #f56c6c;
}

.clear-btn:hover {
  color: #f78989;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  width: 100%;
  height: 180px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.primary-text {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.secondary-text {
  font-size: 12px;
  color: #909399;
  margin: 0;
  line-height: 1.4;
}

.file-list {
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: #303133;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.file-item:hover {
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.file-item.file-error {
  border-color: #fbc4c4;
  background-color: #fef0f0;
}

.file-preview {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.preview-image:hover {
  transform: scale(1.05);
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #c0c4cc;
  font-size: 24px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-error-msg {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.remove-btn {
  color: #f56c6c;
}

.remove-btn:hover {
  color: #f78989;
}

.upload-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.summary-item {
  display: flex;
  gap: 8px;
}

.label {
  color: #909399;
}

.value {
  color: #303133;
  font-weight: 500;
}

.preview-content {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-dragger :deep(.el-upload-dragger) {
    height: 140px;
  }
  
  .upload-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }
  
  .primary-text {
    font-size: 14px;
  }
  
  .secondary-text {
    font-size: 11px;
  }
  
  .file-item {
    padding: 8px;
  }
  
  .file-preview {
    width: 48px;
    height: 48px;
    margin-right: 8px;
  }
  
  .upload-summary {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .summary-item {
    justify-content: space-between;
  }
}
</style>