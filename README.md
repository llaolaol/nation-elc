# 国网故障诊断系统 (State Grid Fault Diagnosis System)

基于逻辑门和 n8n 工作流的智能化电力设备故障诊断系统，提供全面的变压器故障分析、可视化和管理功能。

## 项目概述

本项目是一个专为国家电网设计的现代化故障诊断系统，集成了多种先进的故障诊断技术。系统不仅支持传统的DGA（溶解气体分析）、三比值法、DPM分析，还创新性地引入了逻辑门可视化技术，提供直观的故障树展示和管理功能。

### 🌟 核心特性

- 🧠 **智能逻辑门诊断**：创新的逻辑门故障树可视化，支持AND/OR/NOT逻辑关系
- 🔬 **多维故障分析**：集成DGA分析、三比值法、DPM分析、PRPD局放特征分析
- 📊 **专业可视化**：基于专业算法的多种布局模式（层次、径向、紧凑）
- 🖼️ **图像AI诊断**：支持PRPD、UHF、TEV、AE等图像的智能识别分析
- 🗃️ **故障树管理**：完整的故障树生命周期管理（CRUD操作）
- 📈 **历史追踪**：完整的诊断历史记录和趋势分析
- 📄 **文档管理**：支持多种格式的技术文档在线管理
- 📱 **响应式设计**：适配不同设备的现代化企业级UI界面

## 技术栈

### 🛠️ 前端技术栈
- **Vue 3.5.18** - 现代渐进式 JavaScript 框架，采用 Composition API
- **TypeScript 5.8.0** - 类型安全的 JavaScript 超集，提供完整类型支持
- **Vite 7.0.6** - 新一代前端构建工具，极速热更新

### 🎨 UI 框架与可视化
- **Element Plus 2.10.5** - 专业的 Vue 3 企业级组件库
- **@element-plus/icons-vue 2.3.1** - Element Plus 官方图标库
- **ECharts 5.6.0** - 百度开源的数据可视化图表库
- **vue-echarts 7.0.3** - ECharts 的 Vue 3 组件封装

### 📦 状态管理与路由
- **Pinia 3.0.3** - Vue 3 官方推荐的现代状态管理库
- **Vue Router 4.5.1** - Vue 3 官方路由管理器

### 📄 文档与数据处理
- **PDF.js 5.4.54** - Mozilla 开源的 PDF 解析和渲染库
- **xlsx 0.18.5** - Excel 文档读写处理库

### 🔧 开发工具链
- **ESLint 9.31.0** - JavaScript/TypeScript 代码质量检查工具
- **Prettier 3.6.2** - 代码格式化工具，确保代码风格统一
- **Vue DevTools 8.0.0** - Vue 3 专用浏览器调试工具
- **npm-run-all2** - 并行执行 npm 脚本工具

## 功能模块

### 1. 🔧 故障推理诊断
- **多参数输入**：支持 7 种关键气体浓度参数（H2、CH4、C2H6、C2H4、C2H2、CO、CO2）
- **智能验证**：实时参数验证和专业范围检查
- **多重分析**：三比值法、DPM分析、特征气体分析
- **诊断引擎**：基于国网标准的智能诊断算法
- **结果展示**：详细的多维度诊断结果和专业建议

### 2. 🌳 故障树可视化展示
- **逻辑门可视化**：创新的AND/OR/NOT逻辑门图形展示
- **多种布局**：层次布局、径向布局、紧凑布局三种专业模式
- **交互功能**：支持缩放、拖拽、节点点击交互
- **逻辑关系**：连线上显示逻辑关系符号，直观展示故障逻辑
- **状态显示**：实时显示逻辑门状态（真/假/未知）
- **专业数据**：基于实际PDF技术文档的专业故障诊断数据

### 3. 🗂️ 故障树管理系统
- **全生命周期管理**：故障树的创建、编辑、删除、克隆操作
- **元数据管理**：版本控制、状态管理、权限设置
- **节点编辑器**：可视化节点编辑，支持故障节点和逻辑门节点
- **模板系统**：故障树模板管理和快速复制功能
- **搜索筛选**：按状态、类别、标签、时间范围等多维度筛选
- **批量操作**：支持批量导出、删除等操作

### 4. 🖼️ 图像智能诊断
- **多格式支持**：PRPD、UHF、TEV、AE等多种图像格式
- **AI智能分析**：基于深度学习的图像识别和分析
- **任务管理**：异步任务处理，实时进度追踪
- **结果可视化**：标注结果展示，支持置信度显示
- **专业报告**：生成详细的图像诊断分析报告

