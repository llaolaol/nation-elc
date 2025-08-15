/* eslint-disable @typescript-eslint/no-explicit-any */

// src/types/index.ts

/**
 * @description 故障分类
 */
export type FaultCategory = 'gas_analysis' | 'pd_analysis' | 'moisture_analysis';

/**
 * @description 参数获取方式
 */
export type ParameterAcquisitionMethod = 'manual' | 'automatic';

/**
 * @description 调用诊断API时需要传入的参数
 */
export interface DiagnosisParams {
  H2_ppm: number;
  CH4_ppm: number;
  C2H6_ppm: number;
  C2H4_ppm: number;
  C2H2_ppm: number;
  CO_ppm: number;
  CO2_ppm: number;
  prpd_feature?: string; // prpd 特征可选
  total_hydrocarbons_limit?: number; // 总烃阈值可选
  transformer_id?: string; // 设备ID可选
}

/**
 * @description 单条原始诊断记录的结构
 */
export interface RawFinding {
  method: string;
  fault_code: string;
  diagnosis: string;
  details: string;
  recommendation: string;
}

/**
 * @description 聚合后的诊断发现
 */
export interface AggregatedFinding {
  diagnosis: string;
  evidence: string[];
  recommendations: string[];
  severity_level: number;
}

/**
 * @description 诊断结果的结构 (根据后端实际返回的JSON进行调整)
 */
export interface DiagnosisResult {
  // 从后端返回的JSON示例中提取的字段
  H2_ppm: number;
  CH4_ppm: number;
  C2H6_ppm: number;
  C2H4_ppm: number;
  C2H2_ppm: number;
  CO_ppm: number;
  CO2_ppm: number;
  prpd_feature: string;
  total_hydrocarbons_limit: number;
  three_ratio_code_array: number[];
  three_ratio_diagnosis: string;
  dpm_fault_code: string;
  characteristic_gas_diagnosis: string;
  is_discharge_fault: boolean;
  dpm_diagnosis_result: string;
  dpm_diagnosis_description: string;
  dpm_recommendation: string;

  // 之前定义的，但可能需要根据后端实际返回情况调整为可选或移除
  transformer_id?: string;
  timestamp?: string;
  overall_conclusion?: string;
  severity?: '正常' | '注意' | '警告' | '严重' | '危急';
  severity_level?: number;
  findings_count?: number;
  aggregated_findings?: AggregatedFinding[];
  raw_findings?: RawFinding[];
  expert_suggestion?: string;
  fault_type?: any;
  confidence?: any;
  three_ratio_code?: any;
  co_co2_ratio?: any;
  h2_only?: any;
  diagnosis?: any;
  recommendation?: any;
}

/**
 * @description 简化的诊断结果接口，用于模拟API和测试
 */
export interface SimplifiedDiagnosisResult {
  transformer_id: string;
  timestamp: string;
  overall_conclusion: string;
  severity: '正常' | '注意' | '警告' | '严重' | '危急';
  severity_level: number;
  findings_count: number;
  aggregated_findings: AggregatedFinding[];
  raw_findings: RawFinding[];
  expert_suggestion: string;
}

/**
 * @description 故障诊断历史记录的单条记录结构
 */
export interface DiagnosisRecord {
  id: number; // 序号
  timestamp: string; // 诊断时间
  faultCategory: FaultCategory; // 故障分类
  acquisitionMethod: ParameterAcquisitionMethod; // 参数获取方式
  inputParams: DiagnosisParams; // 输入参数详情
  diagnosisResult: DiagnosisResult; // 诊断结果
}

// 补充缺失的类型定义
export interface FaultTreeNode {
    name: string;
    children?: FaultTreeNode[];
    value?: number | string;
    details?: any;
    id?: any;
    level?: any;
    description?: any;
    recommendation?: any;
    itemStyle?: any;
    label?: any;
    lineStyle?: any;
}

export interface EChartsNodeData {
    name: string;
    children?: EChartsNodeData[];
    value?: number | string;
    collapsed?: boolean;
    id?: any;
    level?: any;
    symbolSize?: any;
    itemStyle?: any;
    label?: any;
    nodeData?: any;
}

export type ThreeRatioCode = [number, number, number];

// ================== 图像诊断相关类型定义 ==================

/**
 * @description 图像诊断任务状态
 */
export type ImageTaskStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';

/**
 * @description 图像类型
 */
export type ImageType = 'PRPD' | 'UHF' | 'TEV' | 'AE';

/**
 * @description 识别敏感度
 */
export type SensitivityLevel = 'low' | 'medium' | 'high';

/**
 * @description 设备信息
 */
