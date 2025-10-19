# 部署指南

## Vercel 部署步骤

### 1. 准备工作

确保你的项目已经推送到 GitHub 仓库。

### 2. 连接 Vercel

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 GitHub 仓库

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 必需的环境变量

```bash
# 应用配置
NODE_ENV=production
FRONTEND_URL=https://your-app-name.vercel.app

# Supabase 配置
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT 配置
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# SiliconFlow API 配置
SILICONFLOW_API_KEY=your_siliconflow_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.com/v1/

# 其他配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. 部署配置

项目已经配置了以下文件：

- `vercel.json`: Vercel 部署配置
- `package.json`: 构建脚本
- `api/tsconfig.json`: API TypeScript 配置

### 5. 部署

1. 在 Vercel 中点击 "Deploy"
2. 等待构建完成
3. 获取部署 URL
4. 更新 `FRONTEND_URL` 环境变量为实际的部署 URL

### 6. 验证部署

部署完成后，访问你的应用 URL 验证：

1. 前端页面正常加载
2. API 接口正常工作
3. 数据库连接正常
4. AI 功能正常

## 环境变量获取指南

### Supabase 配置

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目或选择现有项目
3. 在项目设置 > API 中找到：
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: anon public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role secret key

### SiliconFlow API

1. 访问 [SiliconFlow](https://siliconflow.cn)
2. 注册账号并获取 API Key
3. 设置 `SILICONFLOW_API_KEY`

### JWT Secret

生成一个安全的随机字符串作为 JWT 密钥：

```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 故障排除

### 常见问题

1. **API 请求失败**
   - 检查 `FRONTEND_URL` 是否设置正确
   - 确认 CORS 配置正确

2. **数据库连接失败**
   - 验证 Supabase 环境变量
   - 检查数据库迁移是否执行

3. **AI 功能不工作**
   - 确认 SiliconFlow API Key 有效
   - 检查 API 配额

### 日志查看

在 Vercel 控制台中查看：
- Functions 日志
- 构建日志
- 运行时日志

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 项目结构

```
├── api/                 # 后端 API
├── src/                 # 前端源码
├── dist/                # 构建输出
├── vercel.json          # Vercel 配置
├── .env.example         # 环境变量模板
└── .env.production      # 生产环境模板
```