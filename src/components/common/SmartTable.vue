<!-- 智能数据表格组件 -->
<template>
  <div class="smart-table">
    <!-- 表格工具栏 -->
    <div v-if="showToolbar" class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left" :selection="multipleSelection" />
      </div>
      
      <div class="toolbar-right">
        <slot name="toolbar-right" />
        
        <!-- 刷新按钮 -->
        <el-button
          v-if="showRefresh"
          :icon="Refresh"
          circle
          :loading="loading"
          @click="handleRefresh"
          title="刷新"
        />
        
        <!-- 列设置 -->
        <el-popover
          v-if="showColumnSetting"
          placement="bottom-end"
          :width="200"
          trigger="click"
        >
          <template #reference>
            <el-button :icon="Setting" circle title="列设置" />
          </template>
          
          <div class="column-setting">
            <div class="setting-title">显示列</div>
            <el-checkbox-group v-model="visibleColumns">
              <div
                v-for="col in columns"
                :key="col.key"
                class="column-item"
              >
                <el-checkbox :label="col.key">
                  {{ col.title }}
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-popover>
      </div>
    </div>
    
    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      :data="data"
      :loading="loading"
      :height="height"
      :max-height="maxHeight"
      :stripe="stripe"
      :border="border"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :row-class-name="rowClassName"
      :cell-class-name="cellClassName"
      :empty-text="emptyText"
      :default-sort="defaultSort"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
      class="data-table"
      :class="tableClass"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="selectable"
        type="selection"
        width="55"
        :selectable="selectableFunction"
        fixed="left"
      />
      
      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        :index="indexMethod"
        fixed="left"
      />
      
      <!-- 动态列 -->
      <template v-for="column in filteredColumns" :key="column.key">
        <el-table-column
          :prop="column.key"
          :label="column.title"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :align="column.align"
          :show-overflow-tooltip="column.ellipsis"
          :class-name="column.className"
        >
          <template #default="scope" v-if="column.render || $slots[`column-${column.key}`]">
            <slot
              :name="`column-${column.key}`"
              :row="scope.row"
              :column="column"
              :index="scope.$index"
              :value="scope.row[column.key]"
            >
              <component
                v-if="column.render"
                :is="column.render"
                :row="scope.row"
                :column="column"
                :index="scope.$index"
                :value="scope.row[column.key]"
              />
            </slot>
          </template>
          
          <template #header="scope" v-if="$slots[`header-${column.key}`]">
            <slot
              :name="`header-${column.key}`"
              :column="column"
              :index="scope.$index"
            />
          </template>
        </el-table-column>
      </template>
      
      <!-- 操作列 -->
      <el-table-column
        v-if="$slots.actions"
        label="操作"
        :width="actionWidth"
        :fixed="actionFixed"
        class-name="table-actions"
      >
        <template #default="scope">
          <slot
            name="actions"
            :row="scope.row"
            :index="scope.$index"
          />
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div v-if="showPagination && pagination" class="table-pagination">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizes || [10, 20, 50, 100]"
        :total="pagination.total"
        :layout="paginationLayout"
        :background="true"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, readonly } from 'vue'
import type { TableInstance } from 'element-plus'
import { Refresh, Setting } from '@element-plus/icons-vue'

// 列配置接口
interface TableColumn {
  key: string
  title: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean
  className?: string
  render?: any // 自定义渲染组件
}

