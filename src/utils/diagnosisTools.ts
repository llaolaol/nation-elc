// 故障诊断工具类
import type { DiagnosisParams, DiagnosisResult, ThreeRatioCode } from '@/types'

/**
 * 气体比值计算器
 */
export class GasRatioCalculator {
  /**
   * 计算C2H2/C2H4比值
   */
  static calculateC2H2ToC2H4Ratio(params: DiagnosisParams): number {
    return params.C2H4_ppm > 0 ? params.C2H2_ppm / params.C2H4_ppm : 0
  }

  /**
   * 计算CH4/H2比值
   */
  static calculateCH4ToH2Ratio(params: DiagnosisParams): number {
    return params.H2_ppm > 0 ? params.CH4_ppm / params.H2_ppm : 0
  }

  /**
   * 计算C2H4/C2H6比值
   */
  static calculateC2H4ToC2H6Ratio(params: DiagnosisParams): number {
    return params.C2H6_ppm > 0 ? params.C2H4_ppm / params.C2H6_ppm : 0
  }

  /**
   * 计算CO2/CO比值
   */
  static calculateCO2ToCORatio(params: DiagnosisParams): number {
    return params.CO_ppm > 0 ? params.CO2_ppm / params.CO_ppm : Infinity
  }

  /**
   * 计算总烃含量
   */
  static calculateTotalHydrocarbons(params: DiagnosisParams): number {
    return params.CH4_ppm + params.C2H2_ppm + params.C2H4_ppm + params.C2H6_ppm
  }

  /**
   * 计算故障特征气体含量
   */
  static calculateFaultGases(params: DiagnosisParams): number {
    return params.C2H2_ppm + params.C2H4_ppm + params.C2H6_ppm
  }
}

/**
 * 三比值法诊断器
 */
export class ThreeRatioMethodAnalyzer {
  // 三比值阈值配置
  private static readonly THRESHOLDS = {
    C2H2_C2H4: { low: 0.1, high: 3 },
    CH4_H2: { low: 0.1, high: 1 },
    C2H4_C2H6: { low: 1, high: 3 }
  }

  /**
   * 计算三比值代码
   */
  static calculateCode(params: DiagnosisParams): string {
    const ratio1 = GasRatioCalculator.calculateC2H2ToC2H4Ratio(params)
    const ratio2 = GasRatioCalculator.calculateCH4ToH2Ratio(params)
    const ratio3 = GasRatioCalculator.calculateC2H4ToC2H6Ratio(params)

    const code1 = this.encodeRatio(ratio1, this.THRESHOLDS.C2H2_C2H4)
    const code2 = this.encodeRatio(ratio2, this.THRESHOLDS.CH4_H2, true)
    const code3 = this.encodeRatio(ratio3, this.THRESHOLDS.C2H4_C2H6)

    return `${code1}${code2}${code3}`
  }

  /**
   * 编码单个比值
   */
  private static encodeRatio(
    ratio: number, 
    threshold: { low: number; high: number },
    reversed = false
  ): number {
    if (reversed) {
      // CH4/H2 比值的编码逻辑特殊
      if (ratio < threshold.low) return 1
      if (ratio >= threshold.low && ratio <= threshold.high) return 0
      return 2
    } else {
      if (ratio < threshold.low) return 0
      if (ratio >= threshold.low && ratio <= threshold.high) return 1
      return 2
    }
  }

