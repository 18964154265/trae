import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, TrendingUp, Search, Filter, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects, createProject, isLoading, error } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('开始创建项目，数据:', newProjectData);
    
    if (!newProjectData.title.trim()) {
      console.error('项目标题为空');
      return;
    }

    try {
      console.log('调用 createProject 函数...');
      const newProject = await createProject(newProjectData);
      console.log('createProject 返回结果:', newProject);
      
      if (newProject) {
        setShowCreateModal(false);
        setNewProjectData({ title: '', description: '' });
        console.log('项目创建成功:', newProject);
      } else {
        console.error('项目创建失败: createProject 返回了 null 或 undefined');
      }
    } catch (error) {
      console.error('创建项目时发生错误:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
    }
  };

  // 确保 projects 是数组类型，并进行安全的过滤
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const filteredProjects = safeProjects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = [
    { 
      label: '总项目数', 
      value: safeProjects.length.toString(), 
      icon: FileText, 
      color: 'text-blue-600' 
    },
    { 
      label: '活跃项目', 
      value: safeProjects.filter(p => p.status === 'active').length.toString(), 
      icon: Clock, 
      color: 'text-yellow-600' 
    },
    { 
      label: '已归档', 
      value: safeProjects.filter(p => p.status === 'archived').length.toString(), 
      icon: TrendingUp, 
      color: 'text-green-600' 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">论文写作助手</h1>
              <p className="text-sm text-gray-600">欢迎回来，{user?.name || '用户'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">我的项目</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索项目..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">加载中...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? '没有找到匹配的项目' : '还没有项目，创建您的第一个项目吧！'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  创建项目
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <div key={project.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {project.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'archived' 
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'active'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'archived' ? '已归档' : 
                           project.status === 'active' ? '活跃' : '已删除'}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        最后修改：{new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="ml-4">
                      <Link
                        to={`/editor/${project.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                      >
                        继续编辑
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">创建新项目</h3>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目标题
                  </label>
                  <input
                    type="text"
                    value={newProjectData.title}
                    onChange={(e) => setNewProjectData({ ...newProjectData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入项目标题..."
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目描述（可选）
                  </label>
                  <textarea
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入项目描述..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectData.title.trim() || isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '创建中...' : '创建项目'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;