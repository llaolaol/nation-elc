// 应用常量定义

// DPM结果选项
export const DPM_OPTIONS = [
  { label: 'T1区域', value: 'T1' },
  { label: 'T2区域', value: 'T2' },
  { label: 'T3区域', value: 'T3' },
  { label: 'D1区域', value: 'D1' },
  { label: 'D2区域', value: 'D2' },
  { label: 'DP区域', value: 'DP' }
] as const

// PRPD特征选项
export const PRPD_OPTIONS = [
  { label: '对称宽相位窗口', value: 'symmetric_wide' },
  { label: '对称窄相位窗口', value: 'symmetric_narrow' },
  { label: '单极分布', value: 'single_pole' },
  { label: '非对称宽相位窗口', value: 'asymmetric_wide' }
] as const

// 气体浓度范围限制
export const GAS_CONCENTRATION_LIMITS = {
  H2_ppm: { min: 0, max: 10000 },
  CH4_ppm: { min: 0, max: 10000 },
  C2H6_ppm: { min: 0, max: 1000 },
  C2H4_ppm: { min: 0, max: 1000 },
  C2H2_ppm: { min: 0, max: 1000 },
  CO_ppm: { min: 0, max: 5000 },
  CO2_ppm: { min: 0, max: 20000 }
} as const

// 故障类型颜色映射
export const FAULT_TYPE_COLORS = {
  '设备受潮': 'info',
  '中温过热': 'warning',
  '高温过热': 'danger',
  '绝缘放电': 'warning',
  '悬浮放电': 'danger',
  '尖端放电': 'warning',
  '沿面放电': 'danger',
  '油中高能放电': 'danger',
  '油中低能放电': 'warning'
} as const

// 置信度标签类型映射
export const CONFIDENCE_TAG_TYPES = [
  { min: 0.9, type: 'success' },
  { min: 0.7, type: 'warning' },
  { min: 0, type: 'danger' }
] as const

// 节点级别大小映射
export const NODE_LEVEL_SIZES = {
  '一级节点': 60,
  '二级节点': 50,
  '三级节点': 40,
  '四级节点': 35,
  '五级节点': 30,
  '六级节点': 25
} as const

// 节点级别颜色映射
export const NODE_LEVEL_COLORS = {
  '根节点': '#e74c3c',
  '一级节点': '#e74c3c',
  '二级节点': '#f39c12',
  '三级节点': '#3498db',
  '四级节点': '#27ae60',
  '五级节点': '#9b59b6',
  '六级节点': '#34495e'
} as const

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = [
  '.txt', '.json', '.xlsx', '.xls', '.pdf', '.doc', '.docx'
] as const

// 文件类型图标映射
export const FILE_TYPE_ICONS = {
  'txt': 'DocumentText',
  'json': 'DataBoard',
  'xlsx': 'Grid',
  'xls': 'Grid',
  'pdf': 'Document',
  'doc': 'Document',
  'docx': 'Document'
} as const

// 三比值阈值配置
export const THREE_RATIO_THRESHOLDS = {
  // C2H2/C2H4
  ratio1: {
    low: 0.1,
    high: 3
  },
  // CH4/H2
  ratio2: {
    low: 0.1,
    high: 1
  },
  // C2H4/C2H6
  ratio3: {
    low: 1,
    high: 3
  }
} as const

// 预设测试数据
export const PRESET_TEST_DATA = {
  H2_ppm: 150,
  CH4_ppm: 60,
  C2H6_ppm: 20,
  C2H4_ppm: 50,
  C2H2_ppm: 150,
  CO_ppm: 100,
  CO2_ppm: 400,
  dmp_result: 'D2' as const,
  prpd_feature: 'symmetric_wide' as const
}

// 本地存储键名
export const STORAGE_KEYS = {
  DIAGNOSIS_HISTORY: 'diagnosisHistory',
  USER_PREFERENCES: 'userPreferences',
  UPLOADED_DOCUMENTS: 'uploadedDocuments'
} as const

// API端点
export const API_ENDPOINTS = {
  DOCUMENTS: '/api/documents',
  DIAGNOSIS: '/api/diagnosis',
  FAULT_TREE: '/api/fault-tree'
} as const

// 错误消息
export const ERROR_MESSAGES = {
  FILE_UPLOAD_FAILED: '文件上传失败',
  DIAGNOSIS_FAILED: '诊断失败，请检查输入参数',
  NETWORK_ERROR: '网络连接失败',
  INVALID_FILE_FORMAT: '不支持的文件格式',
  FILE_SIZE_EXCEEDED: '文件大小超出限制'
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: '文件上传成功',
  DIAGNOSIS_COMPLETED: '诊断完成',
  DATA_SAVED: '数据保存成功',
  REPORT_EXPORTED: '报告导出成功'
} as const

// ===================== 逻辑门相关配置 =====================

// 逻辑门类型配置
export const LOGIC_GATE_TYPES = {
  AND: {
    label: '与门',
    symbol: '&',
    description: '所有输入为真时输出为真',
    color: '#409EFF'
  },
  OR: {
    label: '或门', 
    symbol: '∨',
    description: '任一输入为真时输出为真',
    color: '#67C23A'
  },
  NOT: {
    label: '非门',
    symbol: '¬', 
    description: '输入取反',
    color: '#E6A23C'
  }
} as const

