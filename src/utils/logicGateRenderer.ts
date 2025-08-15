// 逻辑门渲染工具 - 处理逻辑门的布局和渲染逻辑
import type { 
  EnhancedFaultTreeNode, 
  LogicGateType, 
  LogicGateState,
  LogicReasoningStep,
  DiagnosisParams 
} from '@/types'

/**
 * 布局配置
 */
interface LayoutConfig {
  nodeWidth: number
  nodeHeight: number
  horizontalSpacing: number
  verticalSpacing: number
  levelHeight: number
}

/**
 * 渲染位置
 */
interface RenderPosition {
  x: number
  y: number
  level: number
}

/**
 * 连线信息
 */
interface Connection {
  from: string
  to: string
  type: 'input' | 'output'
  logicType?: LogicGateType  // 添加逻辑关系类型
  logicLabel?: string       // 添加逻辑关系标签
  style?: {
    color?: string
    width?: number
    dashArray?: string
  }
}

/**
 * 逻辑门渲染器
 */
export class LogicGateRenderer {
  private config: LayoutConfig = {
    nodeWidth: 160,
    nodeHeight: 80,
    horizontalSpacing: 220,
    verticalSpacing: 140,
    levelHeight: 200
  }

  private positions: Map<string, RenderPosition> = new Map()
  private connections: Connection[] = []

  /**
   * 根据视口大小调整配置
   */
  private adjustConfigForViewport(): void {
    const viewportWidth = window.innerWidth
    
    if (viewportWidth < 768) {
      // 移动设备：减小间距
      this.config.horizontalSpacing = 180
      this.config.levelHeight = 160
      this.config.verticalSpacing = 120
    } else if (viewportWidth < 1200) {
      // 平板设备：中等间距
      this.config.horizontalSpacing = 200
      this.config.levelHeight = 180
      this.config.verticalSpacing = 130
    } else {
      // 桌面设备：标准间距
      this.config.horizontalSpacing = 220
      this.config.levelHeight = 200
      this.config.verticalSpacing = 140
    }
  }

  /**
   * 计算节点布局
   */
  calculateLayout(faultTree: EnhancedFaultTreeNode, layoutType: string = 'hierarchical'): Map<string, RenderPosition> {
    this.positions.clear()
    this.connections = []

    // 根据视口大小调整配置
    this.adjustConfigForViewport()

    switch (layoutType) {
      case 'hierarchical':
        this.calculateHierarchicalLayout(faultTree)
        break
      case 'radial':
        this.calculateRadialLayout(faultTree)
        break
      case 'compact':
        this.calculateCompactLayout(faultTree)
        break
      default:
        this.calculateHierarchicalLayout(faultTree)
    }

    // 生成连线
    this.generateConnections(faultTree)

    return this.positions
  }

  /**
   * 层次布局
   */
  private calculateHierarchicalLayout(faultTree: EnhancedFaultTreeNode): void {
    // 计算每层的节点数量
    const levelNodes = this.groupNodesByLevel(faultTree)
    
    // 为每层分配位置
    levelNodes.forEach((nodes, level) => {
      this.layoutLevel(nodes, level)
    })
  }

  /**
   * 径向布局
   */
  private calculateRadialLayout(faultTree: EnhancedFaultTreeNode): void {
    const centerX = 0
    const centerY = 0
    const baseRadius = 150
    
    // 将根节点放在中心
    this.positions.set(faultTree.id, { 
      x: centerX - this.config.nodeWidth / 2, 
      y: centerY - this.config.nodeHeight / 2, 
      level: 0 
    })
    
    // 按层级分组
    const levelNodes = this.groupNodesByLevel(faultTree)
    
    levelNodes.forEach((nodes, level) => {
      if (level === 0) return // 跳过根节点
      
      const radius = baseRadius + (level - 1) * 120
      const totalNodes = nodes.length
      
      // 如果只有一个节点，放在正上方
      if (totalNodes === 1) {
        const x = centerX - this.config.nodeWidth / 2
        const y = centerY - radius - this.config.nodeHeight / 2
        this.positions.set(nodes[0].id, { x, y, level })
        return
      }
      
      // 多个节点均匀分布
      const angleStep = (2 * Math.PI) / totalNodes
      const startAngle = -Math.PI / 2 // 从顶部开始
      
      nodes.forEach((node, index) => {
        const angle = startAngle + index * angleStep
        const x = centerX + radius * Math.cos(angle) - this.config.nodeWidth / 2
        const y = centerY + radius * Math.sin(angle) - this.config.nodeHeight / 2
        
        this.positions.set(node.id, { x, y, level })
      })
    })
  }

