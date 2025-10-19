/**
 * 知识库管理相关路由
 * 处理知识库和文档的CRUD操作、搜索等功能
 */
import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledgeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { generalLimiter, searchLimiter } from '../middleware/rateLimit.js';
import { 
  validateCreateKnowledgeBase,
  validateAddDocument,
  validateSearchKnowledge,
  validateUUID,
  validatePagination
} from '../middleware/validation.js';

const router = Router();

// 所有知识库路由都需要认证
router.use(authenticateToken);

/**
 * 获取用户知识库列表
 * GET /api/knowledge
 */
router.get('/', generalLimiter, validatePagination, KnowledgeController.getKnowledgeBases);

/**
 * 创建新知识库
 * POST /api/knowledge
 */
router.post('/', generalLimiter, validateCreateKnowledgeBase, KnowledgeController.createKnowledgeBase);

/**
 * 添加文档到知识库
 * POST /api/knowledge/:knowledgeBaseId/documents
 */
router.post('/:knowledgeBaseId/documents', generalLimiter, validateUUID, validateAddDocument, KnowledgeController.addDocument);

/**
 * 获取知识库文档列表
 * GET /api/knowledge/:knowledgeBaseId/documents
 */
router.get('/:knowledgeBaseId/documents', generalLimiter, validateUUID, validatePagination, KnowledgeController.getDocuments);

/**
 * 删除文档
 * DELETE /api/knowledge/:knowledgeBaseId/documents/:documentId
 */
router.delete('/:knowledgeBaseId/documents/:documentId', generalLimiter, validateUUID, KnowledgeController.deleteDocument);

/**
 * 搜索知识库
 * POST /api/knowledge/search
 */
router.post('/search', searchLimiter, validateSearchKnowledge, KnowledgeController.searchKnowledge);

export default router;