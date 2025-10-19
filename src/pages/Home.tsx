import React from 'react';
import { Link } from 'react-router-dom';
import { PenTool, BookOpen, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <PenTool className="h-8 w-8 text-blue-600" />,
      title: 'AI智能写作',
      description: '基于先进的AI技术，为您提供智能的写作建议和内容生成'
    },
    {
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      title: 'Canvas交互编辑',
      description: '直观的可视化编辑界面，让论文结构一目了然'
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: '协作编辑',
      description: '支持多人实时协作，提高团队写作效率'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: 'RAG知识增强',
      description: '结合知识库检索，提供更准确的写作建议'
    }
  ];

  const benefits = [
    '提高写作效率 3-5 倍',
    '智能语法和结构检查',
    '自动引用格式化',
    '多种论文模板支持',
    '云端同步，随时随地访问'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">论文写作助手</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI驱动的
              <span className="block text-yellow-300">论文写作助手</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              结合人工智能与可视化编辑，让学术写作变得更加高效和智能
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
              >
                开始免费使用
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/demo"
                className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                观看演示
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              强大的功能特性
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              我们为学术写作者提供全方位的智能化写作解决方案
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                为什么选择我们？
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                我们的AI论文写作助手不仅仅是一个工具，更是您学术写作路上的智能伙伴。
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
                <div className="text-gray-600 mb-6">用户信赖选择</div>
                <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
                <div className="text-gray-600 mb-6">写作效率提升</div>
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600">智能助手支持</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备开始您的智能写作之旅？
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            立即注册，体验AI驱动的论文写作助手，让您的学术写作更加高效
          </p>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
          >
            立即开始免费试用
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">论文写作助手</h3>
            <p className="text-gray-600 mb-4">让学术写作变得更加智能和高效</p>
            <div className="text-sm text-gray-500">
              © 2024 论文写作助手. 保留所有权利.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;