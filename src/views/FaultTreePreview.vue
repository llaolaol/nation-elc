<template>
  <div class="fault-tree-preview">
    <!-- 页面标题 -->
    <el-card class="header-card" shadow="never">
      <h1>故障树预览</h1>
      <p style="color: #606266; margin-top: 8px">选择文档并预览对应的故障树结构</p>
    </el-card>

    <!-- 文档选择区域 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>选择故障树文档</span>
      </template>
      
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-select
            v-model="selectedDocumentId"
            placeholder="请选择要预览的文档"
            style="width: 100%"
            @change="handleDocumentChange"
            :loading="documentsLoading"
          >
            <el-option
              v-for="doc in availableDocuments"
              :key="doc.id"
              :label="doc.name"
              :value="doc.id"
              :disabled="!isSupportedFormat(doc.type)"
            >
              <span style="float: left">{{ doc.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                {{ doc.type.toUpperCase() }}
              </span>
            </el-option>
          </el-select>
        </el-col>
        
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索节点..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        
        <el-col :span="8">
          <el-button-group>
            <el-button @click="expandAll">
              <el-icon><Plus /></el-icon>
              展开全部
            </el-button>
            <el-button @click="collapseAll">
              <el-icon><Minus /></el-icon>
              收起全部
            </el-button>
            <el-button @click="resetView">
              <el-icon><Refresh /></el-icon>
              重置视图
            </el-button>
          </el-button-group>
        </el-col>
      </el-row>
    </el-card>

    <!-- 故障树展示区域 -->
    <el-card style="margin-top: 20px; height: calc(100vh - 300px); min-height: 600px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>故障树结构图</span>
          <div v-if="selectedDocument">
            <el-tag type="info">{{ selectedDocument.name }}</el-tag>
            <el-tag type="success" style="margin-left: 8px">
              节点数: {{ totalNodes }}
            </el-tag>
            <el-tag type="warning" style="margin-left: 8px" v-if="faultTreeData">
              💡 可展开全部查看完整结构
            </el-tag>
          </div>
        </div>
      </template>
      
      <div 
        v-loading="treeLoading" 
        element-loading-text="正在加载故障树..."
        style="height: 100%; position: relative"
      >
        <div v-if="!selectedDocumentId" class="empty-state">
          <el-empty description="请选择一个文档来预览故障树" />
        </div>
        
        <div v-else-if="!faultTreeData" class="empty-state">
          <el-empty description="该文档不包含有效的故障树数据" />
        </div>
        
        <!-- HTML思维导图容器 -->
        <div v-else ref="mindmapContainer" class="mindmap-container"></div>
      </div>
    </el-card>

    <!-- 节点详情抽屉 -->
    <el-drawer
      v-model="showNodeDetail"
      title="节点详情"
      direction="rtl"
      size="400px"
    >
      <div v-if="selectedNode">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="节点名称">
            {{ selectedNode.name }}
          </el-descriptions-item>
          <el-descriptions-item label="节点级别">
            <el-tag :type="getLevelTagType(selectedNode.level)">
              {{ selectedNode.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="子节点数" v-if="selectedNode.children">
            {{ selectedNode.children.length }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px" v-if="selectedNode.name.includes('建议')">
          <h4>建议措施</h4>
          <el-alert
            :title="selectedNode.name"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Minus, Refresh, Search } from '@element-plus/icons-vue'
import { mockApi, type DocumentInfo } from '@/services/mockApi.v2'

// 响应式数据
const documentsLoading = ref(false)
const treeLoading = ref(false)
const availableDocuments = ref<DocumentInfo[]>([])
const selectedDocumentId = ref('')
const selectedDocument = ref<DocumentInfo | null>(null)
const faultTreeData = ref<any>(null)
const searchKeyword = ref('')
const showNodeDetail = ref(false)
const selectedNode = ref<any>(null)
const mindmapContainer = ref<HTMLElement>()

// 计算属性
const totalNodes = computed(() => {
  if (!faultTreeData.value) return 0
  // 处理单个对象或数组格式
  return Array.isArray(faultTreeData.value) ? 
    countNodes(faultTreeData.value) : 
    countSingleNode(faultTreeData.value)
})

// 递归计算节点总数
const countNodes = (nodes: any[]): number => {
  let count = 0
  nodes.forEach(node => {
    count++
    if (node.children && node.children.length > 0) {
      count += countNodes(node.children)
    }
  })
  return count
}

// 计算单个节点及其子节点总数
const countSingleNode = (node: any): number => {
  let count = 1
  if (node.children && node.children.length > 0) {
    count += countNodes(node.children)
  }
  return count
}

// 生命周期钩子
onMounted(async () => {
  await loadDocuments()
  
  // 默认选择包含transformer_fault_detection_json的文档并显示
  if (availableDocuments.value.length > 0) {
    const defaultDoc = availableDocuments.value.find(doc => doc.name.includes('transformer_fault_detection_json'))
    if (defaultDoc) {
      selectedDocumentId.value = defaultDoc.id
      await handleDocumentChange()
    }
  }
})

// 方法
const loadDocuments = async () => {
  documentsLoading.value = true
  try {
    const docs = await mockApi.getDocuments()
    availableDocuments.value = docs.filter(doc => isSupportedFormat(doc.type))
  } catch (error) {
    ElMessage.error('加载文档列表失败')
  } finally {
    documentsLoading.value = false
  }
}

const isSupportedFormat = (type: string) => {
  return ['txt', 'json'].includes(type.toLowerCase())
}

const handleDocumentChange = async () => {
  if (!selectedDocumentId.value) {
    selectedDocument.value = null
    faultTreeData.value = null
    return
  }

  treeLoading.value = true
  try {
    // 获取文档信息
    const doc = await mockApi.getDocument(selectedDocumentId.value)
    selectedDocument.value = doc

    // 获取故障树数据
    const treeData = await mockApi.getFaultTree(selectedDocumentId.value)
    faultTreeData.value = treeData

    if (treeData) {
      await nextTick()
      renderMindMap(treeData)
    } else {
      ElMessage.warning('该文档不包含有效的故障树数据')
    }
  } catch (error) {
    ElMessage.error('加载故障树数据失败')
  } finally {
    treeLoading.value = false
  }
}

const renderMindMap = (treeData: any) => {
  if (!mindmapContainer.value || !treeData) {
    console.warn('无法渲染思维导图:', { 
      hasContainer: !!mindmapContainer.value, 
      hasTreeData: !!treeData
    })
    return
  }

  console.log('开始渲染思维导图，数据:', treeData)

  // 清空容器
  mindmapContainer.value.innerHTML = ''
  
  // 创建思维导图HTML
  createMindMapHTML(mindmapContainer.value, treeData)
}

const createMindMapHTML = (container: HTMLElement, data: any) => {
  // 创建完整的HTML结构
  const htmlContent = `
    <style>
      .mindmap-wrapper {
        font-family: 'Microsoft YaHei', sans-serif;
        background: white;
        border-radius: 15px;
        padding: 20px;
        height: 100%;
        overflow: auto;
        max-height: calc(100vh - 350px);
      }
      
      .mindmap-content {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 20px;
        overflow-x: auto;
        overflow-y: visible;
        min-height: fit-content;
        width: max-content;
        min-width: 100%;
      }
      
      .tree-node {
        display: flex;
        align-items: center;
        margin: 10px 0;
        position: relative;
      }
      
      .node-content {
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        position: relative;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-weight: 500;
        min-width: 120px;
        text-align: center;
      }
      
      .node-content:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      }
      
      .level-根节点 { 
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        font-size: 18px;
        font-weight: 600;
        padding: 20px 30px;
        min-width: 180px;
      }
      
      .level-一级节点 { 
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        font-size: 16px;
        min-width: 140px;
      }
      
      .level-二级节点 { 
        background: linear-gradient(135deg, #2ecc71, #27ae60);
        color: white;
        font-size: 14px;
        min-width: 120px;
      }
      
      .level-三级节点 { 
        background: linear-gradient(135deg, #f39c12, #e67e22);
        color: white;
        font-size: 13px;
        min-width: 100px;
      }
      
      .level-四级节点 { 
        background: linear-gradient(135deg, #9b59b6, #8e44ad);
        color: white;
        font-size: 12px;
        min-width: 90px;
      }
      
      .level-五级节点 { 
        background: linear-gradient(135deg, #1abc9c, #16a085);
        color: white;
        font-size: 12px;
        min-width: 80px;
      }
      
      .level-六级节点 { 
        background: linear-gradient(135deg, #34495e, #2c3e50);
        color: white;
        font-size: 11px;
        min-width: 70px;
      }
      
      .children {
        display: none;
        flex-direction: column;
        margin-left: 40px;
        position: relative;
      }
      
      .children.expanded {
        display: flex;
        animation: slideIn 0.3s ease;
      }
      
      .children::before {
        content: '';
        position: absolute;
        left: -40px;
        top: 50%;
        width: 20px;
        height: 2px;
        background: #bdc3c7;
        transform: translateY(-50%);
      }
      
      .tree-node:not(:last-child)::after {
        content: '';
        position: absolute;
        left: -40px;
        top: 50%;
        bottom: -50%;
        width: 2px;
        background: #bdc3c7;
      }
      
      .tree-node:first-child::before {
        content: '';
        position: absolute;
        left: -40px;
        top: 50%;
        height: 50%;
        width: 2px;
        background: #bdc3c7;
      }
      
      .tree-node:last-child::before {
        content: '';
        position: absolute;
        left: -40px;
        top: -50%;
        height: 100%;
        width: 2px;
        background: #bdc3c7;
      }
      
      .tree-node:only-child::before {
        display: none;
      }
      
      .toggle-icon {
        position: absolute;
        right: -15px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ecf0f1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #7f8c8d;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .toggle-icon:hover {
        background: #d5dbdb;
        transform: translateY(-50%) scale(1.1);
      }
      
      .expanded > .node-content .toggle-icon {
        background: #3498db;
        color: white;
      }
      
      .leaf-node .toggle-icon {
        display: none;
      }
      
      .highlight {
        box-shadow: 0 0 20px #f1c40f !important;
        border: 3px solid #f39c12 !important;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    </style>
    
    <div class="mindmap-wrapper">
      <div class="mindmap-content" id="mindmapContent"></div>
    </div>
  `
  
  container.innerHTML = htmlContent
  
  // 获取内容容器并渲染节点
  const contentContainer = container.querySelector('#mindmapContent')
  if (contentContainer) {
    contentContainer.appendChild(createMindMapNode(data))
    
    // 默认展开到二级
    setTimeout(() => {
      expandToLevel(2)
    }, 100)
  }
}

const createMindMapNode = (data: any): HTMLElement => {
  const div = document.createElement('div')
  div.className = 'tree-node'
  
  const hasChildren = data.children && data.children.length > 0
  if (!hasChildren) {
    div.classList.add('leaf-node')
  }
  
  const content = document.createElement('div')
  content.className = `node-content level-${data.level}`
  content.textContent = data.name
  
  div.appendChild(content)
  
  if (hasChildren) {
    const toggleIcon = document.createElement('div')
    toggleIcon.className = 'toggle-icon'
    toggleIcon.textContent = '+'
    content.appendChild(toggleIcon)
    
    const childrenContainer = document.createElement('div')
    childrenContainer.className = 'children'
    
    data.children.forEach((child: any) => {
      childrenContainer.appendChild(createMindMapNode(child))
    })
    
    div.appendChild(childrenContainer)
    
    content.addEventListener('click', (e) => {
      e.stopPropagation()
      const isExpanded = div.classList.contains('expanded')
      if (isExpanded) {
        div.classList.remove('expanded')
        childrenContainer.classList.remove('expanded')
        toggleIcon.textContent = '+'
      } else {
        div.classList.add('expanded')
        childrenContainer.classList.add('expanded')
        toggleIcon.textContent = '−'
      }
    })
  }
  
  return div
}

const handleSearch = () => {
  if (!mindmapContainer.value || !searchKeyword.value.trim()) {
    clearHighlights()
    return
  }

  const query = searchKeyword.value.toLowerCase()
  const allNodes = mindmapContainer.value.querySelectorAll('.node-content')
  
  allNodes.forEach(node => {
    const element = node as HTMLElement
    element.classList.remove('highlight')
    const text = element.textContent?.toLowerCase() || ''
    
    if (text.includes(query)) {
      element.classList.add('highlight')
      // 展开路径到该节点
      let parent = element.parentElement
      while (parent && parent.classList.contains('tree-node')) {
        if (!parent.classList.contains('leaf-node')) {
          parent.classList.add('expanded')
          const children = parent.querySelector('.children')
          const toggleIcon = parent.querySelector('.toggle-icon')
          if (children) {
            children.classList.add('expanded')
          }
          if (toggleIcon) {
            toggleIcon.textContent = '−'
          }
        }
        parent = parent.parentElement?.parentElement || null
      }
    }
  })
}

const clearHighlights = () => {
  if (!mindmapContainer.value) return
  const allNodes = mindmapContainer.value.querySelectorAll('.node-content')
  allNodes.forEach(node => {
    node.classList.remove('highlight')
  })
}

const expandAll = () => {
  if (!mindmapContainer.value) return
  const allNodes = mindmapContainer.value.querySelectorAll('.tree-node')
  allNodes.forEach(node => {
    if (!node.classList.contains('leaf-node')) {
      node.classList.add('expanded')
      const children = node.querySelector('.children')
      const toggleIcon = node.querySelector('.toggle-icon')
      if (children) {
        children.classList.add('expanded')
      }
      if (toggleIcon) {
        toggleIcon.textContent = '−'
      }
    }
  })
}

const collapseAll = () => {
  if (!mindmapContainer.value) return
  const allNodes = mindmapContainer.value.querySelectorAll('.tree-node')
  allNodes.forEach(node => {
    node.classList.remove('expanded')
    const children = node.querySelector('.children')
    const toggleIcon = node.querySelector('.toggle-icon')
    if (children) {
      children.classList.remove('expanded')
    }
    if (toggleIcon) {
      toggleIcon.textContent = '+'
    }
  })
}

const expandToLevel = (maxLevel: number) => {
  if (!mindmapContainer.value) return
  
  collapseAll()
  const allNodes = mindmapContainer.value.querySelectorAll('.tree-node')
  allNodes.forEach(node => {
    const content = node.querySelector('.node-content')
    if (content) {
      const levelMatch = content.className.match(/level-(.+)/)
      if (levelMatch) {
        const level = levelMatch[1]
        const levelNum = getLevelNumber(level)
        
        if (levelNum <= maxLevel && !node.classList.contains('leaf-node')) {
          node.classList.add('expanded')
          const children = node.querySelector('.children')
          const toggleIcon = node.querySelector('.toggle-icon')
          if (children) {
            children.classList.add('expanded')
          }
          if (toggleIcon) {
            toggleIcon.textContent = '−'
          }
        }
      }
    }
  })
}

const getLevelNumber = (levelName: string): number => {
  const levelMap: Record<string, number> = {
    '根节点': 0,
    '一级节点': 1,
    '二级节点': 2,
    '三级节点': 3,
    '四级节点': 4,
    '五级节点': 5,
    '六级节点': 6
  }
  return levelMap[levelName] || 0
}

const resetView = () => {
  searchKeyword.value = ''
  clearHighlights()
  if (faultTreeData.value) {
    renderMindMap(faultTreeData.value)
  }
}

const getLevelTagType = (level: string) => {
  const types: Record<string, string> = {
    '根节点': 'info',
    '一级节点': 'danger',
    '二级节点': 'warning', 
    '三级节点': 'info',
    '四级节点': 'success',
    '五级节点': 'primary',
    '六级节点': ''
  }
  return types[level] || 'info'
}
</script>

<style scoped>
.fault-tree-preview {
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

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.el-select .el-input__suffix) {
  right: 20px;
}

:deep(.el-drawer__body) {
  padding: 20px;
}

/* 确保卡片占满可用空间 */
.el-card {
  width: 100%;
}

/* 思维导图容器样式 */
.mindmap-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  max-height: calc(100vh - 350px);
  overflow: auto;
  background: #f8f9fa;
  border-radius: 8px;
  position: relative;
}
</style>