import axios from 'axios';

// SiliconFlow API配置
const SILICONFLOW_API_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.com/v1';
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || '';

if (!SILICONFLOW_API_KEY) {
  console.warn('警告: 缺少SiliconFlow API密钥，AI功能将不可用');
}

// API客户端配置 - 创建多个配置用于测试不同的认证格式
const createApiClient = (authFormat: 'bearer' | 'direct' | 'token') => {
  let authHeader: string;
  
  switch (authFormat) {
    case 'bearer':
      authHeader = `Bearer ${SILICONFLOW_API_KEY}`;
      break;
    case 'direct':
      authHeader = SILICONFLOW_API_KEY;
      break;
    case 'token':
      authHeader = `Token ${SILICONFLOW_API_KEY}`;
      break;
    default:
      authHeader = `Bearer ${SILICONFLOW_API_KEY}`;
  }
  
  console.log(`🔧 创建API客户端 - 认证格式: ${authFormat}, Authorization: ${authHeader.substring(0, 20)}...`);
  console.log(`🌐 Base URL: ${SILICONFLOW_API_URL}`);
  
  return axios.create({
    baseURL: SILICONFLOW_API_URL,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30秒超时
  });
};

// 默认使用Bearer格式
let apiClient = createApiClient('bearer');

// 聊天请求接口
interface ChatRequest {
  message: string;
  context?: Array<{ role: string; content: string }>;
  projectId?: string;
}

// 文本生成请求接口
interface GenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

// API响应接口
interface APIResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SiliconFlowService {
  // 验证API密钥格式
  static validateApiKey(): { isValid: boolean; error?: string } {
    if (!SILICONFLOW_API_KEY) {
      return { isValid: false, error: 'API密钥未配置' };
    }
    
    const trimmedKey = SILICONFLOW_API_KEY.trim();
    console.log('API密钥长度:', trimmedKey.length);
    console.log('API密钥前缀:', trimmedKey.substring(0, 10));
    console.log('API密钥是否包含换行符:', SILICONFLOW_API_KEY.includes('\n'));
    console.log('API密钥是否包含回车符:', SILICONFLOW_API_KEY.includes('\r'));
    
    if (trimmedKey.length === 0) {
      return { isValid: false, error: 'API密钥为空' };
    }
    
    if (!trimmedKey.startsWith('sk-')) {
      return { isValid: false, error: 'API密钥格式不正确，应以sk-开头' };
    }
    
    if (trimmedKey.length < 20) {
      return { isValid: false, error: 'API密钥长度不足' };
    }
    
    return { isValid: true };
  }

