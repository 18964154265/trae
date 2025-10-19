import { Request, Response } from 'express';
import { SiliconFlowService } from '../services/siliconFlowService.js';

interface AuthRequest extends Request {
  user?: any;
}

export class AIController {
  // API健康检查
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // 验证API密钥格式
      const validation = SiliconFlowService.validateApiKey();
      
      if (!validation.isValid) {
        res.status(503).json({
          success: false,
          error: `API配置错误: ${validation.error}`,
          status: 'unhealthy'
        });
        return;
      }

      // 尝试调用API进行连接测试
      try {
        const testResponse = await SiliconFlowService.chat({
          message: '测试连接'
        });
        
        res.json({
          success: true,
          status: 'healthy',
          message: 'API连接正常',
          apiKeyValid: true
        });
      } catch (apiError) {
        console.error('API连接测试失败:', apiError);
        res.status(503).json({
          success: false,
          error: apiError instanceof Error ? apiError.message : 'API连接失败',
          status: 'unhealthy',
          apiKeyValid: false
        });
      }
    } catch (error) {
      console.error('健康检查错误:', error);
      res.status(500).json({
        success: false,
        error: '健康检查失败',
        status: 'error'
      });
    }
  }

  // AI聊天对话
  static async chat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { message, context, projectId } = req.body;

      // 验证输入
      if (!message || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '消息内容不能为空'
        });
        return;
      }

      // 调用SiliconFlow API
      const response = await SiliconFlowService.chat({
        message: message.trim(),
        context: context || [],
        projectId
      });

      res.json({
        success: true,
        data: {
          response: response.content,
          usage: response.usage
        }
      });
    } catch (error) {
      console.error('AI聊天错误:', error);
      
      // 根据错误类型返回不同的错误信息
      let errorMessage = 'AI服务暂时不可用，请稍后重试';
      let statusCode = 500;
      
      if (error instanceof Error) {
        const errorMsg = error.message;
        
        if (errorMsg.includes('API密钥')) {
          errorMessage = '服务配置错误，请联系管理员检查API密钥设置';
          statusCode = 503; // Service Unavailable
        } else if (errorMsg.includes('频率超限')) {
          errorMessage = 'API请求过于频繁，请稍后重试';
          statusCode = 429; // Too Many Requests
        } else if (errorMsg.includes('网络错误')) {
          errorMessage = '网络连接异常，请检查网络后重试';
          statusCode = 502; // Bad Gateway
        } else if (errorMsg.includes('访问被拒绝')) {
          errorMessage = '服务访问权限不足，请联系管理员';
          statusCode = 403; // Forbidden
        }
        
        console.error('详细错误信息:', errorMsg);
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // AI文本生成
  static async generateText(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { prompt, type = 'general', maxTokens = 1000 } = req.body;

      // 验证输入
      if (!prompt || prompt.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '提示词不能为空'
        });
        return;
      }

      // 根据类型调整提示词
      let enhancedPrompt = prompt.trim();
      switch (type) {
        case 'academic':
          enhancedPrompt = `作为一个学术写作助手，请帮助完成以下内容：${prompt}`;
          break;
        case 'outline':
          enhancedPrompt = `请为以下主题创建一个详细的论文大纲：${prompt}`;
          break;
        case 'summary':
          enhancedPrompt = `请对以下内容进行总结：${prompt}`;
          break;
        case 'expansion':
          enhancedPrompt = `请扩展以下内容，使其更加详细和完整：${prompt}`;
          break;
      }

      // 调用SiliconFlow API
      const response = await SiliconFlowService.generateText({
        prompt: enhancedPrompt,
        maxTokens
      });

      res.json({
        success: true,
        data: {
          text: response.content,
          usage: response.usage
        }
      });
    } catch (error) {
      console.error('AI文本生成错误:', error);
      res.status(500).json({
        success: false,
        error: 'AI服务暂时不可用，请稍后重试'
      });
    }
  }

  // AI内容优化
  static async optimizeContent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { content, optimizationType = 'general' } = req.body;

      // 验证输入
      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '内容不能为空'
        });
        return;
      }

      // 根据优化类型调整提示词
      let prompt = '';
      switch (optimizationType) {
        case 'grammar':
          prompt = `请检查并修正以下文本的语法错误，保持原意不变：\n\n${content}`;
          break;
        case 'style':
          prompt = `请优化以下文本的写作风格，使其更加学术化和专业：\n\n${content}`;
          break;
        case 'clarity':
          prompt = `请重写以下文本，使其更加清晰易懂：\n\n${content}`;
          break;
        case 'concise':
          prompt = `请将以下文本改写得更加简洁，去除冗余内容：\n\n${content}`;
          break;
        default:
          prompt = `请优化以下文本，使其更加完善：\n\n${content}`;
      }

      // 调用SiliconFlow API
      const response = await SiliconFlowService.generateText({
        prompt,
        maxTokens: 2000
      });

      res.json({
        success: true,
        data: {
          optimizedContent: response.content,
          usage: response.usage
        }
      });
    } catch (error) {
      console.error('AI内容优化错误:', error);
      res.status(500).json({
        success: false,
        error: 'AI服务暂时不可用，请稍后重试'
      });
    }
  }

  // AI翻译
  static async translate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { text, targetLanguage = 'zh', sourceLanguage = 'auto' } = req.body;

      // 验证输入
      if (!text || text.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '翻译文本不能为空'
        });
        return;
      }

      // 构建翻译提示词
      const languageMap: { [key: string]: string } = {
        'zh': '中文',
        'en': '英文',
        'ja': '日文',
        'ko': '韩文',
        'fr': '法文',
        'de': '德文',
        'es': '西班牙文'
      };

      const targetLang = languageMap[targetLanguage] || '中文';
      const prompt = `请将以下文本翻译成${targetLang}，保持原文的学术性和专业性：\n\n${text}`;

      // 调用SiliconFlow API
      const response = await SiliconFlowService.generateText({
        prompt,
        maxTokens: 2000
      });

      res.json({
        success: true,
        data: {
          translatedText: response.content,
          sourceLanguage,
          targetLanguage,
          usage: response.usage
        }
      });
    } catch (error) {
      console.error('AI翻译错误:', error);
      res.status(500).json({
        success: false,
        error: 'AI服务暂时不可用，请稍后重试'
      });
    }
  }

  // 获取AI使用统计
  static async getUsageStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      // 这里可以从数据库获取用户的AI使用统计
      // 暂时返回模拟数据
      const stats = {
        totalRequests: 0,
        totalTokens: 0,
        todayRequests: 0,
        todayTokens: 0,
        remainingQuota: 10000
      };

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('获取AI使用统计错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
}