### 5. 📈 诊断历史管理
- **完整记录**：全面的诊断历史数据存储
- **趋势分析**：诊断结果的时间趋势图表展示
- **数据导出**：支持多种格式的历史数据导出
- **对比分析**：不同时期诊断结果的对比功能
- **统计报表**：诊断频次、故障类型分布等统计

### 6. 📄 文档管理系统
- **格式支持**：PDF、Excel、Word、JSON、图片等多格式
- **在线预览**：支持文档的在线预览功能
- **分类管理**：文档分类和标签系统
- **搜索功能**：全文搜索和筛选功能
- **版本控制**：文档版本管理和历史追踪

## 项目架构

### 核心技术栈

**前端框架**: Vue 3.5.18 + TypeScript 5.8.0 + Vite 7.0.6  
**UI组件库**: Element Plus 2.10.5 + @element-plus/icons-vue 2.3.1  
**图表可视化**: ECharts 5.6.0 + vue-echarts 7.0.3  
**状态管理**: Pinia 3.0.3  
**路由管理**: Vue Router 4.5.1  
**文档处理**: PDF.js 5.4.54 + xlsx 0.18.5  
**开发工具**: ESLint 9.31.0 + Prettier 3.6.2 + Vue DevTools 8.0.0  

### 项目结构

```
fault-diagnosis-system/                 # 🏗️ 项目根目录
├── 📁 public/                          # 静态资源目录
│   └── favicon.ico                     # 网站图标
├── 📁 src/                            # 源代码目录
│   ├── 📁 assets/                     # 静态资源文件
│   │   ├── base.css                   # 基础样式
│   │   ├── logo.svg                   # Logo 图标
│   │   └── main.css                   # 主样式文件
│   ├── 📁 components/                 # Vue 组件目录
│   │   ├── 📁 common/                # 🔧 通用组件
│   │   │   ├── ErrorBoundary.vue     # 错误边界处理组件
│   │   │   ├── LoadingComponent.vue  # 加载状态组件
│   │   │   ├── SmartForm.vue         # 智能表单组件
│   │   │   └── SmartTable.vue        # 智能表格组件
│   │   ├── 📁 icons/                 # 🎨 图标组件库
│   │   │   ├── IconCommunity.vue     # 社区图标
│   │   │   ├── IconDocumentation.vue # 文档图标
│   │   │   ├── IconEcosystem.vue     # 生态图标
│   │   │   ├── IconSupport.vue       # 支持图标
│   │   │   └── IconTooling.vue       # 工具图标
│   │   ├── 📁 image/                 # 🖼️ 图像诊断组件
│   │   │   ├── ImageUploader.vue     # 图像上传处理组件
│   │   │   ├── ResultDisplay.vue     # 诊断结果展示组件
│   │   │   └── TaskManager.vue       # 任务队列管理组件
│   │   ├── 📁 logic/                 # 🧠 逻辑门组件
│   │   │   ├── EnhancedFaultTree.vue # 增强型故障树可视化
│   │   │   ├── LogicGateIcon.vue     # 逻辑门图标组件
│   │   │   └── LogicGateNode.vue     # 逻辑门节点组件
│   │   ├── HelloWorld.vue            # 默认示例组件
│   │   ├── TheWelcome.vue            # 欢迎页组件
│   │   └── WelcomeItem.vue           # 欢迎项组件
│   ├── 📁 composables/               # 🎣 Vue 3 组合式函数
│   │   ├── useForm.ts               # 表单处理 Hook
│   │   ├── useLoading.ts            # 加载状态 Hook
│   │   └── useTableData.ts          # 表格数据 Hook
│   ├── 📁 constants/                 # 📋 常量定义
│   │   └── index.ts                 # 统一常量导出
│   ├── 📁 router/                    # 🛤️ 路由配置
│   │   └── index.ts                 # 路由定义文件
│   ├── 📁 services/                  # 🌐 API 服务层
│   │   ├── diagnosis.ts             # 故障诊断API服务
│   │   ├── imageDiagnosis.ts        # 图像诊断API服务
│   │   ├── mockApi.v2.ts            # 模拟API服务
│   │   ├── visualization.ts         # 可视化数据服务
│   │   └── workflowParser.ts        # n8n工作流解析服务
│   ├── 📁 stores/                   # 🏪 Pinia 状态管理
│   │   └── counter.ts              # 计数器状态示例
│   ├── 📁 types/                    # 📝 TypeScript 类型定义
│   │   └── index.ts                # 统一类型定义导出
│   ├── 📁 utils/                    # 🛠️ 工具函数库
│   │   ├── diagnosisTools.ts        # 故障诊断工具函数
│   │   ├── faultTreeParser.ts       # 故障树数据解析器
│   │   ├── logicGateRenderer.ts     # 逻辑门渲染引擎
│   │   └── textParser.ts            # 文本解析工具
│   ├── 📁 views/                    # 📄 页面组件
│   │   ├── AboutView.vue            # 关于页面
│   │   ├── DiagnosisHistory.vue     # 诊断历史管理页
│   │   ├── DocumentManagement.vue   # 文档管理页面
│   │   ├── FaultDiagnosis.vue       # 故障推理诊断页
│   │   ├── FaultTreeManagement.vue  # 故障树管理页面
│   │   ├── FaultTreePreview.vue     # 故障树预览页面
│   │   ├── HomeView.vue             # 系统首页
│   │   ├── ImageDiagnosis.vue       # 图像AI诊断页
│   │   ├── Test1View.vue            # 故障树展示页面
│   │   └── TestView.vue             # 测试页面
│   ├── App.vue                      # 🎯 根组件
│   └── main.ts                      # 🚀 应用程序入口
├── 📁 .claude/                      # 🤖 Claude AI 配置
├── 📁 .vscode/                      # VS Code 配置
├── env.d.ts                         # 环境变量类型定义
├── eslint.config.ts                 # ESLint 配置文件
├── index.html                       # HTML 入口文件
├── package.json                     # 📦 项目依赖配置
├── package-lock.json               # 依赖锁定文件
├── tsconfig.json                    # TypeScript 根配置
├── tsconfig.app.json               # 应用 TS 配置
├── tsconfig.node.json              # Node.js TS 配置
├── vite.config.ts                  # ⚡ Vite 构建配置
└── README.md                       # 📖 项目说明文档
```

