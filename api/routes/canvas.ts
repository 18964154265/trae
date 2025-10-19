/**
 * Canvas画布相关路由
 * 处理画布数据的保存、加载、导出等操作
 */
import { Router } from 'express';
import { CanvasController } from '../controllers/canvasController.js';
import { authenticateToken } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { 
  validateSaveCanvasData, 
  validateUUID 
} from '../middleware/validation.js';

const router = Router();

// 所有Canvas路由都需要认证
router.use(authenticateToken);

/**
 * 获取项目的Canvas数据
 * GET /api/canvas/:projectId
 */
router.get('/:projectId', generalLimiter, validateUUID, CanvasController.getCanvasData);

/**
 * 保存Canvas数据
 * POST /api/canvas/:projectId
 */
router.post('/:projectId', generalLimiter, validateUUID, validateSaveCanvasData, CanvasController.saveCanvasData);

/**
 * 导出Canvas数据
 * GET /api/canvas/:projectId/export
 */
router.get('/:projectId/export', generalLimiter, validateUUID, CanvasController.exportCanvas);

/**
 * 清空Canvas数据
 * DELETE /api/canvas/:projectId
 */
router.delete('/:projectId', generalLimiter, validateUUID, CanvasController.clearCanvas);

export default router;