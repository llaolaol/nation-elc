<template>
  <div class="document-management">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <h1>文档管理</h1>
      <p style="color: #606266; margin-top: 8px">上传、管理和查看故障树文档</p>
    </el-card>

    <!-- 文档上传区域 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>文档上传</span>
      </template>
      
      <el-upload
        class="upload-area"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        :file-list="fileList"
        multiple
        accept=".txt,.json,.xlsx,.xls,.pdf,.doc,.docx"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <div class="el-upload__tip">
          支持 .txt、.json、.xlsx、.xls、.pdf、.doc、.docx 格式文件
        </div>
      </el-upload>
    </el-card>

    <!-- 文档查询区域 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>文档查询</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery.name"
            placeholder="请输入文档名称"
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="searchQuery.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleSearch"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 文档列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>文档列表</span>
      </template>
      
      <el-table 
        :data="filteredDocuments" 
        class="document-table"
        style="width: 100%" 
        v-loading="loading"
        :row-class-name="getRowClassName"
        :header-row-class-name="'table-header'"
      >
        <el-table-column prop="name" label="文档名称" min-width="200">
          <template #default="{ row }">
            <div class="file-name-wrapper">
              <el-icon class="file-icon" :class="getFileTypeIconClass(row.type)">
                <component :is="getFileTypeIcon(row.type)" />
              </el-icon>
              <el-link 
                class="file-name-link" 
                type="primary" 
                @click="previewDocument(row)"
                :underline="false"
              >
                {{ row.name }}
              </el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="文件类型" width="140">
          <template #default="{ row }">
            <div class="file-type-wrapper">
              <el-icon class="file-type-icon" :class="getFileTypeIconClass(row.type)">
                <component :is="getFileTypeIcon(row.type)" />
              </el-icon>
              <el-tag 
                class="file-type-tag"
                :class="getFileTypeClass(row.type)"
                size="small"
                effect="light"
              >
                {{ row.type.toUpperCase() }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="预览文件" placement="top">
                <el-button 
                  class="action-btn preview-btn" 
                  size="small" 
                  circle
                  @click="previewDocument(row)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip content="下载文件" placement="top">
                <el-button 
                  class="action-btn download-btn" 
                  size="small" 
                  circle
                  @click="downloadDocument(row)"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip content="删除文件" placement="top">
                <el-button 
                  class="action-btn delete-btn" 
                  size="small" 
                  circle
                  @click="deleteDocument(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-dropdown class="more-actions" trigger="click">
                <el-button class="action-btn more-btn" size="small" circle>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="previewDocument(row)">
                      <el-icon><View /></el-icon> 预览
                    </el-dropdown-item>
                    <el-dropdown-item @click="downloadDocument(row)">
                      <el-icon><Download /></el-icon> 下载
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteDocument(row)">
                      <el-icon><Delete /></el-icon> 删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 文件预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="currentPreviewFile?.name"
      width="80%"
      :before-close="closePreviewDialog"
      destroy-on-close
    >
      <div class="preview-container" v-loading="previewLoading">
        <!-- 文本文件预览 -->
        <div v-if="previewFileType === 'text'" class="text-preview">
          <el-scrollbar height="500px">
            <pre class="text-content">{{ previewContent }}</pre>
          </el-scrollbar>
        </div>

        <!-- JSON文件预览 -->
        <div v-else-if="previewFileType === 'json'" class="json-preview">
          <el-scrollbar height="500px">
            <pre class="json-content">{{ formatJsonContent(previewContent) }}</pre>
          </el-scrollbar>
        </div>

        <!-- Excel文件预览 -->
        <div v-else-if="previewFileType === 'excel'" class="excel-preview">
          <el-alert 
            title="Excel文件预览" 
            type="info" 
            :closable="false" 
            style="margin-bottom: 16px"
          >
            <template #default>
              由于浏览器限制，Excel文件将显示为表格格式的预览
            </template>
          </el-alert>
          <el-table :data="excelPreviewData" style="width: 100%" max-height="400px">
            <el-table-column 
              v-for="(column, index) in excelColumns" 
              :key="index"
              :prop="column.prop" 
              :label="column.label"
              min-width="120"
            />
          </el-table>
        </div>

        <!-- PDF文件预览 -->
        <div v-else-if="previewFileType === 'pdf'" class="pdf-preview">
          <el-alert 
            title="PDF文件预览" 
            type="info" 
            :closable="false" 
            style="margin-bottom: 16px"
          >
            <template #default>
              PDF文档预览，支持多页显示
            </template>
          </el-alert>
          <el-scrollbar height="500px">
            <div v-for="page in pdfPreviewData" :key="page.pageNumber" class="pdf-page">
              <div class="page-header">第 {{ page.pageNumber }} 页</div>
              <canvas 
                :ref="el => { if (el) page.canvas = el as HTMLCanvasElement }"
                class="pdf-canvas"
              ></canvas>
            </div>
            <div v-if="pdfPreviewData.length === 0" class="pdf-loading">
              正在加载PDF文档...
            </div>
          </el-scrollbar>
        </div>

        <!-- DOC文件预览 -->
        <div v-else-if="previewFileType === 'doc'" class="doc-preview">
          <el-alert 
            title="Word文档预览" 
            type="info" 
            :closable="false" 
            style="margin-bottom: 16px"
          >
            <template #default>
              由于浏览器限制，Word文档将显示文本内容预览
            </template>
          </el-alert>
          <el-scrollbar height="500px">
            <div class="doc-content" v-html="docPreviewContent"></div>
          </el-scrollbar>
        </div>

        <!-- 不支持的文件类型 -->
        <div v-else class="unsupported-preview">
          <el-empty description="该文件类型暂不支持预览">
            <el-button type="primary" @click="downloadDocument(currentPreviewFile!)">
              <el-icon><Download /></el-icon>
              下载查看
            </el-button>
          </el-empty>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closePreviewDialog">关闭</el-button>
          <el-button type="primary" @click="downloadDocument(currentPreviewFile!)">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UploadFilled, 
  Search, 
  Refresh, 
  View, 
  Download, 
  Delete,
  MoreFilled,
  Document,
  FolderOpened,
  PictureRounded,
  Files
} from '@element-plus/icons-vue'
import { mockApi } from '@/services/mockApi.v2'
import * as XLSX from 'xlsx'
import * as pdfjs from 'pdfjs-dist'