## API 集成说明

### 🔗 多重API集成架构

系统采用多层API集成架构，支持多种诊断模式和数据源：

1. **n8n Webhook 集成** - 传统诊断API
2. **逻辑门工作流解析** - n8n workflow JSON解析
3. **图像诊断API** - AI图像分析服务
4. **本地模拟API** - 开发测试环境

### n8n Webhook 集成

本系统通过 n8n 平台的 webhook 功能实现后端故障诊断逻辑集成。

#### Webhook 端点配置

```typescript
// src/services/diagnosis.ts
const N8N_WEBHOOK_URL = 'http://3.27.250.156:5678/webhook/power-fault-diagnosis-1';
```

#### 请求格式

**HTTP 方法**: `POST`

**请求头**:
```
Content-Type: application/json
```

**请求体结构**:
```typescript
// 请求数据被包装在数组中，符合 n8n webhook 的期望格式
[
  {
    H2_ppm: number,           // 氢气浓度 (ppm)
    CH4_ppm: number,          // 甲烷浓度 (ppm)
    C2H6_ppm: number,         // 乙烷浓度 (ppm)
    C2H4_ppm: number,         // 乙烯浓度 (ppm)
    C2H2_ppm: number,         // 乙炔浓度 (ppm)
    CO_ppm: number,           // 一氧化碳浓度 (ppm)
    CO2_ppm: number,          // 二氧化碳浓度 (ppm)
    total_hydrocarbons_limit?: number, // 总烃阈值 (可选)
    prpd_feature?: string,    // PRPD 特征 (可选)
    transformer_id?: string   // 变压器ID (可选)
  }
]
```

#### 请求示例

```javascript
const requestData = [{
  H2_ppm: 150,
  CH4_ppm: 60,
  C2H6_ppm: 20,
  C2H4_ppm: 50,
  C2H2_ppm: 150,
  CO_ppm: 100,
  CO2_ppm: 400,
  total_hydrocarbons_limit: 150
}];

fetch('http://3.27.250.156:5678/webhook/power-fault-diagnosis-1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestData)
});
```

#### 响应数据结构

