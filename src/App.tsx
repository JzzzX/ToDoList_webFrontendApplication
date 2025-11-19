import React, { useState, useEffect } from 'react'

// 定义数据结构
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// 定义筛选状态类型
type FilterType = 'all' | 'active' | 'completed';

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('my-todo-app-data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return []; 
      }
    }
    // 如果本地没数据，默认给两条欢迎数据
    return [
      { id: 1, text: '完成前端笔试的基础架构', completed: false },
      { id: 2, text: '刷新页面，数据依然还在！', completed: true },
    ];
  });

  const [inputValue, setInputValue] = useState('');

  const [searchTerm, setSearchTerm] = useState(''); // 搜索关键词状态
  const [filter, setFilter] = useState<FilterType>('all'); //筛选状态

  // 自动存档功能
  useEffect(() => {
    localStorage.setItem('my-todo-app-data', JSON.stringify(todos));
  }, [todos]);

/* -------------------------业务逻辑函数（增删改）----------------------- */
  const handleAddTodo = () => {
    if (inputValue.trim() === '') return;
    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue('');
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

  // 4. 计算衍生数据 
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (searchTerm && !todo.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;

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

          {/* 添加任务输入框 */}
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown} 
              placeholder="添加一个新的任务..." 
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
            <button onClick={handleAddTodo} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm">
              添加
            </button>
          </div>

          {/* 搜索和筛选工具栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 搜索任务..."
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

        {/* 3. 列表区域 (渲染 filteredTodos) */}
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
                  <span className={`text-gray-700 transition-all ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                    {todo.text}
                  </span>
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