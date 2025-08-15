<template>
  <div class="result-display">
    <el-card v-if="result" class="result-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>诊断结果</span>
          <div class="header-actions">
            <el-button 
              type="text" 
              size="small"
              @click="toggleDetailView"
            >
              {{ showDetails ? '简要视图' : '详细视图' }}
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              @click="exportResult"
              :loading="exportLoading"
            >
              导出报告
            </el-button>
          </div>
        </div>
      </template>

      <!-- 概要信息 -->
      <div class="summary-section">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="summary-item">
              <div class="summary-label">设备信息</div>
              <div class="summary-value">
                {{ result.equipment_info.device_id }} - {{ result.equipment_info.device_type }}
              </div>
              <div class="summary-location">{{ result.equipment_info.location }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="summary-item">
              <div class="summary-label">诊断时间</div>
              <div class="summary-value">{{ formatDateTime(result.diagnosis_time) }}</div>
              <div class="summary-location">耗时: {{ result.processing_duration }}秒</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 核心诊断结果 -->
      <div class="analysis-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="analysis-card severity-card">
              <div class="analysis-header">
                <el-icon class="analysis-icon"><warning /></el-icon>
                <span>严重程度</span>
              </div>
              <div class="severity-content">
                <div class="severity-level">
                  <el-tag 
                    :type="getSeverityTagType(result.image_analysis.severity_level)"
                    size="large"
                    class="severity-tag"
                  >
                    {{ getSeverityText(result.image_analysis.severity_level) }}
                  </el-tag>
                </div>
                <div class="severity-score">{{ result.image_analysis.severity_level }}/5</div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="analysis-card confidence-card">
              <div class="analysis-header">
                <el-icon class="analysis-icon"><data-analysis /></el-icon>
                <span>置信度</span>
              </div>
              <div class="confidence-content">
                <el-progress 
                  type="circle" 
                  :percentage="result.image_analysis.confidence_score * 100"
                  :width="80"
                  :stroke-width="8"
                  :status="getConfidenceStatus(result.image_analysis.confidence_score)"
                />
                <div class="confidence-text">
                  {{ (result.image_analysis.confidence_score * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="analysis-card probability-card">
              <div class="analysis-header">
                <el-icon class="analysis-icon"><trend-charts /></el-icon>
                <span>故障概率</span>
              </div>
              <div class="probability-content">
                <div class="probability-meter">
                  <el-progress 
                    :percentage="result.image_analysis.fault_probability * 100"
                    :show-text="false"
                    :stroke-width="12"
                    :status="getProbabilityStatus(result.image_analysis.fault_probability)"
                  />
                </div>
                <div class="probability-text">
                  {{ (result.image_analysis.fault_probability * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 诊断发现 -->
      <div class="findings-section">
        <el-descriptions 
          title="诊断发现" 
          :column="2" 
          border
          class="findings-descriptions"
        >
          <el-descriptions-item label="放电类型">
            <el-tag type="primary">{{ result.image_analysis.discharge_type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障位置">
            {{ result.image_analysis.fault_location }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- AI洞察 -->
      <div v-if="result.ai_insights && result.ai_insights.length > 0" class="insights-section">
        <h4 class="section-title">
          <el-icon><chat-dot-round /></el-icon>
          AI 洞察
        </h4>
        <div class="insights-list">
          <div 
            v-for="(insight, index) in result.ai_insights" 
            :key="index"
            class="insight-item"
          >
            <el-icon class="insight-icon"><info-filled /></el-icon>
            <span class="insight-text">{{ insight }}</span>
          </div>
        </div>
      </div>

      <!-- 推荐措施 -->
      <div v-if="result.recommended_actions && result.recommended_actions.length > 0" class="recommendations-section">
        <h4 class="section-title">
          <el-icon><operation /></el-icon>
          推荐措施
        </h4>
        <div class="recommendations-list">
          <div 
            v-for="(action, index) in result.recommended_actions" 
            :key="index"
            class="recommendation-item"
          >
            <div class="recommendation-number">{{ index + 1 }}</div>
            <div class="recommendation-content">{{ action }}</div>
          </div>
        </div>
      </div>

      <!-- 详细分析报告 -->
      <div v-if="result.detailed_analysis && result.detailed_analysis.full_content" class="detailed-analysis-section">
        <h4 class="section-title">
          <el-icon><document /></el-icon>
          详细分析报告
          <div class="analysis-actions">
            <el-button 
              type="text" 
              size="small"
              @click="toggleAnalysisExpanded"
            >
              {{ analysisExpanded ? '收起' : '展开全部' }}
            </el-button>
            <el-button 
              type="text" 
              size="small"
              @click="copyAnalysisContent"
              :loading="copyLoading"
            >
              {{ copyLoading ? '复制中...' : '复制内容' }}
            </el-button>
          </div>
        </h4>

        <!-- 结构化展示 -->
        <el-collapse v-model="activeAnalysisSections" class="analysis-collapse">
          <!-- 特征分析 -->
          <el-collapse-item 
            name="features" 
            title="特征分析"
            v-if="result.detailed_analysis.structured_content.featureAnalysis"
          >
            <div class="analysis-content">
              <div 
                class="analysis-text"
                v-html="formatAnalysisText(result.detailed_analysis.structured_content.featureAnalysis)"
              ></div>
            </div>
          </el-collapse-item>

          <!-- 综合判断 -->
          <el-collapse-item 
            name="judgment" 
            title="综合判断"
            v-if="result.detailed_analysis.structured_content.comprehensiveJudgment"
          >
            <div class="analysis-content">
              <div 
                class="analysis-text"
                v-html="formatAnalysisText(result.detailed_analysis.structured_content.comprehensiveJudgment)"
              ></div>
            </div>
          </el-collapse-item>

          <!-- 完整报告 -->
          <el-collapse-item name="full" title="完整分析报告">
            <div class="analysis-content">
              <div class="full-analysis-container">
                <div 
                  class="analysis-text full-content"
                  v-html="formatAnalysisText(result.detailed_analysis.full_content)"
                ></div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 诊断结论高亮 -->
        <div class="diagnosis-conclusion">
          <h5 class="conclusion-title">
            <el-icon><circle-check /></el-icon>
            诊断结论
          </h5>
          <div class="conclusion-content">
            <el-tag 
              type="primary" 
              size="large"
              effect="dark"
              class="conclusion-tag"
            >
              {{ extractDiagnosisConclusion(result.detailed_analysis.full_content) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 图像对比 -->
      <div v-if="result.processed_images && result.processed_images.length > 0" class="images-section">
        <h4 class="section-title">
          <el-icon><picture /></el-icon>
          图像分析结果
        </h4>
        <div class="images-grid">
          <div 
            v-for="image in result.processed_images" 
            :key="image.image_id"
            class="image-comparison"
          >
            <div class="image-item">
              <div class="image-header">
                <span class="image-title">原始图像</span>
                <span class="image-name">{{ image.original_name }}</span>
              </div>
              <div class="image-container">
                <img 
                  :src="image.original_url" 
                  :alt="image.original_name"
                  class="comparison-image"
                  @click="previewImage(image.original_url, image.original_name)"
                />
              </div>
              <div class="image-info">
                <span>{{ formatFileSize(image.file_size) }}</span>
                <span>{{ image.dimensions.width }}×{{ image.dimensions.height }}</span>
              </div>
            </div>

            <div v-if="image.processed_url" class="image-item">
              <div class="image-header">
                <span class="image-title">分析结果</span>
                <span class="image-annotations">{{ image.annotations.length }} 个标注</span>
              </div>
              <div class="image-container">
                <img 
                  :src="image.processed_url" 
                  :alt="`${image.original_name} - 分析结果`"
                  class="comparison-image"
                  @click="previewImage(image.processed_url, `${image.original_name} - 分析结果`)"
                />
              </div>
              <div class="image-annotations-list">
                <el-tag 
                  v-for="annotation in image.annotations.slice(0, 3)" 
                  :key="annotation.annotation_id"
                  size="small"
                  type="primary"
                  class="annotation-tag"
                >
                  {{ annotation.label }}
                </el-tag>
                <span v-if="image.annotations.length > 3" class="more-annotations">
                  +{{ image.annotations.length - 3 }} 更多
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技术细节 (详细视图) -->
      <el-collapse-transition>
        <div v-show="showDetails && result.technical_details" class="technical-section">
          <h4 class="section-title">
            <el-icon><setting /></el-icon>
            技术细节
          </h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="算法版本">
              {{ result.technical_details?.algorithm_version }}
            </el-descriptions-item>
            <el-descriptions-item label="模型置信度">
              {{ (result.technical_details?.model_confidence || 0 * 100).toFixed(2) }}%
            </el-descriptions-item>
            <el-descriptions-item label="处理步骤">
              <div class="processing-steps">
                <el-tag 
                  v-for="(step, index) in result.technical_details?.processing_steps" 
                  :key="index"
                  size="small"
                  class="step-tag"
                >
                  {{ index + 1 }}. {{ step }}
                </el-tag>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 无结果状态 -->
    <el-card v-else class="no-result-card" shadow="hover">
      <div class="no-result-content">
        <el-icon class="no-result-icon"><document /></el-icon>
        <p class="no-result-text">暂无诊断结果</p>
        <p class="no-result-hint">完成图像诊断后结果将在此处显示</p>
      </div>
    </el-card>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="90%"
      :before-close="closePreview"
    >
      <div class="preview-content">
        <img 
          v-if="previewImageUrl" 
          :src="previewImageUrl" 
          :alt="previewTitle"
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
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Warning, 
  DataAnalysis, 
  TrendCharts, 
  ChatDotRound, 
  InfoFilled,
  Operation,
  Picture,
  Setting,
  Document,
  CircleCheck
} from '@element-plus/icons-vue';
import type { ImageDiagnosisResult } from '@/types';

// Props
interface Props {
  result?: ImageDiagnosisResult | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'export-result': [result: ImageDiagnosisResult];
}>();

// Refs
const showDetails = ref(false);
const exportLoading = ref(false);
const previewVisible = ref(false);
const previewImageUrl = ref('');
const previewTitle = ref('');

// 新增：详细分析相关状态
const analysisExpanded = ref(false);
const copyLoading = ref(false);
const activeAnalysisSections = ref(['features', 'judgment']);

// 格式化日期时间
const formatDateTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取严重程度文本
const getSeverityText = (level: number): string => {
  const severityMap = {
    1: '正常',
    2: '注意',
    3: '警告',
    4: '严重',
    5: '危急'
  };
  return severityMap[level as keyof typeof severityMap] || '未知';
};

// 获取严重程度标签类型
const getSeverityTagType = (level: number) => {
  if (level <= 1) return 'success';
  if (level <= 2) return 'info';
  if (level <= 3) return 'warning';
  return 'danger';
};

// 获取置信度状态
const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'warning';
  return 'exception';
};

// 获取故障概率状态
const getProbabilityStatus = (probability: number) => {
  if (probability <= 0.3) return 'success';
  if (probability <= 0.7) return 'warning';
  return 'exception';
};

// 切换详细视图
const toggleDetailView = () => {
  showDetails.value = !showDetails.value;
};

// 导出结果
const exportResult = async () => {
  if (!props.result) return;
  
  try {
    exportLoading.value = true;
    emit('export-result', props.result);
    ElMessage.success('报告导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
};

// 预览图片
const previewImage = (url: string, title: string) => {
  previewImageUrl.value = url;
  previewTitle.value = title;
  previewVisible.value = true;
};

// 关闭预览
const closePreview = () => {
  previewVisible.value = false;
  previewImageUrl.value = '';
  previewTitle.value = '';
};

// 新增：详细分析相关方法

// 切换分析展开状态
const toggleAnalysisExpanded = () => {
  analysisExpanded.value = !analysisExpanded.value;
  if (analysisExpanded.value) {
    activeAnalysisSections.value = ['features', 'judgment', 'full'];
  } else {
    activeAnalysisSections.value = ['features', 'judgment'];
  }
};

// 复制分析内容
const copyAnalysisContent = async () => {
  if (!props.result?.detailed_analysis?.full_content) return;
  
  copyLoading.value = true;
  try {
    await navigator.clipboard.writeText(props.result.detailed_analysis.full_content);
    ElMessage.success('分析内容已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败，请手动选择复制');
  } finally {
    copyLoading.value = false;
  }
};

// 格式化分析文本（简单的Markdown渲染）
const formatAnalysisText = (text: string): string => {
  if (!text) return '';
  
  return text
    // 处理粗体文本
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 处理标题
    .replace(/### (.+)/g, '<h6 class="analysis-subtitle">$1</h6>')
    // 处理列表项
    .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
    // 处理换行
    .replace(/\n/g, '<br>')
    // 包装列表
    .replace(/(<li>.*<\/li>)/g, '<ul class="analysis-list">$1</ul>')
    // 清理重复的ul标签
    .replace(/<\/ul><br><ul class="analysis-list">/g, '');
};

// 提取诊断结论
const extractDiagnosisConclusion = (content: string): string => {
  if (!content) return '待分析';
  
  const conclusionMatch = content.match(/判断该局部放电类型为：\*\*(.+?)\*\*/);
  if (conclusionMatch) {
    return conclusionMatch[1];
  }
  
  // 备用提取方法
  if (content.includes('绝缘内部放电')) {
    return '绝缘内部放电';
  }
  
  return '图像分析完成';
};
</script>

<style scoped>
.result-display {
  width: 100%;
}

.result-card, .no-result-card {
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
  gap: 8px;
}

.summary-section {
  margin-bottom: 24px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.summary-location {
  font-size: 12px;
  color: #606266;
}

.analysis-section {
  margin-bottom: 24px;
}

.analysis-card {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
  text-align: center;
  height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 500;
  color: #606266;
}

.analysis-icon {
  font-size: 16px;
}

.severity-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.severity-tag {
  font-size: 14px;
  padding: 8px 16px;
}

.severity-score {
  font-size: 12px;
  color: #909399;
}

.confidence-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.confidence-text {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.probability-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.probability-meter {
  padding: 0 20px;
}

.probability-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-align: center;
}

.findings-section {
  margin-bottom: 24px;
}

.findings-descriptions {
  border-radius: 6px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.analysis-actions {
  display: flex;
  gap: 8px;
}

.insights-section, .recommendations-section, .images-section, .technical-section, .detailed-analysis-section {
  margin-bottom: 24px;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.insight-icon {
  color: #409eff;
  margin-top: 2px;
  flex-shrink: 0;
}

.insight-text {
  flex: 1;
  line-height: 1.5;
  color: #303133;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.recommendation-number {
  width: 24px;
  height: 24px;
  background-color: #67c23a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.recommendation-content {
  flex: 1;
  line-height: 1.5;
  color: #303133;
}

.images-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fafafa;
}

.image-item {
  display: flex;
  flex-direction: column;
}

.image-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.image-title {
  font-weight: 500;
  color: #303133;
}

.image-name, .image-annotations {
  font-size: 12px;
  color: #909399;
}

.image-container {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
  aspect-ratio: 4/3;
}

.comparison-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.comparison-image:hover {
  transform: scale(1.02);
}

.image-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #909399;
}

.image-annotations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.annotation-tag {
  font-size: 11px;
}

.more-annotations {
  font-size: 11px;
  color: #909399;
}

.processing-steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-tag {
  align-self: flex-start;
}

.no-result-content {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.no-result-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-result-text {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.no-result-hint {
  font-size: 14px;
  margin: 0;
}

.preview-content {
  text-align: center;
}

.preview-full-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analysis-section {
    margin-bottom: 20px;
  }
  
  .analysis-card {
    height: 120px;
    padding: 16px;
  }
  
  .image-comparison {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .recommendations-list {
    gap: 8px;
  }
  
  .recommendation-item {
    padding: 8px;
  }
}

/* 详细分析报告样式 */
.detailed-analysis-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafbfc;
}

.analysis-collapse {
  border: none;
  background: transparent;
}

.analysis-collapse :deep(.el-collapse-item__header) {
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
}

.analysis-collapse :deep(.el-collapse-item__content) {
  border: none;
  padding: 0;
}

.analysis-content {
  padding: 16px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 12px;
}

.analysis-text {
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
}

.analysis-text :deep(strong) {
  color: #303133;
  font-weight: 600;
}

.analysis-text :deep(.analysis-subtitle) {
  color: #409eff;
  font-size: 15px;
  font-weight: 600;
  margin: 12px 0 8px 0;
  border-left: 4px solid #409eff;
  padding-left: 12px;
}

.analysis-text :deep(.analysis-list) {
  margin: 8px 0;
  padding-left: 20px;
}

.analysis-text :deep(.analysis-list li) {
  margin-bottom: 4px;
  color: #606266;
}

.full-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.diagnosis-conclusion {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f9ff 100%);
  border: 1px solid #b3d8ff;
  border-radius: 8px;
}

.conclusion-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.conclusion-content {
  display: flex;
  justify-content: center;
}

.conclusion-tag {
  font-size: 16px;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
}

/* 响应式设计扩展 */
@media (max-width: 768px) {
  .detailed-analysis-section {
    padding: 16px;
  }
  
  .analysis-content {
    padding: 12px;
  }
  
  .full-content {
    max-height: 300px;
    padding: 12px;
  }
  
  .diagnosis-conclusion {
    padding: 12px;
  }
  
  .analysis-actions {
    flex-direction: column;
    gap: 4px;
  }
}
</style>