// 设置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// 类型定义
interface Document {
  id: string
  name: string
  size: number
  uploadTime: Date
  type: string
  content?: string | ArrayBuffer | any
}

interface SearchQuery {
  name: string
  dateRange: [Date, Date] | null
}

// 响应式数据
const loading = ref(false)
const fileList = ref([])
const documents = ref<Document[]>([])
const searchQuery = reactive<SearchQuery>({
  name: '',
  dateRange: null
})

// 预览相关数据
const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const currentPreviewFile = ref<Document | null>(null)
const previewContent = ref('')
const previewFileType = ref<'text' | 'json' | 'excel' | 'pdf' | 'doc' | 'unsupported'>('text')
const excelPreviewData = ref<any[]>([])
const excelColumns = ref<{prop: string, label: string}[]>([])
const pdfPreviewData = ref<{pageNumber: number, canvas: HTMLCanvasElement}[]>([])
const docPreviewContent = ref('')

// 计算属性
const filteredDocuments = computed(() => {
  let filtered = documents.value

  // 按名称搜索
  if (searchQuery.name) {
    filtered = filtered.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.name.toLowerCase())
    )
  }

  // 按日期范围搜索
  if (searchQuery.dateRange) {
    const [startDate, endDate] = searchQuery.dateRange
    filtered = filtered.filter(doc => {
      const uploadDate = new Date(doc.uploadTime)
      return uploadDate >= startDate && uploadDate <= endDate
    })
  }

  return filtered
})

// 生命周期钩子
onMounted(async () => {
  await loadDocuments()
})