**成功响应** (HTTP 200):
```typescript
// n8n 返回的数据结构（数组格式）
[
  {
    // 输入参数回显
    H2_ppm: number,
    CH4_ppm: number,
    C2H6_ppm: number,
    C2H4_ppm: number,
    C2H2_ppm: number,
    CO_ppm: number,
    CO2_ppm: number,
    prpd_feature: string,
    total_hydrocarbons_limit: number,
    
    // 诊断分析结果
    three_ratio_code_array: number[],      // 三比值编码数组
    three_ratio_diagnosis: string,         // 三比值诊断结果
    dpm_fault_code: string,               // DPM 故障代码
    characteristic_gas_diagnosis: string,  // 特征气体诊断
    is_discharge_fault: boolean,          // 是否为放电故障
    dpm_diagnosis_result: string,         // DPM 诊断结果
    dmp_diagnosis_description: string,    // DPM 诊断描述
    dpm_recommendation: string            // DPM 推荐措施
  }
]
```

#### 错误处理

系统内置了完善的错误处理机制：

```typescript
// HTTP 状态码错误
if (!response.ok) {
  const errorBody = await response.text();
  throw new Error(`HTTP error ${response.status}: ${errorBody}`);
}

// 数据结构验证
if (Array.isArray(result) && result.length > 0) {
  return result[0];  // 返回数组中的第一个对象
} else {
  console.warn('Unexpected API response structure:', result);
  return result;
}
```

#### 集成特点

1. **数据格式适配**: 自动处理 n8n webhook 期望的数组格式
2. **错误恢复**: 完整的 HTTP 错误和数据格式异常处理
3. **类型安全**: 完整的 TypeScript 类型定义
4. **响应适配**: 自动解包数组响应返回核心数据对象

### 逻辑门工作流系统

#### 🧠 创新的逻辑门可视化

系统引入了革命性的逻辑门故障树可视化技术：

```typescript
// src/services/workflowParser.ts - 工作流解析服务
// src/utils/logicGateRenderer.ts - 逻辑门渲染引擎
// src/components/logic/EnhancedFaultTree.vue - 增强故障树组件
```

**核心特性**：
- **n8n Workflow 解析**：智能解析 n8n 工作流 JSON 数据
- **逻辑关系提取**：自动识别 AND/OR/NOT 逻辑关系
- **动态渲染**：支持层次、径向、紧凑三种布局算法
- **实时状态**：逻辑门状态实时更新和可视化
- **交互控制**：支持缩放、拖拽、节点点击等交互

**数据结构**：
```typescript
interface LogicGateNode {
  id: string;
  type: 'logic_gate';
  gate_type: 'AND' | 'OR' | 'NOT';
  name: string;
  condition: string;
  state: 'true' | 'false' | 'unknown';
  input_nodes: string[];
  output_nodes: string[];
}
```

### 图像诊断API集成

#### 🖼️ AI驱动的图像智能分析

```typescript
// src/services/imageDiagnosis.ts - 图像诊断服务
```

**支持的图像类型**：
- **PRPD** - 相位分解局部放电图谱
- **UHF** - 超高频检测图像  
- **TEV** - 暂态地电压图像
- **AE** - 声发射检测图像

**API端点**：
```typescript
POST /api/image-diagnosis
Content-Type: multipart/form-data

// 请求参数
{
  equipment_info: EquipmentInfo,
  image_files: File[],
  image_type: 'PRPD' | 'UHF' | 'TEV' | 'AE',
  sensitivity: 'low' | 'medium' | 'high'
}

// 响应结构
{
  task_id: string,
  image_analysis: {
    discharge_type: string,
    severity_level: number,
    confidence_score: number,
    fault_location: string
  },
  processed_images: ProcessedImage[],
  ai_insights: string[],
  recommended_actions: string[]
}
```

### 故障树管理API

#### 🗂️ 完整的故障树生命周期管理

```typescript
// 故障树元数据管理
interface FaultTreeMetadata {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived' | 'template';
  category: string;
  version: string;
  tags: string[];
  permissions: FaultTreePermission;
}

// CRUD操作支持
- GET /api/fault-trees        // 获取故障树列表
- POST /api/fault-trees       // 创建新故障树
- PUT /api/fault-trees/:id    // 更新故障树
- DELETE /api/fault-trees/:id // 删除故障树
- POST /api/fault-trees/:id/clone // 克隆故障树
```

### 本地模拟 API

开发环境下，系统还提供了本地模拟 API 服务 (`mockApi.v2.ts`)，支持：

- 智能诊断逻辑模拟
- 三比值法分析
- 特征气体分析
- DPM 诊断方法
- 完整的故障类型识别
- 图像诊断模拟

## 安装和运行

### 环境要求

- **Node.js**: ^20.19.0 || >=22.12.0
- **npm**: 最新稳定版本

### 安装步骤

