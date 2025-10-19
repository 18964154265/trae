import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, FabricObject, Rect, Circle as FabricCircle, IText, FabricImage, ActiveSelection, Point } from 'fabric';
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
  Minimize2,
  Trash2,
  Copy,
  MousePointer,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Palette,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight
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

interface HistoryState {
  canvasState: string;
  timestamp: number;
}

interface ObjectProperties {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ projectId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [objectProperties, setObjectProperties] = useState<ObjectProperties>({});
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);

  // 保存画布状态到历史记录
  const saveToHistory = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvasState = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newState: HistoryState = {
      canvasState,
      timestamp: Date.now()
    };

    // 如果当前不在历史记录的末尾，删除后面的记录
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // 限制历史记录数量
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // 从历史记录恢复画布状态
  const restoreFromHistory = useCallback((index: number) => {
    if (!fabricCanvasRef.current || index < 0 || index >= history.length) return;
    
    const state = history[index];
    fabricCanvasRef.current.loadFromJSON(state.canvasState, () => {
      fabricCanvasRef.current?.renderAll();
      setHistoryIndex(index);
    });
  }, [history]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      restoreFromHistory(historyIndex - 1);
    }
  }, [historyIndex, restoreFromHistory]);

  // 重做操作
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      restoreFromHistory(historyIndex + 1);
    }
  }, [historyIndex, history.length, restoreFromHistory]);

  // 删除选中对象
  const handleDeleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        fabricCanvasRef.current?.remove(obj);
      });
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
      saveToHistory();
      setSelectedObject(null);
    }
  }, [saveToHistory]);

  // 复制选中对象
  const handleCopySelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: FabricObject) => {
        setClipboard(cloned);
      });
    }
  }, []);

  // 粘贴对象
  const handlePaste = useCallback(() => {
    if (!fabricCanvasRef.current || !clipboard) return;
    
    clipboard.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      fabricCanvasRef.current?.add(cloned);
      fabricCanvasRef.current?.setActiveObject(cloned);
      fabricCanvasRef.current?.renderAll();
      saveToHistory();
    });
  }, [clipboard, saveToHistory]);

  // 全选对象
  const handleSelectAll = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const allObjects = fabricCanvasRef.current.getObjects();
    if (allObjects.length > 0) {
      const selection = new ActiveSelection(allObjects, {
        canvas: fabricCanvasRef.current,
      });
      fabricCanvasRef.current.setActiveObject(selection);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  // 更新对象属性
  const updateObjectProperty = useCallback((property: string, value: any) => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    selectedObject.set(property, value);
    fabricCanvasRef.current.renderAll();
    saveToHistory();
    
    setObjectProperties(prev => ({
      ...prev,
      [property]: value
    }));
  }, [selectedObject, saveToHistory]);

  // 缩放画布
  const handleZoom = useCallback((delta: number) => {
    if (!fabricCanvasRef.current) return;
    
    const newZoom = Math.max(0.1, Math.min(5, canvasZoom + delta));
    fabricCanvasRef.current.setZoom(newZoom);
    setCanvasZoom(newZoom);
  }, [canvasZoom]);

  // 处理图片上传
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      FabricImage.fromURL(imgUrl).then((img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.renderAll();
        saveToHistory();
      });
    };
    reader.readAsDataURL(file);
  }, [saveToHistory]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete') {
        handleDeleteSelected();
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'c':
            e.preventDefault();
            handleCopySelected();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'a':
            e.preventDefault();
            handleSelectAll();
            break;
        }
      } else if (selectedObject && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const currentLeft = selectedObject.left || 0;
        const currentTop = selectedObject.top || 0;
        
        switch (e.key) {
          case 'ArrowUp':
            selectedObject.set('top', currentTop - step);
            break;
          case 'ArrowDown':
            selectedObject.set('top', currentTop + step);
            break;
          case 'ArrowLeft':
            selectedObject.set('left', currentLeft - step);
            break;
          case 'ArrowRight':
            selectedObject.set('left', currentLeft + step);
            break;
        }
        fabricCanvasRef.current?.renderAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleUndo, handleRedo, handleCopySelected, handlePaste, handleSelectAll, selectedObject]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true,
      });

      fabricCanvasRef.current = canvas;
      setIsCanvasReady(true);

      // 启用对象选择和操作
      canvas.on('selection:created', (e) => {
        const activeObject = e.selected?.[0];
        if (activeObject) {
          setSelectedObject(activeObject);
          setObjectProperties({
            fill: activeObject.fill as string,
            stroke: activeObject.stroke as string,
            strokeWidth: activeObject.strokeWidth,
            opacity: activeObject.opacity,
            fontSize: (activeObject as IText).fontSize,
            fontFamily: (activeObject as IText).fontFamily,
            fontWeight: String((activeObject as IText).fontWeight),
            fontStyle: (activeObject as IText).fontStyle,
            textAlign: (activeObject as IText).textAlign,
          });
        }
      });

      canvas.on('selection:updated', (e) => {
        const activeObject = e.selected?.[0];
        if (activeObject) {
          setSelectedObject(activeObject);
          setObjectProperties({
            fill: activeObject.fill as string,
            stroke: activeObject.stroke as string,
            strokeWidth: activeObject.strokeWidth,
            opacity: activeObject.opacity,
            fontSize: (activeObject as IText).fontSize,
            fontFamily: (activeObject as IText).fontFamily,
            fontWeight: String((activeObject as IText).fontWeight),
            fontStyle: (activeObject as IText).fontStyle,
            textAlign: (activeObject as IText).textAlign,
          });
        }
      });

      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setObjectProperties({});
      });

      // 双击文本进入编辑模式
      canvas.on('mouse:dblclick', (e) => {
        const target = e.target;
        if (target && target.type === 'i-text') {
          if (target instanceof IText) {
            target.enterEditing();
          }
        }
      });

      // 对象修改时保存历史记录
      canvas.on('object:modified', () => {
        saveToHistory();
      });

      // 滚轮缩放
      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
        setCanvasZoom(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

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

      // 保存初始状态
      setTimeout(() => {
        saveToHistory();
      }, 100);

      return () => {
        canvas.dispose();
      };
    }
  }, [saveToHistory]);

  // Tool handlers
  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    // 设置画布交互模式
    if (tool === 'select') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    } else {
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
    }
    
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
        text.enterEditing();
        saveToHistory();
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
        saveToHistory();
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
        saveToHistory();
        break;
      case 'image':
        fileInputRef.current?.click();
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
        // 处理错误情况
        const errorMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.error || 'AI服务暂时不可用，请稍后再试。',
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI API调用失败:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '网络连接错误，请检查网络设置后重试。',
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 主工具栏 */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
        <button
          onClick={() => handleToolSelect('select')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="选择工具"
        >
          <MousePointer size={20} />
        </button>
        <button
          onClick={() => handleToolSelect('text')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="文本工具"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => handleToolSelect('rectangle')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="矩形工具"
        >
          <Square size={20} />
        </button>
        <button
          onClick={() => handleToolSelect('circle')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'circle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="圆形工具"
        >
          <Circle size={20} />
        </button>
        <button
          onClick={() => handleToolSelect('image')}
          className={`p-3 rounded-lg transition-colors ${
            selectedTool === 'image' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="图片工具"
        >
          <Image size={20} />
        </button>
        
        <div className="w-full h-px bg-gray-200 my-2" />
        
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="撤销 (Ctrl+Z)"
        >
          <Undo size={20} />
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="重做 (Ctrl+Y)"
        >
          <Redo size={20} />
        </button>
        
        <div className="w-full h-px bg-gray-200 my-2" />
        
        <button
          onClick={handleDeleteSelected}
          disabled={!selectedObject}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="删除 (Delete)"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={handleCopySelected}
          disabled={!selectedObject}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制 (Ctrl+C)"
        >
          <Copy size={20} />
        </button>
        
        <div className="w-full h-px bg-gray-200 my-2" />
        
        <button
          onClick={() => handleZoom(0.1)}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
          title="放大"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
          title="缩小"
        >
          <ZoomOut size={20} />
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={handleSave}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
          title="保存"
        >
          <Save size={20} />
        </button>
        <button
          onClick={handleExport}
          className="p-3 rounded-lg text-gray-600 hover:bg-gray-100"
          title="导出"
        >
          <Download size={20} />
        </button>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 space-x-4">
          <div className="text-sm text-gray-600">
            缩放: {Math.round(canvasZoom * 100)}%
          </div>
          {selectedObject && (
            <div className="text-sm text-gray-600">
              已选择: {selectedObject.type}
            </div>
          )}
        </div>

        {/* 画布容器 */}
        <div className="flex-1 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>

      {/* 属性面板 */}
      {selectedObject && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">属性面板</h3>
          
          {/* 通用属性 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                填充颜色
              </label>
              <input
                type="color"
                value={objectProperties.fill || '#000000'}
                onChange={(e) => updateObjectProperty('fill', e.target.value)}
                className="w-full h-8 rounded border border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                边框颜色
              </label>
              <input
                type="color"
                value={objectProperties.stroke || '#000000'}
                onChange={(e) => updateObjectProperty('stroke', e.target.value)}
                className="w-full h-8 rounded border border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                边框宽度
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={objectProperties.strokeWidth || 0}
                onChange={(e) => updateObjectProperty('strokeWidth', parseInt(e.target.value))}
                className="w-full px-3 py-1 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                透明度
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={objectProperties.opacity || 1}
                onChange={(e) => updateObjectProperty('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* 文本特有属性 */}
          {selectedObject.type === 'i-text' && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-700">文本属性</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字体大小
                </label>
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={objectProperties.fontSize || 16}
                  onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                  className="w-full px-3 py-1 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字体
                </label>
                <select
                  value={objectProperties.fontFamily || 'Arial'}
                  onChange={(e) => updateObjectProperty('fontFamily', e.target.value)}
                  className="w-full px-3 py-1 border border-gray-300 rounded"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => updateObjectProperty('fontWeight', 
                    objectProperties.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`flex-1 px-3 py-1 rounded border ${
                    objectProperties.fontWeight === 'bold' 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'border-gray-300'
                  }`}
                >
                  <Bold size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateObjectProperty('fontStyle', 
                    objectProperties.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`flex-1 px-3 py-1 rounded border ${
                    objectProperties.fontStyle === 'italic' 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'border-gray-300'
                  }`}
                >
                  <Italic size={16} className="mx-auto" />
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => updateObjectProperty('textAlign', 'left')}
                  className={`flex-1 px-3 py-1 rounded border ${
                    objectProperties.textAlign === 'left' 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'border-gray-300'
                  }`}
                >
                  <AlignLeft size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateObjectProperty('textAlign', 'center')}
                  className={`flex-1 px-3 py-1 rounded border ${
                    objectProperties.textAlign === 'center' 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'border-gray-300'
                  }`}
                >
                  <AlignCenter size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateObjectProperty('textAlign', 'right')}
                  className={`flex-1 px-3 py-1 rounded border ${
                    objectProperties.textAlign === 'right' 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'border-gray-300'
                  }`}
                >
                  <AlignRight size={16} className="mx-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI助手面板 */}
      <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
        isAiPanelExpanded ? 'w-80' : 'w-12'
      }`}>
        <div className="h-full flex flex-col">
          {/* AI面板头部 */}
          <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3">
            {isAiPanelExpanded && (
              <div className="flex items-center space-x-2">
                <Bot size={20} className="text-blue-600" />
                <span className="font-medium">AI助手</span>
              </div>
            )}
            <button
              onClick={() => setIsAiPanelExpanded(!isAiPanelExpanded)}
              className="p-1 rounded hover:bg-gray-100"
            >
              {isAiPanelExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {isAiPanelExpanded && (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>你好！我是AI助手</p>
                    <p className="text-sm">我可以帮助你创建和编辑画布内容</p>
                  </div>
                ) : (
                  aiMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'ai' && <Bot size={16} className="mt-1 flex-shrink-0" />}
                          {message.type === 'user' && <User size={16} className="mt-1 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Bot size={16} />
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

              {/* 输入区域 */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default CanvasEditor;