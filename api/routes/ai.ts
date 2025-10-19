/**
 * AI服务相关路由
 * 处理AI对话、文本生成、内容优化等功能
 */
import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { 
  validateAIChat, 
  validateGenerateText, 
  validateOptimizeContent,
  validateTranslate 
} from '../middleware/validation.js';

const router = Router();

/**
 * API健康检查 (无需认证)
 * GET /api/ai/health
 */
router.get('/health', AIController.healthCheck);

// 所有其他AI路由都需要认证
router.use(authenticateToken);

/**
 * AI对话聊天
 * POST /api/ai/chat
 */
router.post('/chat', aiLimiter, validateAIChat, AIController.chat);

/**
 * AI文本生成
 * POST /api/ai/generate
 */
router.post('/generate', aiLimiter, validateGenerateText, AIController.generateText);

/**
 * 内容优化
 * POST /api/ai/optimize
 */
router.post('/optimize', aiLimiter, validateOptimizeContent, AIController.optimizeContent);

/**
 * 文本翻译
 * POST /api/ai/translate
 */
router.post('/translate', aiLimiter, validateTranslate, AIController.translate);

/**
 * 获取AI使用统计
 * GET /api/ai/usage
 */
router.get('/usage', aiLimiter, AIController.getUsageStats);

export default router;