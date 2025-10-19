/**
 * 项目管理相关路由
 * 处理项目的CRUD操作
 */
import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { 
  validateCreateProject, 
  validateUpdateProject, 
  validateUUID,
  validatePagination 
} from '../middleware/validation.js';

const router = Router();

// 所有项目路由都需要认证
router.use(authenticateToken);

/**
 * 获取用户项目列表
 * GET /api/projects
 */
router.get('/', generalLimiter, validatePagination, ProjectController.getProjects);

/**
 * 创建新项目
 * POST /api/projects
 */
router.post('/', generalLimiter, validateCreateProject, ProjectController.createProject);

/**
 * 获取单个项目详情
 * GET /api/projects/:id
 */
router.get('/:id', generalLimiter, validateUUID, ProjectController.getProject);

/**
 * 更新项目信息
 * PUT /api/projects/:id
 */
router.put('/:id', generalLimiter, validateUUID, validateUpdateProject, ProjectController.updateProject);

/**
 * 删除项目
 * DELETE /api/projects/:id
 */
router.delete('/:id', generalLimiter, validateUUID, ProjectController.deleteProject);

export default router;