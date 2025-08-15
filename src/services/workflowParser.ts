// Workflow解析器 - 将n8n workflow转换为故障树结构
import type { 
  WorkflowNode, 
  ParsedWorkflow, 
  EnhancedFaultTreeNode, 
  LogicGateNode, 
  LogicGateType,
  LogicGateState,
  DiagnosisParams 
} from '@/types'

/**
 * 解析n8n workflow JSON
 */
export class WorkflowParser {
  private nodes: Map<string, WorkflowNode> = new Map()
  private connections: Map<string, string[]> = new Map()
  private logicGates: LogicGateNode[] = []

  /**
   * 解析workflow JSON
   */
  parseWorkflow(workflowJson: any): ParsedWorkflow {
    this.clear()
    
    // 解析nodes
    if (workflowJson.nodes) {
      workflowJson.nodes.forEach((node: any) => {
        const workflowNode: WorkflowNode = {
          id: node.id,
          name: node.name,
          type: node.type,
          parameters: node.parameters,
          position: node.position
        }
        this.nodes.set(node.id, workflowNode)
      })
    }

    // 解析connections
    if (workflowJson.connections) {
      Object.entries(workflowJson.connections).forEach(([nodeId, connections]: [string, any]) => {
        if (connections.main && Array.isArray(connections.main)) {
          const targets: string[] = []
          connections.main.forEach((connectionGroup: any[]) => {
            connectionGroup.forEach((connection: any) => {
              if (connection.node) {
                targets.push(connection.node)
              }
            })
          })
          this.connections.set(nodeId, targets)
        }
      })
    }

    // 生成逻辑门
    this.generateLogicGates()

    // 构建故障树
    const faultTree = this.buildFaultTree()

    return {
      nodes: Array.from(this.nodes.values()),
      connections: this.connections,
      logic_gates: this.logicGates,
      fault_tree: faultTree
    }
  }

  /**
   * 生成逻辑门节点
   */
  private generateLogicGates(): void {
    this.nodes.forEach((node, nodeId) => {
      // 识别IF节点并转换为逻辑门
      if (this.isConditionNode(node)) {
        const logicGate = this.createLogicGateFromCondition(node)
        if (logicGate) {
          this.logicGates.push(logicGate)
        }
      }
    })
  }

  /**
   * 判断是否为条件节点
   */
  private isConditionNode(node: WorkflowNode): boolean {
    return node.name.includes('If：') || 
           node.name.includes('是否') ||
           node.type === 'n8n-nodes-base.if' ||
           (node.parameters && node.parameters.conditions)
  }

  /**
   * 从条件节点创建逻辑门
   */
  private createLogicGateFromCondition(node: WorkflowNode): LogicGateNode | null {
    let gateType: LogicGateType = 'OR' // 默认为OR门
    let condition = ''

    // 根据节点名称判断逻辑类型
    if (node.name.includes('是否')) {
      // 单一条件判断 - 通常为OR门（选择分支）
      gateType = 'OR'
      condition = this.extractConditionFromName(node.name)
    }

    // 分析参数中的条件
    if (node.parameters && node.parameters.conditions) {
      const conditions = node.parameters.conditions
      if (conditions.conditions && Array.isArray(conditions.conditions)) {
        // 多个条件的组合
        gateType = conditions.combinator === 'and' ? 'AND' : 'OR'
        condition = this.buildConditionExpression(conditions.conditions)
      }
    }

    // 获取输入和输出节点
    const inputNodes = this.getInputNodes(node.id)
    const outputNodes = this.connections.get(node.id) || []

    return {
      id: `gate_${node.id}`,
      type: 'logic_gate',
      gate_type: gateType,
      name: this.cleanNodeName(node.name),
      description: `逻辑判断: ${condition}`,
      condition,
      state: 'unknown',
      input_nodes: inputNodes,
      output_nodes: outputNodes,
      position: node.position ? { x: node.position[0], y: node.position[1] } : undefined
    }
  }

  /**
   * 从节点名称提取条件
   */
  private extractConditionFromName(name: string): string {
    const matches = name.match(/是否(.+?)？?$/)
    return matches ? matches[1] : name
  }

