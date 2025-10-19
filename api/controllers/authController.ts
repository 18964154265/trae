import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

interface AuthRequest extends Request {
  user?: any;
}

export class AuthController {
  // 用户注册
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // 验证输入
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          error: '请提供完整的注册信息'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: '密码长度至少6位'
        });
        return;
      }

      // 检查用户是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: '该邮箱已被注册'
        });
        return;
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);

      // 创建用户
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password: hashedPassword
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('注册错误:', error);
        res.status(500).json({
          success: false,
          error: '注册失败，请稍后重试'
        });
        return;
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 用户登录
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // 验证输入
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: '请提供邮箱和密码'
        });
        return;
      }

      // 查找用户
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        res.status(401).json({
          success: false,
          error: '邮箱或密码错误'
        });
        return;
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: '邮箱或密码错误'
        });
        return;
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 获取当前用户信息
  static async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        res.status(404).json({
          success: false,
          error: '用户不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at
          }
        }
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 刷新token
  static async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const email = req.user?.email;

      // 生成新的JWT token
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      console.error('刷新token错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 用户登出
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // 在实际应用中，可以将token加入黑名单
      // 这里简单返回成功响应
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
}