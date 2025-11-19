import React, { useState, useEffect } from 'react'

// 定义数据结构
interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  category: 'work' | 'study' | 'life';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

// 定义筛选状态类型
type FilterType = 'all' | 'active' | 'completed';

function App() {
  // 使用 v2 版本的存储 Key，避免旧数据冲突
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('my-todo-app-data-v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return []; 
      }
    }

    return [
      { 
        id: 1, 
        title: '数据结构已升级', 
        description: '现在支持新字段了，但在界面上还看不到', 
        completed: false,
        category: 'study',
        priority: 'high',
        dueDate: '2025-11-25'
      },
    ];
  });

  // 输入框状态
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState(''); 

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // 自动存档功能
  useEffect(() => {
    localStorage.setItem('my-todo-app-data', JSON.stringify(todos));
  }, [todos]);

/* -------------------------业务逻辑函数（增删改）----------------------- */
  const handleAddTodo = () => {
    if (inputTitle.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now(),
      title: inputTitle,
      description: inputDesc,
      completed: false,
      // 【临时】先给默认值，下一步再做输入框
      category: 'life',
      priority: 'medium',
      dueDate: ''
    };

    setTodos([newTodo, ...todos]);
    setInputTitle('');
    setInputDesc('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTodo();
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 计算衍生数据 
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = todo.title.toLowerCase().includes(term);
      const matchDesc = todo.description?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-10 px-4">
      
      {/* 核心卡片容器 */}
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl overflow-hidden">
        
        {/* 标题区域 */}
        <div className="bg-blue-600 p-6">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            我的待办事项
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            保持专注，高效每一天
          </p>
        </div>

        {/* 控制面板 */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">

        {/* 输入区域 */}
          <div className="space-y-2">
            <input 
              type="text" 
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              onKeyDown={handleKeyDown} 
              placeholder="任务标题 (必填)..." 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={inputDesc}
                onChange={(e) => setInputDesc(e.target.value)}
                onKeyDown={handleKeyDown} 
                placeholder="任务描述 (可选)..." 
                className="flex-1 p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm bg-gray-50 focus:bg-white"
              />
              <button onClick={handleAddTodo} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm whitespace-nowrap">
                添加
              </button>
            </div>
          </div>

          {/* 搜索和筛选工具栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索..."
                className="w-full p-2 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            {/* 筛选按钮组 */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg self-start sm:self-auto">
              {(['all', 'active', 'completed'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === type 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type === 'all' ? '全部' : type === 'active' ? '待办' : '已完成'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 列表区域 (渲染 filteredTodos) */}
        <ul className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {filteredTodos.length === 0 ? (
            <li className="p-10 text-center text-gray-500 flex flex-col items-center">
              <span className="text-4xl mb-2">🤔</span>
              <p>没有找到相关任务</p>
            </li>
          ) : (
            filteredTodos.map(todo => (
              <li key={todo.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition group">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => toggleTodo(todo.id)}>
                  <input 
                    type="checkbox" 
                    checked={todo.completed}
                    readOnly
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className={`font-medium text-gray-800 transition-all ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                      {todo.title}
                    </span>
                    {/* 显示描述 */}
                    {todo.description && (
                      <span className={`text-sm text-gray-500 mt-0.5 ${todo.completed ? 'line-through text-gray-300' : ''}`}>
                        {todo.description}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTodo(todo.id)} className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-2">
                  删除
                </button>
              </li>
            ))
          )}
        </ul>

        {/* 底部统计栏 */}
        <div className="p-4 bg-gray-50 text-sm text-gray-500 text-center border-t border-gray-100">
          共 {todos.length} 个任务 · 显示 {filteredTodos.length} 个
        </div>
      </div>
    </div>
  )
}

export default App