  /**
   * 构建条件表达式
   */
  private buildConditionExpression(conditions: any[]): string {
    return conditions.map((cond: any) => {
      const left = cond.leftValue || ''
      const operator = this.getOperatorSymbol(cond.operator?.operation || 'equals')
      const right = cond.rightValue || ''
      return `${left} ${operator} ${right}`
    }).join(' AND ')
  }

  /**
   * 获取操作符符号
   */
  private getOperatorSymbol(operation: string): string {
    const operatorMap: Record<string, string> = {
      'equals': '==',
      'notEquals': '!=',
      'larger': '>',
      'largerEqual': '>=',
      'smaller': '<',
      'smallerEqual': '<=',
      'contains': 'contains',
      'notContains': 'not contains'
    }
    return operatorMap[operation] || operation
  }

  /**
   * 获取输入节点
   */
  private getInputNodes(nodeId: string): string[] {
    const inputs: string[] = []
    this.connections.forEach((targets, sourceId) => {
      if (targets.includes(nodeId)) {
        inputs.push(sourceId)
      }
    })
    return inputs
  }

  /**
   * 清理节点名称
   */
  private cleanNodeName(name: string): string {
    return name.replace(/^If：/, '').replace(/？$/, '')
  }

  /**
   * 构建故障树结构
   */
  private buildFaultTree(): EnhancedFaultTreeNode {
    // 找到根节点（通常是Webhook或手动触发器）
    const rootNode = this.findRootNode()
    
    if (!rootNode) {
      throw new Error('无法找到workflow根节点')
    }

    return this.buildTreeNode(rootNode, new Set())
  }

  /**
   * 查找根节点
   */
  private findRootNode(): WorkflowNode | null {
    // 查找没有输入连接的节点
    const nodeIds = Array.from(this.nodes.keys())
    const hasInput = new Set<string>()
    
    this.connections.forEach(targets => {
      targets.forEach(target => hasInput.add(target))
    })

    const rootCandidates = nodeIds.filter(id => !hasInput.has(id))
    
    // 优先选择Webhook或手动触发器
    for (const id of rootCandidates) {
      const node = this.nodes.get(id)!
      if (node.type.includes('webhook') || node.type.includes('manualTrigger')) {
        return node
      }
    }

    // 如果没有找到，返回第一个没有输入的节点
    return rootCandidates.length > 0 ? this.nodes.get(rootCandidates[0])! : null
  }

  /**
   * 构建树节点
   */
  private buildTreeNode(node: WorkflowNode, visited: Set<string>): EnhancedFaultTreeNode {
    if (visited.has(node.id)) {
      // 避免循环引用
      return {
        id: node.id,
        name: node.name,
        type: 'fault_node'
      }
    }

    visited.add(node.id)

    // 检查是否为逻辑门节点
    const logicGate = this.logicGates.find(gate => gate.id === `gate_${node.id}`)
    
    const treeNode: EnhancedFaultTreeNode = {
      id: node.id,
      name: this.getDisplayName(node),
      type: logicGate ? 'logic_gate' : 'fault_node',
      description: this.getNodeDescription(node),
      position: node.position ? { x: node.position[0], y: node.position[1] } : undefined
    }

    // 如果是逻辑门，添加逻辑门属性
    if (logicGate) {
      treeNode.gate_type = logicGate.gate_type
      treeNode.state = logicGate.state
      treeNode.condition = logicGate.condition
    }

    // 递归构建子节点
    const childConnections = this.connections.get(node.id) || []
    if (childConnections.length > 0) {
      treeNode.children = childConnections.map(childId => {
        const childNode = this.nodes.get(childId)
        return childNode ? this.buildTreeNode(childNode, new Set(visited)) : null
      }).filter(Boolean) as EnhancedFaultTreeNode[]
    }

    return treeNode
  }

  /**
   * 获取显示名称
   */
  private getDisplayName(node: WorkflowNode): string {
    // 清理节点名称，移除技术性前缀
    let name = node.name
    name = name.replace(/^If：/, '')
    name = name.replace(/？$/, '')
    name = name.replace(/^\d+\.\s*/, '') // 移除序号
    return name || `节点_${node.id.slice(0, 8)}`
  }

