-- 启用行级安全策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- 项目表策略
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Canvas数据表策略
CREATE POLICY "Users can view own canvas data" ON public.canvas_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = canvas_data.project_id 
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own canvas data" ON public.canvas_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = canvas_data.project_id 
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own canvas data" ON public.canvas_data
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = canvas_data.project_id 
            AND projects.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own canvas data" ON public.canvas_data
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = canvas_data.project_id 
            AND projects.user_id::text = auth.uid()::text
        )
    );

-- 知识库表策略
CREATE POLICY "Users can view own knowledge bases" ON public.knowledge_bases
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own knowledge bases" ON public.knowledge_bases
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own knowledge bases" ON public.knowledge_bases
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own knowledge bases" ON public.knowledge_bases
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 文档表策略
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_bases 
            WHERE knowledge_bases.id = documents.knowledge_base_id 
            AND knowledge_bases.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own documents" ON public.documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.knowledge_bases 
            WHERE knowledge_bases.id = documents.knowledge_base_id 
            AND knowledge_bases.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_bases 
            WHERE knowledge_bases.id = documents.knowledge_base_id 
            AND knowledge_bases.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.knowledge_bases 
            WHERE knowledge_bases.id = documents.knowledge_base_id 
            AND knowledge_bases.user_id::text = auth.uid()::text
        )
    );

-- AI使用统计表策略
CREATE POLICY "Users can view own ai usage stats" ON public.ai_usage_stats
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own ai usage stats" ON public.ai_usage_stats
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own ai usage stats" ON public.ai_usage_stats
    FOR UPDATE USING (auth.uid()::text = user_id::text);