  /**
   * 紧凑布局
   */
  private calculateCompactLayout(faultTree: EnhancedFaultTreeNode): void {
    // 紧凑布局：网格式排列，最大化空间利用率
    const allNodes = this.getAllNodes(faultTree)
    const gridCols = Math.ceil(Math.sqrt(allNodes.length))
    const nodeSpacing = this.config.nodeWidth + 40
    const rowSpacing = this.config.nodeHeight + 30
    
    allNodes.forEach((node, index) => {
      const col = index % gridCols
      const row = Math.floor(index / gridCols)
      
      const x = col * nodeSpacing - (gridCols * nodeSpacing) / 2
      const y = row * rowSpacing - (Math.ceil(allNodes.length / gridCols) * rowSpacing) / 2
      
      this.positions.set(node.id, { x, y, level: row })
    })
  }

  /**
   * 获取所有节点（深度优先遍历）
   */
  private getAllNodes(node: EnhancedFaultTreeNode): EnhancedFaultTreeNode[] {
    const nodes: EnhancedFaultTreeNode[] = [node]
    
    if (node.children) {
      node.children.forEach(child => {
        nodes.push(...this.getAllNodes(child))
      })
    }
    
    return nodes
  }

  /**
   * 按层级分组节点
   */
  private groupNodesByLevel(node: EnhancedFaultTreeNode, level: number = 0): Map<number, EnhancedFaultTreeNode[]> {
    const levelNodes = new Map<number, EnhancedFaultTreeNode[]>()
    
    const traverse = (currentNode: EnhancedFaultTreeNode, currentLevel: number) => {
      if (!levelNodes.has(currentLevel)) {
        levelNodes.set(currentLevel, [])
      }
      levelNodes.get(currentLevel)!.push(currentNode)

      if (currentNode.children) {
        currentNode.children.forEach(child => {
          traverse(child, currentLevel + 1)
        })
      }
    }

    traverse(node, level)
    return levelNodes
  }

  /**
   * 布局单个层级
   */
  private layoutLevel(nodes: EnhancedFaultTreeNode[], level: number): void {
    const totalWidth = (nodes.length - 1) * this.config.horizontalSpacing
    const startX = -totalWidth / 2
    const y = level * this.config.levelHeight

    nodes.forEach((node, index) => {
      const x = startX + index * this.config.horizontalSpacing
      this.positions.set(node.id, { x, y, level })
    })
  }

  /**
   * 生成连线
   */
  private generateConnections(node: EnhancedFaultTreeNode): void {
    const traverse = (currentNode: EnhancedFaultTreeNode) => {
      if (currentNode.children) {
        currentNode.children.forEach(child => {
          const connection: Connection = {
            from: currentNode.id,
            to: child.id,
            type: 'output',
            logicType: currentNode.gate_type,
            logicLabel: this.getLogicLabel(currentNode),
            style: this.getConnectionStyle(currentNode, child)
          }
          this.connections.push(connection)
          traverse(child)
        })
      }
    }

    traverse(node)
  }

  /**
   * 获取连线样式
   */
  private getConnectionStyle(from: EnhancedFaultTreeNode, to: EnhancedFaultTreeNode): object {
    const baseStyle = {
      color: '#DCDFE6',
      width: 2
    }

    // 如果是逻辑门节点，根据状态设置样式
    if (from.type === 'logic_gate') {
      switch (from.state) {
        case 'true':
          return { ...baseStyle, color: '#67C23A', width: 3 }
        case 'false':
          return { ...baseStyle, color: '#F56C6C', width: 3 }
        default:
          return { ...baseStyle, dashArray: '5,5' }
      }
    }

    return baseStyle
  }

  /**
   * 获取所有连线
   */
  getConnections(): Connection[] {
    return this.connections
  }

