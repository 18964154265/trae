-- 为anon角色授予基本权限（用于未登录用户的公开访问）
-- 注意：在这个应用中，大部分操作都需要认证，所以anon权限很少

-- 为authenticated角色授予完整权限
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.projects TO authenticated;
GRANT ALL PRIVILEGES ON public.canvas_data TO authenticated;
GRANT ALL PRIVILEGES ON public.knowledge_bases TO authenticated;
GRANT ALL PRIVILEGES ON public.documents TO authenticated;
GRANT ALL PRIVILEGES ON public.ai_usage_stats TO authenticated;

-- 授予序列权限（如果有的话）
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 为service_role授予完整权限（用于服务端操作）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;