  /**
   * 根据三比值代码诊断故障类型
   */
  static diagnoseByCode(code: string): Partial<DiagnosisResult> {
    const diagnoses: Record<string, Partial<DiagnosisResult>> = {
      '000': {
        fault_type: '低温过热',
        diagnosis: '150℃以下低温过热故障',
        recommendation: '检查接触不良、散热不良等问题',
        confidence: 0.82
      },
      '001': {
        fault_type: '低温过热',
        diagnosis: '150-300℃低温过热故障',
        recommendation: '检查线圈接触电阻、引线连接等',
        confidence: 0.85
      },
      '002': {
        fault_type: '低温过热',
        diagnosis: '局部过热伴随轻微放电',
        recommendation: '全面检查过热部位和绝缘状态',
        confidence: 0.80
      },
      '010': {
        fault_type: '局部放电',
        diagnosis: '油中或固体绝缘中的局部放电',
        recommendation: '检查绝缘系统，查找放电源',
        confidence: 0.88
      },
      '020': {
        fault_type: '低温过热',
        diagnosis: '300℃以下过热故障',
        recommendation: '检查负载和冷却系统',
        confidence: 0.86
      },
      '021': {
        fault_type: '中温过热',
        diagnosis: '300-700℃中温过热故障',
        recommendation: '检查线圈导线焊接、引线绝缘等',
        confidence: 0.90
      },
      '022': {
        fault_type: '高温过热',
        diagnosis: '700℃以上高温过热故障',
        recommendation: '立即检查铁芯、夹件等严重过热源',
        confidence: 0.92
      },
      '100': {
        fault_type: '火花放电',
        diagnosis: '油中低能量火花放电',
        recommendation: '检查金属异物、接地不良等',
        confidence: 0.84
      },
      '101': {
        fault_type: '火花放电',
        diagnosis: '油中火花放电伴轻微过热',
        recommendation: '检查悬浮放电和接触不良',
        confidence: 0.82
      },
      '102': {
        fault_type: '高能放电',
        diagnosis: '油中高能量放电或电弧',
        recommendation: '立即停机检查，可能有严重故障',
        confidence: 0.93
      },
      '110': {
        fault_type: '火花放电',
        diagnosis: '混合型故障：火花放电+局部放电',
        recommendation: '综合检查放电和绝缘系统',
        confidence: 0.80
      },
      '120': {
        fault_type: '火花放电兼过热',
        diagnosis: '火花放电伴随过热',
        recommendation: '检查放电源和过热原因',
        confidence: 0.83
      },
      '200': {
        fault_type: '电弧放电',
        diagnosis: '油中电弧放电',
        recommendation: '紧急停机检查，存在电弧故障',
        confidence: 0.95
      },
      '201': {
        fault_type: '电弧放电兼过热',
        diagnosis: '电弧放电伴随过热',
        recommendation: '立即停机，检查严重电气故障',
        confidence: 0.94
      },
      '202': {
        fault_type: '电弧放电兼过热',
        diagnosis: '严重电弧放电伴高温过热',
        recommendation: '紧急停机，可能导致设备损坏',
        confidence: 0.96
      }
    }

    return diagnoses[code] || {
      fault_type: '未知故障',
      diagnosis: `三比值代码${code}未能识别具体故障类型`,
      recommendation: '建议结合其他检测手段进一步分析',
      confidence: 0.3
    }
  }
}

/**
 * DPM方法分析器
 */
export class DPMMethodAnalyzer {
  /**
   * 根据DPM结果分析故障
   */
  static analyzeByDPMResult(dmpResult: string): Partial<DiagnosisResult> {
    const analyses: Record<string, Partial<DiagnosisResult>> = {
      'T1': {
        fault_type: '低温过热',
        diagnosis: 'DPM显示T1区域，表明存在低温过热',
        recommendation: '检查负载和散热系统',
        confidence: 0.85
      },
      'T2': {
        fault_type: '中温过热',
        diagnosis: 'DPM显示T2区域，表明存在中温过热',
        recommendation: '检查导线连接和绝缘状态',
        confidence: 0.88
      },
      'T3': {
        fault_type: '高温过热',
        diagnosis: 'DPM显示T3区域，表明存在高温过热',
        recommendation: '立即检查铁芯和夹件',
        confidence: 0.90
      },
      'D1': {
        fault_type: '低能放电',
        diagnosis: 'DPM显示D1区域，存在低能量放电',
        recommendation: '检查绝缘系统和接地',
        confidence: 0.83
      },
      'D2': {
        fault_type: '高能放电',
        diagnosis: 'DPM显示D2区域，存在高能量放电',
        recommendation: '立即停机检查电弧故障',
        confidence: 0.92
      },
      'DP': {
        fault_type: '混合故障',
        diagnosis: 'DPM显示DP区域，存在复合型故障',
        recommendation: '综合分析放电和过热问题',
        confidence: 0.78
      }
    }

    return analyses[dmpResult] || {
      fault_type: '未知DPM结果',
      diagnosis: `DPM结果${dmpResult}无法识别`,
      recommendation: '请确认DPM检测结果的准确性',
      confidence: 0.3
    }
  }
}

/**
 * PRPD模式分析器
 */
