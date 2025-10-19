/**
 * 统一的API响应格式工具
 */
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  /**
   * 错误响应
   */
  static error(res: Response, error: string, statusCode: number = 400, data?: any): Response {
    const response: ApiResponse = {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    res: Response, 
    data: T[], 
    page: number, 
    limit: number, 
    total: number,
    message?: string
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      message,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      timestamp: new Date().toISOString()
    };
    return res.status(200).json(response);
  }

  /**
   * 创建成功响应
   */
  static created<T>(res: Response, data: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * 无内容响应
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * 未找到响应
   */
  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  /**
   * 未授权响应
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  /**
   * 禁止访问响应
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  /**
   * 服务器错误响应
   */
  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 500);
  }

  /**
   * 验证错误响应
   */
  static validationError(res: Response, errors: any): Response {
    return this.error(res, 'Validation failed', 400, errors);
  }

  /**
   * 限流响应
   */
  static tooManyRequests(res: Response, message: string = 'Too many requests'): Response {
    return this.error(res, message, 429);
  }
}