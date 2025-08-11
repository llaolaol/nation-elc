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