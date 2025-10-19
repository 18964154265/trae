/**
 * 用户认证相关路由
 * 处理用户注册、登录、token管理等
 */
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', authLimiter, validateRegister, AuthController.register);

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', authLimiter, validateLogin, AuthController.login);

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, AuthController.getCurrentUser);

/**
 * 刷新token
 * POST /api/auth/refresh
 */
router.post('/refresh', authenticateToken, AuthController.refreshToken);

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, AuthController.logout);

export default router;
