import { supabase } from '../config/supabase.js';
import { SiliconFlowService } from './siliconFlowService.ts';

// 向量相似度计算
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('向量维度不匹配');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// 搜索结果接口
interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  knowledge_base_id: string;
  similarity: number;
  created_at: string;
  updated_at: string;
}

export class VectorService {
  // 生成文本嵌入向量
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 清理和预处理文本
      const cleanText = text.trim().replace(/\s+/g, ' ');
      
      if (cleanText.length === 0) {
        throw new Error('文本内容为空');
      }

      // 如果文本过长，截取前1000个字符
      const truncatedText = cleanText.length > 1000 
        ? cleanText.substring(0, 1000) + '...'
        : cleanText;

      // 使用SiliconFlow生成嵌入向量
      return await SiliconFlowService.generateEmbedding(truncatedText);
    } catch (error) {
      console.error('生成嵌入向量错误:', error);
      
      // 如果SiliconFlow不支持embedding，返回简单的文本特征向量
      return this.generateSimpleEmbedding(text);
    }
  }

  // 简单的文本特征向量生成（备用方案）
  private static generateSimpleEmbedding(text: string): number[] {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    // 创建一个简单的词频向量（维度为100）
    const vector = new Array(100).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const pos = Math.abs(hash) % 100;
      vector[pos] += 1;
    });

    // 归一化向量
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      return vector.map(val => val / norm);
    }
    
    return vector;
  }

  // 简单哈希函数
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }

  // 向量相似度搜索
  static async searchSimilar(
    queryEmbedding: number[],
    knowledgeBaseId?: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .not('embedding', 'is', null);

      if (knowledgeBaseId) {
        query = query.eq('knowledge_base_id', knowledgeBaseId);
      }

      const { data: documents, error } = await query;

      if (error) {
        throw error;
      }

      if (!documents || documents.length === 0) {
        return [];
      }

      // 计算相似度并排序
      const results: SearchResult[] = documents
        .map(doc => {
          try {
            const docEmbedding = Array.isArray(doc.embedding) 
              ? doc.embedding 
              : JSON.parse(doc.embedding || '[]');
            
            const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
            
            return {
              ...doc,
              similarity
            };
          } catch (embeddingError) {
            console.warn(`文档 ${doc.id} 的嵌入向量格式错误:`, embeddingError);
            return {
              ...doc,
              similarity: 0
            };
          }
        })
        .filter(result => result.similarity > 0.1) // 过滤相似度过低的结果
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('向量搜索错误:', error);
      throw new Error('向量搜索失败');
    }
  }

  // 批量更新文档嵌入向量
  static async updateDocumentEmbeddings(knowledgeBaseId?: string): Promise<void> {
    try {
      let query = supabase
        .from('documents')
        .select('id, content')
        .or('embedding.is.null,embedding.eq.[]');

      if (knowledgeBaseId) {
        query = query.eq('knowledge_base_id', knowledgeBaseId);
      }

      const { data: documents, error } = await query;

      if (error) {
        throw error;
      }

      if (!documents || documents.length === 0) {
        console.log('没有需要更新嵌入向量的文档');
        return;
      }

      console.log(`开始更新 ${documents.length} 个文档的嵌入向量`);

      // 批量处理，避免API限制
      const batchSize = 5;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (doc) => {
            try {
              const embedding = await this.generateEmbedding(doc.content);
              
              await supabase
                .from('documents')
                .update({ 
                  embedding,
                  updated_at: new Date().toISOString()
                })
                .eq('id', doc.id);
              
              console.log(`文档 ${doc.id} 嵌入向量更新成功`);
            } catch (docError) {
              console.error(`文档 ${doc.id} 嵌入向量更新失败:`, docError);
            }
          })
        );

        // 批次间延迟，避免API限制
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('文档嵌入向量批量更新完成');
    } catch (error) {
      console.error('批量更新嵌入向量错误:', error);
      throw new Error('批量更新嵌入向量失败');
    }
  }

  // 检查向量服务状态
  static async checkStatus(): Promise<boolean> {
    try {
      // 测试生成一个简单的嵌入向量
      const testEmbedding = await this.generateEmbedding('测试文本');
      return Array.isArray(testEmbedding) && testEmbedding.length > 0;
    } catch (error) {
      console.error('向量服务状态检查失败:', error);
      return false;
    }
  }
}