export interface EquipmentInfo {
  device_id: string;           // 设备编号
  device_type: string;         // 设备类型
  location: string;            // 设备位置
}

/**
 * @description 图像诊断参数
 */
export interface ImageDiagnosisParams {
  equipment_info: EquipmentInfo;
  image_files: File[];
  image_type: ImageType;
  sensitivity: SensitivityLevel;
}

/**
 * @description 处理后的图像信息
 */
export interface ProcessedImage {
  image_id: string;            // 图像ID
  original_name: string;       // 原始文件名
  original_url: string;        // 原始图像URL
  processed_url?: string;      // 处理后图像URL
  annotations: ImageAnnotation[]; // 图像标注信息
  file_size: number;           // 文件大小(字节)
  dimensions: {                // 图像尺寸
    width: number;
    height: number;
  };
}

/**
 * @description 图像标注信息
 */
export interface ImageAnnotation {
  annotation_id: string;       // 标注ID
  type: 'bbox' | 'point' | 'polygon'; // 标注类型
  coordinates: number[];       // 坐标信息
  label: string;              // 标注标签
  confidence: number;         // 置信度
  description?: string;       // 描述信息
}

/**
 * @description 图像诊断结果
 */
export interface ImageDiagnosisResult {
  task_id: string;            // 任务ID
  equipment_info: EquipmentInfo; // 设备信息
  image_analysis: {
    discharge_type: string;    // 放电类型
    severity_level: number;    // 严重程度(1-5)
    confidence_score: number;  // 整体置信度
    fault_location: string;    // 故障位置
    fault_probability: number; // 故障概率
  };
  ai_insights: string[];      // AI洞察
  recommended_actions: string[]; // 推荐措施
  processed_images: ProcessedImage[]; // 处理后的图像
  diagnosis_time: string;     // 诊断时间
  processing_duration: number; // 处理耗时(秒)
  technical_details?: {       // 技术细节(可选)
    algorithm_version: string;
    model_confidence: number;
    processing_steps: string[];
  };
  detailed_analysis?: {       // 详细分析内容(可选)
    full_content: string;     // 完整分析内容
    structured_content: {     // 结构化内容
      featureAnalysis: string;
      dischargeCharacteristics: string;
      comprehensiveJudgment: string;
    };
    annotations: any[];       // 标注信息
  };
}

/**
 * @description 图像诊断任务
 */
export interface ImageDiagnosisTask {
  task_id: string;            // 任务ID
  status: ImageTaskStatus;    // 任务状态
  created_at: string;         // 创建时间
  updated_at: string;         // 更新时间
  started_at?: string;        // 开始处理时间
  completed_at?: string;      // 完成时间
  params: ImageDiagnosisParams; // 诊断参数
  progress: number;           // 进度百分比(0-100)
  current_step?: string;      // 当前处理步骤
  result?: ImageDiagnosisResult; // 诊断结果
  error_message?: string;     // 错误信息
  retry_count: number;        // 重试次数
}

/**
 * @description 图像上传进度
 */
export interface ImageUploadProgress {
  file_name: string;          // 文件名
  progress: number;           // 上传进度(0-100)
  status: 'pending' | 'uploading' | 'success' | 'error';
  error_message?: string;     // 错误信息
}

// ================== 逻辑门相关类型定义 ==================

/**
 * @description 逻辑门类型
 */
export type LogicGateType = 'AND' | 'OR' | 'NOT';

/**
 * @description 逻辑门状态
 */
export type LogicGateState = 'true' | 'false' | 'unknown';

/**
 * @description 逻辑门节点
 */
export interface LogicGateNode {
  id: string;
  type: 'logic_gate';
  gate_type: LogicGateType;
  name: string;
  description?: string;
  condition?: string;           // 判断条件表达式
  state: LogicGateState;        // 当前状态
  input_nodes: string[];        // 输入节点ID列表
  output_nodes: string[];       // 输出节点ID列表
  position?: {
    x: number;
    y: number;
  };
}

/**
 * @description 增强版故障树节点
 */
export interface EnhancedFaultTreeNode {
  id: string;
  name: string;
  type: 'fault_node' | 'logic_gate';
  level?: string;
  description?: string;
  recommendation?: string;
  children?: EnhancedFaultTreeNode[];
  parent_id?: string;
  
  // 逻辑门特有属性
  gate_type?: LogicGateType;
  state?: LogicGateState;
  condition?: string;
  input_nodes?: string[];        // 输入节点ID列表
  output_nodes?: string[];       // 输出节点ID列表
  
  // 可视化属性
  position?: {
    x: number;
    y: number;
  };
  style?: {
    color?: string;
    shape?: string;
    size?: number;
  };
}

/**
 * @description Workflow节点信息
 */