  /**
   * 生成SVG路径
   */
  generateSVGPath(from: RenderPosition, to: RenderPosition): string {
    const fromX = from.x + this.config.nodeWidth / 2
    const fromY = from.y + this.config.nodeHeight
    const toX = to.x + this.config.nodeWidth / 2
    const toY = to.y

    // 优化贝塞尔曲线路径，增加控制点偏移量确保连线有足够弧度
    const verticalDistance = Math.abs(to.y - from.y)
    const controlPointOffset = Math.max(verticalDistance / 2.5, 40) // 最小偏移40px
    
    const cp1X = fromX
    const cp1Y = fromY + controlPointOffset
    const cp2X = toX
    const cp2Y = toY - controlPointOffset

    return `M ${fromX} ${fromY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`
  }

  /**
   * 计算连线中点位置
   */
  getConnectionMidpoint(from: RenderPosition, to: RenderPosition): { x: number; y: number } {
    const fromX = from.x + this.config.nodeWidth / 2
    const fromY = from.y + this.config.nodeHeight
    const toX = to.x + this.config.nodeWidth / 2
    const toY = to.y

    // 优化中点计算，确保逻辑符号位于连线的最佳位置
    const midX = (fromX + toX) / 2
    
    // 计算贝塞尔曲线在中点的实际Y坐标
    const verticalDistance = Math.abs(toY - fromY)
    const controlPointOffset = Math.max(verticalDistance / 2.5, 40)
    
    // 贝塞尔曲线中点的Y坐标会比直线中点更向外凸出
    const midY = (fromY + toY) / 2
    
    // 确保逻辑符号不会太靠近节点边缘
    const nodeBuffer = 15 // 与节点边缘的最小距离
    const adjustedMidY = Math.max(
      Math.min(midY, toY - nodeBuffer), 
      fromY + nodeBuffer
    )

    return { x: midX, y: adjustedMidY }
  }

  /**
   * 获取逻辑关系标签
   */
  private getLogicLabel(node: EnhancedFaultTreeNode): string {
    if (node.type === 'logic_gate' && node.gate_type) {
      const labels = {
        'AND': '&',
        'OR': '∨',
        'NOT': '¬'
      }
      return labels[node.gate_type] || '?'
    }
    return ''
  }

  /**
   * 获取逻辑门颜色
   */
  private getLogicGateColor(gateType: LogicGateType): string {
    const colors = {
      'AND': '#409EFF',    // 蓝色 - 与门
      'OR': '#67C23A',     // 绿色 - 或门  
      'NOT': '#E6A23C'     // 橙色 - 非门
    }
    return colors[gateType] || '#909399'
  }

