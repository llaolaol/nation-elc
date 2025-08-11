// 故障树数据解析服务
export interface FaultTreeNode {
  id: string
  name: string
  level: number
  children?: FaultTreeNode[]
  description?: string
  recommendation?: string
  parent?: string
}

export interface ParsedFaultTree {
  nodes: FaultTreeNode[]
  rootNodes: FaultTreeNode[]
}

/**
 * 解析111.txt格式的故障树数据
 */
export function parseFaultTreeData(content: string): ParsedFaultTree {
  const lines = content.split('\n').filter(line => line.trim())
  const nodes: FaultTreeNode[] = []
  const nodeMap = new Map<string, FaultTreeNode>()
  
  lines.forEach((line, index) => {
    // 跳过标题行
    if (index === 0 && line.includes('一级节点')) return
    
    const columns = line.split('\t').map(col => col.trim())
    if (columns.length < 2) return
    
    const [level1, level2, level3, level4, , , recommendation] = columns
    
    // 处理一级节点
    if (level1 && !nodeMap.has(level1)) {
      const node: FaultTreeNode = {
        id: generateNodeId('L1', index),
        name: level1,
        level: 1,
        children: []
      }
      nodes.push(node)
      nodeMap.set(level1, node)
    }
    
    // 处理二级节点
    if (level2 && level1) {
      const parentNode = nodeMap.get(level1)
      const nodeKey = `${level1}-${level2}`
      
      if (parentNode && !nodeMap.has(nodeKey)) {
        const node: FaultTreeNode = {
          id: generateNodeId('L2', index),
          name: level2,
          level: 2,
          parent: parentNode.id,
          children: []
        }
        nodes.push(node)
        nodeMap.set(nodeKey, node)
        parentNode.children?.push(node)
      }
    }
    
    // 处理三级节点
    if (level3 && level2 && level1) {
      const parentKey = `${level1}-${level2}`
      const parentNode = nodeMap.get(parentKey)
      const nodeKey = `${level1}-${level2}-${level3}`
      
      if (parentNode && !nodeMap.has(nodeKey)) {
        const node: FaultTreeNode = {
          id: generateNodeId('L3', index),
          name: level3,
          level: 3,
          parent: parentNode.id,
          children: []
        }
        nodes.push(node)
        nodeMap.set(nodeKey, node)
        parentNode.children?.push(node)
      }
    }
    
    // 处理四级节点（叶子节点，包含建议）
    if (level4 && level3 && level2 && level1) {
      const parentKey = `${level1}-${level2}-${level3}`
      const parentNode = nodeMap.get(parentKey)
      const nodeKey = `${level1}-${level2}-${level3}-${level4}`
      
      if (parentNode && !nodeMap.has(nodeKey)) {
        const node: FaultTreeNode = {
          id: generateNodeId('L4', index),
          name: level4,
          level: 4,
          parent: parentNode.id,
          description: level4,
          recommendation: recommendation || '请参考相关技术规范进行处理'
        }
        nodes.push(node)
        nodeMap.set(nodeKey, node)
        parentNode.children?.push(node)
      }
    }
  })
  
  // 获取根节点
  const rootNodes = nodes.filter(node => node.level === 1)
  
  return { nodes, rootNodes }
}

/**
 * 生成节点ID
 */
function generateNodeId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`
}

/**
 * 转换为ECharts树形图数据格式
 */
export function convertToEChartsTreeData(rootNodes: FaultTreeNode[]) {
  return rootNodes.map(convertNodeToEChartsFormat)
}

function convertNodeToEChartsFormat(node: FaultTreeNode): any {
  return {
    name: node.name,
    id: node.id,
    value: node.name,
    symbolSize: getSymbolSize(node.level),
    itemStyle: {
      color: getNodeColor(node.level)
    },
    label: {
      fontSize: getFontSize(node.level),
      fontWeight: node.level <= 2 ? 'bold' : 'normal'
    },
    children: node.children?.map(convertNodeToEChartsFormat) || [],
    // 存储原始数据
    nodeData: {
      level: node.level,
      description: node.description,
      recommendation: node.recommendation
    }
  }
}

function getSymbolSize(level: number): number {
  const sizes = { 1: 80, 2: 60, 3: 45, 4: 35 }
  return sizes[level as keyof typeof sizes] || 30
}

function getNodeColor(level: number): string {
  const colors = {
    1: '#e74c3c',  // 红色 - 根节点
    2: '#f39c12',  // 橙色 - 二级节点  
    3: '#3498db',  // 蓝色 - 三级节点
    4: '#27ae60'   // 绿色 - 叶子节点
  }
  return colors[level as keyof typeof colors] || '#95a5a6'
}

function getFontSize(level: number): number {
  const sizes = { 1: 16, 2: 14, 3: 12, 4: 11 }
  return sizes[level as keyof typeof sizes] || 10
}

/**
 * 搜索故障树节点
 */
export function searchFaultTreeNodes(
  nodes: FaultTreeNode[], 
  keyword: string
): FaultTreeNode[] {
  if (!keyword.trim()) return []
  
  const lowerKeyword = keyword.toLowerCase()
  return nodes.filter(node => 
    node.name.toLowerCase().includes(lowerKeyword) ||
    node.description?.toLowerCase().includes(lowerKeyword) ||
    node.recommendation?.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 根据诊断结果高亮节点路径
 */
export function highlightDiagnosisPath(
  nodes: FaultTreeNode[],
  diagnosisResult: string
): string[] {
  // 根据诊断结果找到对应的叶子节点
  const targetNode = nodes.find(node => 
    node.level === 4 && 
    (node.name.includes(diagnosisResult) || 
     node.description?.includes(diagnosisResult))
  )
  
  if (!targetNode) return []
  
  // 找到从根节点到目标节点的路径
  const path: string[] = []
  let currentNode: FaultTreeNode | null = targetNode
  
  while (currentNode) {
    path.unshift(currentNode.id)
    if (currentNode.parent) {
      currentNode = nodes.find(n => n.id === currentNode!.parent) || null
    } else {
      break
    }
  }
  
  return path
}