  /**
   * 获取节点描述
   */
  private getNodeDescription(node: WorkflowNode): string {
    if (node.type.includes('webhook')) {
      return '数据输入入口'
    }
    if (node.type.includes('manualTrigger')) {
      return '手动触发器'
    }
    if (node.type.includes('if')) {
      return '条件判断节点'
    }
    if (node.type.includes('switch')) {
      return '分支选择节点'
    }
    if (node.type.includes('code')) {
      return '代码执行节点'
    }
    return '处理节点'
  }

  /**
   * 根据诊断参数计算逻辑门状态
   */
  evaluateLogicGates(params: DiagnosisParams): void {
    this.logicGates.forEach(gate => {
      gate.state = this.evaluateGateCondition(gate, params)
    })
  }

  /**
   * 评估逻辑门条件
   */
  private evaluateGateCondition(gate: LogicGateNode, params: DiagnosisParams): LogicGateState {
    if (!gate.condition) {
      return 'unknown'
    }

    try {
      // 简单的条件评估逻辑
      const result = this.evaluateConditionExpression(gate.condition, params)
      return result ? 'true' : 'false'
    } catch (error) {
      console.warn('条件评估失败:', gate.condition, error)
      return 'unknown'
    }
  }

  /**
   * 评估条件表达式
   */
  private evaluateConditionExpression(condition: string, params: DiagnosisParams): boolean {
    // 这里实现简单的条件评估逻辑
    // 在实际应用中可能需要更复杂的表达式解析器
    
    // 替换参数值
    let expression = condition
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}|\\$json\\.${key}`, 'g')
      expression = expression.replace(regex, String(value))
    })

    // 简单的数值比较
    const comparisonMatch = expression.match(/(\d+(?:\.\d+)?)\s*(==|!=|>|>=|<|<=)\s*(\d+(?:\.\d+)?)/)
    if (comparisonMatch) {
      const [, left, operator, right] = comparisonMatch
      const leftVal = parseFloat(left)
      const rightVal = parseFloat(right)
      
      switch (operator) {
        case '==': return leftVal === rightVal
        case '!=': return leftVal !== rightVal
        case '>': return leftVal > rightVal
        case '>=': return leftVal >= rightVal
        case '<': return leftVal < rightVal
        case '<=': return leftVal <= rightVal
        default: return false
      }
    }

    // 默认返回unknown状态对应false
    return false
  }

  /**
   * 清理内部状态
   */
  private clear(): void {
    this.nodes.clear()
    this.connections.clear()
    this.logicGates = []
  }

  /**
   * 获取诊断路径
   */
  getDiagnosisPath(conclusion: string): string[] {
    const path: string[] = []
    
    // 根据结论找到对应的终端节点
    const targetNode = Array.from(this.nodes.values()).find(node => 
      node.name.includes(conclusion) || 
      (node.parameters && JSON.stringify(node.parameters).includes(conclusion))
    )

    if (targetNode) {
      // 回溯路径
      this.tracePath(targetNode.id, path, new Set())
    }

    return path.reverse()
  }

  /**
   * 回溯路径
   */
  private tracePath(nodeId: string, path: string[], visited: Set<string>): void {
    if (visited.has(nodeId)) return
    
    visited.add(nodeId)
    path.push(nodeId)

    // 查找输入节点
    const inputNodes = this.getInputNodes(nodeId)
    inputNodes.forEach(inputId => {
      this.tracePath(inputId, path, visited)
    })
  }
}

/**
 * 工厂函数，创建workflow解析器实例
 */
export function createWorkflowParser(): WorkflowParser {
  return new WorkflowParser()
}

/**
 * 解析workflow文件
 */
export async function parseWorkflowFile(file: File): Promise<ParsedWorkflow> {
  const content = await file.text()
  const workflowJson = JSON.parse(content)
  const parser = createWorkflowParser()
  return parser.parseWorkflow(workflowJson)
}

/**
 * 从URL解析workflow
 */
export async function parseWorkflowFromUrl(url: string): Promise<ParsedWorkflow> {
  const response = await fetch(url)
  const workflowJson = await response.json()
  const parser = createWorkflowParser()
  return parser.parseWorkflow(workflowJson)
}