1. 克隆项目仓库：
```bash
git clone <repository-url>
cd fault-diagnosis-system
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 构建生产版本：
```bash
npm run build
```

### 可用脚本

```bash
# 开发相关命令
npm run dev          # 🚀 启动开发服务器 (默认端口: 5173)
npm run build        # 📦 构建生产版本到 dist/ 目录
npm run build-only   # 🔨 仅构建，不进行类型检查
npm run preview      # 👀 预览生产构建版本

# 代码质量检查
npm run type-check   # 📝 TypeScript 类型检查
npm run lint         # 🔍 ESLint 代码质量检查并自动修复
npm run format       # 🎨 Prettier 代码格式化
```

### 🚀 快速开始指南

1. **启动系统**：
```bash
npm run dev
```

2. **访问系统**：
   - 开发服务器: `http://localhost:5173` (或显示的端口)
   - 系统会自动打开浏览器访问首页

3. **核心功能访问路径**：
   - **故障推理**: `/diagnosis` - 传统气体分析诊断
   - **故障树展示**: `/test1` - 逻辑门可视化展示
   - **故障树管理**: `/fault-tree-management` - 故障树CRUD管理
   - **图像诊断**: `/image-diagnosis` - AI图像分析
   - **诊断历史**: `/history` - 历史记录查看
   - **文档管理**: `/documents` - 技术文档管理

### 🌟 Demo数据体验

系统内置了专业的demo数据，基于实际PDF技术文档制作：

1. **访问故障树管理页面** (`/fault-tree-management`)
2. **查看专业示例**: "本体异常产气故障诊断（专业示例）"
3. **点击预览**: 体验完整的逻辑门故障树可视化
4. **尝试不同布局**: 层次、径向、紧凑三种模式
5. **交互操作**: 缩放、拖拽、节点点击等功能

## 开发指南

### 🛠️ 开发环境配置

**系统环境要求**：
- **Node.js**: ^20.19.0 || >=22.12.0 (推荐 v22.12.0+)
- **npm**: 最新稳定版本 (随 Node.js 安装)
- **操作系统**: Windows 10+, macOS 12+, Linux (Ubuntu 20.04+)

**推荐开发工具**：
- **IDE**: VSCode + Volar 插件 (替代 Vetur)
- **浏览器**: Chrome/Edge 最新版本 (支持 Vue DevTools 3.x)
- **终端**: 支持 Unicode 的现代终端 (Windows Terminal, iTerm2)
- **Git**: 版本控制工具 (v2.30+)

### 代码规范

项目采用现代化的代码质量控制体系：

- **ESLint**: 代码质量检查和潜在问题识别
- **Prettier**: 代码格式化和风格统一
- **TypeScript**: 类型安全和开发时错误检查
- **Vue DevTools**: Vue 3 组件调试支持

### 🚀 扩展开发指南

#### 1. 添加新的诊断方法

```typescript
// 1. 在 src/types/index.ts 中定义类型
interface NewDiagnosisMethod {
  methodName: string;
  parameters: any[];
  result: DiagnosisResult;
}

// 2. 在 src/services/diagnosis.ts 中实现API
export const runNewDiagnosis = async (params: NewDiagnosisParams) => {
  // 实现诊断逻辑
}

// 3. 在组件中集成使用
// 4. 更新路由和导航配置
```

#### 2. 开发新的逻辑门布局

```typescript
// 在 src/utils/logicGateRenderer.ts 中添加新布局
export class LogicGateRenderer {
  calculateCustomLayout(faultTree: EnhancedFaultTreeNode): Map<string, RenderPosition> {
    // 实现自定义布局算法
  }
}
```

#### 3. 创建新的可视化组件

```vue
<!-- src/components/logic/NewVisualization.vue -->
<template>
  <div class="new-visualization">
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
// 使用 Vue 3 Composition API
// 类型安全的 TypeScript
// Element Plus 组件规范
</script>
```

#### 4. 扩展图像诊断功能

```typescript
// src/services/imageDiagnosis.ts
export const addNewImageType = (imageType: string) => {
  // 添加新的图像类型支持
}
```

### 组件开发规范

- **Vue 3 Composition API**: 优先使用组合式API
- **TypeScript**: 强制类型标注，确保类型安全
- **Element Plus**: 遵循组件库设计规范和主题系统
- **单一职责**: 保持组件功能单一、职责清晰
- **组件命名**: 使用 PascalCase，名称具有描述性
- **Props定义**: 使用 TypeScript interface 严格定义
- **事件命名**: 使用 camelCase，遵循Vue约定