  // AI聊天对话 - 支持多种认证格式测试
  static async chat(request: ChatRequest): Promise<APIResponse> {
    // 尝试不同的认证格式
    const authFormats: ('bearer' | 'direct' | 'token')[] = ['direct', 'bearer', 'token'];
    let lastError: any;
    
    for (const authFormat of authFormats) {
      try {
        console.log(`🔄 尝试认证格式: ${authFormat}`);
        
        // 验证API密钥
        const validation = this.validateApiKey();
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // 创建对应格式的API客户端
        const currentClient = createApiClient(authFormat);

        // 构建消息历史
        const messages = [
          {
            role: 'system',
            content: '你是一个专业的论文写作助手，擅长学术写作、研究方法和论文结构。请用中文回答，提供准确、有用的建议。'
          }
        ];

        // 添加上下文消息
        if (request.context && request.context.length > 0) {
          messages.push(...request.context);
        }

        // 添加当前用户消息
        messages.push({
          role: 'user',
          content: request.message
        });

        const requestData = {
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages,
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        };

        console.log(`📤 发送请求到: ${SILICONFLOW_API_URL}/chat/completions`);
        console.log(`📋 请求数据:`, JSON.stringify(requestData, null, 2));

        const response = await currentClient.post('/chat/completions', requestData);

        console.log(`✅ 认证格式 ${authFormat} 成功！响应状态: ${response.status}`);
        console.log(`📥 响应数据:`, response.data);

        const choice = response.data.choices[0];
        return {
          content: choice.message.content,
          usage: response.data.usage
        };
      } catch (error) {
        console.error(`❌ 认证格式 ${authFormat} 失败:`, error);
        lastError = error;
        
        // 详细的错误日志
        if (axios.isAxiosError(error)) {
          console.error('请求配置:', {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            baseURL: error.config?.baseURL
          });
          console.error('响应状态:', error.response?.status);
          console.error('响应数据:', error.response?.data);
          console.error('响应头:', error.response?.headers);
          
          // 如果是401错误，继续尝试下一种格式
          if (error.response?.status === 401) {
            console.log(`🔄 认证格式 ${authFormat} 返回401，尝试下一种格式...`);
            continue;
          }
          // 其他错误直接抛出
          else if (error.response?.status === 429) {
            throw new Error('API请求频率超限，请稍后重试');
          } else if (error.response?.status === 500) {
            throw new Error('AI服务暂时不可用，请稍后重试');
          } else if (error.response?.status === 403) {
            throw new Error('API访问被拒绝，请检查密钥权限');
          } else {
            throw new Error(`API请求失败 (${error.response?.status}): ${error.response?.data || error.message}`);
          }
        } else {
          console.error('非HTTP错误:', error);
          // 网络错误也继续尝试下一种格式
          continue;
        }
      }
    }
    
    // 所有认证格式都失败了
    console.error('❌ 所有认证格式都失败了');
    if (axios.isAxiosError(lastError)) {
      if (lastError.response?.status === 401) {
        const validation = this.validateApiKey();
        console.error('密钥验证结果:', validation);
        throw new Error(`API密钥无效: ${lastError.response?.data || '所有认证格式都被拒绝'}`);
      }
    }
    throw new Error(`网络错误: ${lastError instanceof Error ? lastError.message : '未知错误'}`);
  }

  // AI文本生成
  static async generateText(request: GenerateTextRequest): Promise<APIResponse> {
    try {
      if (!SILICONFLOW_API_KEY) {
        throw new Error('SiliconFlow API密钥未配置');
      }

      const response = await apiClient.post('/chat/completions', {
        model: request.model || 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的论文写作助手，擅长学术写作、研究方法和论文结构。请用中文回答，提供准确、有用的内容。'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        stream: false
      });

      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('SiliconFlow文本生成API错误:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('API密钥无效');
        } else if (error.response?.status === 429) {
          throw new Error('API请求频率超限');
        } else if (error.response?.status === 500) {
          throw new Error('AI服务暂时不可用');
        }
      }
      throw new Error('AI服务请求失败');
    }
  }

  // 获取可用模型列表
  static async getModels(): Promise<string[]> {
    try {
      if (!SILICONFLOW_API_KEY) {
        throw new Error('SiliconFlow API密钥未配置');
      }

      const response = await apiClient.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('获取模型列表错误:', error);
      // 返回默认模型列表
      return [
        'Qwen/Qwen2.5-7B-Instruct',
        'Qwen/Qwen2.5-14B-Instruct',
        'Qwen/Qwen2.5-32B-Instruct'
      ];
    }
  }

  // 检查API状态
  static async checkStatus(): Promise<boolean> {
    try {
      if (!SILICONFLOW_API_KEY) {
        return false;
      }

      await apiClient.get('/models');
      return true;
    } catch (error) {
      console.error('SiliconFlow API状态检查失败:', error);
      return false;
    }
  }

  // 生成文本嵌入向量（如果支持）
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!SILICONFLOW_API_KEY) {
        throw new Error('SiliconFlow API密钥未配置');
      }

      // 注意：这里需要根据SiliconFlow的实际API文档调整
      // 如果不支持embedding，可以使用其他服务或本地模型
      const response = await apiClient.post('/embeddings', {
        model: 'text-embedding-ada-002', // 根据实际支持的模型调整
        input: text
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('生成文本嵌入错误:', error);
      throw new Error('文本嵌入生成失败');
    }
  }
}