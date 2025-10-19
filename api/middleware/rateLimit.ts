import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 通用限流中间件
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 认证相关的限流（更严格）
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个IP最多10次认证请求
  message: {
    success: false,
    error: '认证请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

// AI相关的限流
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每分钟最多20个AI请求
  message: {
    success: false,
    error: 'AI请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // 对于已认证用户，使用用户ID作为key
    const authReq = req as any;
    return authReq.user?.userId || req.ip;
  }
});

// 文件上传限流
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次上传
  message: {
    success: false,
    error: '文件上传过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 搜索限流
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每分钟最多30次搜索
  message: {
    success: false,
    error: '搜索请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});