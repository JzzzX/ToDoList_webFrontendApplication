import React, { useState } from 'react'

// 定义数据结构
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  // 这里先把数据定义好
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: '完成前端笔试的基础架构', completed: false },
    { id: 2, text: '配置 Vite 和 Tailwind 环境', completed: true },
  ]);
  const [inputValue, setInputValue] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-10 px-4">
      
      {/* 核心卡片容器 */}
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl overflow-hidden">
        
        {/* 1. 标题区域 */}
        <div className="bg-blue-600 p-6">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            我的待办事项
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            保持专注，高效每一天
          </p>
        </div>

        {/* 2. 输入区域 */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex space-x-2">
            <input 
              type="text"
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="添加一个新的任务..." 
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
            />
            <button onClick={handleAddTodo} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-sm">
              添加
            </button>
          </div>
        </div>

        {/* 3. 列表区域*/}
        <ul className="divide-y divide-gray-100">
          {todos.length === 0 ? (
            <li className="p-10 text-center text-gray-500">暂无任务，来添加一个吧！</li>
          ) : (
            todos.map(todo => (
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
                  {/* SVG暂时删除以为简洁 */}
                  删除
                </button>
              </li>
            ))
          )}
        </ul>

        {/* 4. 底部统计栏 */}
        <div className="p-4 bg-gray-50 text-sm text-gray-500 text-center border-t border-gray-100">
          还有 {todos.filter(t => !t.completed).length} 个任务未完成
        </div>

      </div>
    </div>
  )
}

export default App