// 方法
const loadDocuments = async () => {
  loading.value = true
  try {
    const docs = await mockApi.getDocuments()
    documents.value = docs
  } catch (error) {
    ElMessage.error('加载文档列表失败')
  } finally {
    loading.value = false
  }
}

const beforeUpload = (file: File) => {
  const allowedTypes = ['txt', 'json', 'xlsx', 'xls', 'pdf', 'doc', 'docx']
  const fileType = file.name.split('.').pop()?.toLowerCase()
  
  if (!allowedTypes.includes(fileType || '')) {
    ElMessage.error('只支持 txt、json、xlsx、xls、pdf、doc、docx 格式文件')
    return false
  }
  
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  return true
}

const handleFileChange = async (file: any) => {
  if (!beforeUpload(file.raw)) {
    return
  }
  
  loading.value = true
  try {
    const uploadedDoc = await mockApi.uploadDocument(file.raw)
    ElMessage.success('文件上传成功')
    await loadDocuments() // 重新加载文档列表
    fileList.value = [] // 清空文件列表
  } catch (error) {
    ElMessage.error('文件上传失败')
  } finally {
    loading.value = false
  }
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('文件上传成功')
  // 添加到文档列表
  const newDoc: Document = {
    id: Date.now().toString(),
    name: file.name,
    size: file.size,
    uploadTime: new Date(),
    type: file.name.split('.').pop()?.toLowerCase() || ''
  }
  documents.value.unshift(newDoc)
}

const handleUploadError = () => {
  ElMessage.error('文件上传失败')
}

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const resetSearch = () => {
  searchQuery.name = ''
  searchQuery.dateRange = null
}

const previewDocument = async (doc: Document) => {
  currentPreviewFile.value = doc
  previewDialogVisible.value = true
  previewLoading.value = true
  
  try {
    // 根据文件类型设置预览类型
    const fileType = doc.type.toLowerCase()
    
    if (fileType === 'txt') {
      previewFileType.value = 'text'
      previewContent.value = await loadTextContent(doc)
    } else if (fileType === 'json') {
      previewFileType.value = 'json'
      previewContent.value = await loadJsonContent(doc)
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      previewFileType.value = 'excel'
      await loadExcelContent(doc)
    } else if (fileType === 'pdf') {
      previewFileType.value = 'pdf'
      await loadPdfContent(doc)
    } else if (fileType === 'doc' || fileType === 'docx') {
      previewFileType.value = 'doc'
      await loadDocContent(doc)
    } else {
      previewFileType.value = 'unsupported'
    }
  } catch (error) {
    ElMessage.error('文件预览失败')
    console.error('Preview error:', error)
  } finally {
    previewLoading.value = false
  }
}

// 加载文本内容
const loadTextContent = async (doc: Document): Promise<string> => {
  // 这里应该调用API获取文件内容，目前返回模拟数据
  return `这是文档 "${doc.name}" 的内容预览。

实际项目中，这里会显示文本文件的真实内容。
您可以在这里看到完整的文档内容，支持滚动查看。

文件大小: ${formatFileSize(doc.size)}
上传时间: ${formatDate(doc.uploadTime)}

--- 文档内容 ---
故障树分析文档
1. 系统概述
2. 故障模式分析
3. 风险评估
4. 维护建议

更多内容...`
}

// 加载JSON内容
const loadJsonContent = async (doc: Document): Promise<string> => {
  // 模拟JSON数据
  const jsonData = {
    "document": {
      "name": doc.name,
      "type": "fault-tree-analysis",
      "version": "1.0",
      "created": doc.uploadTime,
      "content": {
        "root_event": "系统故障",
        "fault_tree": [
          {
            "event_id": "E001",
            "description": "电源故障",
            "probability": 0.1,
            "children": ["E001.1", "E001.2"]
          },
          {
            "event_id": "E002", 
            "description": "软件故障",
            "probability": 0.05,
            "children": []
          }
        ],
        "analysis_results": {
          "total_probability": 0.15,
          "critical_paths": ["E001 -> E001.1"],
          "recommendations": ["定期检查电源", "更新软件版本"]
        }
      }
    }
  }
  
  return JSON.stringify(jsonData)
}

