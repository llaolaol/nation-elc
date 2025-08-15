<template>
  <div class="enhanced-fault-tree">
    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-tooltip effect="dark" placement="bottom">
            <template #content>
              <div v-for="layout in layoutOptions" :key="layout.value" style="margin-bottom: 4px;">
                <strong>{{ layout.label }}:</strong> {{ layout.description }}
              </div>
            </template>
            <el-select 
              v-model="selectedLayout" 
              placeholder="选择布局模式" 
              size="small"
              @change="handleLayoutChange"
            >
              <el-option
                v-for="layout in layoutOptions"
                :key="layout.value"
                :label="layout.label"
                :value="layout.value"
              >
                <span style="float: left">{{ layout.label }}</span>
                <span style="float: right; color: #8492a6; font-size: 12px">
                  {{ getLayoutIcon(layout.value) }}
                </span>
              </el-option>
            </el-select>
          </el-tooltip>
        </el-col>
        
        <el-col :span="8">
          <el-button-group size="small">
            <el-button @click="zoomIn" :disabled="zoomLevel >= maxZoom">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button @click="resetZoom">
              {{ Math.round(zoomLevel * 100) }}%
            </el-button>
            <el-button @click="zoomOut" :disabled="zoomLevel <= minZoom">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
          </el-button-group>
        </el-col>

        <el-col :span="6">
          <el-switch
            v-model="showLogicGates"
            active-text="显示逻辑门"
            inactive-text="隐藏逻辑门"
            size="small"
            @change="handleLogicGateToggle"
          />
        </el-col>

        <el-col :span="4">
          <el-button size="small" @click="exportImage">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 故障树容器 -->
    <div 
      ref="treeContainer" 
      class="tree-container"
      :style="containerStyle"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    >
      <!-- 逻辑符号图例 -->
      <div class="logic-legend" v-if="showLogicGates">
        <div class="legend-header">
          <el-icon><InfoFilled /></el-icon>
          <span>逻辑关系图例</span>
          <el-button 
            type="text" 
            size="small" 
            @click="toggleLegend"
            class="legend-toggle"
          >
            {{ showLegend ? '收起' : '展开' }}
          </el-button>
        </div>
        
        <el-collapse-transition>
          <div v-show="showLegend" class="legend-content">
            <div class="legend-item">
              <div class="legend-symbol and-symbol">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="white" stroke="#409EFF" stroke-width="2"/>
                  <text x="10" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#409EFF">&</text>
                </svg>
              </div>
              <span class="legend-text">与门（AND）- 所有条件同时满足</span>
            </div>
            
            <div class="legend-item">
              <div class="legend-symbol or-symbol">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="white" stroke="#67C23A" stroke-width="2"/>
                  <text x="10" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#67C23A">∨</text>
                </svg>
              </div>
              <span class="legend-text">或门（OR）- 任一条件满足即可</span>
            </div>
            
            <div class="legend-item">
              <div class="legend-symbol not-symbol">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="white" stroke="#E6A23C" stroke-width="2"/>
                  <text x="10" y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#E6A23C">¬</text>
                </svg>
              </div>
              <span class="legend-text">非门（NOT）- 条件取反</span>
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <div 
        class="tree-content"
        :style="contentStyle"
        v-html="renderedTreeHTML"
        @click="handleTreeClick"
      />
    </div>

    <!-- 侧边面板 -->
    <el-drawer
      v-model="showSidePanel"
      title="节点详情"
      direction="rtl"
      size="400px"
    >
      <div v-if="selectedNode">
        <!-- 节点基本信息 -->
        <el-card class="node-info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>{{ selectedNode.name }}</span>
              <el-tag :type="getNodeTypeTag(selectedNode.type)">
                {{ getNodeTypeText(selectedNode.type) }}
              </el-tag>
            </div>
          </template>
          
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item v-if="selectedNode.type === 'logic_gate'" label="逻辑门类型">
              <LogicGateIcon 
                :gate-type="selectedNode.gate_type!" 
                :state="selectedNode.state!"
                size="small"
                :interactive="false"
              />
              <span style="margin-left: 8px;">{{ getGateTypeText(selectedNode.gate_type!) }}</span>
            </el-descriptions-item>
            
            <el-descriptions-item v-if="selectedNode.state" label="当前状态">
              <el-tag :type="getStateTagType(selectedNode.state)">
                {{ getStateText(selectedNode.state) }}
              </el-tag>
            </el-descriptions-item>
            
            <el-descriptions-item v-if="selectedNode.condition" label="判断条件">
              <el-text class="condition-text" type="info">{{ selectedNode.condition }}</el-text>
            </el-descriptions-item>
            
            <el-descriptions-item v-if="selectedNode.description" label="描述">
              {{ selectedNode.description }}
            </el-descriptions-item>
            
            <el-descriptions-item v-if="selectedNode.children" label="子节点数">
              {{ selectedNode.children.length }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 逻辑推理过程 -->
        <el-card v-if="selectedNode.type === 'logic_gate' && reasoningSteps.length > 0" class="reasoning-card" shadow="never">
          <template #header>
            <span>推理过程</span>
          </template>
          
          <div class="reasoning-steps">
            <div 
              v-for="(step, index) in reasoningSteps"
              :key="step.step_id"
              class="reasoning-step"
            >
              <div class="step-header">
                <el-tag size="small" type="primary">步骤 {{ index + 1 }}</el-tag>
                <el-tag size="small" :type="step.output ? 'success' : 'danger'">
                  {{ step.output ? '真' : '假' }}
                </el-tag>
              </div>
              <div class="step-content">
                <p class="step-condition">{{ step.condition }}</p>
                <p class="step-reasoning">{{ step.reasoning }}</p>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 诊断建议 -->
        <el-card v-if="selectedNode.recommendation" class="recommendation-card" shadow="never">
          <template #header>
            <span>诊断建议</span>
          </template>
          <el-alert
            :title="selectedNode.recommendation"
            type="info"
            :closable="false"
            show-icon
          />
        </el-card>
      </div>
    </el-drawer>

    <!-- 诊断参数输入弹窗 -->
    <el-dialog
      v-model="showDiagnosisDialog"
      title="诊断参数输入"
      width="600px"
    >
      <div class="diagnosis-form">
        <el-form :model="diagnosisParams" label-width="120px" size="small">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="H2 (ppm)">
                <el-input-number v-model="diagnosisParams.H2_ppm" :min="0" :max="10000" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="CH4 (ppm)">
                <el-input-number v-model="diagnosisParams.CH4_ppm" :min="0" :max="10000" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="C2H6 (ppm)">
                <el-input-number v-model="diagnosisParams.C2H6_ppm" :min="0" :max="1000" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="C2H4 (ppm)">
                <el-input-number v-model="diagnosisParams.C2H4_ppm" :min="0" :max="1000" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="C2H2 (ppm)">
                <el-input-number v-model="diagnosisParams.C2H2_ppm" :min="0" :max="1000" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="CO (ppm)">
                <el-input-number v-model="diagnosisParams.CO_ppm" :min="0" :max="5000" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="CO2 (ppm)">
                <el-input-number v-model="diagnosisParams.CO2_ppm" :min="0" :max="20000" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDiagnosisDialog = false">取消</el-button>
          <el-button type="primary" @click="runDiagnosis" :loading="diagnosisLoading">
            运行诊断
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ZoomIn, ZoomOut, Download, InfoFilled } from '@element-plus/icons-vue'
import LogicGateIcon from './LogicGateIcon.vue'
import { createLogicGateRenderer } from '@/utils/logicGateRenderer'
import { createWorkflowParser } from '@/services/workflowParser'
import type { 
  EnhancedFaultTreeNode, 
  ParsedWorkflow, 
  DiagnosisParams,
  LogicReasoningStep,
  LogicGateType,
  LogicGateState 
} from '@/types'

