import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

interface AuthRequest extends Request {
  user?: any;
}

export class ProjectController {
  // 获取用户的所有项目
  static async getProjects(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('获取项目列表错误:', error);
        res.status(500).json({
          success: false,
          error: '获取项目列表失败'
        });
        return;
      }

      res.json({
        success: true,
        data: projects || []
      });
    } catch (error) {
      console.error('获取项目列表错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 获取单个项目详情
  static async getProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !project) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('获取项目详情错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 创建新项目
  static async createProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { title, description } = req.body;

      // 验证输入
      if (!title || title.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '项目标题不能为空'
        });
        return;
      }

      // 创建项目
      const { data: project, error } = await supabase
        .from('projects')
        .insert([
          {
            title: title.trim(),
            description: description?.trim() || '',
            user_id: userId,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('创建项目错误:', error);
        res.status(500).json({
          success: false,
          error: '创建项目失败'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('创建项目错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 更新项目
  static async updateProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { title, description, status } = req.body;

      // 验证项目是否存在且属于当前用户
      const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existingProject) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      // 准备更新数据
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) {
        if (!title || title.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: '项目标题不能为空'
          });
          return;
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || '';
      }

      if (status !== undefined) {
        if (!['active', 'archived', 'deleted'].includes(status)) {
          res.status(400).json({
            success: false,
            error: '无效的项目状态'
          });
          return;
        }
        updateData.status = status;
      }

      // 更新项目
      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('更新项目错误:', error);
        res.status(500).json({
          success: false,
          error: '更新项目失败'
        });
        return;
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('更新项目错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 删除项目
  static async deleteProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      // 验证项目是否存在且属于当前用户
      const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existingProject) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      // 删除相关的Canvas数据
      await supabase
        .from('canvas_data')
        .delete()
        .eq('project_id', id);

      // 删除项目
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('删除项目错误:', error);
        res.status(500).json({
          success: false,
          error: '删除项目失败'
        });
        return;
      }

      res.json({
        success: true,
        message: '项目删除成功'
      });
    } catch (error) {
      console.error('删除项目错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
}