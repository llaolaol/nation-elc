// 故障树可视化服务
import * as echarts from 'echarts'
import type { FaultTreeNode, EChartsNodeData, DiagnosisResult } from '@/types'
import { NODE_LEVEL_COLORS, NODE_LEVEL_SIZES } from '@/constants'

/**
 * 故障树可视化类
 */
export class FaultTreeVisualization {
  private chartInstance: echarts.ECharts | null = null

  /**
   * 初始化图表
   */
  init(container: HTMLElement): void {
    if (this.chartInstance) {
      this.chartInstance.dispose()
    }
    
    this.chartInstance = echarts.init(container, null, {
      renderer: 'canvas',
      useDirtyRect: true // 启用脏矩形优化
    })

    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  /**
   * 渲染故障树
   */
  render(faultTree: FaultTreeNode, diagnosisResult?: DiagnosisResult): void {
    if (!this.chartInstance) {
      throw new Error('图表未初始化')
    }

    const chartData = this.convertToEChartsFormat(faultTree)
    const highlightedNodes = diagnosisResult 
      ? this.findHighlightNodes(faultTree, diagnosisResult.fault_type)
      : []

    const option = this.createChartOption(chartData, highlightedNodes, diagnosisResult)
    this.chartInstance.setOption(option, true)
  }

  /**
   * 转换为ECharts格式
   */
  private convertToEChartsFormat(node: FaultTreeNode): EChartsNodeData {
    return {
      name: node.name,
      id: node.id,
      value: node.name,
      level: node.level,
      symbolSize: this.getSymbolSize(node.level),
      itemStyle: {
        color: this.getNodeColor(node.level)
      },
      label: {
        fontSize: this.getFontSize(node.level),
        fontWeight: this.getFontWeight(node.level)
      },
      children: node.children?.map((child: FaultTreeNode) => this.convertToEChartsFormat(child)) || [],
      nodeData: {
        level: node.level,
        description: node.description,
        recommendation: node.recommendation
      }
    }
  }

  /**
   * 创建图表配置
   */
  private createChartOption(
    data: EChartsNodeData, 
    highlightedNodes: string[],
    diagnosisResult?: DiagnosisResult
  ) {
    return {
      title: {
        text: diagnosisResult ? `诊断结果: ${diagnosisResult.fault_type}` : '故障树结构',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: diagnosisResult ? this.getFaultTypeColor(diagnosisResult.fault_type) : '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(50,50,50,0.9)',
        borderColor: '#333',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        formatter: this.createTooltipFormatter(highlightedNodes, diagnosisResult)
      },
      animationDuration: 1000,
      animationEasing: 'cubicOut' as any,
      series: [{
        type: 'tree',
        data: [data],
        top: diagnosisResult ? '15%' : '10%',
        left: '5%',
        bottom: '5%',
        right: '15%',
        orient: 'LR', // 水平布局
        symbol: 'circle',
        expandAndCollapse: true,
        initialTreeDepth: 3, // 初始展开层级
        itemStyle: {
          color: (params: any) => this.getItemColor(params, highlightedNodes),
          borderColor: '#fff',
          borderWidth: (params: any) => this.getBorderWidth(params, highlightedNodes),
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.2)'
        },
        lineStyle: {
          color: (params: any) => this.getLineColor(params, highlightedNodes),
          width: (params: any) => this.getLineWidth(params, highlightedNodes),
          curveness: 0.3
        },
        label: {
          position: 'right',
          distance: 8,
          fontSize: (params: any) => this.getLabelFontSize(params),
          color: (params: any) => this.getLabelColor(params, highlightedNodes),
          fontWeight: (params: any) => this.getLabelFontWeight(params, highlightedNodes),
          formatter: (params: any) => this.formatNodeLabel(params, highlightedNodes)
        },
        emphasis: {
          focus: 'descendant',
          itemStyle: {
            borderWidth: 4,
            shadowBlur: 12
          },
          lineStyle: {
            width: 4
          }
        },
        blur: {
          itemStyle: {
            opacity: 0.4
          },
          lineStyle: {
            opacity: 0.4
          },
          label: {
            opacity: 0.4
          }
        }
      }]
    }
  }

  /**
   * 查找高亮节点
   */
  private findHighlightNodes(node: FaultTreeNode, faultType: string): string[] {
    const matches: string[] = []
    
    const searchNode = (currentNode: FaultTreeNode) => {
      // 模糊匹配逻辑
      if (this.isNodeMatched(currentNode.name, faultType)) {
        matches.push(currentNode.name)
      }
      
      // 递归搜索子节点
      currentNode.children?.forEach(searchNode)
    }
    
    searchNode(node)
    return matches
  }

  /**
   * 节点匹配判断
   */
  private isNodeMatched(nodeName: string, faultType: string): boolean {
    const keywords = this.extractKeywords(faultType)
    return keywords.some(keyword => nodeName.includes(keyword))
  }

  /**
   * 提取关键词
   */
  private extractKeywords(faultType: string): string[] {
    const keywordMap: Record<string, string[]> = {
      '设备受潮': ['受潮', '潮湿', '水分'],
      '中温过热': ['过热', '中温', '300', '700'],
      '高温过热': ['过热', '高温', '700'],
      '绝缘放电': ['绝缘', '放电'],
      '悬浮放电': ['悬浮', '放电'],
      '尖端放电': ['尖端', '放电'],
      '沿面放电': ['沿面', '放电'],
      '油中高能放电': ['高能', '放电'],
      '油中低能放电': ['低能', '放电']
    }
    
    return keywordMap[faultType] || [faultType]
  }

