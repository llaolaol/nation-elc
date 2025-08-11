// 数据管理 Composable
import { ref, computed, reactive, readonly } from 'vue'

export interface PaginationConfig {
  current: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

export interface SortConfig {
  field?: string
  order?: 'asc' | 'desc'
}

export interface FilterConfig {
  [key: string]: any
}

export interface UseTableDataOptions<T> {
  initialData?: T[]
  pagination?: Partial<PaginationConfig>
  defaultSort?: SortConfig
  defaultFilters?: FilterConfig
}

/**
 * 表格数据管理
 */
export function useTableData<T extends Record<string, any>>(
  fetchFn: (params: {
    pagination: PaginationConfig
    sort: SortConfig
    filters: FilterConfig
  }) => Promise<{ data: T[]; total: number }>,
  options: UseTableDataOptions<T> = {}
) {
  const {
    initialData = [],
    pagination: initialPagination = {},
    defaultSort = {},
    defaultFilters = {}
  } = options

  // 状态管理
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<T[]>(initialData)
  
  const pagination = reactive<PaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    ...initialPagination
  })
  
  const sort = reactive<SortConfig>({ ...defaultSort })
  const filters = reactive<FilterConfig>({ ...defaultFilters })

  // 计算属性
  const isEmpty = computed(() => data.value.length === 0)
  const hasData = computed(() => data.value.length > 0)
  const hasError = computed(() => !!error.value)

  /**
   * 加载数据
   */
  const loadData = async (resetPagination = false) => {
    loading.value = true
    error.value = null

    if (resetPagination) {
      pagination.current = 1
    }

    try {
      const result = await fetchFn({
        pagination: { ...pagination },
        sort: { ...sort },
        filters: { ...filters }
      })

      data.value = result.data
      pagination.total = result.total
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      error.value = errorObj
      data.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新数据（保持当前页）
   */
  const refresh = () => {
    return loadData(false)
  }

  /**
   * 重新加载数据（重置到第一页）
   */
  const reload = () => {
    return loadData(true)
  }

  /**
   * 处理分页变化
   */
  const handlePageChange = (page: number) => {
    pagination.current = page
    return loadData(false)
  }

  /**
   * 处理页面大小变化
   */
  const handlePageSizeChange = (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.current = 1
    return loadData(false)
  }

  /**
   * 处理排序变化
   */
  const handleSortChange = (newSort: SortConfig) => {
    Object.assign(sort, newSort)
    return loadData(true)
  }

  /**
   * 处理筛选变化
   */
  const handleFilterChange = (newFilters: Partial<FilterConfig>) => {
    Object.assign(filters, newFilters)
    return loadData(true)
  }

  /**
   * 重置筛选
   */
  const resetFilters = () => {
    Object.assign(filters, defaultFilters)
    return loadData(true)
  }

  /**
   * 重置排序
   */
  const resetSort = () => {
    Object.assign(sort, defaultSort)
    return loadData(true)
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    pagination.current = 1
    pagination.total = 0
    Object.assign(sort, defaultSort)
    Object.assign(filters, defaultFilters)
    data.value = []
    error.value = null
  }

  /**
   * 添加数据项
   */
  const addItem = (item: T) => {
    const newItem = { ...item } as any
    data.value.unshift(newItem)
    pagination.total += 1
  }

  /**
   * 更新数据项
   */
  const updateItem = (index: number, item: Partial<T>) => {
    if (index >= 0 && index < data.value.length) {
      Object.assign(data.value[index], item)
    }
  }

  /**
   * 根据条件更新数据项
   */
  const updateItemBy = (predicate: (item: T) => boolean, updates: Partial<T>) => {
    const index = data.value.findIndex((item) => predicate(item as T))
    if (index >= 0) {
      updateItem(index, updates)
    }
  }

  /**
   * 删除数据项
   */
  const removeItem = (index: number) => {
    if (index >= 0 && index < data.value.length) {
      data.value.splice(index, 1)
      pagination.total -= 1
    }
  }

  /**
   * 根据条件删除数据项
   */
  const removeItemBy = (predicate: (item: T) => boolean) => {
    const index = data.value.findIndex((item) => predicate(item as T))
    if (index >= 0) {
      removeItem(index)
    }
  }

  /**
   * 批量删除数据项
   */
  const removeItems = (indices: number[]) => {
    // 从大到小排序，避免删除时索引变化
    const sortedIndices = [...indices].sort((a, b) => b - a)
    sortedIndices.forEach(index => {
      if (index >= 0 && index < data.value.length) {
        data.value.splice(index, 1)
        pagination.total -= 1
      }
    })
  }

  /**
   * 查找数据项
   */
  const findItem = (predicate: (item: T) => boolean): T | undefined => {
    return data.value.find((item) => predicate(item as T)) as T | undefined
  }

  /**
   * 查找数据项索引
   */
  const findItemIndex = (predicate: (item: T) => boolean): number => {
    return data.value.findIndex((item) => predicate(item as T))
  }

  return {
    // 状态
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    pagination,
    sort,
    filters,

    // 计算属性
    isEmpty,
    hasData,
    hasError,

    // 方法
    loadData,
    refresh,
    reload,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleFilterChange,
    resetFilters,
    resetSort,
    reset,
    addItem,
    updateItem,
    updateItemBy,
    removeItem,
    removeItemBy,
    removeItems,
    findItem,
    findItemIndex
  }
}