// 分页配置接口
interface Pagination {
  current: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

interface Props {
  data: any[]
  columns: TableColumn[]
  loading?: boolean
  height?: string | number
  maxHeight?: string | number
  stripe?: boolean
  border?: boolean
  showHeader?: boolean
  highlightCurrentRow?: boolean
  selectable?: boolean
  selectableFunction?: (row: any, index: number) => boolean
  showIndex?: boolean
  indexMethod?: (index: number) => number
  rowClassName?: string | ((params: any) => string)
  cellClassName?: string | ((params: any) => string)
  emptyText?: string
  defaultSort?: { prop: string; order: string }
  showToolbar?: boolean
  showRefresh?: boolean
  showColumnSetting?: boolean
  showPagination?: boolean
  pagination?: Pagination
  paginationLayout?: string
  actionWidth?: number | string
  actionFixed?: boolean | 'left' | 'right'
  tableClass?: string
}

interface Emits {
  'selection-change': [selection: any[]]
  'sort-change': [sort: { column: any; prop: string; order: string }]
  'row-click': [row: any, column: any, event: Event]
  'row-dblclick': [row: any, column: any, event: Event]
  'refresh': []
  'size-change': [size: number]
  'current-change': [current: number]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stripe: true,
  border: true,
  showHeader: true,
  highlightCurrentRow: true,
  selectable: false,
  showIndex: false,
  emptyText: '暂无数据',
  showToolbar: true,
  showRefresh: true,
  showColumnSetting: true,
  showPagination: true,
  paginationLayout: 'total, sizes, prev, pager, next, jumper',
  actionWidth: 120,
  actionFixed: 'right'
})

const emit = defineEmits<Emits>()

const tableRef = ref<TableInstance>()
const multipleSelection = ref<any[]>([])
const visibleColumns = ref<string[]>([])

// 初始化可见列
watch(
  () => props.columns,
  (columns) => {
    if (visibleColumns.value.length === 0) {
      visibleColumns.value = columns.map(col => col.key)
    }
  },
  { immediate: true }
)

// 过滤后的列
const filteredColumns = computed(() => {
  return props.columns.filter(col => visibleColumns.value.includes(col.key))
})

// 事件处理函数
const handleSelectionChange = (selection: any[]) => {
  multipleSelection.value = selection
  emit('selection-change', selection)
}

const handleSortChange = (sort: { column: any; prop: string; order: string }) => {
  emit('sort-change', sort)
}

const handleRowClick = (row: any, column: any, event: Event) => {
  emit('row-click', row, column, event)
}

const handleRowDblClick = (row: any, column: any, event: Event) => {
  emit('row-dblclick', row, column, event)
}

const handleRefresh = () => {
  emit('refresh')
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleCurrentChange = (current: number) => {
  emit('current-change', current)
}

// 表格方法
const clearSelection = () => {
  tableRef.value?.clearSelection()
}

const toggleRowSelection = (row: any, selected?: boolean) => {
  tableRef.value?.toggleRowSelection(row, selected)
}

const toggleAllSelection = () => {
  tableRef.value?.toggleAllSelection()
}

const setCurrentRow = (row: any) => {
  tableRef.value?.setCurrentRow(row)
}

const clearSort = () => {
  tableRef.value?.clearSort()
}

const doLayout = () => {
  tableRef.value?.doLayout()
}

const sort = (prop: string, order: string) => {
  tableRef.value?.sort(prop, order)
}

// 导出数据
const exportData = () => {
  const headers = filteredColumns.value.map(col => col.title).join(',')
  const rows = props.data.map(row => 
    filteredColumns.value.map(col => row[col.key]).join(',')
  ).join('\n')
  
  const csvContent = `${headers}\n${rows}`
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `table_data_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// 暴露方法
defineExpose({
  tableRef,
  clearSelection,
  toggleRowSelection,
  toggleAllSelection,
  setCurrentRow,
  clearSort,
  doLayout,
  sort,
  exportData,
  multipleSelection: readonly(multipleSelection)
})
</script>

<style scoped>
.smart-table {
  width: 100%;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.toolbar-left {
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-setting {
  padding: 8px 0;
}

.setting-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.column-item {
  padding: 4px 0;
}

.data-table {
  width: 100%;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
}

/* 表格样式增强 */
:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th.el-table__cell) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table .table-actions) {
  .cell {
    padding: 0 8px;
  }
  
  .el-button + .el-button {
    margin-left: 4px;
  }
}

:deep(.el-table__empty-text) {
  color: #909399;
}

/* 响应式处理 */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .table-pagination {
    justify-content: center;
  }
  
  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 加载状态 */
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: #f5f7fa;
}

:deep(.el-table__body tr.current-row > td) {
  background-color: #ecf5ff;
}

/* 排序图标 */
:deep(.el-table th.ascending .sort-caret.ascending) {
  border-bottom-color: #409eff;
}

:deep(.el-table th.descending .sort-caret.descending) {
  border-top-color: #409eff;
}
</style>