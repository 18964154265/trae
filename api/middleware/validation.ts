import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// 验证结果处理中间件
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: '输入验证失败',
      details: errors.array()
    });
    return;
  }
  next();
};

// 用户注册验证
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓名长度必须在1-50个字符之间'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度必须在6-128个字符之间'),
  handleValidationErrors
];

// 用户登录验证
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('密码不能为空'),
  handleValidationErrors
];

// 项目创建验证
export const validateCreateProject = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('项目标题长度必须在1-200个字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('项目描述不能超过1000个字符'),
  handleValidationErrors
];

// 项目更新验证
export const validateUpdateProject = [
  param('id')
    .isUUID()
    .withMessage('无效的项目ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('项目标题长度必须在1-200个字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('项目描述不能超过1000个字符'),
  body('status')
    .optional()
    .isIn(['active', 'archived', 'deleted'])
    .withMessage('无效的项目状态'),
  handleValidationErrors
];

// Canvas数据保存验证
export const validateSaveCanvas = [
  param('projectId')
    .isUUID()
    .withMessage('无效的项目ID'),
  body('canvasJson')
    .notEmpty()
    .withMessage('Canvas数据不能为空'),
  handleValidationErrors
];

// AI聊天验证
export const validateAIChat = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('消息长度必须在1-2000个字符之间'),
  body('context')
    .optional()
    .isArray()
    .withMessage('上下文必须是数组格式'),
  body('projectId')
    .optional()
    .isUUID()
    .withMessage('无效的项目ID'),
  handleValidationErrors
];

// AI文本生成验证
export const validateGenerateText = [
  body('prompt')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('提示词长度必须在1-2000个字符之间'),
  body('type')
    .optional()
    .isIn(['general', 'academic', 'outline', 'summary', 'expansion'])
    .withMessage('无效的生成类型'),
  body('maxTokens')
    .optional()
    .isInt({ min: 100, max: 4000 })
    .withMessage('最大token数必须在100-4000之间'),
  handleValidationErrors
];

// 内容优化验证
export const validateOptimizeContent = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('内容长度必须在1-5000个字符之间'),
  body('optimizationType')
    .optional()
    .isIn(['general', 'grammar', 'style', 'clarity', 'concise'])
    .withMessage('无效的优化类型'),
  handleValidationErrors
];

// 翻译验证
export const validateTranslate = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 3000 })
    .withMessage('翻译文本长度必须在1-3000个字符之间'),
  body('targetLanguage')
    .optional()
    .isIn(['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es'])
    .withMessage('不支持的目标语言'),
  body('sourceLanguage')
    .optional()
    .isIn(['auto', 'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es'])
    .withMessage('不支持的源语言'),
  handleValidationErrors
];

// 知识库创建验证
export const validateCreateKnowledgeBase = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('知识库名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('知识库描述不能超过500个字符'),
  handleValidationErrors
];

// 文档添加验证
export const validateAddDocument = [
  param('knowledgeBaseId')
    .isUUID()
    .withMessage('无效的知识库ID'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('文档标题长度必须在1-200个字符之间'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('文档内容长度必须在1-50000个字符之间'),
  body('type')
    .optional()
    .isIn(['text', 'markdown', 'pdf', 'doc'])
    .withMessage('不支持的文档类型'),
  handleValidationErrors
];

// 知识库搜索验证
export const validateSearchKnowledge = [
  body('query')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('搜索查询长度必须在1-200个字符之间'),
  body('knowledgeBaseId')
    .optional()
    .isUUID()
    .withMessage('无效的知识库ID'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1-50之间'),
  handleValidationErrors
];

// 分页验证
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  handleValidationErrors
];

// UUID参数验证
export const validateUUIDParam = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`无效的${paramName}`),
  handleValidationErrors
];

// UUID验证中间件
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('无效的ID'),
  handleValidationErrors
];

// Canvas数据保存验证（修正名称）
export const validateSaveCanvasData = [
  param('projectId')
    .isUUID()
    .withMessage('无效的项目ID'),
  body('canvasJson')
    .notEmpty()
    .withMessage('Canvas数据不能为空'),
  handleValidationErrors
];