  /**
   * 计算视图边界
   */
  calculateViewBounds(): { width: number; height: number; minX: number; minY: number } {
    if (this.positions.size === 0) {
      return { width: 800, height: 600, minX: 0, minY: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    this.positions.forEach(pos => {
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x + this.config.nodeWidth)
      minY = Math.min(minY, pos.y)
      maxY = Math.max(maxY, pos.y + this.config.nodeHeight)
    })

    const padding = 50
    return {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
      minX: minX - padding,
      minY: minY - padding
    }
  }

  /**
   * 创建HTML渲染结构
   */
  createHTMLStructure(faultTree: EnhancedFaultTreeNode, layoutType: string = 'hierarchical'): string {
    const positions = this.calculateLayout(faultTree, layoutType)
    const bounds = this.calculateViewBounds()

    let html = `
    <div class="logic-gate-container" style="
      width: ${bounds.width}px; 
      height: ${bounds.height}px; 
      position: relative;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: auto;
    ">
    `

    // 渲染连线SVG
    html += this.renderConnectionsSVG(bounds)

    // 渲染节点
    html += this.renderNodes(faultTree, positions, bounds)

    html += '</div>'
    return html
  }

  /**
   * 渲染连线SVG
   */
  private renderConnectionsSVG(bounds: { width: number; height: number; minX: number; minY: number }): string {
    let svg = `
    <svg 
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"
      viewBox="0 0 ${bounds.width} ${bounds.height}"
    >
    `

    this.connections.forEach(connection => {
      const fromPos = this.positions.get(connection.from)
      const toPos = this.positions.get(connection.to)
      
      if (fromPos && toPos) {
        // 调整坐标相对于视图边界
        const adjustedFrom = {
          x: fromPos.x - bounds.minX,
          y: fromPos.y - bounds.minY,
          level: fromPos.level
        }
        const adjustedTo = {
          x: toPos.x - bounds.minX,
          y: toPos.y - bounds.minY,
          level: toPos.level
        }

        const path = this.generateSVGPath(adjustedFrom, adjustedTo)
        const style = connection.style || {}
        
        // 渲染连线
        svg += `
        <path 
          d="${path}" 
          stroke="${style.color || '#DCDFE6'}" 
          stroke-width="${style.width || 2}"
          ${style.dashArray ? `stroke-dasharray="${style.dashArray}"` : ''}
          fill="none"
          class="connection-path"
        />
        `

        // 如果有逻辑关系，在连线中间添加逻辑符号
        if (connection.logicLabel && connection.logicType) {
          const midpoint = this.getConnectionMidpoint(adjustedFrom, adjustedTo)
          const logicColor = this.getLogicGateColor(connection.logicType)
          const symbolSize = 24 // 增大符号尺寸从20到24
          
          svg += `
          <g class="logic-symbol-container" style="z-index: 100;">
            <!-- 阴影背景圆圈 -->
            <circle 
              cx="${midpoint.x + 1}" 
              cy="${midpoint.y + 1}" 
              r="${symbolSize / 2 + 1}" 
              fill="rgba(0, 0, 0, 0.1)" 
              class="logic-symbol-shadow"
            />
            <!-- 主背景圆圈 -->
            <circle 
              cx="${midpoint.x}" 
              cy="${midpoint.y}" 
              r="${symbolSize / 2}" 
              fill="white" 
              stroke="${logicColor}" 
              stroke-width="3"
              class="logic-symbol-bg"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            />
            <!-- 逻辑符号文字 -->
            <text 
              x="${midpoint.x}" 
              y="${midpoint.y + 4}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              font-size="16" 
              font-weight="bold" 
              fill="${logicColor}"
              class="logic-symbol-text"
              style="user-select: none; pointer-events: none;"
            >${connection.logicLabel}</text>
          </g>
          `
        }
      }
    })

    svg += '</svg>'
    return svg
  }

  /**
   * 渲染节点
   */
  private renderNodes(node: EnhancedFaultTreeNode, positions: Map<string, RenderPosition>, bounds: any): string {
    let html = ''

    const traverse = (currentNode: EnhancedFaultTreeNode) => {
      const pos = positions.get(currentNode.id)
      if (pos) {
        const adjustedX = pos.x - bounds.minX
        const adjustedY = pos.y - bounds.minY

        html += `
        <div 
          class="enhanced-tree-node ${currentNode.type === 'logic_gate' ? 'logic-gate' : 'fault-node'}"
          style="
            position: absolute;
            left: ${adjustedX}px;
            top: ${adjustedY}px;
            width: ${this.config.nodeWidth}px;
            min-height: ${this.config.nodeHeight}px;
          "
          data-node-id="${currentNode.id}"
          data-node-type="${currentNode.type}"
        >
          ${this.renderNodeContent(currentNode)}
        </div>
        `
      }

      if (currentNode.children) {
        currentNode.children.forEach(traverse)
      }
    }

    traverse(node)
    return html
  }

  /**
   * 渲染节点内容
   */
  private renderNodeContent(node: EnhancedFaultTreeNode): string {
    if (node.type === 'logic_gate') {
      return this.renderLogicGateContent(node)
    } else {
      return this.renderFaultNodeContent(node)
    }
  }

  /**
   * 渲染逻辑门内容
   */
  private renderLogicGateContent(node: EnhancedFaultTreeNode): string {
    const gateSymbol = this.getGateSymbol(node.gate_type!)
    const stateClass = `state-${node.state || 'unknown'}`
    
    return `
    <div class="logic-gate-content ${stateClass}">
      <div class="gate-symbol">${gateSymbol}</div>
      <div class="gate-name">${node.name}</div>
      ${node.condition ? `<div class="gate-condition">${this.truncateText(node.condition, 20)}</div>` : ''}
      <div class="gate-state-indicator ${stateClass}"></div>
    </div>
    `
  }

  /**
   * 渲染故障节点内容
   */
  private renderFaultNodeContent(node: EnhancedFaultTreeNode): string {
    return `
    <div class="fault-node-content">
      <div class="node-name">${node.name}</div>
      ${node.description ? `<div class="node-description">${this.truncateText(node.description, 30)}</div>` : ''}
    </div>
    `
  }

  /**
   * 获取逻辑门符号
   */
  private getGateSymbol(gateType: LogicGateType): string {
    const symbols = {
      'AND': '&',
      'OR': '∨',
      'NOT': '¬'
    }
    return symbols[gateType] || '?'
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
  }

  /**
   * 获取CSS样式
   */
  getCSSStyles(): string {
    return `
    .logic-gate-container {
      font-family: 'Microsoft YaHei', sans-serif;
      user-select: none;
    }

    .enhanced-tree-node {
      background: white;
      border: 2px solid #DCDFE6;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      cursor: pointer;
    }

    .enhanced-tree-node:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .logic-gate-content {
      padding: 12px;
      text-align: center;
      position: relative;
    }

    .gate-symbol {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #303133;
    }

    .gate-name {
      font-size: 12px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .gate-condition {
      font-size: 10px;
      color: #909399;
      font-family: monospace;
      background: #F5F7FA;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .gate-state-indicator {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1px solid white;
    }

    .state-true .gate-state-indicator {
      background: #67C23A;
    }

    .state-false .gate-state-indicator {
      background: #F56C6C;
    }

    .state-unknown .gate-state-indicator {
      background: #909399;
    }

    .fault-node-content {
      padding: 12px;
      text-align: center;
    }

    .node-name {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }

    .node-description {
      font-size: 11px;
      color: #606266;
      line-height: 1.3;
    }

    .connection-path {
      transition: all 0.3s ease;
    }

    .connection-path:hover {
      stroke-width: 4;
    }

    /* 逻辑符号样式 */
    .logic-symbol-container {
      transition: all 0.3s ease;
      z-index: 100;
    }

    .logic-symbol-shadow {
      opacity: 0.3;
    }

    .logic-symbol-bg {
      transition: all 0.3s ease;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
    }

    .logic-symbol-bg:hover {
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25));
      transform: scale(1.05);
      stroke-width: 4 !important;
    }

    .logic-symbol-text {
      transition: all 0.3s ease;
      user-select: none;
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 不同逻辑门类型的特殊样式 */
    .logic-gate-and .logic-symbol-bg {
      stroke: #409EFF;
    }

    .logic-gate-or .logic-symbol-bg {
      stroke: #67C23A;
    }

    .logic-gate-not .logic-symbol-bg {
      stroke: #E6A23C;
    }

    /* 激活状态的逻辑符号 */
    .logic-symbol-container.active .logic-symbol-bg {
      stroke-width: 3;
      filter: drop-shadow(0 0 10px currentColor);
    }

    .logic-symbol-container.active .logic-symbol-text {
      font-weight: bolder;
    }
    `
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取节点在指定位置
   */
  getNodeAtPosition(x: number, y: number): string | null {
    for (const [nodeId, pos] of this.positions) {
      if (x >= pos.x && x <= pos.x + this.config.nodeWidth &&
          y >= pos.y && y <= pos.y + this.config.nodeHeight) {
        return nodeId
      }
    }
    return null
  }

  /**
   * 高亮路径
   */
  highlightPath(nodeIds: string[]): void {
    // 添加高亮样式类
    nodeIds.forEach(nodeId => {
      const element = document.querySelector(`[data-node-id="${nodeId}"]`)
      if (element) {
        element.classList.add('highlighted')
      }
    })
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    document.querySelectorAll('.enhanced-tree-node.highlighted').forEach(element => {
      element.classList.remove('highlighted')
    })
  }
}

/**
 * 创建渲染器实例
 */
export function createLogicGateRenderer(): LogicGateRenderer {
  return new LogicGateRenderer()
}

/**
 * 渲染逻辑推理步骤
 */
export function renderReasoningSteps(steps: LogicReasoningStep[]): string {
  let html = '<div class="reasoning-steps">'
  
  steps.forEach((step, index) => {
    html += `
    <div class="reasoning-step">
      <div class="step-header">
        <span class="step-number">${index + 1}</span>
        <span class="step-gate">${step.gate_type} 门</span>
        <span class="step-result ${step.output ? 'true' : 'false'}">${step.output ? '真' : '假'}</span>
      </div>
      <div class="step-condition">${step.condition}</div>
      <div class="step-reasoning">${step.reasoning}</div>
    </div>
    `
  })
  
  html += '</div>'
  return html
}