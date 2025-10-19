-- 为用户表添加密码字段
ALTER TABLE public.users ADD COLUMN password VARCHAR(255);

-- 为密码字段添加索引（可选，用于性能优化）
CREATE INDEX IF NOT EXISTS idx_users_password ON public.users(password);