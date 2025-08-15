<template>
  <div 
    class="logic-gate-node"
    :class="[
      `gate-${node.gate_type?.toLowerCase()}`,
      `state-${node.state}`,
      { 'highlighted': isHighlighted, 'interactive': interactive }
    ]"
    @click="handleClick"
  >
    <!-- 逻辑门图标 -->
    <div class="gate-icon-container">
      <LogicGateIcon
        :gate-type="node.gate_type!"
        :state="node.state!"
        :size="size"
        :interactive="interactive"
        @click="handleGateClick"
      />
    </div>

    <!-- 节点信息 -->
    <div class="node-info">
      <div class="node-name">{{ node.name }}</div>
      <div v-if="showCondition && node.condition" class="node-condition">
        {{ formatCondition(node.condition) }}
      </div>
    </div>

    <!-- 输入连线指示 -->
    <div v-if="showConnections" class="input-indicators">
      <div 
        v-for="(inputId, index) in node.input_nodes" 
        :key="inputId"
        class="input-indicator"
        :style="{ top: `${20 + index * 15}px` }"
      />
    </div>

    <!-- 输出连线指示 -->
    <div v-if="showConnections" class="output-indicators">
      <div 
        v-for="(outputId, index) in node.output_nodes" 
        :key="outputId"
        class="output-indicator"
        :style="{ top: `${20 + index * 15}px` }"
      />
    </div>

    <!-- 详情弹出框 -->
    <el-popover
      v-model:visible="showDetails"
      placement="right"
      :width="300"
    >
      <template #reference>
        <div class="details-trigger" />
      </template>
      
      <div class="gate-details">
        <h4>{{ node.name }}</h4>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="逻辑门类型">
            <el-tag :type="getGateTypeTagType(node.gate_type!) as any">
              {{ getGateTypeText(node.gate_type!) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStateTagType(node.state!) as any">
              {{ getStateText(node.state!) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="node.condition" label="判断条件">
            <code class="condition-code">{{ node.condition }}</code>
          </el-descriptions-item>
          <el-descriptions-item v-if="node.description" label="描述">
            {{ node.description }}
          </el-descriptions-item>
          <el-descriptions-item label="输入节点">
            {{ (node as any).input_nodes?.length || 0 }} 个
          </el-descriptions-item>
          <el-descriptions-item label="输出节点">
            {{ (node as any).output_nodes?.length || 0 }} 个
          </el-descriptions-item>
        </el-descriptions>

        <!-- 调试信息 -->
        <div v-if="showDebugInfo" class="debug-info">
          <h5>调试信息</h5>
          <pre>{{ JSON.stringify(node, null, 2) }}</pre>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElPopover, ElTag, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import LogicGateIcon from './LogicGateIcon.vue'
import type { EnhancedFaultTreeNode, LogicGateType, LogicGateState } from '@/types'

interface Props {
  node: EnhancedFaultTreeNode
  size?: 'small' | 'medium' | 'large'
  interactive?: boolean
  showCondition?: boolean
  showConnections?: boolean
  showDebugInfo?: boolean
  isHighlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  interactive: true,
  showCondition: true,
  showConnections: false,
  showDebugInfo: false,
  isHighlighted: false
})

const emit = defineEmits<{
  click: [node: EnhancedFaultTreeNode]
  gateClick: [gateType: LogicGateType, state: LogicGateState, node: EnhancedFaultTreeNode]
  showDetails: [node: EnhancedFaultTreeNode]
}>()

const showDetails = ref(false)

// 处理节点点击
const handleClick = () => {
  if (props.interactive) {
    showDetails.value = !showDetails.value
    emit('click', props.node)
  }
}

// 处理逻辑门图标点击
const handleGateClick = (gateType: LogicGateType, state: LogicGateState) => {
  emit('gateClick', gateType, state, props.node)
}

// 格式化条件文本
const formatCondition = (condition: string): string => {
  if (condition.length > 30) {
    return condition.substring(0, 27) + '...'
  }
  return condition
}

// 获取逻辑门类型标签类型
const getGateTypeTagType = (gateType: LogicGateType): string => {
  const typeMap = {
    'AND': 'primary',
    'OR': 'success',
    'NOT': 'warning'
  }
  return typeMap[gateType] || 'info'
}

// 获取逻辑门类型文本
const getGateTypeText = (gateType: LogicGateType): string => {
  const textMap = {
    'AND': '与门',
    'OR': '或门',
    'NOT': '非门'
  }
  return textMap[gateType] || gateType
}

// 获取状态标签类型
const getStateTagType = (state: LogicGateState): string => {
  const typeMap = {
    'true': 'success',
    'false': 'danger',
    'unknown': 'info'
  }
  return typeMap[state] || 'info'
}

// 获取状态文本
const getStateText = (state: LogicGateState): string => {
  const textMap = {
    'true': '真',
    'false': '假',
    'unknown': '未知'
  }
  return textMap[state] || state
}

// 节点样式
const nodeStyle = computed(() => {
  const sizes = {
    small: { width: '120px', minHeight: '60px' },
    medium: { width: '160px', minHeight: '80px' },
    large: { width: '200px', minHeight: '100px' }
  }
  return sizes[props.size]
})
</script>

<style scoped>
.logic-gate-node {
  position: relative;
  background: white;
  border: 2px solid #DCDFE6;
  border-radius: 12px;
  padding: 12px;
  margin: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logic-gate-node.interactive {
  cursor: pointer;
}

.logic-gate-node.interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #409EFF;
}

.logic-gate-node.highlighted {
  border-color: #F56C6C;
  background: linear-gradient(135deg, #FFF5F5, #FFFFFF);
  box-shadow: 0 4px 20px rgba(245, 108, 108, 0.3);
}

.gate-icon-container {
  margin-bottom: 8px;
}

.node-info {
  text-align: center;
  width: 100%;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.2;
}

.node-condition {
  font-size: 11px;
  color: #909399;
  font-family: 'Courier New', monospace;
  background: #F5F7FA;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

.input-indicators,
.output-indicators {
  position: absolute;
  top: 0;
  height: 100%;
  pointer-events: none;
}

.input-indicators {
  left: -6px;
}

.output-indicators {
  right: -6px;
}

.input-indicator,
.output-indicator {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409EFF;
  border: 2px solid white;
}

.details-trigger {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

/* 不同状态的样式 */
.state-true {
  border-color: #67C23A;
}

.state-false {
  border-color: #F56C6C;
}

.state-unknown {
  border-color: #909399;
}

/* 不同逻辑门类型的样式 */
.gate-and {
  background: linear-gradient(135deg, #E6F3FF, #FFFFFF);
}

.gate-or {
  background: linear-gradient(135deg, #F0F9FF, #FFFFFF);
}

.gate-not {
  background: linear-gradient(135deg, #FFF7E6, #FFFFFF);
}

.gate-details h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.condition-code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #F5F7FA;
  padding: 4px 8px;
  border-radius: 4px;
  color: #606266;
}

.debug-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
}

.debug-info h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.debug-info pre {
  font-size: 10px;
  background: #F5F7FA;
  padding: 8px;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
}

/* 动画效果 */
@keyframes glow {
  0% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 4px 20px rgba(64, 158, 255, 0.4);
  }
  100% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.logic-gate-node.active {
  animation: glow 2s infinite;
}
</style>