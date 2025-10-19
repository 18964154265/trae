import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

interface AuthRequest extends Request {
  user?: any;
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// JWT认证中间件
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: '访问令牌缺失'
      });
      return;
    }

    // 验证JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JWTPayload;

    // 验证用户是否仍然存在
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: '无效的访问令牌'
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: '无效的访问令牌'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: '访问令牌已过期'
      });
    } else {
      console.error('认证中间件错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
};

// 可选认证中间件（用于可选登录的接口）
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // 没有token，继续执行，但不设置用户信息
      next();
      return;
    }

    // 验证JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JWTPayload;

    // 验证用户是否仍然存在
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', decoded.userId)
      .single();

    if (!error && user) {
      // 将用户信息添加到请求对象
      req.user = {
        userId: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      };
    }

    next();
  } catch (error) {
    // 认证失败，但不阻止请求继续执行
    next();
  }
};