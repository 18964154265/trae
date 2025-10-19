import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricObject, Rect, Circle as FabricCircle, IText } from 'fabric';
import { 
  Save, 
  Download, 
  Upload, 
  Undo, 
  Redo, 
  Type, 
  Image, 
  Square, 
  Circle,
  Send,
  Bot,
  User,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { aiAPI } from '../services/api';

interface CanvasEditorProps {
  projectId?: string;
}

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ projectId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Fabric.js canvas
    useEffect(() => {
      if (canvasRef.current && !fabricCanvasRef.current) {
        const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      });

      fabricCanvasRef.current = canvas;
      setIsCanvasReady(true);

      // Add some sample content
      const text = new IText('论文标题', {
        left: 100,
        top: 50,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#333333'
      });
      canvas.add(text);

      const rect = new Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 100,
        fill: '#f0f0f0',
        stroke: '#cccccc',
        strokeWidth: 1
      });
      canvas.add(rect);

      const sampleText = new IText('这里是论文内容区域\n可以添加文本、图片等元素', {
        left: 110,
        top: 120,
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#666666',
        width: 180
      });
      canvas.add(sampleText);

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  // Tool handlers
  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    switch (tool) {
      case 'text':
        const text = new IText('新文本', {
          left: 200,
          top: 200,
          fontFamily: 'Arial',
          fontSize: 16,
          fill: '#333333'
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        break;
      case 'rectangle':
        const rect = new Rect({
          left: 200,
          top: 200,
          width: 100,
          height: 60,
          fill: 'transparent',
          stroke: '#333333',
          strokeWidth: 2
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        break;
      case 'circle':
        const circle = new FabricCircle({
          left: 200,
          top: 200,
          radius: 30,
          fill: 'transparent',
          stroke: '#333333',
          strokeWidth: 2
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        break;
    }
    canvas.renderAll();
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;
    const canvasData = fabricCanvasRef.current.toJSON();
    console.log('Saving canvas data:', canvasData);
    // TODO: Implement save to backend
  };

  const handleExport = () => {
    if (!fabricCanvasRef.current) return;
    const dataURL = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = dataURL;
    link.click();
  };

  const handleUndo = () => {
    // TODO: Implement undo functionality
    console.log('Undo action');
  };

  const handleRedo = () => {
    // TODO: Implement redo functionality
    console.log('Redo action');
  };

  // AI Chat handlers
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // 构建上下文消息历史
      const context = aiMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // 调用AI API
      const response = await aiAPI.sendMessage({
        message: currentMessage,
        context,
        projectId
      });

      if (response.success && response.data) {
        const aiResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.data.response,
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, aiResponse]);
      } else {
        // 处理API错误
        const errorMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: '抱歉，AI服务暂时不可用，请稍后重试。',
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI聊天错误:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '抱歉，发生了网络错误，请检查网络连接后重试。',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-1" />
              保存
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-1" />
              导出
            </button>
            <div className="border-l border-gray-300 h-6 mx-2"></div>
            <button
              onClick={handleUndo}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAiPanelExpanded(!isAiPanelExpanded)}
              className="flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Bot className="w-4 h-4 mr-1" />
              AI助手
              {isAiPanelExpanded ? <Minimize2 className="w-4 h-4 ml-1" /> : <Maximize2 className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Toolbar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
          {[
            { id: 'select', icon: Settings, label: '选择' },
            { id: 'text', icon: Type, label: '文本' },
            { id: 'rectangle', icon: Square, label: '矩形' },
            { id: 'circle', icon: Circle, label: '圆形' },
            { id: 'image', icon: Image, label: '图片' }
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex">
          <div className="flex-1 p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-sm p-4 inline-block">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* AI Chat Panel */}
          {isAiPanelExpanded && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-purple-600" />
                  AI写作助手
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  告诉我您想要如何改进您的论文
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>开始与AI助手对话</p>
                    <p className="text-sm mt-1">描述您的写作需求</p>
                  </div>
                )}
                
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'ai' && (
                          <Bot className="w-4 h-4 mt-0.5 text-purple-600" />
                        )}
                        {message.type === 'user' && (
                          <User className="w-4 h-4 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="描述您的写作需求..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;