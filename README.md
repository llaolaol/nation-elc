# 故障诊断系统 (Fault Diagnosis System)

基于 n8n 工作流的变压器故障诊断系统，提供智能化的电力设备故障分析和诊断功能。

## 项目概述

本项目是一个专为电力变压器故障诊断设计的纯前端展示系统，通过集成 n8n 工作流平台实现后端诊断逻辑。系统支持多种气体分析参数输入，能够进行智能故障分析，并提供可视化的故障树预览和历史记录管理功能。

### 主要特性

- 🔬 **智能诊断**：基于气体分析的多参数故障诊断
- 📊 **可视化展示**：ECharts 驱动的故障树可视化
- 📱 **响应式设计**：适配不同设备的现代化 UI 界面
- 📈 **历史追踪**：完整的诊断历史记录管理
- 📄 **文档管理**：支持多种格式的技术文档管理

## 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的前端构建工具

### UI 组件与样式
- **Element Plus** - 基于 Vue 3 的组件库
- **ECharts** + **vue-echarts** - 数据可视化图表库

### 状态管理与路由
- **Pinia** - Vue 3 官方状态管理库
- **Vue Router** - Vue.js 官方路由管理器

### 文档处理
- **PDF.js** - PDF 文档解析和展示
- **xlsx** - Excel 文档处理库

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型检查

## 功能模块

### 1. 故障参数输入与诊断
- 支持 7 种关键气体浓度参数输入（H2、CH4、C2H6、C2H4、C2H2、CO、CO2）
- 实时参数验证和范围检查
- 一键触发诊断分析
- 详细的诊断结果展示

### 2. 故障树可视化预览
- 交互式故障树图表展示
- 支持节点搜索和筛选
- 多层级节点展开/折叠功能
- 自定义节点样式和布局

### 3. 诊断历史记录管理
- 完整的诊断历史追踪
- 支持历史数据导出
- 诊断结果对比分析
- 数据统计和趋势分析

### 4. 文档管理系统
- 支持多种文档格式（PDF、Excel、Word、JSON等）
- 文档在线预览功能
- 文档分类和标签管理
- 文档搜索和筛选

## 项目结构

```
fault-diagnosis-system/
├── public/                     # 静态资源
├── src/
│   ├── assets/                # 静态资源文件
│   ├── components/            # Vue 组件
│   │   ├── common/           # 通用组件
│   │   └── icons/            # 图标组件
│   ├── composables/          # Vue 组合式函数
│   ├── constants/            # 应用常量定义
│   ├── router/               # 路由配置
│   ├── services/             # API 服务层
│   │   ├── diagnosis.ts      # 故障诊断服务
│   │   ├── mockApi.v2.ts     # 模拟 API 服务
│   │   └── visualization.ts  # 可视化服务
│   ├── stores/               # Pinia 状态管理
│   ├── types/                # TypeScript 类型定义
│   ├── utils/                # 工具函数
│   ├── views/                # 页面组件
│   │   ├── FaultDiagnosis.vue    # 故障诊断页面
│   │   ├── FaultTreePreview.vue  # 故障树预览页面
│   │   ├── DiagnosisHistory.vue  # 诊断历史页面
│   │   └── DocumentManagement.vue # 文档管理页面
│   ├── App.vue               # 根组件
│   └── main.ts               # 应用入口
├── package.json              # 项目依赖配置
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 构建配置
└── README.md                 # 项目说明文档
```

## API 集成说明

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

### 本地模拟 API

开发环境下，系统还提供了本地模拟 API 服务 (`mockApi.v2.ts`)，支持：

- 智能诊断逻辑模拟
- 三比值法分析
- 特征气体分析
- DPM 诊断方法
- 完整的故障类型识别

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
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run type-check   # TypeScript 类型检查
npm run lint         # ESLint 代码检查
npm run format       # Prettier 代码格式化
```

## 开发指南

### 代码规范

项目采用 ESLint + Prettier 进行代码质量控制：

- **ESLint**: 负责代码质量检查和潜在问题识别
- **Prettier**: 负责代码格式化和风格统一
- **TypeScript**: 提供类型安全和开发时错误检查

### 添加新的诊断方法

1. 在 `src/types/index.ts` 中定义相关类型接口
2. 在 `src/services/diagnosis.ts` 中实现 API 调用逻辑
3. 在相应的 Vue 组件中集成新的诊断方法
4. 更新 `src/constants/index.ts` 中的相关常量配置

### 组件开发规范

- 使用 Vue 3 Composition API
- 优先使用 TypeScript 进行类型标注
- 遵循 Element Plus 组件库设计规范
- 保持组件的单一职责原则

## 部署和配置

### 生产环境构建

```bash
npm run build
```

构建产物将生成在 `dist/` 目录中。

### 环境变量

可以通过 `.env` 文件配置环境变量：

```bash
# n8n webhook 端点
VITE_N8N_WEBHOOK_URL=http://your-n8n-instance:5678/webhook/your-webhook-id

# API 基础路径
VITE_API_BASE_URL=http://your-api-server.com

# 应用标题
VITE_APP_TITLE=故障诊断系统
```

### 部署配置

系统可以部署到任何支持静态文件托管的平台，如：

- **Nginx**: 配置反向代理和静态文件服务
- **Apache**: 配置虚拟主机和文件服务
- **CDN**: 部署到云服务平台的静态站点服务

## 许可证

[MIT License](LICENSE)

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目 Issues 页面]
- Email: [联系邮箱]

---

© 2024 故障诊断系统. All rights reserved.