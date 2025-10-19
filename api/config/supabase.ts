import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// 环境变量检查
if (!supabaseUrl) {
  throw new Error('缺少SUPABASE_URL环境变量');
}

// 开发环境配置策略：
// 1. 优先使用service role key（生产环境推荐）
// 2. 如果没有service role key，使用anon key（开发环境备选）
// 注意：anon key权限有限，某些管理操作可能无法执行
let supabaseKey = supabaseServiceKey;
let keyType = 'service_role';

if (!supabaseServiceKey && supabaseAnonKey) {
  supabaseKey = supabaseAnonKey;
  keyType = 'anon';
  console.warn('⚠️  使用anon key连接Supabase，某些管理功能可能受限');
} else if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('缺少Supabase密钥：需要SUPABASE_SERVICE_ROLE_KEY或SUPABASE_ANON_KEY');
}

console.log(`🔑 Supabase连接类型: ${keyType}`);

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 数据库表类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CanvasData {
  id: string;
  project_id: string;
  canvas_json: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'pdf' | 'doc';
  knowledge_base_id: string;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}