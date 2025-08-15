<template>
  <div class="test1-view">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <h1>逻辑门故障树测试页面</h1>
      <p style="color: #606266; margin-top: 8px">
        测试基于n8n workflow的逻辑门故障树可视化功能
      </p>
    </el-card>

    <!-- 顶部控制面板 -->
    <el-card class="control-panel-top" style="margin-top: 20px;">
      <el-row :gutter="20" align="middle">
        <!-- 数据源选择 -->
        <el-col :span="6">
          <div class="control-item">
            <h4>数据源</h4>
            <el-radio-group v-model="dataSource" @change="handleDataSourceChange" size="small">
              <el-radio-button value="workflow">Workflow JSON</el-radio-button>
              <el-radio-button value="sample">示例数据</el-radio-button>
            </el-radio-group>
          </div>
        </el-col>

        <!-- 文件上传或示例选择 -->
        <el-col :span="10">
          <!-- Workflow文件上传 -->
          <div v-if="dataSource === 'workflow'" class="control-item">
            <h4>上传Workflow文件</h4>
            <div style="display: flex; gap: 8px; align-items: center;">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :show-file-list="false"
                accept=".json"
                :on-change="handleFileChange"
                :before-upload="beforeUpload"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>
                  选择JSON文件
                </el-button>
              </el-upload>
              
              <el-button 
                v-if="selectedFile" 
                type="success" 
                size="small" 
                @click="parseWorkflowFile"
                :loading="parsing"
              >
                解析Workflow
              </el-button>
              
              <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
            </div>
          </div>

          <!-- 示例数据选择 -->
          <div v-if="dataSource === 'sample'" class="control-item">
            <h4>示例数据</h4>
            <el-select v-model="selectedSample" @change="loadSampleData" style="width: 300px;" size="small">
              <el-option
                v-for="sample in sampleOptions"
                :key="sample.value"
                :label="sample.label"
                :value="sample.value"
              />
            </el-select>
          </div>
        </el-col>

        <!-- 逻辑门状态显示 -->
        <el-col :span="8">
          <div v-if="logicGates.length > 0" class="control-item">
            <h4>逻辑门状态 ({{ logicGates.length }}个)</h4>
            <div class="logic-gates-status-horizontal">
              <el-tooltip 
                v-for="gate in logicGates.slice(0, 5)" 
                :key="gate.id"
                :content="`${gate.name}: ${gate.condition || '无条件'}`"
                placement="bottom"
              >
                <div class="gate-status-item-small">
                  <LogicGateIcon
                    :gate-type="gate.gate_type"
                    :state="gate.state"
                    size="small"
                    :interactive="false"
                  />
                </div>
              </el-tooltip>
              <span v-if="logicGates.length > 5" class="more-gates">+{{ logicGates.length - 5 }}个</span>
            </div>
          </div>
          <div v-else class="control-item">
            <h4>系统状态</h4>
            <el-tag type="info" size="small">{{ hasValidData ? '数据已加载' : '等待加载数据' }}</el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 故障树全屏显示区域 -->
    <el-card class="tree-display-full" style="margin-top: 20px; height: calc(100vh - 250px);">
      <template #header>
        <div class="tree-header">
          <span>逻辑门故障树预览</span>
          <div class="header-actions">
            <el-tag v-if="parsedWorkflow" type="success">
              {{ parsedWorkflow.logic_gates.length }} 个逻辑门
            </el-tag>
            <el-tag v-if="parsedWorkflow" type="info" style="margin-left: 8px">
              {{ parsedWorkflow.nodes.length }} 个节点
            </el-tag>
          </div>
        </div>
      </template>

      <!-- 故障树组件 -->
      <EnhancedFaultTree
        v-if="hasValidData"
        ref="faultTreeRef"
        :workflow-data="workflowData"
        :fault-tree-data="faultTreeData"
        @node-click="handleNodeClick"
        @diagnosis-complete="handleDiagnosisComplete"
      />

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty 
          description="请选择数据源并加载数据"
          :image-size="120"
        >
          <el-button type="primary" @click="loadDefaultSample">
            加载默认示例
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <!-- 诊断结果弹窗 -->
    <el-dialog
      v-model="showResultDialog"
      title="诊断结果"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="diagnosisResult" class="diagnosis-result">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="总体结论">
            <el-tag :type="getResultTagType(diagnosisResult.conclusion)">
              {{ diagnosisResult.conclusion }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="置信度">
            {{ (diagnosisResult.confidence * 100).toFixed(1) }}%
          </el-descriptions-item>
          <el-descriptions-item label="诊断路径" :span="2">
            <div class="diagnosis-path">
              <el-tag 
                v-for="(step, index) in diagnosisResult.path" 
                :key="index"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px;"
              >
                {{ step }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="reasoning-process" style="margin-top: 20px;">
          <h4>推理过程</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(step, index) in diagnosisResult.steps"
              :key="index"
              :type="step.result ? 'success' : 'danger'"
            >
              <div class="timeline-content">
                <div class="step-title">
                  <strong>{{ step.gateName }}</strong>
                  <el-tag size="small" :type="step.result ? 'success' : 'danger'">
                    {{ step.result ? '真' : '假' }}
                  </el-tag>
                </div>
                <div class="step-condition">条件: {{ step.condition }}</div>
                <div class="step-reasoning">推理: {{ step.reasoning }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showResultDialog = false">关闭</el-button>
          <el-button type="primary" @click="exportResult">导出结果</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import EnhancedFaultTree from '@/components/logic/EnhancedFaultTree.vue'
import LogicGateIcon from '@/components/logic/LogicGateIcon.vue'
import { createWorkflowParser } from '@/services/workflowParser'
import type { 
  EnhancedFaultTreeNode, 
  ParsedWorkflow, 
  DiagnosisParams,
  LogicGateNode
} from '@/types'

// 响应式数据
const dataSource = ref<'workflow' | 'sample'>('sample')
const selectedFile = ref<File | null>(null)
const selectedSample = ref('basic')
const parsing = ref(false)
const diagnosisRunning = ref(false)
const showResultDialog = ref(false)

const workflowData = ref<any>(null)
const faultTreeData = ref<EnhancedFaultTreeNode | undefined>(undefined)
const parsedWorkflow = ref<ParsedWorkflow | null>(null)
const diagnosisResult = ref<any>(null)

const faultTreeRef = ref()
const uploadRef = ref()

// 诊断参数
const diagnosisParams = reactive<DiagnosisParams>({
  H2_ppm: 150,
  CH4_ppm: 60,
  C2H6_ppm: 20,
  C2H4_ppm: 50,
  C2H2_ppm: 150,
  CO_ppm: 100,
  CO2_ppm: 400
})

// 示例数据选项
const sampleOptions = [
  { label: '基础逻辑门示例', value: 'basic' },
  { label: '复杂故障树示例', value: 'complex' },
  { label: '变电站逻辑推理', value: 'substation' }
]

// 解析器
const parser = createWorkflowParser()

// 计算属性
const hasValidData = computed(() => {
  return workflowData.value || faultTreeData.value
})

const logicGates = computed((): LogicGateNode[] => {
  return parsedWorkflow.value?.logic_gates || []
})


// 生命周期
onMounted(() => {
  // 默认加载示例数据
  loadDefaultSample()
})

// 方法
const handleDataSourceChange = (value: 'workflow' | 'sample') => {
  // 清理之前的数据
  clearData()
  
  if (value === 'sample') {
    loadSampleData(selectedSample.value)
  }
}

const clearData = () => {
  workflowData.value = null
  faultTreeData.value = undefined
  parsedWorkflow.value = null
  selectedFile.value = null
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

const beforeUpload = (file: File) => {
  const isJSON = file.type === 'application/json' || file.name.endsWith('.json')
  if (!isJSON) {
    ElMessage.error('只能上传 JSON 文件!')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  
  return false // 阻止自动上传
}

const parseWorkflowFile = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  parsing.value = true
  try {
    const content = await selectedFile.value.text()
    const json = JSON.parse(content)
    
    workflowData.value = json
    parsedWorkflow.value = parser.parseWorkflow(json)
    
    ElMessage.success('Workflow解析成功')
  } catch (error) {
    console.error('解析失败:', error)
    ElMessage.error('文件解析失败，请检查JSON格式')
  } finally {
    parsing.value = false
  }
}

const loadSampleData = (sampleType: string) => {
  switch (sampleType) {
    case 'basic':
      loadBasicSample()
      break
    case 'complex':
      loadComplexSample()
      break
    case 'substation':
      loadSubstationSample()
      break
    default:
      loadBasicSample()
  }
}

const loadDefaultSample = () => {
  selectedSample.value = 'basic'
  loadBasicSample()
}

const loadBasicSample = () => {
  // 基于PDF文档创建专业的故障诊断树
  const basicFaultTree: EnhancedFaultTreeNode = {
    id: 'root',
    name: '本体异常产气故障诊断',
    type: 'fault_node',
    children: [
      {
        id: 'h2_check',
        name: '仅H2升高判断',
        type: 'logic_gate',
        gate_type: 'AND',
        state: 'unknown',
        condition: 'H2升高 AND (CH4少量或无)',
        input_nodes: ['input'],
        output_nodes: ['moisture_result'],
        children: [
          {
            id: 'moisture_result',
            name: '器身受潮',
            type: 'fault_node',
            description: '建议排查器身受潮',
            recommendation: '检查变压器密封性，进行干燥处理'
          }
        ]
      },
      {
        id: 'co_co2_check',
        name: 'CO/CO2比值判断',
        type: 'logic_gate',
        gate_type: 'AND',
        state: 'unknown',
        condition: 'CO、CO2升高 AND CO2/CO > 3',
        input_nodes: ['input'],
        output_nodes: ['solid_insulation'],
        children: [
          {
            id: 'solid_insulation',
            name: '过热、放电涉及固体纸绝缘',
            type: 'fault_node',
            description: '固体绝缘受损',
            recommendation: '检查绝缘纸状态，考虑更换'
          }
        ]
      },
      {
        id: 'three_ratio_branch',
        name: '三比值诊断分支',
        type: 'logic_gate',
        gate_type: 'OR',
        state: 'unknown',
        condition: '根据三比值代码分类',
        input_nodes: ['input'],
        output_nodes: ['thermal_branch', 'discharge_branch'],
        children: [
          {
            id: 'thermal_branch',
            name: '过热故障分支(0xx)',
            type: 'logic_gate',
            gate_type: 'OR',
            state: 'unknown',
            condition: '三比值代码：0xx AND DPM位于T1、T2、T3区域',
            children: [
              {
                id: 't2_fault',
                name: '中温过热(021/T2)',
                type: 'fault_node',
                description: '300~700℃中温过热',
                recommendation: '检查线圈导线焊接缺陷、引线绝缘破损、引线连接缺陷等'
              },
              {
                id: 't3_fault',
                name: '高温过热(022/T3)',
                type: 'fault_node',
                description: '700℃以上高温过热',
                recommendation: '检查铁芯及夹件环流、导线焊接缺陷、未有效连接接触电阻偏大等'
              }
            ]
          },
          {
            id: 'discharge_branch',
            name: '放电故障分支(1xx,2xx)',
            type: 'logic_gate',
            gate_type: 'OR',
            state: 'unknown',
            condition: '三比值代码：1xx、2xx AND DPM位于D1、D2、DP区域',
            children: [
              {
                id: 'high_energy_discharge',
                name: '高能放电(1XX/D2)',
                type: 'fault_node',
                description: '油中高能放电、电弧放电，常见102',
                recommendation: '检查静电板等电位线断裂、铁心接地线虚接、线圈匝间层间短路'
              },
              {
                id: 'low_energy_discharge',
                name: '低能放电(2XX/D1)',
                type: 'fault_node',
                description: '油中低能放电、火花放电，常见20x',
                recommendation: '检查铁心接地线连接、压板等电位连接、油中金属异物等'
              }
            ]
          }
        ]
      },
      {
        id: 'prpd_analysis',
        name: 'PRPD局放特征分析',
        type: 'logic_gate',
        gate_type: 'OR',
        state: 'unknown',
        condition: '基于PRPD图谱特征判断',
        input_nodes: ['input'],
        output_nodes: ['internal_discharge', 'floating_discharge', 'corona_discharge', 'surface_discharge'],
        children: [
          {
            id: 'internal_discharge',
            name: '绝缘放电',
            type: 'fault_node',
            description: 'PRPD对称性强，相位窗口宽(60°~90°)',
            recommendation: '检查铁芯夹件绝缘、压板绝缘缺陷、绝缘老化损伤等'
          },
          {
            id: 'floating_discharge',
            name: '悬浮放电',
            type: 'fault_node',
            description: 'PRPD对称分布，相位窗口窄(30°~45°)',
            recommendation: '检查等电位金属导线松动、金属异物附着、接触不良等'
          },
          {
            id: 'corona_discharge',
            name: '尖端放电',
            type: 'fault_node',
            description: 'PRPD单极分布，仅存于正半周或负半周',
            recommendation: '检查金属加工粗糙、安装缺陷造成的尖角毛刺等'
          },
          {
            id: 'surface_discharge',
            name: '沿面放电',
            type: 'fault_node',
            description: 'PRPD不对称分布，相位窗口极宽(>100°)',
            recommendation: '检查绝缘表面污染、受潮、表面绝缘老化等'
          }
        ]
      }
    ]
  }

  faultTreeData.value = basicFaultTree
  ElMessage.success('专业故障诊断示例数据加载完成')
}

const loadComplexSample = () => {
  // 基于PDF文档创建完整的故障诊断决策树
  const complexFaultTree: EnhancedFaultTreeNode = {
    id: 'root',
    name: '本体异常产气故障诊断完整流程',
    type: 'fault_node',
    children: [
      {
        id: 'primary_analysis',
        name: '初级分析',
        type: 'logic_gate',
        gate_type: 'AND',
        state: 'unknown',
        condition: '特征气体分析 AND 基础判断',
        input_nodes: ['gas_input'],
        output_nodes: ['secondary_analysis'],
        children: [
          {
            id: 'h2_only_gate',
            name: 'H2独立升高判断',
            type: 'logic_gate',
            gate_type: 'AND',
            state: 'unknown',
            condition: 'H2升高 AND CH4少量',
            children: [
              {
                id: 'moisture_diagnosis',
                name: '器身受潮诊断',
                type: 'fault_node',
                description: '仅H2升高或同时伴有少量CH4升高',
                recommendation: '建议排查器身受潮，检查密封性'
              }
            ]
          },
          {
            id: 'co_ratio_gate',
            name: 'CO/CO2比值判断',
            type: 'logic_gate',
            gate_type: 'AND',
            state: 'unknown',
            condition: 'CO、CO2升高 AND CO2/CO > 3',
            children: [
              {
                id: 'solid_involvement',
                name: '固体绝缘受损',
                type: 'fault_node',
                description: '过热、放电涉及固体纸绝缘',
                recommendation: '检查绝缘纸状态，考虑绝缘系统维护'
              }
            ]
          }
        ]
      },
      {
        id: 'secondary_analysis',
        name: '二级分析',
        type: 'logic_gate',
        gate_type: 'OR',
        state: 'unknown',
        condition: '三比值法 OR DPM法',
        input_nodes: ['primary_analysis'],
        output_nodes: ['thermal_analysis', 'discharge_analysis'],
        children: [
          {
            id: 'thermal_analysis',
            name: '过热故障分析',
            type: 'logic_gate',
            gate_type: 'OR',
            state: 'unknown',
            condition: '三比值代码0xx OR DPM在T1/T2/T3区域',
            children: [
              {
                id: 'low_temp_overheating',
                name: '低温过热(<300℃)',
                type: 'logic_gate',
                gate_type: 'AND',
                state: 'unknown',
                condition: '021代码 OR T1区域',
                children: [
                  {
                    id: 'low_temp_result',
                    name: '低温过热故障',
                    type: 'fault_node',
                    description: '温度低于300℃的过热',
                    recommendation: '检查负载分布，排查局部过热点'
                  }
                ]
              },
              {
                id: 'medium_temp_overheating',
                name: '中温过热(300-700℃)',
                type: 'logic_gate',
                gate_type: 'AND',
                state: 'unknown',
                condition: '021代码 OR T2区域',
                children: [
                  {
                    id: 'medium_temp_result',
                    name: '中温过热故障',
                    type: 'fault_node',
                    description: '300~700℃中温过热',
                    recommendation: '检查线圈导线焊接缺陷、引线绝缘破损、并联引线环流等'
                  }
                ]
              },
              {
                id: 'high_temp_overheating',
                name: '高温过热(>700℃)',
                type: 'logic_gate',
                gate_type: 'AND',
                state: 'unknown',
                condition: '022代码 OR T3区域',
                children: [
                  {
                    id: 'high_temp_result',
                    name: '高温过热故障',
                    type: 'fault_node',
                    description: '700℃以上高温过热',
                    recommendation: '检查铁芯及夹件环流、导线焊接缺陷、接触电阻偏大等'
                  }
                ]
              }
            ]
          },
          {
            id: 'discharge_analysis',
            name: '放电故障分析',
            type: 'logic_gate',
            gate_type: 'OR',
            state: 'unknown',
            condition: '三比值代码1xx/2xx OR DPM在D1/D2/DP区域',
            children: [
              {
                id: 'high_energy_branch',
                name: '高能放电分支',
                type: 'logic_gate',
                gate_type: 'AND',
                state: 'unknown',
                condition: '1XX代码 OR D2区域',
                children: [
                  {
                    id: 'arc_discharge',
                    name: '电弧放电',
                    type: 'fault_node',
                    description: '油中高能放电、电弧放电，常见102',
                    recommendation: '检查静电板等电位线断裂、铁心接地线虚接、线圈匝间层间短路'
                  }
                ]
              },
              {
                id: 'low_energy_branch',
                name: '低能放电分支',
                type: 'logic_gate',
                gate_type: 'AND',
                state: 'unknown',
                condition: '2XX代码 OR D1区域',
                children: [
                  {
                    id: 'spark_discharge',
                    name: '火花放电',
                    type: 'fault_node',
                    description: '油中低能放电、火花放电，常见20x',
                    recommendation: '检查铁心接地线连接、压板等电位连接、油中金属异物等'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'prpd_verification',
        name: 'PRPD验证分析',
        type: 'logic_gate',
        gate_type: 'OR',
        state: 'unknown',
        condition: '局放信号特征验证',
        input_nodes: ['secondary_analysis'],
        output_nodes: ['final_diagnosis'],
        children: [
          {
            id: 'symmetric_prpd',
            name: '对称PRPD模式',
            type: 'logic_gate',
            gate_type: 'OR',
            state: 'unknown',
            condition: 'PRPD对称性判断',
            children: [
              {
                id: 'wide_phase_window',
                name: '宽相位窗口(60°-90°)',
                type: 'fault_node',
                description: '绝缘放电、内部放电',
                recommendation: '检查铁芯夹件绝缘、压板绝缘缺陷、绝缘老化损伤等'
              },
              {
                id: 'narrow_phase_window',
                name: '窄相位窗口(30°-45°)',
                type: 'fault_node',
                description: '悬浮放电、接触放电',
                recommendation: '检查等电位金属导线松动、金属异物附着、接触不良等'
              }
            ]
          },
          {
            id: 'asymmetric_prpd',
            name: '不对称PRPD模式',
            type: 'logic_gate',
            gate_type: 'OR',
            state: 'unknown',
            condition: 'PRPD不对称性判断',
            children: [
              {
                id: 'unipolar_distribution',
                name: '单极分布',
                type: 'fault_node',
                description: '尖端放电、金属放电、电晕放电',
                recommendation: '检查金属加工粗糙、安装缺陷造成的尖角毛刺等'
              },
              {
                id: 'extremely_wide_window',
                name: '极宽相位窗口(>100°)',
                type: 'fault_node',
                description: '沿面放电、爬电',
                recommendation: '检查绝缘表面污染、受潮、表面绝缘老化等'
              }
            ]
          }
        ]
      }
    ]
  }

  faultTreeData.value = complexFaultTree
  ElMessage.success('完整故障诊断流程数据加载完成')
}

const loadSubstationSample = async () => {
  try {
    // 尝试加载实际的变电站逻辑推理数据
    const response = await fetch('/Users/laolao/Desktop/laolao/VScode/national elc/变电站逻辑推理 0808-v1_副本.json')
    const json = await response.json()
    
    workflowData.value = json
    parsedWorkflow.value = parser.parseWorkflow(json)
    
    ElMessage.success('变电站逻辑推理数据加载完成')
  } catch (error) {
    console.warn('无法加载实际workflow文件，使用模拟数据')
    // 如果无法加载实际文件，使用模拟的变电站数据
    loadBasicSample()
  }
}


const handleNodeClick = (node: EnhancedFaultTreeNode) => {
  console.log('节点点击:', node)
  ElMessage.info(`点击了节点: ${node.name}`)
}

const handleDiagnosisComplete = (result: any) => {
  console.log('诊断完成:', result)
}

const exportResult = () => {
  if (diagnosisResult.value) {
    const dataStr = JSON.stringify(diagnosisResult.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `diagnosis_result_${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('结果导出成功')
  }
}

const getResultTagType = (conclusion: string) => {
  if (conclusion.includes('正常')) return 'success'
  if (conclusion.includes('注意')) return 'warning'
  if (conclusion.includes('故障')) return 'danger'
  return 'info'
}

</script>

<style scoped>
.test1-view {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.header-card {
  border: none;
  margin-bottom: 20px;
}

.header-card :deep(.el-card__body) {
  padding: 20px 0;
}

/* 顶部控制面板样式 */
.control-panel-top {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-panel-top :deep(.el-card__body) {
  padding: 20px;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item h4 {
  margin: 0;
  color: #303133;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.file-name {
  font-size: 12px;
  color: #606266;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 水平排列的逻辑门状态 */
.logic-gates-status-horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.gate-status-item-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #F5F7FA;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.gate-status-item-small:hover {
  background: #E6F3FF;
  transform: scale(1.05);
}

.more-gates {
  font-size: 11px;
  color: #909399;
  background: #F5F7FA;
  padding: 4px 8px;
  border-radius: 12px;
}

/* 故障树全屏显示区域 */
.tree-display-full {
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.logic-gates-status {
  max-height: 200px;
  overflow-y: auto;
}

.gate-status-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #F5F7FA;
  border-radius: 6px;
}

.gate-info {
  margin-left: 12px;
  flex: 1;
}

.gate-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.gate-condition {
  font-size: 10px;
  color: #909399;
  font-family: monospace;
  margin-top: 2px;
}

.diagnosis-result {
  max-height: 500px;
  overflow-y: auto;
}

.diagnosis-path {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.reasoning-process {
  border-top: 1px solid #EBEEF5;
  padding-top: 16px;
}

.timeline-content {
  font-size: 14px;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.step-condition,
.step-reasoning {
  font-size: 12px;
  color: #606266;
  margin: 2px 0;
}

.step-condition {
  font-family: monospace;
  background: #F5F7FA;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

/* 响应式样式 */
@media (max-width: 1200px) {
  .control-panel-top :deep(.el-row) {
    flex-direction: column;
    gap: 16px;
  }
  
  .control-panel-top :deep(.el-col) {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
  
  .tree-display-full {
    height: calc(100vh - 350px) !important;
  }
}

@media (max-width: 768px) {
  .test1-view {
    padding: 10px;
  }
  
  .control-panel-top :deep(.el-card__body) {
    padding: 15px;
  }
  
  .control-item h4 {
    font-size: 12px;
  }
  
  .logic-gates-status-horizontal {
    gap: 6px;
  }
  
  .gate-status-item-small {
    width: 28px;
    height: 28px;
  }
  
  .tree-display-full {
    height: calc(100vh - 380px) !important;
    margin-top: 15px;
  }
  
  .header-card {
    margin-bottom: 15px;
  }
}
</style>