  /**
   * 获取节点大小
   */
  private getSymbolSize(level: string): number {
    return NODE_LEVEL_SIZES[level as keyof typeof NODE_LEVEL_SIZES] || 30
  }

  /**
   * 获取节点颜色
   */
  private getNodeColor(level: string): string {
    return NODE_LEVEL_COLORS[level as keyof typeof NODE_LEVEL_COLORS] || '#95a5a6'
  }

  /**
   * 获取字体大小
   */
  private getFontSize(level: string): number {
    const sizeMap: Record<string, number> = {
      '根节点': 14,
      '一级节点': 14,
      '二级节点': 12,
      '三级节点': 11,
      '四级节点': 10,
      '五级节点': 9,
      '六级节点': 9
    }
    return sizeMap[level] || 10
  }

  /**
   * 获取字体粗细
   */
  private getFontWeight(level: string): string {
    return ['根节点', '一级节点', '二级节点'].includes(level) ? 'bold' : 'normal'
  }

  /**
   * 获取项目颜色（带高亮）
   */
  private getItemColor(params: any, highlightedNodes: string[]): string {
    const isHighlighted = highlightedNodes.includes(params.data.name)
    if (isHighlighted) {
      return '#e74c3c' // 高亮色
    }
    return this.getNodeColor(params.data.level)
  }

  /**
   * 获取边框宽度
   */
  private getBorderWidth(params: any, highlightedNodes: string[]): number {
    const isHighlighted = highlightedNodes.includes(params.data.name)
    return isHighlighted ? 4 : 2
  }

  /**
   * 获取连线颜色
   */
  private getLineColor(params: any, highlightedNodes: string[]): string {
    const isHighlighted = highlightedNodes.includes(params.data.name)
    return isHighlighted ? '#e74c3c' : '#ddd'
  }

  /**
   * 获取连线宽度
   */
  private getLineWidth(params: any, highlightedNodes: string[]): number {
    const isHighlighted = highlightedNodes.includes(params.data.name)
    return isHighlighted ? 3 : 1.5
  }

  /**
   * 获取标签字体大小
   */
  private getLabelFontSize(params: any): number {
    return this.getFontSize(params.data.level)
  }

  /**
   * 获取标签颜色
   */
  private getLabelColor(params: any, highlightedNodes: string[]): string {
    const isHighlighted = highlightedNodes.includes(params.data.name)
    return isHighlighted ? '#e74c3c' : '#333'
  }

  /**
   * 获取标签字体粗细
   */
  private getLabelFontWeight(params: any, highlightedNodes: string[]): string {
    const isHighlighted = highlightedNodes.includes(params.data.name)
    return isHighlighted ? 'bold' : this.getFontWeight(params.data.level)
  }

  /**
   * 格式化节点标签
   */
  private formatNodeLabel(params: any, highlightedNodes: string[]): string {
    const name = params.data.name
    const isHighlighted = highlightedNodes.includes(name)
    const maxLength = 15
    
    let displayName = name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name
    
    if (isHighlighted) {
      displayName = `★ ${displayName}`
    }
    
    return displayName
  }

  /**
   * 创建提示框格式化器
   */
  private createTooltipFormatter(highlightedNodes: string[], diagnosisResult?: DiagnosisResult) {
    return (params: any) => {
      const data = params.data
      const isHighlighted = highlightedNodes.includes(data.name)
      
      let html = `<div style="max-width: 300px;">`
      html += `<div style="font-weight: bold; margin-bottom: 5px;">${data.name}</div>`
      html += `<div style="color: #ccc; font-size: 11px; margin-bottom: 5px;">级别: ${data.level}</div>`
      
      if (isHighlighted) {
        html += `<div style="color: #e74c3c; margin-bottom: 5px;">★ 诊断路径节点</div>`
      }
      
      if (data.nodeData?.description) {
        html += `<div style="margin-bottom: 5px;"><strong>描述:</strong><br/>${data.nodeData.description}</div>`
      }
      
      if (data.nodeData?.recommendation) {
        html += `<div><strong>建议:</strong><br/>${data.nodeData.recommendation}</div>`
      }
      
      if (diagnosisResult && isHighlighted) {
        html += `<div style="margin-top: 10px; padding: 8px; background: rgba(231,76,60,0.1); border-left: 3px solid #e74c3c;">`
        html += `<div style="font-weight: bold;">置信度: ${(diagnosisResult.confidence * 100).toFixed(1)}%</div>`
        html += `</div>`
      }
      
      html += `</div>`
      return html
    }
  }

  /**
   * 获取故障类型颜色
   */
  private getFaultTypeColor(faultType: string): string {
    const dangerTypes = ['高温过热', '悬浮放电', '沿面放电', '油中高能放电']
    return dangerTypes.includes(faultType) ? '#e74c3c' : '#3498db'
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize(): void {
    if (this.chartInstance) {
      this.chartInstance.resize()
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
    window.removeEventListener('resize', this.handleResize.bind(this))
  }

  /**
   * 导出图片
   */
  exportImage(type: 'png' | 'jpeg' = 'png'): string | null {
    if (!this.chartInstance) return null
    
    return this.chartInstance.getDataURL({
      type,
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
  }

  /**
   * 高亮特定节点
   */
  highlightNodes(nodeNames: string[]): void {
    if (!this.chartInstance) return
    
    // 通过动画效果高亮节点
    this.chartInstance.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: nodeNames
    })
  }

  /**
   * 取消高亮
   */
  downplayNodes(): void {
    if (!this.chartInstance) return
    
    this.chartInstance.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    })
  }
}