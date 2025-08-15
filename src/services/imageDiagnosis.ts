// 图像诊断服务
import type { 
  ImageDiagnosisParams, 
  ImageDiagnosisResult, 
  ImageDiagnosisTask,
  ProcessedImage,
  ImageAnnotation 
} from '@/types';

// N8N 图像诊断 API 地址
const N8N_IMAGE_DIAGNOSIS_URL = 'https://n8n.bd.kxsz.net:9443/webhook/upload-image';

// 是否使用 Mock API (生产环境中应该从环境变量读取)
const USE_MOCK_API = false;

/**
 * 图像诊断服务类
 */
export class ImageDiagnosisService {
  
  /**
   * 提交图像诊断任务
   */
  static async submitDiagnosisTask(params: ImageDiagnosisParams): Promise<ImageDiagnosisTask> {
    if (USE_MOCK_API) {
      return this.mockSubmitDiagnosisTask(params);
    }
    
    // 真实 N8N API 调用实现
    return this.submitToN8N(params);
  }

  /**
   * 获取任务状态
   */
  static async getTaskStatus(taskId: string): Promise<ImageDiagnosisTask> {
    if (USE_MOCK_API) {
      return this.mockGetTaskStatus(taskId);
    }
    
    // 真实 API 实现
    const response = await fetch(`${N8N_IMAGE_DIAGNOSIS_URL}/status/${taskId}`);
    if (!response.ok) {
      throw new Error(`获取任务状态失败: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * 取消任务
   */
  static async cancelTask(taskId: string): Promise<void> {
    if (USE_MOCK_API) {
      return this.mockCancelTask(taskId);
    }
    
    // 真实 API 实现
    const response = await fetch(`${N8N_IMAGE_DIAGNOSIS_URL}/cancel/${taskId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`取消任务失败: ${response.statusText}`);
    }
  }

  // ==================== Mock API 实现 ====================

  /**
   * Mock: 提交诊断任务
   */
  private static async mockSubmitDiagnosisTask(params: ImageDiagnosisParams): Promise<ImageDiagnosisTask> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const taskId = this.generateTaskId();
    const now = new Date().toISOString();

    // 创建任务对象
    const task: ImageDiagnosisTask = {
      task_id: taskId,
      status: 'pending',
      created_at: now,
      updated_at: now,
      params: params,
      progress: 0,
      retry_count: 0
    };

    // 保存到本地存储
    this.saveTaskToStorage(task);

    // 异步模拟任务处理
    this.simulateTaskProcessing(taskId);

    return task;
  }

