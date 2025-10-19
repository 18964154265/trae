-- 种子数据文件
-- 注意：这些数据仅用于开发和测试环境

-- 插入测试用户（注意：实际用户会通过Supabase Auth创建）
-- 这里只是为了演示数据结构
INSERT INTO public.users (id, email, name, avatar_url) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', '演示用户', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo')
ON CONFLICT (id) DO NOTHING;

-- 插入示例项目
INSERT INTO public.projects (id, user_id, title, description, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '我的第一篇论文', '关于人工智能在教育领域应用的研究论文', 'active'),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '机器学习综述', '机器学习算法的综合性研究报告', 'active'),
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '数据分析项目', '基于大数据的用户行为分析研究', 'archived')
ON CONFLICT (id) DO NOTHING;

-- 插入示例Canvas数据
INSERT INTO public.canvas_data (project_id, data, version) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '{"objects": [], "background": "#ffffff", "version": "5.3.0"}', 1),
    ('550e8400-e29b-41d4-a716-446655440002', '{"objects": [], "background": "#ffffff", "version": "5.3.0"}', 1)
ON CONFLICT (project_id) DO NOTHING;

-- 插入示例知识库
INSERT INTO public.knowledge_bases (id, user_id, name, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'AI研究资料', '人工智能相关的研究论文和资料'),
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '机器学习基础', '机器学习的基础理论和算法资料')
ON CONFLICT (id) DO NOTHING;

-- 插入示例文档
INSERT INTO public.documents (id, knowledge_base_id, title, content, type) VALUES
    ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '深度学习简介', '深度学习是机器学习的一个分支，它基于人工神经网络的表示学习。深度学习的核心思想是通过多层神经网络来学习数据的层次化表示...', 'text'),
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', '自然语言处理概述', '自然语言处理（NLP）是人工智能的一个重要分支，旨在让计算机能够理解、解释和生成人类语言...', 'text'),
    ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011', '监督学习算法', '监督学习是机器学习的一种方法，它使用标记的训练数据来学习从输入到输出的映射函数...', 'text')
ON CONFLICT (id) DO NOTHING;

-- 插入示例AI使用统计
INSERT INTO public.ai_usage_stats (user_id, service_type, tokens_used, requests_count, date) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'chat', 1500, 10, CURRENT_DATE),
    ('550e8400-e29b-41d4-a716-446655440000', 'generate', 800, 5, CURRENT_DATE),
    ('550e8400-e29b-41d4-a716-446655440000', 'optimize', 600, 3, CURRENT_DATE)
ON CONFLICT (user_id, service_type, date) DO NOTHING;