// 逻辑门状态配置
export const LOGIC_GATE_STATES = {
  true: {
    label: '真',
    color: '#67C23A',
    bgColor: '#F0F9FF',
    borderColor: '#529B2E'
  },
  false: {
    label: '假',
    color: '#F56C6C', 
    bgColor: '#FEF0F0',
    borderColor: '#C45656'
  },
  unknown: {
    label: '未知',
    color: '#909399',
    bgColor: '#F5F7FA', 
    borderColor: '#73767A'
  }
} as const

// 逻辑门大小配置
export const LOGIC_GATE_SIZES = {
  small: {
    width: 40,
    height: 28,
    fontSize: 12,
    iconSize: 16
  },
  medium: {
    width: 60,
    height: 40,
    fontSize: 14,
    iconSize: 20
  },
  large: {
    width: 80,
    height: 54,
    fontSize: 16,
    iconSize: 24
  }
} as const

// 故障树布局配置
export const FAULT_TREE_LAYOUT = {
  nodeWidth: 160,
  nodeHeight: 80,
  horizontalSpacing: 200,
  verticalSpacing: 120,
  levelHeight: 150,
  minZoom: 0.2,
  maxZoom: 3.0,
  defaultZoom: 1.0
} as const

// workflow节点类型映射
export const WORKFLOW_NODE_TYPES = {
  'n8n-nodes-base.webhook': {
    label: 'Webhook触发器',
    category: 'trigger',
    icon: 'Webhook',
    color: '#409EFF'
  },
  'n8n-nodes-base.manualTrigger': {
    label: '手动触发器', 
    category: 'trigger',
    icon: 'Click',
    color: '#67C23A'
  },
  'n8n-nodes-base.if': {
    label: '条件判断',
    category: 'logic',
    icon: 'Branch',
    color: '#E6A23C'
  },
  'n8n-nodes-base.switch': {
    label: '分支选择',
    category: 'logic', 
    icon: 'Switch',
    color: '#E6A23C'
  },
  'n8n-nodes-base.code': {
    label: '代码执行',
    category: 'data',
    icon: 'Code',
    color: '#9B59B6'
  },
  'n8n-nodes-base.noOp': {
    label: '无操作',
    category: 'utility',
    icon: 'NoOp',
    color: '#95A5A6'
  }
} as const

// 诊断操作符配置
export const DIAGNOSIS_OPERATORS = {
  equals: { symbol: '==', label: '等于' },
  notEquals: { symbol: '!=', label: '不等于' },
  larger: { symbol: '>', label: '大于' },
  largerEqual: { symbol: '>=', label: '大于等于' },
  smaller: { symbol: '<', label: '小于' },
  smallerEqual: { symbol: '<=', label: '小于等于' },
  contains: { symbol: '包含', label: '包含' },
  notContains: { symbol: '不包含', label: '不包含' }
} as const

// 推理步骤类型
export const REASONING_STEP_TYPES = {
  INPUT: {
    label: '输入检查',
    color: '#909399',
    icon: 'Input'
  },
  CONDITION: {
    label: '条件判断', 
    color: '#E6A23C',
    icon: 'Condition'
  },
  LOGIC: {
    label: '逻辑运算',
    color: '#409EFF', 
    icon: 'Logic'
  },
  OUTPUT: {
    label: '输出结果',
    color: '#67C23A',
    icon: 'Output'
  }
} as const

// 连线样式配置
export const CONNECTION_STYLES = {
  default: {
    color: '#DCDFE6',
    width: 2,
    dashArray: 'none'
  },
  active: {
    color: '#409EFF',
    width: 3,
    dashArray: 'none'
  },
  highlighted: {
    color: '#F56C6C',
    width: 4,
    dashArray: 'none'
  },
  inactive: {
    color: '#E4E7ED',
    width: 1,
    dashArray: '5,5'
  }
} as const

// 导出格式配置
export const EXPORT_FORMATS = {
  PNG: {
    label: 'PNG图片',
    extension: '.png',
    mimeType: 'image/png'
  },
  JPG: {
    label: 'JPG图片', 
    extension: '.jpg',
    mimeType: 'image/jpeg'
  },
  SVG: {
    label: 'SVG矢量图',
    extension: '.svg',
    mimeType: 'image/svg+xml'
  },
  JSON: {
    label: 'JSON数据',
    extension: '.json', 
    mimeType: 'application/json'
  }
} as const

// 动画配置
export const ANIMATIONS = {
  nodeHover: {
    duration: 300,
    easing: 'ease-in-out',
    scale: 1.05
  },
  stateChange: {
    duration: 500,
    easing: 'ease-out',
    glow: true
  },
  pathHighlight: {
    duration: 1000,
    easing: 'ease-in-out',
    delay: 200
  }
} as const

// 调试模式配置
export const DEBUG_CONFIG = {
  showNodeIds: false,
  showConnectionIds: false,
  logWorkflowParsing: true,
  logStateChanges: true,
  showPerformanceMetrics: false
} as const