// 加载 PDF 内容
const loadPdfContent = async (doc: Document) => {
  try {
    const fullDoc = await mockApi.getDocument(doc.id)
    if (!fullDoc || !fullDoc.content) {
      throw new Error('无法获取PDF文档内容')
    }

    const arrayBuffer = fullDoc.content as ArrayBuffer
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    
    pdfPreviewData.value = []
    
    // 渲染所有页面（最多5页防止性能问题）
    const maxPages = Math.min(pdf.numPages, 5)
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const scale = 1.5
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }
      
      await page.render(renderContext).promise
      
      pdfPreviewData.value.push({
        pageNumber: pageNum,
        canvas: canvas
      })
    }
    
    // 如果有更多页面，显示提示
    if (pdf.numPages > 5) {
      ElMessage.info(`PDF文档共${pdf.numPages}页，仅显示前5页`)
    }
  } catch (error) {
    console.error('PDF加载错误:', error)
    ElMessage.error('PDF文档加载失败')
    pdfPreviewData.value = []
  }
}

// 加载 DOC 内容
const loadDocContent = async (doc: Document) => {
  try {
    const fullDoc = await mockApi.getDocument(doc.id)
    if (!fullDoc || !fullDoc.content) {
      throw new Error('无法获取Word文档内容')
    }

    // 由于浏览器限制，我们无法直接解析DOC/DOCX文件
    // 这里显示一个提示信息
    docPreviewContent.value = `
      <div class="doc-placeholder">
        <h3>📄 Word 文档预览</h3>
        <p><strong>文件名：</strong>${doc.name}</p>
        <p><strong>文件大小：</strong>${formatFileSize(doc.size)}</p>
        <p><strong>上传时间：</strong>${formatDate(doc.uploadTime)}</p>
        <br>
        <p>由于浏览器安全限制，无法直接在网页中预览 Word 文档内容。</p>
        <p>请下载文件到本地后使用 Microsoft Word 或兼容软件打开查看。</p>
        <br>
        <div class="doc-tips">
          <h4>💡 建议：</h4>
          <ul>
            <li>可以将 Word 文档转换为 PDF 格式后上传，以获得更好的预览支持</li>
            <li>或者将文档内容复制到 .txt 文件中上传</li>
          </ul>
        </div>
      </div>
    `
  } catch (error) {
    console.error('DOC加载错误:', error)
    docPreviewContent.value = `
      <div class="doc-error">
        <h3>⚠️ 加载失败</h3>
        <p>无法加载 Word 文档，请检查文件是否损坏。</p>
      </div>
    `
  }
}

