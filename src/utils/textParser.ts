// 文本解析工具 - 用于解析 n8n 返回的纯文本报告

export interface ParsedDiagnosisResult {
  fault_type?: string;
  severity?: string;
  severity_level?: number;
  main_diagnosis?: string;
  recommendations?: string[];
  raw_report: string;
  parsed_success: boolean;
}

/**
 * 解析 n8n 返回的纯文本诊断报告
 * @param rawText n8n 返回的原始文本
 * @returns 解析后的结构化数据
 */
export function parseN8nTextResponse(rawText: string): ParsedDiagnosisResult {
  const result: ParsedDiagnosisResult = {
    raw_report: rawText,
    parsed_success: false,
    recommendations: []
  };

  try {
    // 提取严重性信息
    const severityMatch = rawText.match(/总体严重性[：:]\s*([^，\n]+)/);
    if (severityMatch) {
      result.severity = severityMatch[1].trim();
      
      // 映射严重性等级
      const severityMap: { [key: string]: number } = {
        '正常': 1,
        '注意': 2,
        '警告': 3,
        '严重': 4,
        '危急': 5
      };
      result.severity_level = severityMap[result.severity] || 0;
    }

    // 提取主要故障类型
    const faultTypeMatch = rawText.match(/主要故障类型[：:]\s*([^，\n\(]+)/);
    if (faultTypeMatch) {
      result.fault_type = faultTypeMatch[1].trim();
    }

    // 尝试从文本中提取其他故障描述
    const diagnosisMatches = [
      rawText.match(/高能电弧放电/),
      rawText.match(/([^。]*放电[^。]*)/),
      rawText.match(/([^。]*故障[^。]*)/),
      rawText.match(/DPM[^，]*诊断为[^，。]*/),
      rawText.match(/杜瓦尔五边形法[^，]*诊断为[^，。]*/)
    ];

    for (const match of diagnosisMatches) {
      if (match && match[0]) {
        result.main_diagnosis = match[0].trim();
        break;
      }
    }

    // 提取推荐措施
    const recommendationPatterns = [
      /[1-9]\.\s*\*\*([^*]+)\*\*/g, // 匹配 "1. **措施**" 格式
      /[1-9]\.\s*([^：\n]+)[:：]/g,   // 匹配 "1. 措施:" 格式
      /必须执行的安全措施[^：]*[:：]\s*([\s\S]*?)(?=\n\n|\n[#1-9])/
    ];

    for (const pattern of recommendationPatterns) {
      const matches = Array.from(rawText.matchAll(pattern));
      if (matches.length > 0) {
        result.recommendations = matches.map(match => 
          match[1]?.trim().replace(/\*\*/g, '') || ''
        ).filter(rec => rec.length > 0);
        break;
      }
    }

    // 如果没有提取到推荐措施，尝试提取关键建议
    if (result.recommendations?.length === 0) {
      const keyAdvice = [
        '立即停运与隔离',
        '安全警示与区域封锁',
        '接地保护',
        '消防准备',
        '人员防护'
      ];
      
      result.recommendations = keyAdvice.filter(advice => 
        rawText.includes(advice)
      );
    }

    result.parsed_success = !!(result.severity || result.fault_type || result.main_diagnosis);

  } catch (error) {
    console.error('解析文本时出错:', error);
    result.parsed_success = false;
  }

  return result;
}

/**
 * 生成简化的诊断摘要
 * @param parsed 解析后的诊断结果
 * @returns 格式化的摘要文本
 */
export function generateDiagnosisSummary(parsed: ParsedDiagnosisResult): string {
  const parts = [];
  
  if (parsed.severity) {
    parts.push(`严重性: ${parsed.severity}`);
  }
  
  if (parsed.fault_type) {
    parts.push(`故障类型: ${parsed.fault_type}`);
  } else if (parsed.main_diagnosis) {
    parts.push(`诊断结果: ${parsed.main_diagnosis}`);
  }
  
  if (parsed.recommendations && parsed.recommendations.length > 0) {
    parts.push(`主要建议: ${parsed.recommendations.slice(0, 2).join(', ')}`);
  }
  
  return parts.join(' | ');
}

/**
 * 提取关键数值信息
 * @param rawText 原始文本
 * @returns 提取的数值信息
 */
export function extractKeyMetrics(rawText: string) {
  const metrics: { [key: string]: string | number } = {};
  
  // 提取等级信息
  const levelMatch = rawText.match(/等级[：:]\s*(\d+)\/(\d+)/);
  if (levelMatch) {
    metrics.severity_level = parseInt(levelMatch[1]);
    metrics.max_level = parseInt(levelMatch[2]);
  }
  
  // 提取时间信息
  const timeMatch = rawText.match(/诊断时间[：:]\s*([^\n]+)/);
  if (timeMatch) {
    metrics.diagnosis_time = timeMatch[1].trim();
  }
  
  // 提取设备ID
  const deviceMatch = rawText.match(/设备ID[：:]\s*([^\n]+)/);
  if (deviceMatch) {
    metrics.device_id = deviceMatch[1].trim();
  }
  
  return metrics;
}