  /**
   * Mock: 获取任务状态
   */
  private static async mockGetTaskStatus(taskId: string): Promise<ImageDiagnosisTask> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));

    const task = this.getTaskFromStorage(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    return task;
  }

  /**
   * Mock: 取消任务
   */
  private static async mockCancelTask(taskId: string): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    const task = this.getTaskFromStorage(taskId);
    if (task && ['pending', 'uploading', 'processing'].includes(task.status)) {
      task.status = 'failed';
      task.error_message = '任务已被用户取消';
      task.updated_at = new Date().toISOString();
      this.saveTaskToStorage(task);
    }
  }

  /**
   * 模拟任务处理过程
   */
  private static async simulateTaskProcessing(taskId: string) {
    const updateTask = (updates: Partial<ImageDiagnosisTask>) => {
      const task = this.getTaskFromStorage(taskId);
      if (task) {
        Object.assign(task, updates, { updated_at: new Date().toISOString() });
        this.saveTaskToStorage(task);
      }
    };

    try {
      // 第一阶段: 上传文件 (2-3秒)
      updateTask({ 
        status: 'uploading', 
        progress: 10, 
        current_step: '上传图像文件...' 
      });

      await this.sleep(1000);
      updateTask({ progress: 30 });

      await this.sleep(1000);
      updateTask({ progress: 50 });

      await this.sleep(500);
      updateTask({ 
        status: 'processing', 
        progress: 60,
        current_step: '图像预处理...',
        started_at: new Date().toISOString()
      });

      // 第二阶段: 图像处理 (3-5秒)
      await this.sleep(1000);
      updateTask({ 
        progress: 70, 
        current_step: '特征提取与分析...' 
      });

      await this.sleep(1500);
      updateTask({ 
        progress: 85, 
        current_step: 'AI模型推理...' 
      });

      await this.sleep(1000);
      updateTask({ 
        progress: 95, 
        current_step: '生成诊断报告...' 
      });

      await this.sleep(800);

      // 第三阶段: 完成并生成结果
      const result = this.generateMockResult(taskId);
      updateTask({
        status: 'completed',
        progress: 100,
        current_step: '诊断完成',
        completed_at: new Date().toISOString(),
        result: result
      });

    } catch (error) {
      // 模拟偶发错误 (5% 概率)
      if (Math.random() < 0.05) {
        updateTask({
          status: 'failed',
          error_message: '图像处理服务暂时不可用，请稍后重试',
          current_step: '处理失败'
        });
      }
    }
  }

  /**
   * 生成模拟诊断结果
   */
  private static generateMockResult(taskId: string): ImageDiagnosisResult {
    const task = this.getTaskFromStorage(taskId);
    if (!task) throw new Error('任务不存在');

    // 随机故障类型和严重程度
    const dischargeTypes = [
      '局部放电', '悬浮放电', '尖端放电', '沿面放电', 
      '绝缘老化', '无明显异常'
    ];
    const faultLocations = [
      'A相绕组', 'B相绕组', 'C相绕组', '绕组接头', 
      '套管区域', '铁芯接地', '油箱内部', '未明确定位'
    ];

    const dischargeType = dischargeTypes[Math.floor(Math.random() * dischargeTypes.length)];
    const isNormal = dischargeType === '无明显异常';
    const severityLevel = isNormal ? 1 : Math.floor(Math.random() * 4) + 2; // 1-5
    const confidenceScore = 0.6 + Math.random() * 0.35; // 0.6-0.95
    const faultProbability = isNormal ? Math.random() * 0.3 : 0.4 + Math.random() * 0.6; // 0-0.3 或 0.4-1.0

    // 生成 AI 洞察
    const insights = this.generateInsights(dischargeType, severityLevel);
    
    // 生成推荐措施
    const recommendations = this.generateRecommendations(dischargeType, severityLevel);

    // 处理图像信息
    const processedImages = this.generateProcessedImages(task.params.image_files);

    return {
      task_id: taskId,
      equipment_info: task.params.equipment_info,
      image_analysis: {
        discharge_type: dischargeType,
        severity_level: severityLevel,
        confidence_score: confidenceScore,
        fault_location: faultLocations[Math.floor(Math.random() * faultLocations.length)],
        fault_probability: faultProbability
      },
      ai_insights: insights,
      recommended_actions: recommendations,
      processed_images: processedImages,
      diagnosis_time: new Date().toISOString(),
      processing_duration: 8 + Math.floor(Math.random() * 7), // 8-15秒
      technical_details: {
        algorithm_version: 'v2.1.3',
        model_confidence: confidenceScore,
        processing_steps: [
          '图像质量检测',
          '特征点提取',
          '模式识别',
          '故障分类',
          '置信度计算'
        ]
      }
    };
  }

  /**
   * 生成 AI 洞察
   */
  private static generateInsights(dischargeType: string, severityLevel: number): string[] {
    const baseInsights = [
      `检测到${dischargeType}模式，建议进一步监测`,
      `当前严重程度为 ${severityLevel}/5，需要关注设备运行状态`
    ];

    if (severityLevel >= 4) {
      baseInsights.push('高严重程度故障，建议立即安排检修');
      baseInsights.push('建议停机检查，避免故障扩大');
    } else if (severityLevel >= 3) {
      baseInsights.push('中等严重程度，建议加强监测频率');
    } else {
      baseInsights.push('轻微异常，可继续运行但需密切监测');
    }

    if (dischargeType !== '无明显异常') {
      baseInsights.push('建议结合油气分析数据进行综合判断');
    }

    return baseInsights;
  }

  /**
   * 生成推荐措施
   */
  private static generateRecommendations(dischargeType: string, severityLevel: number): string[] {
    const recommendations: string[] = [];

    if (dischargeType === '无明显异常') {
      recommendations.push('继续正常运行，保持定期监测');
      recommendations.push('建议3个月后复检');
      return recommendations;
    }

    // 基础推荐措施
    recommendations.push('立即通知运维人员，记录发现时间');
    
    if (severityLevel >= 4) {
      recommendations.push('立即安排停电检修，避免事故扩大');
      recommendations.push('联系专业检修团队进行详细检查');
      recommendations.push('准备备用设备，确保供电连续性');
    } else if (severityLevel >= 3) {
      recommendations.push('制定检修计划，尽快安排停电检查');
      recommendations.push('加强日常巡检，每日记录设备状态');
      recommendations.push('进行油气分析，获取更多诊断信息');
    } else {
      recommendations.push('增加监测频率，每周进行一次检查');
      recommendations.push('观察故障发展趋势，记录变化情况');
    }

    // 特定故障类型的建议
    if (dischargeType.includes('绕组')) {
      recommendations.push('重点检查绕组绝缘状况和接头连接');
    }
    
    if (dischargeType.includes('放电')) {
      recommendations.push('使用超声波检测定位放电源');
    }

    return recommendations;
  }

  /**
   * 生成处理后的图像信息
   */
  private static generateProcessedImages(files: File[]): ProcessedImage[] {
    return files.map((file, index) => {
      const imageId = `img_${Date.now()}_${index}`;
      const originalUrl = URL.createObjectURL(file);
      
      // 模拟处理后的图像 (这里使用相同的图像作为示例)
      const processedUrl = originalUrl; // 实际应用中这里是处理后的图像URL
      
      // 生成模拟标注
      const annotations: ImageAnnotation[] = [];
      const annotationCount = Math.floor(Math.random() * 3) + 1; // 1-3个标注
      
      for (let i = 0; i < annotationCount; i++) {
        annotations.push({
          annotation_id: `ann_${imageId}_${i}`,
          type: 'bbox',
          coordinates: [
            Math.random() * 100, // x
            Math.random() * 100, // y
            20 + Math.random() * 30, // width
            20 + Math.random() * 30  // height
          ],
          label: ['放电点', '异常区域', '疑似故障'][Math.floor(Math.random() * 3)],
          confidence: 0.7 + Math.random() * 0.3,
          description: '检测到的异常区域'
        });
      }

      return {
        image_id: imageId,
        original_name: file.name,
        original_url: originalUrl,
        processed_url: processedUrl,
        annotations: annotations,
        file_size: file.size,
        dimensions: {
          width: 1024 + Math.floor(Math.random() * 1024), // 模拟图像尺寸
          height: 768 + Math.floor(Math.random() * 768)
        }
      };
    });
  }

  // ==================== 真实 N8N API 实现 ====================

  /**
   * 向 N8N 提交诊断任务
   */
  private static async submitToN8N(params: ImageDiagnosisParams): Promise<ImageDiagnosisTask> {
    const taskId = this.generateTaskId();
    const now = new Date().toISOString();

    try {
      // 创建初始任务对象
      const task: ImageDiagnosisTask = {
        task_id: taskId,
        status: 'uploading',
        created_at: now,
        updated_at: now,
        started_at: now,
        params: params,
        progress: 20,
        current_step: '上传图像到n8n服务器...',
        retry_count: 0
      };

      // 保存任务到本地存储
      this.saveTaskToStorage(task);

      // 上传每个图像文件并收集结果
      const uploadResults = [];
      
      for (let i = 0; i < params.image_files.length; i++) {
        const file = params.image_files[i];
        const formData = new FormData();
        
        // 添加文件 - 根据curl示例使用'file'作为字段名
        formData.append('file', file);
        
        // 添加设备信息作为元数据
        formData.append('device_id', params.equipment_info.device_id);
        formData.append('device_type', params.equipment_info.device_type);
        formData.append('location', params.equipment_info.location);
        formData.append('image_type', params.image_type);
        formData.append('sensitivity', params.sensitivity);
        formData.append('file_index', i.toString());

        // 更新上传进度
        const uploadProgress = 20 + (i / params.image_files.length) * 60;
        this.updateTaskProgress(taskId, uploadProgress, `正在处理第${i + 1}/${params.image_files.length}个图像...`);

        const response = await fetch(N8N_IMAGE_DIAGNOSIS_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`图像诊断请求失败: ${response.status} ${response.statusText}`);
        }

        let result;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          // 如果返回的是文本，尝试解析为JSON或直接使用文本
          const textResult = await response.text();
          try {
            result = JSON.parse(textResult);
          } catch {
            result = { message: textResult, file_name: file.name };
          }
        }
        
        uploadResults.push(result);
      }

      // 更新为生成结果阶段
      this.updateTaskProgress(taskId, 90, '生成诊断报告...');

      // 直接完成任务并生成结果
      const diagnosisResult = this.convertN8nResultToSystemFormat(taskId, uploadResults, task);
      
      // 立即完成任务
      const completedTask: ImageDiagnosisTask = {
        ...task,
        status: 'completed',
        progress: 100,
        current_step: '诊断完成',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        result: diagnosisResult
      };

      // 保存完成的任务
      this.saveTaskToStorage(completedTask);

      return completedTask;

    } catch (error) {
      console.error('N8N图像诊断请求失败:', error);
      
      // 创建失败任务
      const failedTask: ImageDiagnosisTask = {
        task_id: taskId,
        status: 'failed',
        created_at: now,
        updated_at: new Date().toISOString(),
        started_at: now,
        params: params,
        progress: 0,
        current_step: '诊断失败',
        error_message: error instanceof Error ? error.message : '未知错误',
        retry_count: 0
      };

      // 保存失败任务
      this.saveTaskToStorage(failedTask);
      
      throw new Error(`图像诊断失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 更新任务进度
   */
  private static updateTaskProgress(taskId: string, progress: number, currentStep: string): void {
    const task = this.getTaskFromStorage(taskId);
    if (task) {
      task.progress = progress;
      task.current_step = currentStep;
      task.updated_at = new Date().toISOString();
      this.saveTaskToStorage(task);
    }
  }

  /**
   * 更新任务状态
   */
  private static updateTaskStatus(taskId: string, status: any, progress: number, currentStep: string): void {
    const task = this.getTaskFromStorage(taskId);
    if (task) {
      task.status = status;
      task.progress = progress;
      task.current_step = currentStep;
      task.updated_at = new Date().toISOString();
      this.saveTaskToStorage(task);
    }
  }


  /**
   * 将n8n结果转换为系统格式
   */
  private static convertN8nResultToSystemFormat(taskId: string, n8nResults: any[], task: ImageDiagnosisTask): ImageDiagnosisResult {
    // 分析n8n返回的结果
    const primaryResult = n8nResults[0] || {};
    
    // 解析新的返回格式
    const analysisContent = primaryResult.content || '';
    const annotations = primaryResult.annotations || [];
    
    // 从分析内容中提取关键信息
    const extractedInfo = this.extractAnalysisInfo(analysisContent);
    
    // 提取诊断信息
    const dischargeType = extractedInfo.dischargeType || '图像分析完成';
    const confidence = extractedInfo.confidence || 0.85; // 基于AI分析内容的默认置信度
    const severity = this.calculateSeverityFromAnalysis(analysisContent);
    
    // 生成AI洞察（基于分析内容）
    const insights = this.generateInsightsFromAnalysisContent(analysisContent);
    const recommendations = this.generateRecommendationsFromAnalysisContent(analysisContent);
    
    // 处理图像信息
    const processedImages = this.generateProcessedImagesFromN8nResult(task.params.image_files, n8nResults);

    return {
      task_id: taskId,
      equipment_info: task.params.equipment_info,
      image_analysis: {
        discharge_type: dischargeType,
        severity_level: severity,
        confidence_score: confidence,
        fault_location: extractedInfo.faultLocation || '需要进一步分析确定',
        fault_probability: extractedInfo.faultProbability || confidence
      },
      ai_insights: insights,
      recommended_actions: recommendations,
      processed_images: processedImages,
      diagnosis_time: new Date().toISOString(),
      processing_duration: Math.floor((new Date().getTime() - new Date(task.created_at).getTime()) / 1000),
      technical_details: {
        algorithm_version: 'n8n-v2.0',
        model_confidence: confidence,
        processing_steps: [
          '图像上传完成',
          'AI图像分析处理',
          '特征提取与分类',
          '综合判断完成'
        ]
      },
      // 新增字段：完整的分析内容
      detailed_analysis: {
        full_content: analysisContent,
        structured_content: this.parseAnalysisContent(analysisContent),
        annotations: annotations
      }
    };
  }

  /**
   * 从分析内容中提取关键信息
   */
  private static extractAnalysisInfo(content: string): any {
    const info = {
      dischargeType: '',
      confidence: 0.85,
      faultLocation: '',
      faultProbability: 0.85
    };

    // 提取放电类型
    const dischargeMatch = content.match(/判断该局部放电类型为：\*\*(.+?)\*\*/);
    if (dischargeMatch) {
      info.dischargeType = dischargeMatch[1];
    }

    // 根据分析内容判断置信度
    if (content.includes('明显的对称性') && content.includes('集中分布较密集')) {
      info.confidence = 0.9;
      info.faultProbability = 0.88;
    }

    // 提取故障位置信息
    if (content.includes('正半周') && content.includes('负半周')) {
      info.faultLocation = '正负半周对称分布区域';
    }

    return info;
  }

  /**
   * 解析分析内容为结构化数据
   */
  private static parseAnalysisContent(content: string): any {
    const sections = {
      featureAnalysis: '',
      dischargeCharacteristics: '',
      comprehensiveJudgment: ''
    };

    // 提取特征分析部分
    const featureMatch = content.match(/### 特征分析：([\s\S]*?)### 综合判断：/);
    if (featureMatch) {
      sections.featureAnalysis = featureMatch[1].trim();
    }

    // 提取综合判断部分
    const judgmentMatch = content.match(/### 综合判断：([\s\S]*?)因此，判断该局部放电类型为：/);
    if (judgmentMatch) {
      sections.comprehensiveJudgment = judgmentMatch[1].trim();
    }

    return sections;
  }

  /**
   * 从分析内容计算严重程度
   */
  private static calculateSeverityFromAnalysis(content: string): number {
    // 根据分析内容判断严重程度
    if (content.includes('绝缘内部放电')) {
      return 4; // 较严重
    }
    if (content.includes('对称性') && content.includes('集中分布较密集')) {
      return 3; // 中等严重
    }
    if (content.includes('无明显异常')) {
      return 1; // 正常
    }
    return 3; // 默认中等严重
  }

  /**
   * 从分析内容生成AI洞察
   */
  private static generateInsightsFromAnalysisContent(content: string): string[] {
    const insights = [];

    if (content.includes('绝缘内部放电')) {
      insights.push('AI检测到绝缘内部放电特征，需要重点关注设备绝缘状况');
    }

    if (content.includes('对称性')) {
      insights.push('放电数据显示明显的对称性分布，符合典型放电模式');
    }

    if (content.includes('正半周') && content.includes('负半周')) {
      insights.push('放电在正负半周期中均匀分布，表明故障具有周期性特征');
    }

    if (content.includes('集中分布较密集')) {
      insights.push('放电数据集中分布，表明故障位置相对固定');
    }

    // 添加通用洞察
    insights.push('建议结合其他检测手段进行综合判断');
    insights.push('定期监测放电趋势变化情况');

    return insights;
  }

  /**
   * 从分析内容生成推荐措施
   */
  private static generateRecommendationsFromAnalysisContent(content: string): string[] {
    const recommendations = [];

    if (content.includes('绝缘内部放电')) {
      recommendations.push('立即安排绝缘系统专项检查');
      recommendations.push('测量绝缘电阻和介质损耗因数');
      recommendations.push('检查绝缘材料老化情况');
    }

    if (content.includes('对称性') && content.includes('集中分布')) {
      recommendations.push('定位具体故障点，制定针对性维修方案');
      recommendations.push('加强该区域的监测频率');
    }

    // 添加通用推荐措施
    recommendations.push('建立设备档案，跟踪放电发展趋势');
    recommendations.push('制定应急预案，防止故障扩大');
    recommendations.push('定期进行局部放电检测');

    return recommendations;
  }

  /**
   * 从n8n结果计算严重程度
   */
  private static calculateSeverityFromResult(result: any): number {
    if (result.severity_level) return result.severity_level;
    if (result.confidence && result.confidence > 0.8) return 4;
    if (result.confidence && result.confidence > 0.6) return 3;
    return 2;
  }

  /**
   * 从n8n结果生成洞察
   */
  private static generateInsightsFromN8nResult(results: any[]): string[] {
    const insights = [];
    
    if (results.length > 0) {
      const mainResult = results[0];
      
      if (mainResult.message) {
        insights.push(`n8n分析结果: ${mainResult.message}`);
      }
      
      if (mainResult.diagnosis) {
        insights.push(`诊断结论: ${mainResult.diagnosis}`);
      }
      
      if (mainResult.confidence) {
        insights.push(`分析置信度: ${(mainResult.confidence * 100).toFixed(1)}%`);
      }
      
      insights.push('建议结合其他检测手段进行综合判断');
    } else {
      insights.push('图像已成功上传并处理');
      insights.push('请查看具体分析结果');
    }
    
    return insights;
  }

  /**
   * 从n8n结果生成推荐措施
   */
  private static generateRecommendationsFromN8nResult(results: any[]): string[] {
    const recommendations = [];
    
    if (results.length > 0) {
      const mainResult = results[0];
      
      if (mainResult.recommendation) {
        recommendations.push(mainResult.recommendation);
      }
      
      if (mainResult.next_steps) {
        recommendations.push(mainResult.next_steps);
      }
    }
    
    // 添加通用推荐
    recommendations.push('记录分析结果并存档');
    recommendations.push('定期进行图像诊断监测');
    recommendations.push('如有异常请联系专业技术人员');
    
    return recommendations;
  }

  /**
   * 从n8n结果生成处理后的图像信息
   */
  private static generateProcessedImagesFromN8nResult(files: File[], results: any[]): ProcessedImage[] {
    return files.map((file, index) => {
      const imageId = `img_${Date.now()}_${index}`;
      const originalUrl = URL.createObjectURL(file);
      const result = results[index] || results[0] || {};
      
      // 模拟标注信息（根据n8n实际返回的数据调整）
      const annotations: ImageAnnotation[] = [];
      
      if (result.annotations) {
        // 如果n8n返回了标注信息
        result.annotations.forEach((ann: any, i: number) => {
          annotations.push({
            annotation_id: `ann_${imageId}_${i}`,
            type: ann.type || 'bbox',
            coordinates: ann.coordinates || [],
            label: ann.label || '检测区域',
            confidence: ann.confidence || 0.8,
            description: ann.description || '自动检测标注'
          });
        });
      }
      
      return {
        image_id: imageId,
        original_name: file.name,
        original_url: originalUrl,
        processed_url: originalUrl, // 实际应用中可能是处理后的图像URL
        annotations: annotations,
        file_size: file.size,
        dimensions: {
          width: 1024, // 实际应从图像中获取
          height: 768
        }
      };
    });
  }

  /**
   * 生成任务ID
   */
  private static generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 睡眠函数
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 保存任务到本地存储
   */
  private static saveTaskToStorage(task: ImageDiagnosisTask): void {
    const tasks = this.getAllTasksFromStorage();
    const existingIndex = tasks.findIndex(t => t.task_id === task.task_id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    localStorage.setItem('image_diagnosis_tasks', JSON.stringify(tasks));
  }

  /**
   * 从本地存储获取任务
   */
  private static getTaskFromStorage(taskId: string): ImageDiagnosisTask | null {
    const tasks = this.getAllTasksFromStorage();
    return tasks.find(task => task.task_id === taskId) || null;
  }

  /**
   * 获取所有任务
   */
  private static getAllTasksFromStorage(): ImageDiagnosisTask[] {
    try {
      const tasksJson = localStorage.getItem('image_diagnosis_tasks');
      return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
      console.error('解析任务数据失败:', error);
      return [];
    }
  }

  /**
   * 清理本地存储中的任务
   */
  static clearTasksFromStorage(): void {
    localStorage.removeItem('image_diagnosis_tasks');
  }

  /**
   * 获取所有本地任务 (用于前端显示)
   */
  static getAllTasks(): ImageDiagnosisTask[] {
    return this.getAllTasksFromStorage();
  }

  /**
   * 删除特定任务
   */
  static removeTask(taskId: string): void {
    const tasks = this.getAllTasksFromStorage();
    const filteredTasks = tasks.filter(task => task.task_id !== taskId);
    localStorage.setItem('image_diagnosis_tasks', JSON.stringify(filteredTasks));
  }

  /**
   * 清理已完成的任务
   */
  static clearCompletedTasks(): void {
    const tasks = this.getAllTasksFromStorage();
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    localStorage.setItem('image_diagnosis_tasks', JSON.stringify(activeTasks));
  }
}

// 导出默认实例
export default ImageDiagnosisService;