// 加载Excel内容
const loadExcelContent = async (doc: Document) => {
  try {
    // 获取文档内容
    const fullDoc = await mockApi.getDocument(doc.id)
    if (!fullDoc || !fullDoc.content) {
      throw new Error('无法获取文档内容')
    }

    let workbook: XLSX.WorkBook
    
    // 如果已经是解析后的工作簿对象，直接使用
    if (typeof fullDoc.content === 'object' && fullDoc.content && 'SheetNames' in fullDoc.content) {
      workbook = fullDoc.content as XLSX.WorkBook
    } else {
      // 否则尝试从字符串或二进制数据解析
      if (typeof fullDoc.content === 'string') {
        // 如果是字符串，返回默认数据
        throw new Error('无法解析Excel文件内容')
      } else if (fullDoc.content instanceof ArrayBuffer) {
        // 如果是 ArrayBuffer，先转换为 Uint8Array 再解析
        const data = new Uint8Array(fullDoc.content)
        workbook = XLSX.read(data, { type: 'array' })
      } else {
        workbook = fullDoc.content as XLSX.WorkBook
      }
    }

    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 将工作表转换为JSON数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (jsonData.length === 0) {
      throw new Error('Excel文件为空')
    }

    // 获取表头（第一行）
    const headers = jsonData[0] as string[]
    const rows = jsonData.slice(1) as any[][]

    // 构建列配置
    excelColumns.value = headers.map((header, index) => ({
      prop: `col_${index}`,
      label: header || `列${index + 1}`
    }))

    // 构建表格数据
    excelPreviewData.value = rows.map(row => {
      const rowData: Record<string, any> = {}
      headers.forEach((_, index) => {
        rowData[`col_${index}`] = row[index] || ''
      })
      return rowData
    })

  } catch (error) {
    console.error('Excel解析错误:', error)
    // 如果解析失败，返回默认数据
    excelColumns.value = [
      { prop: 'component', label: '组件名称' },
      { prop: 'failure_mode', label: '故障模式' },
      { prop: 'probability', label: '故障概率' },
      { prop: 'impact', label: '影响程度' },
      { prop: 'recommendation', label: '维护建议' }
    ]
    
    excelPreviewData.value = [
      {
        component: '无法解析Excel文件',
        failure_mode: '请检查文件格式',
        probability: '-',
        impact: '-',
        recommendation: '重新上传正确的Excel文件'
      }
    ]
  }
}

// 格式化JSON内容
const formatJsonContent = (content: string): string => {
  try {
    const parsed = JSON.parse(content)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return content
  }
}

// 关闭预览弹窗
const closePreviewDialog = () => {
  previewDialogVisible.value = false
  currentPreviewFile.value = null
  previewContent.value = ''
  excelPreviewData.value = []
  excelColumns.value = []
  pdfPreviewData.value = []
  docPreviewContent.value = ''
}

const downloadDocument = (doc: Document) => {
  ElMessage.success(`下载文档: ${doc.name}`)
  // 实现文档下载逻辑
}

