import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

interface AuthRequest extends Request {
  user?: any;
}

export class CanvasController {
  // 获取Canvas数据
  static async getCanvasData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { projectId } = req.params;

      // 验证项目是否属于当前用户
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError || !project) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      // 获取Canvas数据
      const { data: canvasData, error } = await supabase
        .from('canvas_data')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误码
        console.error('获取Canvas数据错误:', error);
        res.status(500).json({
          success: false,
          error: '获取Canvas数据失败'
        });
        return;
      }

      // 如果没有Canvas数据，返回空的默认数据
      const defaultCanvasData = {
        project_id: projectId,
        canvas_json: JSON.stringify({
          version: '5.3.0',
          objects: []
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.json({
        success: true,
        data: {
          canvasData: canvasData || defaultCanvasData
        }
      });
    } catch (error) {
      console.error('获取Canvas数据错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 保存Canvas数据
  static async saveCanvasData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { projectId } = req.params;
      const { canvasJson } = req.body;

      // 验证输入
      if (!canvasJson) {
        res.status(400).json({
          success: false,
          error: 'Canvas数据不能为空'
        });
        return;
      }

      // 验证项目是否属于当前用户
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError || !project) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      // 检查是否已存在Canvas数据
      const { data: existingCanvas } = await supabase
        .from('canvas_data')
        .select('id')
        .eq('project_id', projectId)
        .single();

      let canvasData;
      let error;

      if (existingCanvas) {
        // 更新现有数据
        const result = await supabase
          .from('canvas_data')
          .update({
            canvas_json: typeof canvasJson === 'string' ? canvasJson : JSON.stringify(canvasJson),
            updated_at: new Date().toISOString()
          })
          .eq('project_id', projectId)
          .select()
          .single();
        
        canvasData = result.data;
        error = result.error;
      } else {
        // 创建新数据
        const result = await supabase
          .from('canvas_data')
          .insert([
            {
              project_id: projectId,
              canvas_json: typeof canvasJson === 'string' ? canvasJson : JSON.stringify(canvasJson),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
        
        canvasData = result.data;
        error = result.error;
      }

      if (error) {
        console.error('保存Canvas数据错误:', error);
        res.status(500).json({
          success: false,
          error: '保存Canvas数据失败'
        });
        return;
      }

      // 更新项目的最后修改时间
      await supabase
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', projectId);

      res.json({
        success: true,
        data: { canvasData }
      });
    } catch (error) {
      console.error('保存Canvas数据错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 导出Canvas数据
  static async exportCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { projectId } = req.params;
      const { format = 'json' } = req.query;

      // 验证项目是否属于当前用户
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError || !project) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      // 获取Canvas数据
      const { data: canvasData, error } = await supabase
        .from('canvas_data')
        .select('canvas_json')
        .eq('project_id', projectId)
        .single();

      if (error || !canvasData) {
        res.status(404).json({
          success: false,
          error: 'Canvas数据不存在'
        });
        return;
      }

      // 根据格式返回数据
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}_canvas.json"`);
        res.send(canvasData.canvas_json);
      } else {
        res.status(400).json({
          success: false,
          error: '不支持的导出格式'
        });
      }
    } catch (error) {
      console.error('导出Canvas数据错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 清空Canvas数据
  static async clearCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { projectId } = req.params;

      // 验证项目是否属于当前用户
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError || !project) {
        res.status(404).json({
          success: false,
          error: '项目不存在'
        });
        return;
      }

      // 清空Canvas数据
      const { error } = await supabase
        .from('canvas_data')
        .update({
          canvas_json: JSON.stringify({
            version: '5.3.0',
            objects: []
          }),
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId);

      if (error) {
        console.error('清空Canvas数据错误:', error);
        res.status(500).json({
          success: false,
          error: '清空Canvas数据失败'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Canvas数据已清空'
      });
    } catch (error) {
      console.error('清空Canvas数据错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
}