### 📁 文件组织规范

```
新功能开发结构：
src/
├── components/
│   └── [feature]/           # 按功能分组
│       ├── FeatureComponent.vue
│       └── FeatureDialog.vue
├── services/
│   └── featureService.ts    # 对应的服务
├── types/
│   └── index.ts            # 添加类型定义
└── views/
    └── FeatureView.vue     # 主页面组件
```

### 🧪 测试和调试

```bash
# 类型检查
npm run type-check

# 代码质量检查
npm run lint

# 代码格式化
npm run format
```

**调试技巧**：
- 使用浏览器 Vue DevTools 插件
- 在组件中使用 `console.log` 进行调试
- 利用 TypeScript 的类型提示功能
- 使用 Vite 的热更新功能快速开发

## 部署和配置

### 生产环境构建

```bash
npm run build
```

构建产物将生成在 `dist/` 目录中。

### 环境变量配置

可以通过 `.env` 文件配置环境变量：

```bash
# n8n webhook 端点
VITE_N8N_WEBHOOK_URL=http://your-n8n-instance:5678/webhook/your-webhook-id

# 图像诊断API端点
VITE_IMAGE_DIAGNOSIS_API=http://your-image-api-server.com

# API 基础路径
VITE_API_BASE_URL=http://your-api-server.com

# 应用配置
VITE_APP_TITLE=国网故障诊断系统
VITE_APP_VERSION=2.0.0
```

### 🌐 部署方案

#### 1. 静态文件部署

系统采用 SPA (单页应用) 架构，构建为纯静态文件，支持多种部署方式：

```bash
# 构建生产版本
npm run build

# 构建完成后的 dist/ 目录结构
dist/
├── index.html                    # 主 HTML 文件
├── assets/                       # 资源文件目录
│   ├── index-[hash].js          # 主 JavaScript 包
│   ├── index-[hash].css         # 主样式文件
│   ├── [component]-[hash].js    # 组件懒加载包
│   └── [other-assets]           # 其他静态资源
├── favicon.ico                   # 网站图标
└── [other-static-files]         # 其他静态文件

# 文件大小优化
- JavaScript 包已开启 Tree Shaking
- CSS 已开启自动前缀和压缩
- 图片资源已优化压缩
- 支持 Gzip/Brotli 压缩
```

#### 2. 推荐部署平台

- **Nginx**: 高性能Web服务器
  ```nginx
  server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    location / {
      try_files $uri $uri/ /index.html;
    }
  }
  ```

- **Apache**: 传统Web服务器
- **CDN部署**: 阿里云OSS、腾讯云COS等
- **容器化**: Docker + Nginx

#### 3. Docker 容器化部署

**多阶段 Dockerfile**:
```dockerfile
# 构建阶段
FROM node:22-alpine AS builder
WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine AS production

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf 配置**:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # 支持 Vue Router 的 History 模式
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # 启用 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Docker Compose 部署**:
```yaml
# docker-compose.yml
version: '3.8'
services:
  fault-diagnosis-web:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/nginx
```

## 📊 系统特色亮点

### 🎯 技术创新点

1. **逻辑门可视化引擎** - 业界首创的电力故障诊断逻辑门可视化系统
2. **多模态诊断集成** - 融合气体分析、图像AI、逻辑推理的综合诊断平台
3. **专业数据驱动** - 基于实际PDF技术文档的专业故障诊断知识库
4. **企业级管理** - 完整的故障树生命周期管理和权限控制系统

### 🏆 应用价值

- **提升诊断效率**: 可视化逻辑关系，快速定位故障原因
- **降低操作门槛**: 直观的图形界面，降低专业技术要求
- **标准化流程**: 基于国网标准的标准化诊断流程
- **知识沉淀**: 故障树模板化管理，积累诊断经验

## 🤝 贡献指南

欢迎为项目贡献代码！请遵循以下流程：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献类型

- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX 优化
- ⚡ 性能优化

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## 📞 技术支持

如有问题或建议，请通过以下方式联系：

- **GitHub Issues**: [提交问题和建议](https://github.com/your-org/fault-diagnosis-system/issues)
- **技术文档**: 查看项目Wiki获取详细技术文档
- **社区讨论**: 加入技术讨论群组

## 🙏 致谢

感谢所有为项目做出贡献的开发者和国家电网提供的专业技术指导。

---

© 2024 国网故障诊断系统. All rights reserved.

**⚡ 现代化 | 🧠 智能化 | 🔬 专业化 | 🎯 可视化**