interface Props {
  workflowData?: any
  faultTreeData?: EnhancedFaultTreeNode
  showToolbar?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  interactive: true
})

const emit = defineEmits<{
  nodeClick: [node: EnhancedFaultTreeNode]
  diagnosisComplete: [result: any]
}>()

// 响应式数据
const treeContainer = ref<HTMLElement>()
const selectedLayout = ref('hierarchical')
const showLogicGates = ref(true)
const showSidePanel = ref(false)
const showDiagnosisDialog = ref(false)
const diagnosisLoading = ref(false)
const showLegend = ref(true)

const selectedNode = ref<EnhancedFaultTreeNode | null>(null)
const parsedWorkflow = ref<ParsedWorkflow | null>(null)
const reasoningSteps = ref<LogicReasoningStep[]>([])

// 缩放和平移
const zoomLevel = ref(1)
const minZoom = 0.2
const maxZoom = 3
const panOffset = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const lastMousePos = reactive({ x: 0, y: 0 })

// 诊断参数
const diagnosisParams = reactive<DiagnosisParams>({
  H2_ppm: 150,
  CH4_ppm: 60,
  C2H6_ppm: 20,
  C2H4_ppm: 50,
  C2H2_ppm: 150,
  CO_ppm: 100,
  CO2_ppm: 400
})

