// src/services/mockApi.v2.ts
import * as XLSX from 'xlsx'

/**
 * =================================================================
 * API v2.1: 统一的模拟数据服务
 * - 包含文档管理功能和预置数据，确保向后兼容
 * - 实现基于多参数规则的智能诊断逻辑
 * - 内置诊断知识库
 * =================================================================
 */

// --- 类型定义 ---
export interface FaultModel {
  id: string;
  name: string;
  description: string;
  disabled?: boolean;
}

export interface DiagnosisParams {
  H2_ppm: number;
  CH4_ppm: number;
  C2H6_ppm: number;
  C2H4_ppm: number;
  C2H2_ppm: number;
  CO_ppm: number;
  CO2_ppm: number;
  dpm_result: 'T1' | 'T2' | 'T3' | 'D1' | 'D2' | 'DP';
  prpd_feature: 'symmetric_wide' | 'symmetric_narrow' | 'single_pole' | 'asymmetric_wide';
}

export interface DiagnosisResult {
  fault_type: string;
  diagnosis: string;
  recommendation: string;
  confidence: number;
  path: string[];
  three_ratio_code?: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  uploadTime: Date;
  type: string;
  content?: string | XLSX.WorkBook | ArrayBuffer;
  faultTree?: any;
}

// --- 诊断知识库 ---
const diagnosisKnowledgeBase = {
  'oil_paper_overheat': { fault_type: '油纸混合绝缘过热', diagnosis: 'CO、CO2 含量显著增高，总烃中甲烷、乙烯占主要成分，表明故障涉及固体绝缘材料，且温度较高。', recommendation: '应缩短试验周期，密切监视，必要时安排停电检查。' },
  'low_temp_overheat': { fault_type: '低温过热 (<300°C)', diagnosis: '通常由铁芯局部过热、接触不良等引起。特征气体以CH₄和C₂H₆为主。', recommendation: '加强监测，短期内安排停机检查。' },
  'mid_temp_overheat': { fault_type: '中温过热 (300-700°C)', diagnosis: '可能由接头松动、涡流损耗过大导致。C₂H₄含量增加，开始超过CH₄。', recommendation: '建议排查线圈导线焊接缺陷、引线绝缘破损等问题。' },
  'high_temp_overheat': { fault_type: '高温过热 (>700°C)', diagnosis: '严重过热故障，C₂H₄成为主要特征气体。', recommendation: '建议排查铁芯及夹件环流、导线焊接缺陷、引线连接缺陷等。' },
  'spark_discharge': { fault_type: '火花放电', diagnosis: '能量较高的局部放电，C₂H₂含量中等（5%-30%），无明显过热特征。', recommendation: '建议检查铁心接地线与端子盒连接、压板等电位连接松动等情况。' },
  'arc_discharge': { fault_type: '高能放电 (电弧)', diagnosis: '严重的电弧放电故障，C₂H₂含量极高（>30%）。', recommendation: '立即停机检查，进行详细的内部探伤和油样化验。' },
  'insulation_discharge': { fault_type: '绝缘放电', diagnosis: 'PRPD对称性强，相位窗口相对较宽（约 60°~90°）。', recommendation: '建议检查铁芯夹件绝缘降低、压板绝缘缺陷、绝缘中杂质侵入等情况。' },
  'floating_discharge': { fault_type: '悬浮放电', diagnosis: 'PRPD对称分布，相位窗口相对较窄（约 30°~45°）。', recommendation: '建议检查等电位的金属导线松动、脱落、断裂，金属异物附着线圈等情况。' },
  'tip_discharge': { fault_type: '尖端放电', diagnosis: 'PRPD单极分布，多仅存于正半周或负半周。', recommendation: '建议检查放电部位金属加工粗糙、安装缺陷等造成的局部形成尖角、毛刺等情况。' },
  'surface_discharge': { fault_type: '沿面放电', diagnosis: 'PRPD不对称分布，相位窗口极宽（>100°）。', recommendation: '建议检查绝缘表面污染、受潮、表面绝缘老化等情况。' },
  'default_case': { fault_type: '未识别故障', diagnosis: '当前参数组合未匹配到明确的故障类型。', recommendation: '建议进行全面检查或咨询专家。' }
};

