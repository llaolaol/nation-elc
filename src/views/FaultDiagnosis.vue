<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  ElCard, ElRow, ElCol, ElButton, ElMessage, ElAlert, 
  ElForm, ElFormItem, ElInput, ElDescriptions, ElDescriptionsItem,
  ElTag, ElDivider, ElTimeline, ElTimelineItem
} from 'element-plus';
import type { DiagnosisParams } from '@/types';

// 引入更新后的后端服务
import { runFaultDiagnosis } from '@/services/diagnosis';

// --- 状态管理 ---
const isLoading = ref(false);
const diagnosisError = ref<string | null>(null);

// 使用 Partial<DiagnosisParams> 以允许表单初始为空
const manualParams = reactive<Partial<DiagnosisParams>>({
  H2_ppm: 50,
  CH4_ppm: 100,
  C2H6_ppm: 10,
  C2H4_ppm: 100,
  C2H2_ppm: 10,
  CO_ppm: 100,
  CO2_ppm: 100,
  total_hydrocarbons_limit: 150,
});

// 诊断结果展示 (使用 any 类型以适应新的 API 返回结构)
const currentDiagnosisResult = ref<any | null>(null);
const showRawText = ref(false); // 控制是否显示原始文本

// --- 方法 ---

// 根据严重性获取标签类型
const getSeverityType = (severity?: string) => {
  switch (severity) {
    case '危急': return 'danger';
    case '严重': return 'danger';
    case '警告': return 'warning';
    case '注意': return 'info';
    case '正常': return 'success';
    default: return '';
  }
};

// 触发诊断流程
const triggerDiagnosis = async () => {
  isLoading.value = true;
  diagnosisError.value = null;
  currentDiagnosisResult.value = null;

  try {
    // 调用后端接口
    const result = await runFaultDiagnosis(manualParams as DiagnosisParams);
    currentDiagnosisResult.value = result;
    ElMessage.success('诊断接口调用成功！');

  } catch (error) {
    diagnosisError.value = (error as Error).message || '诊断过程中发生未知错误。';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

</script>

<template>
  <div class="fault-diagnosis-page" v-loading="isLoading">
    <ElRow :gutter="20">
      <!-- 故障参数输入区域 -->
      <ElCol :span="12">
        <ElCard class="box-card input-card">
          <template #header><div class="card-header"><span>故障参数输入</span></div></template>
          <ElForm :model="manualParams" label-width="180px">
            <ElFormItem label="H2 (ppm)">
              <ElInput v-model.number="manualParams.H2_ppm" type="number" placeholder="请输入 H2 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="CH4 (ppm)">
              <ElInput v-model.number="manualParams.CH4_ppm" type="number" placeholder="请输入 CH4 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="C2H6 (ppm)">
              <ElInput v-model.number="manualParams.C2H6_ppm" type="number" placeholder="请输入 C2H6 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="C2H4 (ppm)">
              <ElInput v-model.number="manualParams.C2H4_ppm" type="number" placeholder="请输入 C2H4 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="C2H2 (ppm)">
              <ElInput v-model.number="manualParams.C2H2_ppm" type="number" placeholder="请输入 C2H2 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="CO (ppm)">
              <ElInput v-model.number="manualParams.CO_ppm" type="number" placeholder="请输入 CO 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="CO2 (ppm)">
              <ElInput v-model.number="manualParams.CO2_ppm" type="number" placeholder="请输入 CO2 浓度"></ElInput>
            </ElFormItem>
            <ElFormItem label="总烃限值">
              <ElInput v-model.number="manualParams.total_hydrocarbons_limit" type="number" placeholder="请输入总烃限值"></ElInput>
            </ElFormItem>
            <ElButton type="primary" @click="triggerDiagnosis" style="width: 100%; margin-top: 20px;">开始诊断</ElButton>
          </ElForm>
        </ElCard>
      </ElCol>

      <!-- 故障结果显示区域 -->
      <ElCol :span="12">
        <ElCard class="box-card result-display-card">
          <template #header><div class="card-header"><span>故障结果显示</span></div></template>
          <div v-if="currentDiagnosisResult">
            <!-- 结构化展示 -->
            <div v-if="currentDiagnosisResult.parsed_data">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="故障严重性">
                  <el-tag :type="getSeverityType(currentDiagnosisResult.parsed_data.severity)">
                    {{ currentDiagnosisResult.parsed_data.severity || '未知' }} 
                    ({{ currentDiagnosisResult.parsed_data.severity_level || 0 }}/5)
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="故障类型">
                  {{ currentDiagnosisResult.parsed_data.fault_type || '未检测到' }}
                </el-descriptions-item>
                <el-descriptions-item label="主要诊断">
                  {{ currentDiagnosisResult.parsed_data.main_diagnosis || '无明确诊断' }}
                </el-descriptions-item>
                <el-descriptions-item label="诊断摘要">
                  {{ currentDiagnosisResult.summary || '无摘要信息' }}
                </el-descriptions-item>
              </el-descriptions>

              <!-- 推荐措施 -->
              <el-divider content-position="left">推荐措施</el-divider>
              <el-timeline v-if="currentDiagnosisResult.parsed_data.recommendations?.length">
                <el-timeline-item 
                  v-for="(rec, index) in currentDiagnosisResult.parsed_data.recommendations" 
                  :key="index"
                  :timestamp="`措施 ${index + 1}`"
                >
                  {{ rec }}
                </el-timeline-item>
              </el-timeline>
              <el-alert v-else title="暂无推荐措施" type="info" show-icon />
            </div>

            <!-- 切换显示原始文本 -->
            <el-divider />
            <el-button @click="showRawText = !showRawText" type="info" size="small">
              {{ showRawText ? '隐藏' : '显示' }}原始专家报告
            </el-button>
            
            <!-- 原始文本显示 -->
            <div v-if="showRawText" style="margin-top: 15px;">
              <el-input
                type="textarea"
                :model-value="currentDiagnosisResult.raw_text || JSON.stringify(currentDiagnosisResult, null, 2)"
                :rows="15"
                readonly
                style="font-family: monospace; font-size: 12px;"
              />
            </div>
          </div>
          <ElAlert v-else title="暂无诊断结果" type="info" center show-icon :closable="false" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElAlert v-if="diagnosisError" :title="diagnosisError" type="error" show-icon :closable="false" style="margin-top: 20px;" />

  </div>
</template>

<style scoped>
.fault-diagnosis-page {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.box-card {
  min-height: 500px;
}
.input-card .el-form-item {
  margin-bottom: 18px;
}
</style>