// 渲染器
const renderer = createLogicGateRenderer()
const parser = createWorkflowParser()

// 布局选项
const layoutOptions = [
  { label: '层次布局', value: 'hierarchical', description: '传统的自上而下层次结构' },
  { label: '径向布局', value: 'radial', description: '以根节点为中心的圆形分布' },
  { label: '紧凑布局', value: 'compact', description: '网格式排列，节省空间' }
]

// 计算属性
const containerStyle = computed(() => ({
  overflow: 'hidden' as const,
  position: 'relative' as const,
  width: '100%',
  height: '100%',
  background: '#f8f9fa',
  cursor: isDragging.value ? 'grabbing' : 'grab'
}))

const contentStyle = computed(() => ({
  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel.value})`,
  transformOrigin: '0 0',
  transition: isDragging.value ? 'none' : 'transform 0.3s ease'
}))

const renderedTreeHTML = ref('')

// 监听数据变化
watch([() => props.workflowData, () => props.faultTreeData, selectedLayout], async () => {
  await renderTree()
}, { immediate: true })

// 生命周期
onMounted(async () => {
  await renderTree()
  // 添加样式
  const style = document.createElement('style')
  style.textContent = renderer.getCSSStyles()
  document.head.appendChild(style)
})

// 方法
const renderTree = async () => {
  try {
    let faultTree: EnhancedFaultTreeNode | null = null

    if (props.workflowData) {
      // 从workflow数据生成故障树
      parsedWorkflow.value = parser.parseWorkflow(props.workflowData)
      faultTree = parsedWorkflow.value.fault_tree
    } else if (props.faultTreeData) {
      // 直接使用提供的故障树数据
      faultTree = props.faultTreeData
    }

    if (faultTree) {
      renderedTreeHTML.value = renderer.createHTMLStructure(faultTree, selectedLayout.value)
      await nextTick()
      attachEventListeners()
    }
  } catch (error) {
    console.error('渲染故障树失败:', error)
    ElMessage.error('渲染故障树失败')
  }
}

const attachEventListeners = () => {
  const nodes = treeContainer.value?.querySelectorAll('.enhanced-tree-node')
  nodes?.forEach(node => {
    node.addEventListener('click', (e) => {
      e.stopPropagation()
      const nodeId = (e.currentTarget as HTMLElement).dataset.nodeId
      if (nodeId) {
        handleNodeClick(nodeId)
      }
    })
  })
}

const handleNodeClick = (nodeId: string) => {
  if (!props.interactive) return

  const node = findNodeById(nodeId)
  if (node) {
    selectedNode.value = node
    showSidePanel.value = true
    emit('nodeClick', node)

    // 如果是逻辑门节点，显示推理过程
    if (node.type === 'logic_gate') {
      loadReasoningSteps(node)
    }
  }
}

const findNodeById = (nodeId: string): EnhancedFaultTreeNode | null => {
  const searchInTree = (node: EnhancedFaultTreeNode): EnhancedFaultTreeNode | null => {
    if (node.id === nodeId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = searchInTree(child)
        if (found) return found
      }
    }
    return null
  }

  if (parsedWorkflow.value) {
    return searchInTree(parsedWorkflow.value.fault_tree)
  } else if (props.faultTreeData) {
    return searchInTree(props.faultTreeData)
  }
  return null
}

const loadReasoningSteps = (node: EnhancedFaultTreeNode) => {
  // 模拟推理步骤数据
  reasoningSteps.value = [
    {
      step_id: `step_${node.id}_1`,
      gate_id: node.id,
      gate_type: node.gate_type!,
      condition: node.condition || '',
      inputs: [],
      output: node.state === 'true',
      reasoning: `根据输入条件判断，${node.gate_type}门的输出为${node.state === 'true' ? '真' : '假'}`,
      timestamp: new Date().toISOString()
    }
  ]
}

// 缩放控制
const zoomIn = () => {
  if (zoomLevel.value < maxZoom) {
    zoomLevel.value = Math.min(zoomLevel.value * 1.2, maxZoom)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > minZoom) {
    zoomLevel.value = Math.max(zoomLevel.value / 1.2, minZoom)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panOffset.x = 0
  panOffset.y = 0
}

// 鼠标事件处理
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.min(Math.max(zoomLevel.value * delta, minZoom), maxZoom)
  zoomLevel.value = newZoom
}

const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 0) { // 左键
    isDragging.value = true
    lastMousePos.x = e.clientX
    lastMousePos.y = e.clientY
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = e.clientX - lastMousePos.x
    const deltaY = e.clientY - lastMousePos.y
    panOffset.x += deltaX
    panOffset.y += deltaY
    lastMousePos.x = e.clientX
    lastMousePos.y = e.clientY
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

// 其他功能
const handleLogicGateToggle = (show: boolean) => {
  // 切换逻辑门显示
  const logicGates = treeContainer.value?.querySelectorAll('.logic-gate')
  logicGates?.forEach(gate => {
    (gate as HTMLElement).style.display = show ? 'block' : 'none'
  })
}

const handleTreeClick = (e: Event) => {
  // 处理树区域点击（空白区域）
  if (e.target === e.currentTarget) {
    selectedNode.value = null
    showSidePanel.value = false
  }
}

const exportImage = () => {
  // 导出图片功能
  ElMessage.info('导出功能开发中...')
}

const runDiagnosis = async () => {
  diagnosisLoading.value = true
  try {
    // 运行诊断逻辑
    if (parsedWorkflow.value) {
      parser.evaluateLogicGates(diagnosisParams)
      await renderTree() // 重新渲染以显示更新的状态
      ElMessage.success('诊断完成')
      emit('diagnosisComplete', diagnosisParams)
    }
  } catch (error) {
    console.error('诊断失败:', error)
    ElMessage.error('诊断失败')
  } finally {
    diagnosisLoading.value = false
    showDiagnosisDialog.value = false
  }
}

// 工具函数
const getNodeTypeTag = (type: string) => {
  return type === 'logic_gate' ? 'warning' : 'info'
}

const getNodeTypeText = (type: string) => {
  return type === 'logic_gate' ? '逻辑门' : '故障节点'
}

const getGateTypeText = (gateType: LogicGateType) => {
  const map = { 'AND': '与门', 'OR': '或门', 'NOT': '非门' }
  return map[gateType] || gateType
}

const getStateTagType = (state: LogicGateState) => {
  const map = { 'true': 'success', 'false': 'danger', 'unknown': 'info' }
  return map[state] || 'info'
}

const getStateText = (state: LogicGateState) => {
  const map = { 'true': '真', 'false': '假', 'unknown': '未知' }
  return map[state] || state
}

// 布局相关方法
const handleLayoutChange = async (newLayout: string) => {
  console.log('布局切换:', newLayout)
  // 重置视图位置
  panOffset.x = 0
  panOffset.y = 0
  zoomLevel.value = 1
  
  // 触发重新渲染
  await renderTree()
  ElMessage.success(`已切换到${getLayoutName(newLayout)}`)
}

const getLayoutIcon = (layoutType: string) => {
  const icons = {
    'hierarchical': '🌳',
    'radial': '🎯', 
    'compact': '🔲'
  }
  return icons[layoutType as keyof typeof icons] || '📊'
}

const getLayoutName = (layoutType: string) => {
  const layout = layoutOptions.find(l => l.value === layoutType)
  return layout?.label || layoutType
}

// 图例相关方法
const toggleLegend = () => {
  showLegend.value = !showLegend.value
}

// 暴露给父组件的方法
defineExpose({
  showDiagnosisDialog: () => { showDiagnosisDialog.value = true },
  resetView: resetZoom,
  exportImage,
  changeLayout: (layoutType: string) => { selectedLayout.value = layoutType }
})
</script>

<style scoped>
.enhanced-fault-tree {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.tree-container {
  flex: 1;
  min-height: 500px;
  position: relative;
}

/* 逻辑符号图例样式 */
.logic-legend {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  max-width: 280px;
  font-size: 12px;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #EBEEF5;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 8px 8px 0 0;
}

.legend-header span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.legend-toggle {
  padding: 0 !important;
  height: auto !important;
  font-size: 11px !important;
}

.legend-content {
  padding: 12px 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-symbol {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-text {
  color: #606266;
  line-height: 1.4;
  font-size: 12px;
}

/* 图例符号悬停效果 */
.legend-symbol svg {
  transition: all 0.3s ease;
}

.legend-item:hover .legend-symbol svg {
  transform: scale(1.1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.legend-item:hover .legend-text {
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logic-legend {
    top: 8px;
    left: 8px;
    right: 8px;
    max-width: none;
    font-size: 11px;
  }
  
  .legend-header {
    padding: 10px 12px;
  }
  
  .legend-header span {
    font-size: 12px;
  }
  
  .legend-content {
    padding: 10px 12px;
  }
  
  .legend-item {
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .legend-text {
    font-size: 11px;
  }
  
  .legend-symbol svg {
    width: 18px;
    height: 18px;
  }
}

.node-info-card,
.reasoning-card,
.recommendation-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #F5F7FA;
  padding: 4px 8px;
  border-radius: 4px;
}

.reasoning-steps {
  max-height: 300px;
  overflow-y: auto;
}

.reasoning-step {
  margin-bottom: 12px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 6px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.step-content {
  font-size: 12px;
}

.step-condition {
  font-family: 'Courier New', monospace;
  color: #606266;
  margin: 4px 0;
}

.step-reasoning {
  color: #303133;
  margin: 4px 0;
}

.diagnosis-form {
  max-height: 400px;
  overflow-y: auto;
}

/* 全局样式补充 */
:deep(.enhanced-tree-node.highlighted) {
  border-color: #F56C6C !important;
  background: linear-gradient(135deg, #FFF5F5, #FFFFFF) !important;
  box-shadow: 0 4px 20px rgba(245, 108, 108, 0.3) !important;
}

:deep(.logic-gate-content.state-true) {
  border-left: 4px solid #67C23A;
}

:deep(.logic-gate-content.state-false) {
  border-left: 4px solid #F56C6C;
}

:deep(.logic-gate-content.state-unknown) {
  border-left: 4px solid #909399;
}
</style>