// src/services/diagnosis.ts
import type { DiagnosisParams, DiagnosisResult } from '@/types';
import { parseN8nTextResponse, generateDiagnosisSummary, extractKeyMetrics } from '@/utils/textParser';

// 故障推理专用 n8n webhook URL
const N8N_WEBHOOK_URL = 'https://n8n.bd.kxsz.net:9443/webhook/power-fault-diagnosis-1';

/**
 * @description 调用n8n工作流执行故障诊断
 * @param data 包含气体浓度等参数的对象
 * @returns 返回一个包含API响应内容的Promise
 */
export async function runFaultDiagnosis(data: DiagnosisParams): Promise<any> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 将参数包裹在数组中，以匹配n8n webhook的期望格式
      body: JSON.stringify([data]),
    });

    if (!response.ok) {
      // 如果HTTP响应状态码不是2xx, 抛出错误
      const errorBody = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorBody}`);
    }

    // n8n 返回的是纯文本，不是 JSON
    const result = await response.text();
    
    // 解析文本响应
    const parsed = parseN8nTextResponse(result);
    
    console.log('📊 N8N API 原始响应:', result.substring(0, 200) + '...');
    console.log('📊 解析后的数据:', parsed);
    
    // 返回包含原始文本和解析数据的对象
    return {
      raw_text: result,
      parsed_data: parsed,
      summary: generateDiagnosisSummary(parsed),
      metrics: extractKeyMetrics(result),
      input_params: data
    };

  } catch (error) {
    console.error('Error calling the diagnosis API:', error);
    // 向上层抛出错误，以便UI层可以捕获并显示给用户
    throw error;
  }
}

/**
 * @description 调用n8n工作流执行故障诊断（原始版本，返回纯文本）
 * @param data 包含气体浓度等参数的对象
 * @returns 返回原始文本响应
 */
export async function runFaultDiagnosisRaw(data: DiagnosisParams): Promise<string> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([data]),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorBody}`);
    }

    return await response.text();

  } catch (error) {
    console.error('Error calling the diagnosis API:', error);
    throw error;
  }
}