const deleteDocument = async (doc: Document) => {
  ElMessageBox.confirm(
    `确定要删除文档 "${doc.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    loading.value = true
    try {
      const success = await mockApi.deleteDocument(doc.id)
      if (success) {
        ElMessage.success('删除成功')
        await loadDocuments() // 重新加载文档列表
      } else {
        ElMessage.error('删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    } finally {
      loading.value = false
    }
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 获取文件类型图标
const getFileTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    'json': FolderOpened,
    'txt': Document, 
    'xlsx': Files,
    'xls': Files,
    'pdf': Document,
    'doc': Document,
    'docx': Document
  }
  return icons[type] || Document
}

// 获取文件类型图标样式类
const getFileTypeIconClass = (type: string) => {
  const classes: Record<string, string> = {
    'json': 'icon-json',
    'txt': 'icon-text', 
    'xlsx': 'icon-excel',
    'xls': 'icon-excel',
    'pdf': 'icon-pdf',
    'doc': 'icon-doc',
    'docx': 'icon-doc'
  }
  return classes[type] || 'icon-default'
}

// 获取文件类型样式类
const getFileTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    'json': 'tag-json',
    'txt': 'tag-text', 
    'xlsx': 'tag-excel',
    'xls': 'tag-excel',
    'pdf': 'tag-pdf',
    'doc': 'tag-doc',
    'docx': 'tag-doc'
  }
  return classes[type] || 'tag-default'
}

// 获取表格行类名
const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'table-row-even' : 'table-row-odd'
}

const getFileTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'json': 'success',
    'txt': 'info', 
    'xlsx': 'warning',
    'xls': 'warning',
    'pdf': 'danger',
    'doc': 'primary',
    'docx': 'primary'
  }
  return colors[type] || 'info'
}
</script>

<style scoped>
.document-management {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.header-card {
  border: none;
  margin-bottom: 20px;
}

.header-card :deep(.el-card__body) {
  padding: 20px 0;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
}

.el-upload__tip {
  margin-top: 10px;
  color: #606266;
}

/* 确保卡片占满可用空间 */
.el-card {
  width: 100%;
}

/* 表格整体样式优化 */
.document-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表头样式 */
.document-table :deep(.table-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.document-table :deep(.table-header th) {
  background: transparent !important;
  border: none;
  color: white;
  padding: 16px 12px;
}

/* 表格行样式 */
.document-table :deep(.table-row-even) {
  background-color: #fafbfc;
}

.document-table :deep(.table-row-odd) {
  background-color: #ffffff;
}

.document-table :deep(.el-table__row) {
  transition: all 0.3s ease;
  cursor: pointer;
}

.document-table :deep(.el-table__row:hover) {
  background-color: #f0f9ff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.document-table :deep(.el-table td) {
  border: none;
  padding: 16px 12px;
  vertical-align: middle;
}

/* 文件名称区域 */
.file-name-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-name-link {
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1;
  text-align: left;
}

.file-name-link:hover {
  transform: translateX(4px);
  color: #409eff;
}

/* 文件类型标签区域 */
.file-type-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}

.file-type-icon {
  font-size: 16px;
}

.file-type-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 12px;
  padding: 4px 8px;
  border: none;
}

/* 文件类型图标颜色 */
.icon-json { color: #52c41a; }
.icon-text { color: #1890ff; }
.icon-excel { color: #52c41a; }
.icon-pdf { color: #f5222d; }
.icon-doc { color: #1890ff; }
.icon-default { color: #8c8c8c; }

/* 文件类型标签颜色 */
.tag-json {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
}

.tag-text {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
}

.tag-excel {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
}

.tag-pdf {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
  color: white;
}

.tag-doc {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
}

.tag-default {
  background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
  color: white;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 0;
}

.action-btn .el-icon {
  position: relative;
  z-index: 1;
  font-size: 14px;
}

.preview-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.preview-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.download-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
}

.download-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 20px rgba(82, 196, 26, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
  color: white;
}

.delete-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 20px rgba(245, 34, 45, 0.4);
}

.more-btn {
  background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
  color: white;
}

.more-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 6px 20px rgba(140, 140, 140, 0.4);
}

/* 更多操作下拉菜单 */
.more-actions {
  display: none;
}

/* 响应式设计 */
.el-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .action-buttons .action-btn:not(.more-btn) {
    display: none;
  }
  
  .more-actions {
    display: block;
  }
  
  .file-name-wrapper {
    gap: 8px;
  }
  
  .file-name-link {
    font-size: 14px;
  }
  
  .file-type-wrapper {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  
  .document-table :deep(.el-table td) {
    padding: 12px 8px;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    justify-content: center;
  }
  
  .file-type-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
}

/* 预览弹窗样式 */
.preview-container {
  min-height: 300px;
}

.text-preview,
.json-preview {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
}

.text-content,
.json-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.json-content {
  background-color: #2d3748;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 4px;
}

.excel-preview {
  background-color: #fff;
}

.pdf-preview {
  background-color: #f5f5f5;
}

.pdf-page {
  margin-bottom: 20px;
  text-align: center;
}

.page-header {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  font-weight: bold;
}

.pdf-canvas {
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 100%;
  height: auto;
}

.pdf-loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.doc-preview {
  background-color: #f8f9fa;
}

.doc-content {
  padding: 20px;
  background-color: white;
  border-radius: 6px;
  margin: 10px;
}

.doc-placeholder {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.doc-placeholder h3 {
  color: #409eff;
  margin-bottom: 20px;
}

.doc-placeholder p {
  line-height: 1.6;
  margin-bottom: 10px;
}

.doc-tips {
  text-align: left;
  background-color: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.doc-tips h4 {
  margin-bottom: 10px;
  color: #409eff;
}

.doc-tips ul {
  margin-left: 20px;
}

.doc-tips li {
  margin-bottom: 5px;
}

.doc-error {
  text-align: center;
  color: #f56c6c;
}

.doc-error h3 {
  margin-bottom: 10px;
}

.unsupported-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .preview-container {
    font-size: 12px;
  }
}
</style>