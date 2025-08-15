<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { 
  ElCard, ElRow, ElCol, ElDescriptions, ElDescriptionsItem, ElTag, ElTimeline, 
  ElTimelineItem, ElButton, ElMessage, ElAlert, ElSelect, ElOption, ElRadioGroup, 
  ElRadio, ElForm, ElFormItem, ElInput, ElDivider, ElSpace, ElCollapse, ElCollapseItem,
  ElIcon
} from 'element-plus';
import type { SimplifiedDiagnosisResult, DiagnosisParams, FaultCategory, ParameterAcquisitionMethod, RawFinding, AggregatedFinding, FaultTreeNode } from '@/types';
import VueECharts from 'vue-echarts';
import { use } from 'echarts/core';
import { TreeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { 
  TitleComponent, TooltipComponent, LegendComponent, GridComponent 
} from 'echarts/components';
import { Warning, DataAnalysis, Document } from '@element-plus/icons-vue';

// 图标组件导出给模板使用
defineOptions({
  components: {
    Warning,
    DataAnalysis,
    Document
  }
})

// 导入故障树数据
import faultTreeHierarchyData from '../../../fault_tree_hierarchy.json';

// 注册ECharts组件
use([
  CanvasRenderer,
  TreeChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

// --- 状态管理 ---
const isLoading = ref(false); // 全局加载状态
const diagnosisError = ref<string | null>(null); // 诊断过程中的错误信息

// 故障参数输入区域状态 (简化，仅用于测试)
const selectedCategory = ref<FaultCategory>('gas_analysis'); 
const acquisitionMethod = ref<ParameterAcquisitionMethod>('manual'); 

// 手动输入参数的表单数据
const manualParams = reactive<DiagnosisParams>({
  H2_ppm: 0,
  CH4_ppm: 0,
  C2H6_ppm: 0,
  C2H4_ppm: 0,
  C2H2_ppm: 0,
  CO_ppm: 0,
  CO2_ppm: 0,
  prpd_feature: '',
  total_hydrocarbons_limit: 150,
  transformer_id: '测试变压器#001',
});

// 预设参数 (参考变电站逻辑推理0805.json的pinData)
const presetParams: DiagnosisParams = {
  H2_ppm: 20,
  CH4_ppm: 15,
  C2H6_ppm: 10,
  C2H4_ppm: 8,
  C2H2_ppm: 0.5,
  CO_ppm: 50,
  CO2_ppm: 100,
  prpd_feature: 'symmetric_wide',
  total_hydrocarbons_limit: 150,
  transformer_id: '预设测试变压器#001',
};

// 诊断结果和排查路径展示
const currentDiagnosisResult = ref<(SimplifiedDiagnosisResult & { highlighted_nodes: string[] }) | null>(null);
const faultTreeOption = ref({}); // ECharts 故障树图表配置

// --- 辅助数据 ---
const faultCategories = [
  { label: '油中溶解气体分析', value: 'gas_analysis' },
  { label: '局部放电类型诊断', value: 'pd_analysis' },
  { label: '设备受潮与绝缘老化', value: 'moisture_analysis', disabled: true },
];

// --- 方法 ---


// 应用预设参数
const applyPresetParams = () => {
  Object.assign(manualParams, presetParams);
  ElMessage.success('已应用预设参数。');
};

/**
 * 模拟诊断逻辑 (纯前端实现)
 * 根据输入参数和变电站逻辑推理0805.json的规则生成诊断结果
 * 同时返回高亮节点列表
 */
const simulateDiagnosis = async (params: DiagnosisParams): Promise<SimplifiedDiagnosisResult & { highlighted_nodes: string[] }> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟

  let overall_conclusion = '未检测到明显故障特征。';
  let severity: SimplifiedDiagnosisResult['severity'] = '正常';
  let severity_level = 0;
  const raw_findings: RawFinding[] = [];
  const aggregated_findings: AggregatedFinding[] = [];
  const expert_suggestion = '设备运行正常，请继续保持日常监测。';
  const highlighted_nodes: string[] = ['变压器故障检测']; // 根节点默认高亮

  // --- 模拟 n8n 的“计算诊断参数”节点中的逻辑 ---
  // 气体比值计算
  const ratioC2H2C2H4 = params.C2H4_ppm > 0 ? params.C2H2_ppm / params.C2H4_ppm : 0;
  const ratioCH4H2 = params.H2_ppm > 0 ? params.CH4_ppm / params.H2_ppm : 0;
  const ratioC2H4C2H6 = params.C2H6_ppm > 0 ? params.C2H4_ppm / params.C2H6_ppm : 0;

  // 杜瓦尔三角/五边形法 (简化模拟)
  let dpm_fault_code = 'N/A';
  if (params.CH4_ppm > 50 && params.C2H4_ppm < 10 && params.C2H2_ppm < 1) dpm_fault_code = 'T1';
  else if (params.C2H4_ppm > 50 && params.CH4_ppm > 10 && params.C2H2_ppm < 5) dpm_fault_code = 'T2';
  else if (params.C2H2_ppm > 10 && params.C2H4_ppm > 10) dpm_fault_code = 'D3';
  else if (params.H2_ppm > 50 && params.C2H2_ppm < 1) dpm_fault_code = 'D1';

  // 特征气体法 (简化模拟)
  let characteristic_gas_diagnosis = '';
  if (params.CO_ppm > 500 && params.CO2_ppm > 1000) characteristic_gas_diagnosis = '油纸过热';
  else if (params.C2H2_ppm > 100) characteristic_gas_diagnosis = '油中电弧';

  // --- 模拟 n8n 的 Switch 节点和 Set 节点逻辑 ---

  // 三比值法诊断
  let threeRatioDiagnosis = '无故障';
  const code1 = ratioC2H2C2H4 < 0.1 ? 0 : (ratioC2H2C2H4 < 1 ? 1 : (ratioC2H2C2H4 < 3 ? 2 : 3));
  const code2 = ratioCH4H2 < 0.1 ? 1 : (ratioCH4H2 < 1 ? 0 : 2); // CH4/H2编码特殊
  const code3 = ratioC2H4C2H6 < 1 ? 0 : (ratioC2H4C2H6 < 3 ? 1 : 2);
  const threeRatioCode = `${code1}${code2}${code3}`;

  const threeRatioMap: { [key: string]: string } = {
    '010': '低温过热（低于150℃）',
    '011': '低温过热（150-300℃）',
    '012': '中温过热（300-700℃）',
    '112': '高温过热（高于700℃）',
    '001': '局部放电（低能）',
    '002': '局部放电（高能）',
    '202': '火花放电（低能）',
    '303': '电弧放电（高能）',
    '212': '电弧放电+过热',
  };
  threeRatioDiagnosis = threeRatioMap[threeRatioCode] || `未知故障类型（编码: ${threeRatioCode}）`;

  if (threeRatioDiagnosis !== '无故障') {
    highlighted_nodes.push('气体特征', '三比值法'); // 高亮父节点
    // 尝试匹配三比值法下的具体诊断结果节点
    if (threeRatioDiagnosis.includes('低温过热')) highlighted_nodes.push('低温过热');
    else if (threeRatioDiagnosis.includes('中温过热')) highlighted_nodes.push('中温过热');
    else if (threeRatioDiagnosis.includes('高温过热')) highlighted_nodes.push('高温过热');
    else if (threeRatioDiagnosis.includes('局部放电')) highlighted_nodes.push('局部放电');
    else if (threeRatioDiagnosis.includes('火花放电')) highlighted_nodes.push('火花放电');
    else if (threeRatioDiagnosis.includes('电弧放电')) highlighted_nodes.push('电弧放电');

    raw_findings.push({
      method: '三比值法',
      fault_code: threeRatioCode,
      diagnosis: threeRatioDiagnosis,
      details: `比值: C2H2/C2H4=${ratioC2H2C2H4.toFixed(2)}, CH4/H2=${ratioCH4H2.toFixed(2)}, C2H4/C2H6=${ratioC2H4C2H6.toFixed(2)}`,
      recommendation: '请根据三比值法结果进行初步判断。',
    });
    overall_conclusion = '检测到潜在故障。';
    severity = '警告';
    severity_level = Math.max(severity_level, 2);
  }

  // DPM诊断分发
  if (dpm_fault_code !== 'N/A') {
    highlighted_nodes.push('气体特征', `三比值代码:0xx DPM位于T1、T2、T3区域`); // 匹配故障树中的DPM父节点
    let dpmDiagnosis = '';
    let dpmRecommendation = '';
    switch (dpm_fault_code) {
      case 'T1': dpmDiagnosis = '低温过热(<300°C)'; dpmRecommendation = '检查负载和散热系统'; highlighted_nodes.push('021或T2'); break; // 匹配具体DPM结果节点
      case 'T2': dpmDiagnosis = '中温过热(300-700°C)'; dpmRecommendation = '检查导线连接和绝缘状态'; highlighted_nodes.push('021或T2'); break;
      case 'T3': dpmDiagnosis = '高温过热(>700°C)'; dpmRecommendation = '立即检查铁芯和夹件'; highlighted_nodes.push('022或T3'); break;
      case 'D1': dpmDiagnosis = '局部放电(PD)'; dpmRecommendation = '检查绝缘系统和接地'; highlighted_nodes.push('油色谱特征-1XX或D1'); break;
      case 'D2': dpmDiagnosis = '低能电弧放电'; dpmRecommendation = '结合电气试验和放电定位技术排查'; highlighted_nodes.push('油色谱特征-2XX或D2'); break;
      case 'D3': dpmDiagnosis = '高能电弧放电'; dpmRecommendation = '立即停电并进行内部检查'; highlighted_nodes.push('油色谱特征-1XX或D1'); break;
      case 'DT': dpmDiagnosis = '放电兼过热(复合故障)'; dpmRecommendation = '综合分析放电和过热问题'; break;
    }
    raw_findings.push({
      method: '杜瓦尔五边形法',
      fault_code: dpm_fault_code,
      diagnosis: dpmDiagnosis,
      details: `DPM代码: ${dpm_fault_code}`,
      recommendation: dpmRecommendation,
    });
    overall_conclusion = '检测到潜在故障。';
    severity = '严重';
    severity_level = Math.max(severity_level, 3);
  }

  // 特征气体法诊断
  if (characteristic_gas_diagnosis) {
    highlighted_nodes.push('气体特征', '特征气体法', characteristic_gas_diagnosis); // 匹配父节点和结果节点
    raw_findings.push({
      method: '特征气体法',
      fault_code: 'N/A',
      diagnosis: characteristic_gas_diagnosis,
      details: `特征气体诊断结果: ${characteristic_gas_diagnosis}`,
      recommendation: '根据特征气体分析结果进行处理。',
    });
    overall_conclusion = '检测到特征气体异常。';
    severity = '危急';
    severity_level = Math.max(severity_level, 4);
  }

  // PRPD特征分析
  if (params.prpd_feature) {
    highlighted_nodes.push('放电特征', 'PRP相位分布'); // 匹配父节点
    let prpdDiagnosis = '';
    let prpdRecommendation = '';
    switch (params.prpd_feature) {
      case 'symmetric_wide': prpdDiagnosis = '绝缘放电'; prpdRecommendation = '检查固体绝缘完整性'; highlighted_nodes.push('局放特征-PRPD对称性强,多位于电压上升沿, 相位窗口相对较宽(约60°~90°); 超声波50Hz特征显著'); break;
      case 'symmetric_narrow': prpdDiagnosis = '悬浮放电'; prpdRecommendation = '检查金属连接松动'; highlighted_nodes.push('局放特征-PRPD对称分布,多位于90°、180°, 相位窗口相对较窄(约30°~45°); 超声波100Hz特征显著'); break;
      case 'single_pole': prpdDiagnosis = '尖端放电'; prpdRecommendation = '检查金属尖角、毛刺'; highlighted_nodes.push('局放特征-PRPD单极分布,多仅存于正半周或负半周'); break;
      case 'asymmetric_wide': prpdDiagnosis = '沿面放电'; prpdRecommendation = '检查绝缘表面污染、受潮'; highlighted_nodes.push('局放特征-PRPD不对称分布,相位窗口极宽(>100°),甚至跨半周连续分布'); break;
    }
    raw_findings.push({
      method: 'PRPD分析',
      fault_code: params.prpd_feature,
      diagnosis: prpdDiagnosis,
      details: `PRPD特征: ${params.prpd_feature}`,
      recommendation: prpdRecommendation,
    });
    overall_conclusion = '检测到放电特征。';
    severity = '严重';
    severity_level = Math.max(severity_level, 4);
  }

  // 聚合发现 (简化)
  if (raw_findings.length > 0) {
    aggregated_findings.push({
      diagnosis: overall_conclusion,
      evidence: raw_findings.map(f => f.diagnosis),
      recommendations: raw_findings.map(f => f.recommendation),
      severity_level: severity_level,
    });
  }

  return {
    transformer_id: params.transformer_id || '未知设备',
    timestamp: new Date().toISOString(),
    overall_conclusion,
    severity,
    severity_level,
    findings_count: raw_findings.length,
    aggregated_findings,
    raw_findings,
    expert_suggestion,
    highlighted_nodes, // 返回高亮节点列表
  };
};

/**
 * 模拟故障树路径高亮 (纯前端实现)
 * 根据诊断结果来高亮 fault_tree_hierarchy.json 中的路径
 */
const simulateFaultTreePath = (result: SimplifiedDiagnosisResult & { highlighted_nodes: string[] }) => {
  const treeData: FaultTreeNode[] = JSON.parse(JSON.stringify(faultTreeHierarchyData)); // 深拷贝，避免修改原始数据

  function traverseAndHighlight(node: FaultTreeNode) {
    // 检查当前节点是否需要高亮
    const shouldHighlightNode = result.highlighted_nodes.includes(node.name);

    if (shouldHighlightNode) {
      node.itemStyle = { color: '#e0620d' }; // 高亮颜色
      node.label = { show: true, color: '#e0620d', fontWeight: 'bold' };
      // ECharts 树图的连线样式通常在子节点上定义，表示从父节点到子节点的线
      node.lineStyle = { color: '#e0620d', width: 2 }; 
    } else {
      node.itemStyle = { color: '#999' }; // 默认颜色
      node.label = { show: true, color: '#999' };
      node.lineStyle = { color: '#ccc', width: 1 };
    }

    if (node.children) {
      node.children.forEach(traverseAndHighlight);
    }
  }

  treeData.forEach(traverseAndHighlight);

  faultTreeOption.value = {
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'tree',
        data: treeData,
        top: '1%',
        left: '7%',
        bottom: '1%',
        right: '20%',
        symbolSize: 7,
        initialTreeDepth: 2, // 初始展开深度，可以调整
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 9,
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        emphasis: {
          focus: 'descendant',
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
      },
    ],
  };
};

// 触发诊断流程
const triggerDiagnosis = async () => {
  isLoading.value = true;
  diagnosisError.value = null;
  currentDiagnosisResult.value = null;

  let paramsToUse: DiagnosisParams;

  if (acquisitionMethod.value === 'manual') {
    paramsToUse = manualParams;
  } else {
    // 模拟自动获取参数 (传感器数据)
    paramsToUse = {
      H2_ppm: 80,
      CH4_ppm: 60,
      C2H6_ppm: 30,
      C2H4_ppm: 40,
      C2H2_ppm: 5,
      CO_ppm: 200,
      CO2_ppm: 800,
      prpd_feature: 'symmetric_narrow',
      total_hydrocarbons_limit: 150,
      transformer_id: '传感器数据变压器#002',
    };
    ElMessage.info('已自动获取传感器参数。');
  }

  try {
    const result = await simulateDiagnosis(paramsToUse);
    currentDiagnosisResult.value = result;
    simulateFaultTreePath(result); // 更新故障树可视化
    ElMessage.success('诊断完成！');
  } catch (error) {
    diagnosisError.value = (error as Error).message || '诊断过程中发生未知错误。';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// API 测试相关状态
const apiTestLoading = ref(false)
const apiTestResult = ref<any>(null)
const apiTestError = ref<string | null>(null)
const activeApiCollapse = ref(['summary']) // 控制折叠面板展开状态
const showRawData = ref(false) // 控制是否显示原始数据
const testHistory = ref<any[]>([]) // 存储测试历史，用于对比

// 测试 N8N API
const testN8nAPI = async () => {
  apiTestLoading.value = true
  apiTestResult.value = null
  apiTestError.value = null
  
  const testData = [{
    H2_ppm: 150,
    CH4_ppm: 60,
    C2H6_ppm: 20,
    C2H4_ppm: 50,
    C2H2_ppm: 150,
    CO_ppm: 100,
    CO2_ppm: 400,
    total_hydrocarbons_limit: 150
  }]
  
  try {
    console.log('🔍 测试 n8n webhook API')
    console.log('📤 发送数据:', testData)
    
    const response = await fetch('http://3.27.250.156:5678/webhook/power-fault-diagnosis-1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📊 响应状态:', response.status)
    console.log('📊 响应头:', Object.fromEntries(response.headers.entries()))
    
    const rawData = await response.text()
    
    console.log('📥 原始响应数据:')
    console.log('类型:', typeof rawData)
    console.log('长度:', rawData.length)
    console.log('前200字符:', rawData.substring(0, 200))
    console.log('完整响应数据hash:', rawData.length > 0 ? rawData.substring(0, 100).replace(/\s+/g, '').length : 0)
    
    let parsedData = null
    try {
      parsedData = JSON.parse(rawData)
      console.log('✅ JSON 解析成功:', parsedData)
    } catch (e) {
      console.log('❌ 无法解析为 JSON - 这是纯文本响应')
    }
    
    const result = {
      status: response.status,
      dataType: typeof rawData,
      dataLength: rawData.length,
      rawData: rawData,
      parsedData: parsedData,
      timestamp: new Date().toLocaleString(),
      requestId: Date.now() // 简单的请求ID
    }
    
    apiTestResult.value = result
    
    // 保存到测试历史中，最多保存最近5次
    testHistory.value.unshift(result)
    if (testHistory.value.length > 5) {
      testHistory.value.pop()
    }
    
    // 如果有历史记录，对比内容差异
    if (testHistory.value.length > 1) {
      const current = testHistory.value[0]
      const previous = testHistory.value[1]
      const isIdentical = current.rawData === previous.rawData
      console.log(`🔄 内容对比: ${isIdentical ? '完全相同' : '有差异'}`)
      if (!isIdentical) {
        console.log('📊 当前长度:', current.dataLength)
        console.log('📊 上次长度:', previous.dataLength)
        console.log('📊 长度差异:', current.dataLength - previous.dataLength)
      }
    }
    
  } catch (err) {
    apiTestError.value = `API 调用失败: ${(err as Error).message}`
    console.error('❌ API 调用失败:', err)
  } finally {
    apiTestLoading.value = false
  }
}

// API 测试结果解析方法
const parseApiTestResult = (result: any) => {
  if (!result) return null
  
  try {
    // 如果返回的数据有解析后的结构
    if (result.parsed_data) {
      return {
        severity: result.parsed_data.severity || '未知',
        severity_level: result.parsed_data.severity_level || 0,
        fault_type: result.parsed_data.fault_type || '未检测到',
        main_diagnosis: result.parsed_data.main_diagnosis || '无明确诊断',
        recommendations: result.parsed_data.recommendations || [],
        summary: result.summary || '无摘要信息'
      }
    }
    
    // 如果是纯文本数据，尝试解析
    const rawText = result.rawData || result.raw_text || ''
    if (typeof rawText === 'string' && rawText.length > 100) {
      // 简单的文本解析
      const severityMatch = rawText.match(/总体严重性[：:]\s*([^，\n]+)/)
      const faultTypeMatch = rawText.match(/主要故障类型[：:]\s*([^，\n\(]+)/)
      
      return {
        severity: severityMatch ? severityMatch[1].trim() : '未知',
        severity_level: getSeverityLevel(severityMatch ? severityMatch[1].trim() : ''),
        fault_type: faultTypeMatch ? faultTypeMatch[1].trim() : '未检测到',
        main_diagnosis: '详见专家报告',
        recommendations: extractRecommendations(rawText),
        summary: '基于专家分析的诊断结果'
      }
    }
    
    return null
  } catch (error) {
    console.error('解析测试结果失败:', error)
    return null
  }
}

const getSeverityLevel = (severity: string): number => {
  const levelMap: { [key: string]: number } = {
    '正常': 1, '注意': 2, '警告': 3, '严重': 4, '危急': 5
  }
  return levelMap[severity] || 0
}

const extractRecommendations = (text: string): string[] => {
  console.log('🔍 提取推荐措施 - 文本长度:', text.length)
  console.log('🔍 文本前500字符:', text.substring(0, 500))
  
  const recommendations: string[] = []
  
  // 更详细的关键词匹配，增加调试信息
  const keywordChecks = [
    { keywords: ['立即停运', '停运', '解列'], action: '立即停运与隔离' },
    { keywords: ['安全警示', '封锁', '警戒', '区域'], action: '安全区域封锁' },
    { keywords: ['接地保护', '接地', '放电'], action: '接地保护' },
    { keywords: ['消防', '灭火', '火灾'], action: '消防准备' },
    { keywords: ['人员防护', '防护用品', '安全帽', '绝缘'], action: '人员防护' },
    { keywords: ['DGA', '气体分析', '油样'], action: '重复DGA检测' },
    { keywords: ['局部放电', 'PD', '放电测试'], action: '局部放电测试' },
    { keywords: ['内部检查', '吊罩', '检修'], action: '设备内部检查' }
  ]
  
  keywordChecks.forEach(check => {
    const found = check.keywords.some(keyword => text.includes(keyword))
    if (found) {
      recommendations.push(check.action)
      console.log(`✅ 找到关键词: ${check.keywords.join('|')} -> ${check.action}`)
    } else {
      console.log(`❌ 未找到关键词: ${check.keywords.join('|')}`)
    }
  })
  
  console.log('📋 最终提取的推荐措施:', recommendations)
  return recommendations.length > 0 ? recommendations : ['请查看详细报告']
}

const getSeverityTagType = (severity: string) => {
  switch (severity) {
    case '危急': return 'danger'
    case '严重': return 'danger'  
    case '警告': return 'warning'
    case '注意': return 'info'
    case '正常': return 'success'
    default: return 'info'
  }
}

// 计算属性 - 解析后的测试结果
const parsedTestResult = computed(() => {
  return parseApiTestResult(apiTestResult.value)
})

// 页面加载时，执行一次默认诊断
onMounted(() => {
  triggerDiagnosis();
});

</script>

<template>
  <div class="test-page" v-loading="isLoading">
    <!-- N8N API 测试区域 -->
    <ElCard style="margin-bottom: 20px;">
      <template #header>
        <div class="card-header">
          <span>N8N API 测试</span>
        </div>
      </template>
      
      <ElSpace direction="vertical" size="large" style="width: 100%">
        <ElButton type="primary" @click="testN8nAPI" :loading="apiTestLoading">
          测试 N8N 接口
        </ElButton>
        
        <ElDivider />
        
        <div v-if="apiTestResult">
          <!-- 基本响应信息 -->
          <ElAlert 
            :title="`API 响应: ${apiTestResult.status} | 数据长度: ${apiTestResult.dataLength} 字符`"
            :type="apiTestResult.status === 200 ? 'success' : 'error'"
            show-icon 
            style="margin-bottom: 16px;"
          />
          
          <!-- 解析后的紧凑展示 -->
          <div v-if="parsedTestResult" class="compact-diagnosis-result">
            <!-- 状态栏 -->
            <div class="status-bar">
              <ElTag 
                :type="getSeverityTagType(parsedTestResult.severity)" 
                size="large"
                effect="dark"
              >
                🚨 {{ parsedTestResult.severity }} 
                ({{ parsedTestResult.severity_level }}/5)
              </ElTag>
              <span class="fault-type">
                <ElIcon style="margin-right: 4px;"><Warning /></ElIcon>
                {{ parsedTestResult.fault_type }}
              </span>
            </div>
            
            <!-- 核心信息 -->
            <div class="core-info">
              <div class="info-item">
                <ElIcon style="margin-right: 8px; color: #409eff;"><DataAnalysis /></ElIcon>
                <span><strong>主要诊断:</strong> {{ parsedTestResult.main_diagnosis }}</span>
              </div>
              <div class="info-item">
                <ElIcon style="margin-right: 8px; color: #67c23a;"><Document /></ElIcon>
                <span><strong>诊断摘要:</strong> {{ parsedTestResult.summary }}</span>
              </div>
            </div>
            
            <!-- 可折叠详细信息 -->
            <ElCollapse v-model="activeApiCollapse" style="margin-top: 16px;">
              <ElCollapseItem title="🚨 推荐措施" name="recommendations">
                <ul class="recommendation-list" v-if="parsedTestResult.recommendations.length">
                  <li v-for="(rec, index) in parsedTestResult.recommendations" :key="index">
                    {{ rec }}
                  </li>
                </ul>
                <ElAlert v-else title="暂无特定推荐措施" type="info" show-icon />
              </ElCollapseItem>
              
              <ElCollapseItem title="🔄 测试历史对比" name="history" v-if="testHistory.length > 1">
                <div style="margin-bottom: 12px;">
                  <ElAlert title="显示最近几次测试的推荐措施对比" type="info" show-icon />
                </div>
                <div v-for="(historyItem, index) in testHistory.slice(0, 3)" :key="historyItem.requestId" 
                     style="margin-bottom: 16px; padding: 12px; border: 1px solid #e4e7ed; border-radius: 6px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>{{ index === 0 ? '当前' : `第${index + 1}次` }} ({{ historyItem.timestamp }})</strong>
                    <span style="font-size: 12px; color: #999;">长度: {{ historyItem.dataLength }}</span>
                  </div>
                  <div v-if="parseApiTestResult(historyItem)">
                    <strong>推荐措施:</strong>
                    <ul class="recommendation-list">
                      <li v-for="rec in parseApiTestResult(historyItem)?.recommendations || []" :key="rec">{{ rec }}</li>
                    </ul>
                  </div>
                  <div v-else>
                    <ElAlert title="无法解析此次的推荐措施" type="warning" size="small" />
                  </div>
                </div>
              </ElCollapseItem>
              
              <ElCollapseItem title="📋 原始数据" name="rawdata">
                <div style="margin-bottom: 12px;">
                  <ElButton @click="showRawData = !showRawData" size="small" type="info">
                    {{ showRawData ? '隐藏' : '显示' }}完整原始数据
                  </ElButton>
                </div>
                
                <div v-if="showRawData">
                  <h5>响应详情:</h5>
                  <ul style="font-size: 12px; color: #666; margin-bottom: 12px;">
                    <li>数据类型: {{ apiTestResult.dataType }}</li>
                    <li>数据长度: {{ apiTestResult.dataLength }} 字符</li>
                    <li>是否为JSON: {{ apiTestResult.parsedData ? '是' : '否' }}</li>
                  </ul>
                  
                  <div v-if="apiTestResult.parsedData">
                    <h5>JSON 数据:</h5>
                    <pre class="json-display">{{ JSON.stringify(apiTestResult.parsedData, null, 2) }}</pre>
                  </div>
                  
                  <h5>原始文本内容:</h5>
                  <ElInput
                    type="textarea"
                    :model-value="apiTestResult.rawData"
                    :rows="10"
                    readonly
                    style="font-family: 'Courier New', monospace; font-size: 12px;"
                  />
                </div>
              </ElCollapseItem>
            </ElCollapse>
          </div>
          
          <!-- 如果无法解析，显示原始数据 -->
          <div v-else>
            <ElAlert title="无法解析诊断数据，显示原始响应" type="warning" show-icon style="margin-bottom: 16px;" />
            
            <ElDivider />
            
            <div v-if="apiTestResult.parsedData">
              <h4>JSON 数据:</h4>
              <pre class="json-display">{{ JSON.stringify(apiTestResult.parsedData, null, 2) }}</pre>
            </div>
            
            <h4>原始响应内容:</h4>
            <ElInput
              type="textarea"
              :model-value="apiTestResult.rawData"
              :rows="15"
              readonly
              style="font-family: 'Courier New', monospace; font-size: 12px;"
            />
          </div>
        </div>
        
        <div v-if="apiTestError">
          <ElAlert :title="apiTestError" type="error" show-icon />
        </div>
      </ElSpace>
    </ElCard>

    <ElRow :gutter="20">
      <!-- 故障参数输入区域 -->
      <ElCol :span="8">
        <ElCard class="box-card input-card">
          <template #header><div class="card-header"><span>故障参数输入 (Test Page)</span></div></template>
          <ElForm label-width="120px">
            <ElFormItem label="故障分类">
              <ElSelect v-model="selectedCategory" placeholder="请选择故障分类">
                <ElOption
                  v-for="item in faultCategories"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :disabled="item.disabled"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="参数获取方式">
              <ElRadioGroup v-model="acquisitionMethod">
                <ElRadio label="manual">手动输入参数</ElRadio>
                <ElRadio label="automatic">自动获取参数</ElRadio>
              </ElRadioGroup>
            </ElFormItem>

            <ElDivider content-position="left">参数详情</ElDivider>

            <div v-if="acquisitionMethod === 'manual'">
              <ElForm :model="manualParams" label-width="120px">
                <ElFormItem label="设备ID">
                  <ElInput v-model="manualParams.transformer_id"></ElInput>
                </ElFormItem>
                <ElFormItem label="H2 (ppm)">
                  <ElInput v-model.number="manualParams.H2_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="CH4 (ppm)">
                  <ElInput v-model.number="manualParams.CH4_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="C2H6 (ppm)">
                  <ElInput v-model.number="manualParams.C2H6_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="C2H4 (ppm)">
                  <ElInput v-model.number="manualParams.C2H4_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="C2H2 (ppm)">
                  <ElInput v-model.number="manualParams.C2H2_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="CO (ppm)">
                  <ElInput v-model.number="manualParams.CO_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="CO2 (ppm)">
                  <ElInput v-model.number="manualParams.CO2_ppm" type="number"></ElInput>
                </ElFormItem>
                <ElFormItem label="PRPD 特征">
                  <ElInput v-model="manualParams.prpd_feature" placeholder="例如: symmetric_wide"></ElInput>
                </ElFormItem>
                <ElFormItem>
                  <ElButton type="info" @click="applyPresetParams">应用预设参数</ElButton>
                </ElFormItem>
              </ElForm>
            </div>
            <div v-else>
              <p>将通过模拟传感器数据自动获取参数。</p>
              <!-- 实际中这里可能显示传感器连接状态或最近数据 -->
            </div>

            <ElButton type="primary" @click="triggerDiagnosis" style="width: 100%; margin-top: 20px;">开始诊断</ElButton>
          </ElForm>
        </ElCard>
      </ElCol>

      <!-- 故障排查路径展示区域 -->
      <ElCol :span="8">
        <ElCard class="box-card path-display-card">
          <template #header><div class="card-header"><span>故障排查路径展示</span></div></template>
          <div v-if="faultTreeOption && Object.keys(faultTreeOption).length > 0" class="echarts-container">
            <VueECharts :option="faultTreeOption" autoresize />
          </div>
          <ElAlert v-else title="暂无排查路径可显示" type="info" center show-icon :closable="false" />
        </ElCard>
      </ElCol>

      <!-- 故障结果显示区域 -->
      <ElCol :span="8">
        <ElCard class="box-card result-display-card">
          <template #header><div class="card-header"><span>故障结果显示</span></div></template>
          <div v-if="currentDiagnosisResult">
            <ElDescriptions :column="1" border style="margin-bottom: 20px;">
              <ElDescriptionsItem label="设备ID">{{ currentDiagnosisResult.transformer_id }}</ElDescriptionsItem>
              <ElDescriptionsItem label="诊断时间">{{ currentDiagnosisResult.timestamp ? new Date(currentDiagnosisResult.timestamp).toLocaleString() : '未知时间' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="总体严重性">
                <ElTag :type="getSeverityTagType(currentDiagnosisResult.severity || '正常')">{{ currentDiagnosisResult.severity || '正常' }} ({{ currentDiagnosisResult.severity_level || 0 }}/5)</ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="核心结论">{{ currentDiagnosisResult.overall_conclusion }}</ElDescriptionsItem>
              <ElDescriptionsItem label="专家建议">{{ currentDiagnosisResult.expert_suggestion }}</ElDescriptionsItem>
            </ElDescriptions>

            <ElDivider content-position="left">详细发现</ElDivider>
            <ElTimeline v-if="currentDiagnosisResult.raw_findings && currentDiagnosisResult.raw_findings.length">
              <ElTimelineItem
                v-for="(finding, index) in currentDiagnosisResult.raw_findings"
                :key="index"
                :timestamp="`方法: ${finding.method}`"
                placement="top"
              >
                <ElCard>
                  <h4>{{ finding.diagnosis }}</h4>
                  <p><b>详情:</b> {{ finding.details }}</p>
                  <p><b>建议:</b> {{ finding.recommendation }}</p>
                  <p v-if="finding.fault_code && finding.fault_code !== 'N/A'"><b>故障代码:</b> {{ finding.fault_code }}</p>
                </ElCard>
              </ElTimelineItem>
            </ElTimeline>
            <p v-else>暂无详细诊断发现。</p>

          </div>
          <ElAlert v-else title="暂无诊断结果" type="info" center show-icon :closable="false" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElAlert v-if="diagnosisError" :title="diagnosisError" type="error" show-icon :closable="false" style="margin-top: 20px;" />

  </div>
</template>

<style scoped>
.test-page {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.box-card {
  min-height: 300px; /* 确保卡片有一定高度 */
}
.input-card .el-form-item {
  margin-bottom: 18px;
}
.echarts-container {
  height: 500px; /* 为ECharts图表设置固定高度 */
  width: 100%;
}

/* 紧凑式诊断结果展示样式 */
.compact-diagnosis-result {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.fault-type {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.core-info {
  padding: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item span {
  flex: 1;
}

.recommendation-list {
  margin: 0;
  padding-left: 20px;
  list-style-type: none;
}

.recommendation-list li {
  position: relative;
  margin-bottom: 8px;
  padding-left: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.recommendation-list li:before {
  content: '🔸';
  position: absolute;
  left: 0;
  color: #409eff;
}

.json-display {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  font-family: 'Courier New', Monaco, monospace;
}

/* 折叠面板样式优化 */
:deep(.el-collapse-item__header) {
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-collapse-item__content) {
  padding: 16px;
  background: #fafbfc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .status-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>