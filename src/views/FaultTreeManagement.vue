<template>
  <div class="fault-tree-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">故障树管理</h1>
        <p class="page-description">管理和维护系统中的所有故障树模型</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleCreateTree">
          新建故障树
        </el-button>
        <el-button :icon="Upload" @click="handleImportTree">
          导入故障树
        </el-button>
        <el-button :icon="Download" @click="handleBatchExport" :disabled="selectedTrees.length === 0">
          批量导出
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选工具栏 -->
    <div class="toolbar">
      <div class="search-container">
        <el-input
          v-model="filterForm.keyword"
          placeholder="搜索故障树名称、描述或标签..."
          :prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
          clearable
        />
      </div>
      <div class="filter-container">
        <el-select
          v-model="filterForm.status"
          placeholder="状态筛选"
          multiple
          collapse-tags
          collapse-tags-tooltip
          @change="handleFilter"
        >
          <el-option label="草稿" value="draft" />
          <el-option label="活跃" value="active" />
          <el-option label="归档" value="archived" />
          <el-option label="模板" value="template" />
        </el-select>
        
        <el-select
          v-model="filterForm.category"
          placeholder="故障类别"
          multiple
          collapse-tags
          @change="handleFilter"
        >
          <el-option label="变压器故障" value="transformer" />
          <el-option label="开关故障" value="switch" />
          <el-option label="母线故障" value="busbar" />
          <el-option label="保护系统" value="protection" />
        </el-select>

        <el-button :icon="Filter" @click="showAdvancedFilter = !showAdvancedFilter">
          高级筛选
        </el-button>
        <el-button :icon="Refresh" @click="handleRefresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 高级筛选面板 -->
    <el-collapse-transition>
      <div v-if="showAdvancedFilter" class="advanced-filter">
        <el-card>
          <template #header>
            <span>高级筛选选项</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="设备类型">
                <el-select v-model="filterForm.equipment_type" multiple placeholder="选择设备类型">
                  <el-option label="电力变压器" value="power_transformer" />
                  <el-option label="配电变压器" value="distribution_transformer" />
                  <el-option label="断路器" value="circuit_breaker" />
                  <el-option label="隔离开关" value="disconnector" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="创建时间">
                <el-date-picker
                  v-model="dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  @change="handleDateRangeChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="节点数量">
                <el-slider
                  v-model="nodeCountRange"
                  range
                  :min="0"
                  :max="200"
                  :step="5"
                  @change="handleNodeCountRangeChange"
                />
                <div class="range-display">{{ nodeCountRange[0] }} - {{ nodeCountRange[1] }} 个节点</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </el-collapse-transition>

    <!-- 故障树列表 -->
    <div class="tree-list-container">
      <el-table
        v-loading="loading"
        :data="displayTrees"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="name" label="故障树名称" min-width="200">
          <template #default="{ row }">
            <div class="tree-name-cell">
              <el-icon class="tree-icon">
                <Share />
              </el-icon>
              <div class="tree-info">
                <div class="tree-name">{{ row.metadata.name }}</div>
                <div class="tree-version">v{{ row.metadata.version }}</div>
              </div>
              <el-tag
                v-if="row.metadata.is_template"
                type="info"
                size="small"
                class="template-tag"
              >
                模板
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.metadata.description" :disabled="!row.metadata.description">
              <span class="description-text">
                {{ truncateText(row.metadata.description, 50) }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.metadata.status)">
              {{ getStatusLabel(row.metadata.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="类别" width="120">
          <template #default="{ row }">
            {{ getCategoryLabel(row.metadata.category) }}
          </template>
        </el-table-column>

        <el-table-column prop="statistics" label="统计" width="150">
          <template #default="{ row }">
            <div class="statistics-cell">
              <div class="stat-item">
                <el-icon><Grid /></el-icon>
                <span>{{ row.metadata.node_count }}</span>
              </div>
              <div class="stat-item">
                <el-icon><Connection /></el-icon>
                <span>{{ row.metadata.gate_count }}</span>
              </div>
              <div class="stat-item">
                <el-icon><Sort /></el-icon>
                <span>{{ row.metadata.depth }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tags" label="标签" width="150">
          <template #default="{ row }">
            <div class="tags-cell">
              <el-tag
                v-for="tag in row.metadata.tags.slice(0, 2)"
                :key="tag"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-tag
                v-if="row.metadata.tags.length > 2"
                size="small"
                type="info"
                class="more-tags"
              >
                +{{ row.metadata.tags.length - 2 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time">{{ formatTime(row.metadata.updated_at) }}</div>
              <div class="author">{{ row.metadata.updated_by }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                link
                type="primary"
                :icon="View"
                @click.stop="handlePreview(row)"
              >
                预览
              </el-button>
              <el-button
                link
                type="primary"
                :icon="Edit"
                @click.stop="handleEdit(row)"
                :disabled="!row.metadata.permissions.canEdit"
              >
                编辑
              </el-button>
              <el-dropdown @command="(cmd) => handleDropdownAction(cmd, row)" trigger="click">
                <el-button link type="primary" :icon="More" @click.stop />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="clone" :icon="DocumentCopy">克隆</el-dropdown-item>
                    <el-dropdown-item command="export" :icon="Download">导出</el-dropdown-item>
                    <el-dropdown-item command="template" :icon="Star">设为模板</el-dropdown-item>
                    <el-dropdown-item 
                      command="archive" 
                      :icon="Box"
                      v-if="row.metadata.status !== 'archived'"
                    >
                      归档
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="activate" 
                      :icon="Check"
                      v-if="row.metadata.status === 'archived'"
                    >
                      激活
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="delete" 
                      :icon="Delete"
                      :disabled="!row.metadata.permissions.canDelete"
                      divided
                    >
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :small="false"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredTrees.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="故障树预览"
      width="90%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div v-if="currentPreviewTree" class="preview-container">
        <div class="preview-header">
          <div class="preview-info">
            <h3>{{ currentPreviewTree.metadata.name }}</h3>
            <p>{{ currentPreviewTree.metadata.description }}</p>
          </div>
          <div class="preview-controls">
            <el-radio-group v-model="previewLayout" @change="handlePreviewLayoutChange">
              <el-radio-button label="hierarchical">层次</el-radio-button>
              <el-radio-button label="radial">径向</el-radio-button>
              <el-radio-button label="compact">紧凑</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="preview-content">
          <EnhancedFaultTree
            :fault-tree-data="currentPreviewTree.tree"
            :show-toolbar="true"
            :interactive="true"
            @node-click="handlePreviewNodeClick"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editMode === 'create' ? '新建故障树' : '编辑故障树'"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <div v-if="currentEditTree" class="edit-container">
        <!-- 基本信息表单 -->
        <el-tabs v-model="activeEditTab" type="card">
          <el-tab-pane label="基本信息" name="basic">
            <el-form
              ref="editFormRef"
              :model="currentEditTree.metadata"
              :rules="editFormRules"
              label-width="120px"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="故障树名称" prop="name">
                    <el-input v-model="currentEditTree.metadata.name" placeholder="请输入故障树名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="版本号" prop="version">
                    <el-input v-model="currentEditTree.metadata.version" placeholder="如: 1.0.0" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="描述" prop="description">
                <el-input
                  v-model="currentEditTree.metadata.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入故障树描述"
                />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="状态" prop="status">
                    <el-select v-model="currentEditTree.metadata.status">
                      <el-option label="草稿" value="draft" />
                      <el-option label="活跃" value="active" />
                      <el-option label="归档" value="archived" />
                      <el-option label="模板" value="template" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="故障类别" prop="category">
                    <el-select v-model="currentEditTree.metadata.category">
                      <el-option label="变压器故障" value="transformer" />
                      <el-option label="开关故障" value="switch" />
                      <el-option label="母线故障" value="busbar" />
                      <el-option label="保护系统" value="protection" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="设备类型" prop="equipment_type">
                    <el-select v-model="currentEditTree.metadata.equipment_type">
                      <el-option label="电力变压器" value="power_transformer" />
                      <el-option label="配电变压器" value="distribution_transformer" />
                      <el-option label="断路器" value="circuit_breaker" />
                      <el-option label="隔离开关" value="disconnector" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="标签">
                <el-tag
                  v-for="tag in currentEditTree.metadata.tags"
                  :key="tag"
                  closable
                  @close="handleTagClose(tag)"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-if="tagInputVisible"
                  ref="tagInputRef"
                  v-model="tagInputValue"
                  class="tag-input"
                  size="small"
                  @keyup.enter="handleTagAdd"
                  @blur="handleTagAdd"
                />
                <el-button
                  v-else
                  class="button-new-tag"
                  size="small"
                  @click="showTagInput"
                >
                  + 添加标签
                </el-button>
              </el-form-item>

              <el-form-item label="模板选项">
                <el-checkbox v-model="currentEditTree.metadata.is_template">设为模板</el-checkbox>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="节点编辑" name="nodes">
            <div class="node-editor">
              <div class="editor-toolbar">
                <el-button-group>
                  <el-button type="primary" :icon="Plus" @click="addRootNode" :disabled="hasRootNode">
                    添加根节点
                  </el-button>
                  <el-button :icon="Edit" @click="editSelectedNode" :disabled="!selectedNodeId">
                    编辑节点
                  </el-button>
                  <el-button :icon="Delete" @click="deleteSelectedNode" :disabled="!selectedNodeId">
                    删除节点
                  </el-button>
                </el-button-group>
              </div>
              
              <div class="editor-content">
                <div class="tree-preview">
                  <EnhancedFaultTree
                    v-if="currentEditTree.tree"
                    :fault-tree-data="currentEditTree.tree"
                    :show-toolbar="true"
                    :interactive="true"
                    @node-click="handleEditTreeNodeClick"
                  />
                  <div v-else class="empty-tree">
                    <el-empty description="暂无节点，请先添加根节点" />
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTree" :loading="saving">
            {{ editMode === 'create' ? '创建' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 节点编辑弹窗 -->
    <el-dialog
      v-model="nodeEditDialogVisible"
      :title="nodeEditMode === 'create' ? '添加节点' : '编辑节点'"
      width="60%"
    >
      <el-form
        v-if="currentEditNode"
        ref="nodeEditFormRef"
        :model="currentEditNode"
        :rules="nodeEditFormRules"
        label-width="120px"
      >
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="currentEditNode.name" placeholder="请输入节点名称" />
        </el-form-item>

        <el-form-item label="节点类型" prop="type">
          <el-radio-group v-model="currentEditNode.type">
            <el-radio label="fault_node">故障节点</el-radio>
            <el-radio label="logic_gate">逻辑门</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="currentEditNode.type === 'logic_gate'" label="逻辑门类型" prop="gate_type">
          <el-select v-model="currentEditNode.gate_type">
            <el-option label="与门 (AND)" value="AND" />
            <el-option label="或门 (OR)" value="OR" />
            <el-option label="非门 (NOT)" value="NOT" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="currentEditNode.description"
            type="textarea"
            :rows="3"
            placeholder="请输入节点描述"
          />
        </el-form-item>

        <el-form-item v-if="currentEditNode.type === 'logic_gate'" label="判断条件" prop="condition">
          <el-input
            v-model="currentEditNode.condition"
            placeholder="例如: H2 > 150 AND CH4 > 50"
          />
        </el-form-item>

        <el-form-item v-if="currentEditNode.type === 'fault_node'" label="推荐措施" prop="recommendation">
          <el-input
            v-model="currentEditNode.recommendation"
            type="textarea"
            :rows="2"
            placeholder="请输入推荐的处理措施"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="nodeEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveNode">保存节点</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, Search, Filter, Refresh,
  View, Edit, More, Share, Grid, Connection, Sort,
  DocumentCopy, Star, Box, Check, Delete
} from '@element-plus/icons-vue'
import type {
  FaultTreeData,
  FaultTreeMetadata,
  FaultTreeFilter,
  FaultTreeStatus,
  EnhancedFaultTreeNode,
  NodeOperation
} from '@/types'
import EnhancedFaultTree from '@/components/logic/EnhancedFaultTree.vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showAdvancedFilter = ref(false)

// 筛选表单
const filterForm = reactive<FaultTreeFilter>({
  keyword: '',
  status: [],
  category: [],
  equipment_type: []
})

const dateRange = ref<[Date, Date] | null>(null)
const nodeCountRange = ref([0, 200])

// 故障树数据
const faultTrees = ref<FaultTreeData[]>([])
const selectedTrees = ref<FaultTreeData[]>([])

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20
})

// 预览相关
const previewDialogVisible = ref(false)
const currentPreviewTree = ref<FaultTreeData | null>(null)
const previewLayout = ref('hierarchical')

// 编辑相关
const editDialogVisible = ref(false)
const currentEditTree = ref<FaultTreeData | null>(null)
const editMode = ref<'create' | 'edit'>('create')
const activeEditTab = ref('basic')

// 节点编辑相关
const nodeEditDialogVisible = ref(false)
const currentEditNode = ref<Partial<EnhancedFaultTreeNode> | null>(null)
const nodeEditMode = ref<'create' | 'edit'>('create')
const selectedNodeId = ref<string | null>(null)

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 表单验证规则
const editFormRules = {
  name: [
    { required: true, message: '请输入故障树名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度应在 1 到 100 个字符', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择故障类别', trigger: 'change' }
  ],
  equipment_type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ]
}

const nodeEditFormRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择节点类型', trigger: 'change' }
  ],
  gate_type: [
    { required: true, message: '请选择逻辑门类型', trigger: 'change' }
  ]
}

// 计算属性
const filteredTrees = computed(() => {
  let trees = faultTrees.value

  // 关键词搜索
  if (filterForm.keyword) {
    const keyword = filterForm.keyword.toLowerCase()
    trees = trees.filter(tree => 
      tree.metadata.name.toLowerCase().includes(keyword) ||
      tree.metadata.description?.toLowerCase().includes(keyword) ||
      tree.metadata.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  // 状态筛选
  if (filterForm.status && filterForm.status.length > 0) {
    trees = trees.filter(tree => filterForm.status!.includes(tree.metadata.status))
  }

  // 类别筛选
  if (filterForm.category && filterForm.category.length > 0) {
    trees = trees.filter(tree => filterForm.category!.includes(tree.metadata.category))
  }

  // 设备类型筛选
  if (filterForm.equipment_type && filterForm.equipment_type.length > 0) {
    trees = trees.filter(tree => filterForm.equipment_type!.includes(tree.metadata.equipment_type))
  }

  return trees
})

const displayTrees = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredTrees.value.slice(start, end)
})

const hasRootNode = computed(() => {
  return currentEditTree.value?.tree != null
})

// 方法
const handleSearch = () => {
  pagination.currentPage = 1
}

const handleFilter = () => {
  pagination.currentPage = 1
}

const handleDateRangeChange = (dates: [Date, Date] | null) => {
  if (dates) {
    filterForm.date_range = {
      start: dates[0].toISOString(),
      end: dates[1].toISOString()
    }
  } else {
    delete filterForm.date_range
  }
  handleFilter()
}

const handleNodeCountRangeChange = (range: [number, number]) => {
  filterForm.node_count_range = {
    min: range[0],
    max: range[1]
  }
  handleFilter()
}

const handleRefresh = () => {
  loadFaultTrees()
}

const handleSelectionChange = (selection: FaultTreeData[]) => {
  selectedTrees.value = selection
}

const handleRowClick = (row: FaultTreeData) => {
  handlePreview(row)
}

const handleSizeChange = () => {
  pagination.currentPage = 1
}

const handleCurrentChange = () => {
  // 页面改变时的处理
}

// 预览相关方法
const handlePreview = (tree: FaultTreeData) => {
  console.log('预览故障树数据:', tree)
  console.log('故障树结构:', tree.tree)
  currentPreviewTree.value = tree
  previewDialogVisible.value = true
}

const handlePreviewLayoutChange = () => {
  // 布局改变的处理逻辑
}

const handlePreviewNodeClick = (nodeId: string) => {
  ElMessage.info(`点击了节点: ${nodeId}`)
}

// 编辑相关方法
const handleCreateTree = () => {
  editMode.value = 'create'
  currentEditTree.value = createEmptyTree()
  activeEditTab.value = 'basic'
  editDialogVisible.value = true
}

const handleEdit = (tree: FaultTreeData) => {
  editMode.value = 'edit'
  currentEditTree.value = JSON.parse(JSON.stringify(tree)) // 深拷贝
  activeEditTab.value = 'basic'
  selectedNodeId.value = null
  editDialogVisible.value = true
}

const handleSaveTree = async () => {
  if (!currentEditTree.value) return
  
  saving.value = true
  try {
    // 表单验证
    // await editFormRef.value?.validate()
    
    if (editMode.value === 'create') {
      // 创建新故障树
      currentEditTree.value.metadata.id = generateId()
      currentEditTree.value.metadata.created_at = new Date().toISOString()
      currentEditTree.value.metadata.updated_at = new Date().toISOString()
      currentEditTree.value.metadata.created_by = '当前用户'
      currentEditTree.value.metadata.updated_by = '当前用户'
      
      faultTrees.value.push(currentEditTree.value)
      ElMessage.success('故障树创建成功')
    } else {
      // 更新现有故障树
      const index = faultTrees.value.findIndex(t => t.metadata.id === currentEditTree.value!.metadata.id)
      if (index !== -1) {
        currentEditTree.value.metadata.updated_at = new Date().toISOString()
        currentEditTree.value.metadata.updated_by = '当前用户'
        faultTrees.value[index] = currentEditTree.value
        ElMessage.success('故障树保存成功')
      }
    }
    
    editDialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败，请检查输入信息')
  } finally {
    saving.value = false
  }
}

// 节点编辑相关方法
const handleEditTreeNodeClick = (nodeId: string) => {
  selectedNodeId.value = nodeId
}

const addRootNode = () => {
  nodeEditMode.value = 'create'
  currentEditNode.value = {
    id: generateId(),
    name: '',
    type: 'fault_node',
    description: ''
  }
  nodeEditDialogVisible.value = true
}

const editSelectedNode = () => {
  if (!selectedNodeId.value || !currentEditTree.value?.tree) return
  
  const node = findNodeById(currentEditTree.value.tree, selectedNodeId.value)
  if (node) {
    nodeEditMode.value = 'edit'
    currentEditNode.value = JSON.parse(JSON.stringify(node))
    nodeEditDialogVisible.value = true
  }
}

const deleteSelectedNode = async () => {
  if (!selectedNodeId.value || !currentEditTree.value?.tree) return
  
  try {
    await ElMessageBox.confirm('确定要删除此节点吗？删除后无法恢复。', '确认删除', {
      type: 'warning'
    })
    
    if (selectedNodeId.value === currentEditTree.value.tree.id) {
      // 删除根节点
      currentEditTree.value.tree = null as any
    } else {
      // 删除子节点
      removeNodeById(currentEditTree.value.tree, selectedNodeId.value)
    }
    
    selectedNodeId.value = null
    ElMessage.success('节点删除成功')
  } catch {
    // 用户取消删除
  }
}

const handleSaveNode = () => {
  if (!currentEditNode.value || !currentEditTree.value) return
  
  if (nodeEditMode.value === 'create') {
    if (!currentEditTree.value.tree) {
      // 创建根节点
      currentEditTree.value.tree = currentEditNode.value as EnhancedFaultTreeNode
    } else {
      // 添加子节点（需要选择父节点）
      if (selectedNodeId.value) {
        const parentNode = findNodeById(currentEditTree.value.tree, selectedNodeId.value)
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(currentEditNode.value as EnhancedFaultTreeNode)
        }
      }
    }
    ElMessage.success('节点创建成功')
  } else {
    // 更新节点
    const node = findNodeById(currentEditTree.value.tree, currentEditNode.value.id!)
    if (node) {
      Object.assign(node, currentEditNode.value)
      ElMessage.success('节点更新成功')
    }
  }
  
  nodeEditDialogVisible.value = false
  updateTreeStatistics()
}

// 下拉菜单操作
const handleDropdownAction = async (command: string, tree: FaultTreeData) => {
  switch (command) {
    case 'clone':
      await handleCloneTree(tree)
      break
    case 'export':
      await handleExportTree(tree)
      break
    case 'template':
      await handleSetAsTemplate(tree)
      break
    case 'archive':
      await handleArchiveTree(tree)
      break
    case 'activate':
      await handleActivateTree(tree)
      break
    case 'delete':
      await handleDeleteTree(tree)
      break
  }
}

const handleCloneTree = async (tree: FaultTreeData) => {
  const clonedTree = JSON.parse(JSON.stringify(tree))
  clonedTree.metadata.id = generateId()
  clonedTree.metadata.name = `${tree.metadata.name} - 副本`
  clonedTree.metadata.created_at = new Date().toISOString()
  clonedTree.metadata.updated_at = new Date().toISOString()
  clonedTree.metadata.version = '1.0.0'
  
  faultTrees.value.push(clonedTree)
  ElMessage.success('故障树克隆成功')
}

const handleExportTree = async (tree: FaultTreeData) => {
  // 导出逻辑
  ElMessage.info('导出功能开发中...')
}

const handleSetAsTemplate = async (tree: FaultTreeData) => {
  tree.metadata.is_template = true
  tree.metadata.updated_at = new Date().toISOString()
  ElMessage.success('已设置为模板')
}

const handleArchiveTree = async (tree: FaultTreeData) => {
  tree.metadata.status = 'archived'
  tree.metadata.updated_at = new Date().toISOString()
  ElMessage.success('故障树已归档')
}

const handleActivateTree = async (tree: FaultTreeData) => {
  tree.metadata.status = 'active'
  tree.metadata.updated_at = new Date().toISOString()
  ElMessage.success('故障树已激活')
}

const handleDeleteTree = async (tree: FaultTreeData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除故障树"${tree.metadata.name}"吗？删除后无法恢复。`,
      '确认删除',
      { type: 'warning' }
    )
    
    const index = faultTrees.value.findIndex(t => t.metadata.id === tree.metadata.id)
    if (index !== -1) {
      faultTrees.value.splice(index, 1)
      ElMessage.success('故障树删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

// 批量操作
const handleBatchExport = () => {
  if (selectedTrees.value.length === 0) {
    ElMessage.warning('请先选择要导出的故障树')
    return
  }
  ElMessage.info('批量导出功能开发中...')
}

const handleImportTree = () => {
  ElMessage.info('导入功能开发中...')
}

// 标签相关方法
const handleTagClose = (tag: string) => {
  if (currentEditTree.value) {
    const index = currentEditTree.value.metadata.tags.indexOf(tag)
    if (index !== -1) {
      currentEditTree.value.metadata.tags.splice(index, 1)
    }
  }
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const handleTagAdd = () => {
  const value = tagInputValue.value.trim()
  if (value && currentEditTree.value) {
    if (!currentEditTree.value.metadata.tags.includes(value)) {
      currentEditTree.value.metadata.tags.push(value)
    }
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

// 工具方法
const getStatusTagType = (status: FaultTreeStatus) => {
  const types: Record<FaultTreeStatus, string> = {
    draft: 'info',
    active: 'success',
    archived: 'warning',
    template: 'primary'
  }
  return types[status]
}

const getStatusLabel = (status: FaultTreeStatus) => {
  const labels: Record<FaultTreeStatus, string> = {
    draft: '草稿',
    active: '活跃',
    archived: '归档',
    template: '模板'
  }
  return labels[status]
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    transformer: '变压器',
    switch: '开关',
    busbar: '母线',
    protection: '保护系统'
  }
  return labels[category] || category
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN')
}

const truncateText = (text: string | undefined, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

const createEmptyTree = (): FaultTreeData => {
  return {
    metadata: {
      id: '',
      name: '',
      description: '',
      status: 'draft',
      category: 'transformer',
      equipment_type: 'power_transformer',
      version: '1.0.0',
      created_by: '当前用户',
      created_at: '',
      updated_by: '当前用户',
      updated_at: '',
      tags: [],
      node_count: 0,
      gate_count: 0,
      depth: 0,
      is_template: false,
      permissions: {
        canView: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canClone: true
      }
    },
    tree: null as any
  }
}

const findNodeById = (node: EnhancedFaultTreeNode, id: string): EnhancedFaultTreeNode | null => {
  if (node.id === id) return node
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  
  return null
}

const removeNodeById = (node: EnhancedFaultTreeNode, id: string): boolean => {
  if (node.children) {
    const index = node.children.findIndex(child => child.id === id)
    if (index !== -1) {
      node.children.splice(index, 1)
      return true
    }
    
    for (const child of node.children) {
      if (removeNodeById(child, id)) {
        return true
      }
    }
  }
  
  return false
}

const updateTreeStatistics = () => {
  if (!currentEditTree.value?.tree) {
    currentEditTree.value!.metadata.node_count = 0
    currentEditTree.value!.metadata.gate_count = 0
    currentEditTree.value!.metadata.depth = 0
    return
  }
  
  const stats = calculateTreeStatistics(currentEditTree.value.tree)
  currentEditTree.value.metadata.node_count = stats.nodeCount
  currentEditTree.value.metadata.gate_count = stats.gateCount
  currentEditTree.value.metadata.depth = stats.depth
}

const calculateTreeStatistics = (node: EnhancedFaultTreeNode): { nodeCount: number; gateCount: number; depth: number } => {
  let nodeCount = 1
  let gateCount = node.type === 'logic_gate' ? 1 : 0
  let maxDepth = 1
  
  if (node.children) {
    for (const child of node.children) {
      const childStats = calculateTreeStatistics(child)
      nodeCount += childStats.nodeCount
      gateCount += childStats.gateCount
      maxDepth = Math.max(maxDepth, childStats.depth + 1)
    }
  }
  
  return { nodeCount, gateCount, depth: maxDepth }
}

const loadFaultTrees = () => {
  loading.value = true
  
  // 模拟加载示例数据
  setTimeout(() => {
    faultTrees.value = generateSampleTrees()
    loading.value = false
  }, 500)
}

const generateSampleTrees = (): FaultTreeData[] => {
  return [
    // Demo数据 - 从故障树展示页面导入的专业示例
    {
      metadata: {
        id: 'demo-001',
        name: '本体异常产气故障诊断（专业示例）',
        description: '基于国网标准的变压器本体异常产气故障诊断决策树，包含三比值分析、DPM分析和PRPD局放特征分析',
        status: 'template',
        category: 'transformer',
        equipment_type: 'power_transformer',
        version: '2.0.0',
        created_by: '技术专家',
        created_at: '2024-08-15T15:00:00Z',
        updated_by: '技术专家',
        updated_at: '2024-08-15T15:00:00Z',
        tags: ['DGA分析', '三比值法', 'DPM分析', 'PRPD分析', '本体故障', 'demo'],
        node_count: 21,
        gate_count: 7,
        depth: 4,
        is_template: true,
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: false,
          canExport: true,
          canClone: true
        }
      },
      tree: {
        id: 'root',
        name: '本体异常产气故障诊断',
        type: 'fault_node',
        description: '基于溶解气体分析的变压器本体异常产气故障综合诊断系统',
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
    },
    // 其他示例数据
    {
      metadata: {
        id: 'tree-001',
        name: '变压器过热故障诊断',
        description: '基于温度和气体分析的变压器过热故障诊断',
        status: 'active',
        category: 'transformer',
        equipment_type: 'power_transformer',
        version: '1.5.0',
        created_by: '系统管理员',
        created_at: '2024-01-15T09:30:00Z',
        updated_by: '技术专家',
        updated_at: '2024-08-10T14:20:00Z',
        tags: ['过热故障', '温度分析'],
        node_count: 8,
        gate_count: 3,
        depth: 3,
        is_template: false,
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          canClone: true
        }
      },
      tree: {
        id: 'root-001',
        name: '变压器过热故障',
        type: 'logic_gate',
        gate_type: 'OR',
        state: 'unknown',
        condition: 'H2 > 150 OR CH4 > 120',
        children: [
          {
            id: 'node-002',
            name: '低温过热故障',
            type: 'fault_node',
            description: '温度 < 300°C的过热故障',
            recommendation: '检查负载情况，监测油温变化'
          },
          {
            id: 'node-003',
            name: '高温过热故障',
            type: 'fault_node',
            description: '温度 > 700°C的过热故障',
            recommendation: '立即检查变压器负载和冷却系统'
          }
        ]
      }
    },
    {
      metadata: {
        id: 'tree-002',
        name: '断路器操作机构故障诊断',
        description: '断路器操作机构常见故障诊断决策树',
        status: 'draft',
        category: 'switch',
        equipment_type: 'circuit_breaker',
        version: '1.3.0',
        created_by: '运维工程师',
        created_at: '2024-03-20T16:45:00Z',
        updated_by: '运维工程师',
        updated_at: '2024-08-12T10:15:00Z',
        tags: ['断路器', '操作机构', '机械故障'],
        node_count: 5,
        gate_count: 2,
        depth: 2,
        is_template: false,
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          canClone: true
        }
      },
      tree: {
        id: 'root-002',
        name: '断路器操作异常',
        type: 'logic_gate',
        gate_type: 'OR',
        state: 'unknown',
        condition: '操作时间异常 OR 操作失败',
        children: [
          {
            id: 'node-004',
            name: '液压系统故障',
            type: 'fault_node',
            description: '液压油压力不足或泄漏',
            recommendation: '检查液压系统压力和密封性'
          },
          {
            id: 'node-005',
            name: '机械卡涩',
            type: 'fault_node',
            description: '操作机构机械卡涩或润滑不良',
            recommendation: '检查机械部件润滑状态和动作灵活性'
          }
        ]
      }
    }
  ]
}

// 生命周期
onMounted(() => {
  loadFaultTrees()
})
</script>

<style scoped>
.fault-tree-management {
  padding: 0;
  background: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  margin: 0 16px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.filter-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-container .el-select {
  width: 140px;
}

.advanced-filter {
  margin: 0 16px 16px;
}

.range-display {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.tree-list-container {
  margin: 0 16px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tree-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-icon {
  color: #409eff;
  font-size: 18px;
}

.tree-info {
  flex: 1;
}

.tree-name {
  font-weight: 600;
  color: #303133;
}

.tree-version {
  font-size: 12px;
  color: #909399;
}

.template-tag {
  margin-left: auto;
}

.description-text {
  color: #606266;
  font-size: 13px;
}

.statistics-cell {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.stat-item .el-icon {
  font-size: 14px;
}

.tags-cell {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-item {
  font-size: 11px;
}

.more-tags {
  font-size: 11px;
}

.time-cell {
  text-align: left;
}

.time {
  font-size: 13px;
  color: #303133;
}

.author {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-container {
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #e4e7ed;
}

.preview-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.preview-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.preview-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.preview-content {
  flex: 1;
  overflow: hidden;
}

.edit-container {
  max-height: 70vh;
  overflow-y: auto;
}

.node-editor {
  min-height: 500px;
}

.editor-toolbar {
  margin-bottom: 16px;
}

.editor-content {
  display: flex;
  gap: 16px;
}

.tree-preview {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.empty-tree {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.tag-input {
  width: 80px;
  margin-left: 8px;
}

.button-new-tag {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  border-style: dashed;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>