export class PRPDPatternAnalyzer {
  /**
   * 根据PRPD特征分析放电类型
   */
  static analyzeByPRPDFeature(prpdFeature: string): Partial<DiagnosisResult> {
    const analyses: Record<string, Partial<DiagnosisResult>> = {
      'symmetric_wide': {
        fault_type: '绝缘放电',
        diagnosis: 'PRPD对称宽相位窗口分布，典型的绝缘内部放电特征',
        recommendation: '检查固体绝缘完整性，排查绝缘劣化',
        confidence: 0.87
      },
      'symmetric_narrow': {
        fault_type: '悬浮放电',
        diagnosis: 'PRPD对称窄相位窗口分布，典型的悬浮电位放电',
        recommendation: '检查金属连接松动、等电位线断裂',
        confidence: 0.89
      },
      'single_pole': {
        fault_type: '尖端放电',
        diagnosis: 'PRPD单极分布，典型的尖端电晕放电',
        recommendation: '检查金属尖角、毛刺等缺陷',
        confidence: 0.83
      },
      'asymmetric_wide': {
        fault_type: '沿面放电',
        diagnosis: 'PRPD非对称宽相位分布，典型的沿面闪络特征',
        recommendation: '检查绝缘表面污染、受潮情况',
        confidence: 0.86
      }
    }

    return analyses[prpdFeature] || {
      fault_type: '未知放电类型',
      diagnosis: `PRPD特征${prpdFeature}无法准确识别`,
      recommendation: '建议进一步分析PRPD模式',
      confidence: 0.4
    }
  }
}

/**
 * 综合诊断决策器
 */
export class DiagnosisDecisionMaker {
  /**
   * 融合多种方法的诊断结果
   */
  static fuseDiagnosisResults(
    results: Array<{ result: Partial<DiagnosisResult>; weight: number }>
  ): DiagnosisResult {
    // 计算加权平均置信度
    const totalWeight = results.reduce((sum, item) => sum + item.weight, 0)
    const avgConfidence = results.reduce(
      (sum, item) => sum + (item.result.confidence || 0) * item.weight,
      0
    ) / totalWeight

    // 选择置信度最高的结果作为主要诊断
    const primaryResult = results.reduce((prev, current) => {
      const prevConf = (prev.result.confidence || 0) * prev.weight
      const currentConf = (current.result.confidence || 0) * current.weight
      return currentConf > prevConf ? current : prev
    })

    return {
      transformer_id: '', // 需要从外部传入
      timestamp: new Date().toISOString(),
      overall_conclusion: primaryResult.result.diagnosis || '诊断信息不足',
      severity: '注意', // 需要根据confidence计算
      severity_level: 3, // 需要根据confidence计算
      findings_count: 1,
      aggregated_findings: [],
      raw_findings: [],
      expert_suggestion: primaryResult.result.recommendation || '建议进一步检测',
      fault_type: primaryResult.result.fault_type || '未知故障',
      diagnosis: primaryResult.result.diagnosis || '诊断信息不足',
      recommendation: primaryResult.result.recommendation || '建议进一步检测',
      confidence: Math.min(avgConfidence, 1.0),
      three_ratio_code: primaryResult.result.three_ratio_code,
      co_co2_ratio: primaryResult.result.co_co2_ratio,
      h2_only: primaryResult.result.h2_only
    }
  }

  /**
   * 验证诊断结果的一致性
   */
  static validateConsistency(
    threeRatioResult: Partial<DiagnosisResult>,
    dmpResult: Partial<DiagnosisResult>,
    prpdResult: Partial<DiagnosisResult>
  ): { consistent: boolean; conflictReason?: string } {
    // 检查故障类型是否一致
    const faultTypes = [
      threeRatioResult.fault_type,
      dmpResult.fault_type,
      prpdResult.fault_type
    ].filter(Boolean)

    // 如果故障类型差异过大，标记为不一致
    const uniqueFaultTypes = [...new Set(faultTypes)]
    if (uniqueFaultTypes.length > 2) {
      return {
        consistent: false,
        conflictReason: `多种方法诊断结果差异较大：${uniqueFaultTypes.join(', ')}`
      }
    }

    // 检查置信度
    const confidences = [
      threeRatioResult.confidence || 0,
      dmpResult.confidence || 0,
      prpdResult.confidence || 0
    ]
    
    const avgConfidence = confidences.reduce((a, b) => a + b) / confidences.length
    if (avgConfidence < 0.6) {
      return {
        consistent: false,
        conflictReason: '各方法诊断置信度普遍偏低'
      }
    }

    return { consistent: true }
  }
}