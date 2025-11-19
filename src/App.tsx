import React, { useState, useEffect } from 'react'

interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  category: 'work' | 'study' | 'life';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

type FilterType = 'all' | 'active' | 'completed';

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('my-todo-app-data-v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  // 表单状态
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  // 表单控制状态
  const [category, setCategory] = useState<Todo['category']>('study');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [dueDate, setDueDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    localStorage.setItem('my-todo-app-data-v2', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = () => {
    if (inputTitle.trim() === '') return;
    
    const newTodo: Todo = {
      id: Date.now(),
      title: inputTitle,
      description: inputDesc,
      completed: false,
      category,
      priority,
      dueDate
    };
    
    setTodos([newTodo, ...todos]);
    // 重置表单
    setInputTitle('');
    setInputDesc('');
    setPriority('medium');
    setDueDate('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAddTodo(); };
  const toggleTodo = (id: number) => { setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)); };
  const deleteTodo = (id: number) => { setTodos(todos.filter(todo => todo.id !== id)); };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return todo.title.toLowerCase().includes(term) || todo.description?.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Ultimate Todo List
          </h1>
        </header>

        {/* 输入卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100">
          <input 
            type="text" 
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
            placeholder="准备做什么？(必填)" 
            className="w-full text-lg font-medium placeholder:text-gray-400 border-0 border-b-2 border-gray-100 focus:border-blue-500 focus:ring-0 px-0 py-2 transition-colors"
          />
          <textarea 
            value={inputDesc}
            onChange={e => setInputDesc(e.target.value)}
            placeholder="添加描述..." 
            rows={2}
            className="w-full text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
          
          {/* 控制栏：日期、分类、优先级 */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="text-sm bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-gray-100 transition"
              >
                <option value="study">📚 学习</option>
                <option value="work">💼 工作</option>
                <option value="life">🏖️ 生活</option>
                <option value="exercise">🏃 运动</option>
              </select>

              <select 
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="text-sm bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-gray-100 transition"
              >
                <option value="low">🟢 低优先级</option>
                <option value="medium">🟡 中优先级</option>
                <option value="high">🔴 高优先级</option>
              </select>

              <input 
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="text-sm bg-gray-50 border-none rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-100 cursor-pointer hover:bg-gray-100 transition text-gray-600"
              />
            </div>

            <button 
              onClick={handleAddTodo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              创建任务
            </button>
          </div>
        </div>

        {/* 简单的列表展示（还没美化，先凑合看） */}
        <div className="space-y-2">
            {filteredTodos.map(todo => (
                <div key={todo.id} className="bg-white p-4 rounded shadow">{todo.title} (暂时还没美化列表)</div>
            ))}
        </div>
        
      </div>
    </div>
  )
}
export default App