// --- 模拟数据存储 ---
const transformerFaultTreeData = {
  "name": "变压器故障检测",
  "level": "根节点",
  "children": [
    {
      "name": "气体特征",
      "level": "一级节点",
      "children": [
        {
          "name": "特征气体法",
          "level": "二级节点",
          "children": [
            {
              "name": "CH4、C2H6量著升高",
              "level": "三级节点",
              "children": [
                {
                  "name": "C2H4较C2H6稍高或接近",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "油中、低温下300℃",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                },
                {
                  "name": "C2H4显著升高",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "油中高、中温过热，温度高于700℃",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                }
              ]
            },
            {
              "name": "CH4、C2H4、CO、CO2较多",
              "level": "三级节点",
              "children": [
                {
                  "name": "固体绝缘",
                  "level": "四级节点",
                  "children": []
                }
              ]
            },
            {
              "name": "H2、CH4量著升高",
              "level": "三级节点",
              "children": [
                {
                  "name": "无CO产生，有C2H4产生",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "油中局部放电",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                },
                {
                  "name": "有CO产生，几乎无C2H4产生",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "固体绝缘中局部放电",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                }
              ]
            },
            {
              "name": "H2、C2H2量著升高，总烃不高",
              "level": "三级节点",
              "children": [
                {
                  "name": "油中火花放电",
                  "level": "四级节点",
                  "children": []
                }
              ]
            },
            {
              "name": "H2、C2H2、C2H4量著升高",
              "level": "三级节点",
              "children": [
                {
                  "name": "CO较多时伴随",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "高能量电弧",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                },
                {
                  "name": "CO较少或者没有",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "进出线故障",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "name": "三比值法",
          "level": "二级节点",
          "children": [
            {
              "name": "第一位C2H2/C2H4：0",
              "level": "三级节点",
              "children": [
                {
                  "name": "第三位C2H4/C2H6：0",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "第二位C4H4/H2：0",
                      "level": "五级节点",
                      "children": [
                        {
                          "name": "低能放电(低于150℃)",
                          "level": "六级节点",
                          "children": []
                        }
                      ]
                    },
                    {
                      "name": "第二位C4H4/H2：1",
                      "level": "五级节点",
                      "children": [
                        {
                          "name": "局部放电",
                          "level": "六级节点",
                          "children": []
                        }
                      ]
                    },
                    {
                      "name": "第二位C4H4/H2：2",
                      "level": "五级节点",
                      "children": [
                        {
                          "name": "低温过热(150℃-300℃)",
                          "level": "六级节点",
                          "children": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "name": "第三位C2H4/C2H6：1",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "第二位C4H4/H2：2",
                      "level": "五级节点",
                      "children": [
                        {
                          "name": "中温过热(300℃-700℃)",
                          "level": "六级节点",
                          "children": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "name": "第三位C2H4/C2H6：2",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "高温过热(高于700℃)",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                }
              ]
            },
            {
              "name": "第一位C2H2/C2H4：1",
              "level": "三级节点",
              "children": [
                {
                  "name": "第三位C4H4/H2：0,1",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "火花放电",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                },
                {
                  "name": "第三位C4H4/H2：2",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "火花放电兼过热",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                }
              ]
            },
            {
              "name": "第一位C2H2/C2H4：2",
              "level": "三级节点",
              "children": [
                {
                  "name": "第二位C4H4/H2：0,1",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "电弧放电",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                },
                {
                  "name": "第二位C4H4/H2：2",
                  "level": "四级节点",
                  "children": [
                    {
                      "name": "电弧放电兼过热",
                      "level": "五级节点",
                      "children": []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "放电特征",
      "level": "一级节点",
      "children": [
        {
          "name": "脉冲间隔性",
          "level": "二级节点",
          "children": [
            {
              "name": "PRP分布",
              "level": "三级节点",
              "children": [
                {
                  "name": "高含内部放电，高空气比",
                  "level": "四级节点",
                  "children": []
                }
              ]
            },
            {
              "name": "早期分布",
              "level": "三级节点",
              "children": [
                {
                  "name": "综合放电，小局部放电",
                  "level": "四级节点",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "name": "PRP相位分布",
          "level": "二级节点",
          "children": [
            {
              "name": "45°~135°，225°~315°，恒定频率下（内）60°~90°）",
              "level": "三级节点",
              "children": [
                {
                  "name": "空地内部放电",
                  "level": "四级节点",
                  "children": []
                }
              ]
            },
            {
              "name": "90°~120°，240°~300°，梯形常数下（内）30°~45°）",
              "level": "三级节点",
              "children": [
                {
                  "name": "绝缘放置",
                  "level": "四级节点",
                  "children": []
                }
              ]
            },
            {
              "name": "正弦波主要害低电位0°~90°，恒定频率下（30°~60°），东点常量中心的个180°~270°，他们常量内部要点（>150°）且分布管呈均性",
              "level": "三级节点",
              "children": [
                {
                  "name": "悬浮放置",
                  "level": "四级节点",
                  "children": []
                }
              ]
            },
            {
              "name": "注：角平均分，占整体（平毫放电发生事点），两们常量内部点要（>100°）且内容管呈层性",
              "level": "三级节点",
              "children": [
                {
                  "name": "边界放置",
                  "level": "四级节点",
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const defaultFaultTreeData = transformerFaultTreeData;

const availableModels: FaultModel[] = [
  { id: 'gas_analysis', name: '油中溶解气体诊断模型', description: '基于DGA数据进行变压器内部过热和放电性故障诊断。' },
  { id: 'pd_analysis', name: '局部放电类型诊断模型', description: '根据PRPD图谱特征识别局部放电的具体类型。' },
  { id: 'moisture_analysis', name: '设备受潮与绝缘老化模型', description: '（暂未开放）', disabled: true },
];

// !!关键恢复: 保证文档列表数据不丢失!!
const documents: DocumentInfo[] = [
    { id: '1', name: '变电站逻辑推理0801.json', size: 15420, uploadTime: new Date('2024-01-01'), type: 'json' },
    { id: '2', name: 'transformer_fault_detection_json.json', size: 8340, uploadTime: new Date('2024-01-02'), type: 'json', faultTree: transformerFaultTreeData },
    { id: '3', name: 'tree.xlsx', size: 8750, uploadTime: new Date('2024-01-03'), type: 'xlsx' }
];

// --- 模拟API实现 ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- v2 API ---
export const mockApiV2 = {
  async getAvailableFaultModels(): Promise<FaultModel[]> {
    await sleep(300);
    return availableModels;
  },

  async getFaultTreeById(modelId: string): Promise<any> {
    await sleep(500);
    if (modelId === 'gas_analysis') return defaultFaultTreeData;
    if (modelId === 'pd_analysis') return { name: '局部放电分析总树', children: [{ name: '尖端放电' }, { name: '沿面放电' }, { name: '绝缘放电' }, { name: '悬浮放电' }] };
    throw new Error('Invalid model ID');
  },

  async diagnose(modelId: string, params: DiagnosisParams): Promise<DiagnosisResult> {
    await sleep(1000);

    let resultKey = 'default_case';
    let path: string[] = [];

    if (modelId === 'gas_analysis') {
      if (params.CO_ppm > 80 && params.C2H4_ppm > 80 && params.CH4_ppm > 80) {
        resultKey = 'oil_paper_overheat';
        path = ['过热故障', '中温过热'];
      } else if (params.C2H2_ppm > 30) {
        resultKey = 'arc_discharge';
        path = ['放电故障', '高能放电'];
      } else if (params.C2H2_ppm > 5) {
        resultKey = 'spark_discharge';
        path = ['放电故障', '火花放电'];
      } else if (params.C2H4_ppm > 150) {
        resultKey = 'high_temp_overheat';
        path = ['过热故障', '高温过热'];
      } else if (params.C2H4_ppm > 50) {
        resultKey = 'mid_temp_overheat';
        path = ['过热故障', '中温过热'];
      } else if (params.CH4_ppm > 50) {
        resultKey = 'low_temp_overheat';
        path = ['过热故障', '低温过热'];
      }
    } else if (modelId === 'pd_analysis') {
      resultKey = params.prpd_feature;
      path = [diagnosisKnowledgeBase[resultKey as keyof typeof diagnosisKnowledgeBase]?.fault_type || '放电故障'];
    }

    const resultEntry = diagnosisKnowledgeBase[resultKey as keyof typeof diagnosisKnowledgeBase];
    return {
      ...resultEntry,
      confidence: Math.random() * 0.15 + 0.8,
      path: path,
      three_ratio_code: '012',
    };
  }
};

// --- v1 (Legacy) API for backward compatibility ---
const legacyApi = {
  async getDocuments(): Promise<DocumentInfo[]> {
    await sleep(300);
    return [...documents];
  },
  async getDocument(id: string): Promise<DocumentInfo | null> {
    await sleep(200);
    const doc = documents.find(d => d.id === id);
    return doc ? { ...doc } : null;
  },
  async uploadDocument(file: File): Promise<DocumentInfo> {
    await sleep(500);
    const newDoc: DocumentInfo = { id: Date.now().toString(), name: file.name, size: file.size, uploadTime: new Date(), type: file.name.split('.').pop() || '' };
    documents.unshift(newDoc);
    return newDoc;
  },
  async deleteDocument(id: string): Promise<boolean> {
    await sleep(200);
    const index = documents.findIndex(d => d.id === id);
    if (index > -1) {
      documents.splice(index, 1);
      return true;
    }
    return false;
  },
  async getFaultTree(documentId: string): Promise<any> {
    await sleep(400);
    const doc = documents.find(d => d.id === documentId);
    return doc?.faultTree || defaultFaultTreeData;
  },
  async getDefaultFaultTree(): Promise<any> {
    return Promise.resolve(defaultFaultTreeData);
  },
};

export const mockApi = legacyApi;

export const getDiagnosisResult = mockApiV2.diagnose;