export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  parameters?: any;
  position?: number[];
  connections?: {
    main: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  };
}

/**
 * @description 解析后的Workflow结构
 */
export interface ParsedWorkflow {
  nodes: WorkflowNode[];
  connections: Map<string, string[]>;
  logic_gates: LogicGateNode[];
  fault_tree: EnhancedFaultTreeNode;
}

/**
 * @description 逻辑推理步骤
 */
export interface LogicReasoningStep {
  step_id: string;
  gate_id: string;
  gate_type: LogicGateType;
  condition: string;
  inputs: {
    id: string;
    value: boolean;
    source: string;
  }[];
  output: boolean;
  reasoning: string;
  timestamp: string;
}

/**
 * @description 逻辑推理过程
 */
export interface LogicReasoningProcess {
  process_id: string;
  input_params: DiagnosisParams;
  steps: LogicReasoningStep[];
  final_result: {
    conclusion: string;
    confidence: number;
    path: string[];
  };
  created_at: string;
}

// ================== 故障树管理相关类型定义 ==================

/**
 * @description 故障树项目状态
 */
export type FaultTreeStatus = 'draft' | 'active' | 'archived' | 'template';

/**
 * @description 故障树操作权限
 */
export interface FaultTreePermission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canClone: boolean;
}

/**
 * @description 故障树元数据
 */
export interface FaultTreeMetadata {
  id: string;
  name: string;
  description?: string;
  status: FaultTreeStatus;
  category: string;              // 故障类别（变压器、开关等）
  equipment_type: string;        // 设备类型
  version: string;               // 版本号
  created_by: string;            // 创建人
  created_at: string;            // 创建时间
  updated_by: string;            // 更新人
  updated_at: string;            // 更新时间
  tags: string[];               // 标签
  node_count: number;           // 节点总数
  gate_count: number;           // 逻辑门数量
  depth: number;                // 树的深度
  is_template: boolean;         // 是否为模板
  permissions: FaultTreePermission; // 权限设置
}

/**
 * @description 故障树完整数据
 */
export interface FaultTreeData {
  metadata: FaultTreeMetadata;
  tree: EnhancedFaultTreeNode;
  layout_config?: {
    default_layout: string;
    custom_positions?: Map<string, { x: number; y: number }>;
    zoom_level?: number;
    center_point?: { x: number; y: number };
  };
}

/**
 * @description 故障树操作历史记录
 */
export interface FaultTreeOperation {
  id: string;
  tree_id: string;
  operation_type: 'create' | 'update' | 'delete' | 'clone' | 'export' | 'import';
  operation_details: string;
  performed_by: string;
  performed_at: string;
  affected_nodes?: string[];     // 受影响的节点ID列表
  before_snapshot?: string;      // 操作前快照（JSON）
  after_snapshot?: string;       // 操作后快照（JSON）
}

/**
 * @description 节点操作类型
 */
export type NodeOperationType = 'add_child' | 'add_sibling' | 'edit' | 'delete' | 'move' | 'change_type';

/**
 * @description 节点操作参数
 */
export interface NodeOperation {
  type: NodeOperationType;
  node_id?: string;              // 目标节点ID（编辑、删除时）
  parent_id?: string;            // 父节点ID（添加时）
  position?: number;             // 插入位置（添加兄弟节点时）
  data?: Partial<EnhancedFaultTreeNode>; // 节点数据（添加、编辑时）
}

/**
 * @description 故障树搜索过滤条件
 */
export interface FaultTreeFilter {
  keyword?: string;             // 关键词搜索
  status?: FaultTreeStatus[];   // 状态筛选
  category?: string[];          // 类别筛选
  equipment_type?: string[];    // 设备类型筛选
  created_by?: string[];        // 创建人筛选
  tags?: string[];              // 标签筛选
  date_range?: {                // 创建时间范围
    start: string;
    end: string;
  };
  node_count_range?: {          // 节点数量范围
    min: number;
    max: number;
  };
}

/**
 * @description 故障树导入导出选项
 */
export interface FaultTreeIOOptions {
  format: 'json' | 'xml' | 'excel' | 'pdf';
  include_metadata: boolean;    // 是否包含元数据
  include_layout: boolean;      // 是否包含布局信息
  include_history: boolean;     // 是否包含操作历史
  compress: boolean;            // 是否压缩
}

/**
 * @description 故障树验证结果
 */
export interface FaultTreeValidation {
  is_valid: boolean;
  errors: {
    type: 'structure' | 'logic' | 'data';
    node_id?: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }[];
  suggestions: string[];
  statistics: {
    total_nodes: number;
    fault_nodes: number;
    logic_gates: number;
    max_depth: number;
    isolated_nodes: number;
  };
}