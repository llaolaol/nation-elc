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