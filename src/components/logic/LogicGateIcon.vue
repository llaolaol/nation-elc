<template>
  <div 
    class="logic-gate-icon"
    :class="`gate-${gateType.toLowerCase()}`"
    :style="gateStyle"
  >
    <!-- AND门图标 -->
    <svg v-if="gateType === 'AND'" viewBox="0 0 60 40" class="gate-svg">
      <path 
        d="M10 5 L35 5 Q50 5 50 20 Q50 35 35 35 L10 35 Z" 
        :fill="fillColor" 
        :stroke="strokeColor" 
        stroke-width="2"
      />
      <text x="30" y="25" text-anchor="middle" :fill="textColor" font-size="12" font-weight="bold">
        &amp;
      </text>
    </svg>

    <!-- OR门图标 -->
    <svg v-else-if="gateType === 'OR'" viewBox="0 0 60 40" class="gate-svg">
      <path 
        d="M10 5 Q25 5 35 5 Q50 10 50 20 Q50 30 35 35 Q25 35 10 35 Q20 20 10 5 Z" 
        :fill="fillColor" 
        :stroke="strokeColor" 
        stroke-width="2"
      />
      <text x="30" y="25" text-anchor="middle" :fill="textColor" font-size="16" font-weight="bold">
        ∨
      </text>
    </svg>

    <!-- NOT门图标 -->
    <svg v-else-if="gateType === 'NOT'" viewBox="0 0 60 40" class="gate-svg">
      <path 
        d="M10 5 L45 20 L10 35 Z" 
        :fill="fillColor" 
        :stroke="strokeColor" 
        stroke-width="2"
      />
      <circle cx="48" cy="20" r="3" :fill="fillColor" :stroke="strokeColor" stroke-width="2"/>
      <text x="25" y="25" text-anchor="middle" :fill="textColor" font-size="12" font-weight="bold">
        ¬
      </text>
    </svg>

    <!-- 状态指示器 -->
    <div class="state-indicator" :class="`state-${state}`">
      <div class="state-dot"></div>
    </div>

    <!-- 状态文本 -->
    <div v-if="showStateText" class="state-text">
      {{ stateText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LogicGateType, LogicGateState } from '@/types'

interface Props {
  gateType: LogicGateType
  state?: LogicGateState
  size?: 'small' | 'medium' | 'large'
  showStateText?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  state: 'unknown',
  size: 'medium',
  showStateText: false,
  interactive: true
})

const emit = defineEmits<{
  click: [gateType: LogicGateType, state: LogicGateState]
}>()

// 计算样式
const gateStyle = computed(() => {
  const sizes = {
    small: { width: '40px', height: '28px' },
    medium: { width: '60px', height: '40px' },
    large: { width: '80px', height: '54px' }
  }
  
  return {
    ...sizes[props.size],
    cursor: props.interactive ? 'pointer' : 'default'
  }
})

// 填充颜色
const fillColor = computed(() => {
  const stateColors = {
    'true': '#67C23A',   // 绿色
    'false': '#F56C6C',  // 红色
    'unknown': '#909399' // 灰色
  }
  return stateColors[props.state]
})

// 边框颜色
const strokeColor = computed(() => {
  const stateColors = {
    'true': '#529B2E',
    'false': '#C45656',
    'unknown': '#73767A'
  }
  return stateColors[props.state]
})

// 文字颜色
const textColor = computed(() => {
  return props.state === 'unknown' ? '#FFFFFF' : '#FFFFFF'
})

// 状态文本
const stateText = computed(() => {
  const stateTexts = {
    'true': '真',
    'false': '假',
    'unknown': '未知'
  }
  return stateTexts[props.state]
})

// 点击处理
const handleClick = () => {
  if (props.interactive) {
    emit('click', props.gateType, props.state)
  }
}
</script>

<style scoped>
.logic-gate-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.logic-gate-icon:hover {
  transform: scale(1.05);
}

.gate-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.state-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.state-true .state-dot {
  background: #67C23A;
}

.state-false .state-dot {
  background: #F56C6C;
}

.state-unknown .state-dot {
  background: #909399;
}

.state-text {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #606266;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
  white-space: nowrap;
}

/* 不同门类型的特殊样式 */
.gate-and {
  /* AND门特殊样式 */
}

.gate-or {
  /* OR门特殊样式 */
}

.gate-not {
  /* NOT门特殊样式 */
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.logic-gate-icon.active {
  animation: pulse 1s infinite;
}
</style>