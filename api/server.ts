/**
 * local server entry file, for local development
 */
import 'dotenv/config';
import app from './app.js';
import { SiliconFlowService } from './services/siliconFlowService.js';

/**
 * 启动时验证API配置
 */
async function validateApiConfiguration() {
  console.log('🔍 验证API配置...');
  
  const validation = SiliconFlowService.validateApiKey();
  if (!validation.isValid) {
    console.error('❌ API密钥验证失败:', validation.error);
    console.error('请检查.env文件中的SILICONFLOW_API_KEY配置');
    return false;
  }
  
  console.log('✅ API密钥格式验证通过');
  
  // 测试API连接
  try {
    console.log('🔗 测试API连接...');
    await SiliconFlowService.chat({ message: '测试连接' });
    console.log('✅ API连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ API连接测试失败:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
  console.log(`Server ready on port ${PORT}`);
  
  // 异步验证API配置，不阻塞服务器启动
  setTimeout(async () => {
    const isValid = await validateApiConfiguration();
    if (!isValid) {
      console.warn('⚠️  服务器已启动，但AI功能可能不可用');
    }
  }, 1000);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;