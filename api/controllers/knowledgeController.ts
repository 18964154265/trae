import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { VectorService } from '../services/vectorService.ts';

interface AuthRequest extends Request {
  user?: any;
}

export class KnowledgeController {
  // 获取知识库列表
  static async getKnowledgeBases(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      const { data: knowledgeBases, error } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取知识库列表错误:', error);
        res.status(500).json({
          success: false,
          error: '获取知识库列表失败'
        });
        return;
      }

      res.json({
        success: true,
        data: { knowledgeBases: knowledgeBases || [] }
      });
    } catch (error) {
      console.error('获取知识库列表错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 创建知识库
  static async createKnowledgeBase(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { name, description } = req.body;

      // 验证输入
      if (!name || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '知识库名称不能为空'
        });
        return;
      }

      // 创建知识库
      const { data: knowledgeBase, error } = await supabase
        .from('knowledge_bases')
        .insert([
          {
            name: name.trim(),
            description: description?.trim() || '',
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('创建知识库错误:', error);
        res.status(500).json({
          success: false,
          error: '创建知识库失败'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: { knowledgeBase }
      });
    } catch (error) {
      console.error('创建知识库错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 添加文档到知识库
  static async addDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { knowledgeBaseId } = req.params;
      const { title, content, type = 'text' } = req.body;

      // 验证输入
      if (!title || !content) {
        res.status(400).json({
          success: false,
          error: '文档标题和内容不能为空'
        });
        return;
      }

      // 验证知识库是否属于当前用户
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('knowledge_bases')
        .select('id')
        .eq('id', knowledgeBaseId)
        .eq('user_id', userId)
        .single();

      if (kbError || !knowledgeBase) {
        res.status(404).json({
          success: false,
          error: '知识库不存在'
        });
        return;
      }

      // 生成文档向量（如果启用了向量化服务）
      let embedding = null;
      try {
        embedding = await VectorService.generateEmbedding(content);
      } catch (embeddingError) {
        console.warn('生成向量失败:', embeddingError);
        // 向量化失败不影响文档创建
      }

      // 创建文档
      const { data: document, error } = await supabase
        .from('documents')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            type,
            knowledge_base_id: knowledgeBaseId,
            embedding,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('添加文档错误:', error);
        res.status(500).json({
          success: false,
          error: '添加文档失败'
        });
        return;
      }

      // 更新知识库的文档数量
      await supabase
        .from('knowledge_bases')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', knowledgeBaseId);

      res.status(201).json({
        success: true,
        data: { document }
      });
    } catch (error) {
      console.error('添加文档错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 搜索知识库
  static async searchKnowledge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { query, knowledgeBaseId, limit = 10 } = req.body;

      // 验证输入
      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: '搜索查询不能为空'
        });
        return;
      }

      let searchResults = [];

      if (knowledgeBaseId) {
        // 在指定知识库中搜索
        const { data: knowledgeBase, error: kbError } = await supabase
          .from('knowledge_bases')
          .select('id')
          .eq('id', knowledgeBaseId)
          .eq('user_id', userId)
          .single();

        if (kbError || !knowledgeBase) {
          res.status(404).json({
            success: false,
            error: '知识库不存在'
          });
          return;
        }

        // 尝试向量搜索
        try {
          const queryEmbedding = await VectorService.generateEmbedding(query);
          searchResults = await VectorService.searchSimilar(queryEmbedding, knowledgeBaseId, limit);
        } catch (vectorError) {
          console.warn('向量搜索失败，使用文本搜索:', vectorError);
          
          // 回退到文本搜索
          const { data: documents, error } = await supabase
            .from('documents')
            .select('*')
            .eq('knowledge_base_id', knowledgeBaseId)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .limit(limit);

          if (!error && documents) {
            searchResults = documents.map(doc => ({
              ...doc,
              similarity: 0.5 // 默认相似度
            }));
          }
        }
      } else {
        // 在用户所有知识库中搜索
        const { data: documents, error } = await supabase
          .from('documents')
          .select(`
            *,
            knowledge_bases!inner(user_id)
          `)
          .eq('knowledge_bases.user_id', userId)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(limit);

        if (!error && documents) {
          searchResults = documents.map(doc => ({
            ...doc,
            similarity: 0.5 // 默认相似度
          }));
        }
      }

      res.json({
        success: true,
        data: {
          results: searchResults,
          query,
          total: searchResults.length
        }
      });
    } catch (error) {
      console.error('搜索知识库错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 获取知识库文档列表
  static async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { knowledgeBaseId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // 验证知识库是否属于当前用户
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('knowledge_bases')
        .select('id')
        .eq('id', knowledgeBaseId)
        .eq('user_id', userId)
        .single();

      if (kbError || !knowledgeBase) {
        res.status(404).json({
          success: false,
          error: '知识库不存在'
        });
        return;
      }

      const offset = (Number(page) - 1) * Number(limit);

      // 获取文档列表
      const { data: documents, error, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('knowledge_base_id', knowledgeBaseId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        console.error('获取文档列表错误:', error);
        res.status(500).json({
          success: false,
          error: '获取文档列表失败'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          documents: documents || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取文档列表错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }

  // 删除文档
  static async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { documentId } = req.params;

      // 验证文档是否属于当前用户
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select(`
          id,
          knowledge_bases!inner(user_id)
        `)
        .eq('id', documentId)
        .eq('knowledge_bases.user_id', userId)
        .single();

      if (docError || !document) {
        res.status(404).json({
          success: false,
          error: '文档不存在'
        });
        return;
      }

      // 删除文档
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('删除文档错误:', error);
        res.status(500).json({
          success: false,
          error: '删除文档失败'
        });
        return;
      }

      res.json({
        success: true,
        message: '文档删除成功'
      });
    } catch (error) {
      console.error('删除文档错误:', error);
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
}