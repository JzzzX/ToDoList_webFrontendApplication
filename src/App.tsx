import React, { useState, useEffect } from 'react'
import { useAITaskSplitter } from './hooks/useAITaskSplitter'

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
type SortType = 'date' | 'priority';

function App() {
  // 初始化状态
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('my-todo-app-data-v2');
    if (saved) { try { return JSON.parse(saved); } catch (e) { return []; } }
    return [];
  });

  // === AI 相关状态 ===
  const { splitTaskWithAI, isLoading: isAILoading } = useAITaskSplitter();
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTargetTaskId, setAiTargetTaskId] = useState<number | null>(null);
  const [aiTargetTaskTitle, setAiTargetTaskTitle] = useState('');
  const [apiKey, setApiKey] = useState('');

  // 表单状态
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [category, setCategory] = useState<Todo['category']>('study');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [dueDate, setDueDate] = useState('');

  // 工具栏状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');

  // 持久化 & 通知检查
  useEffect(() => {
    localStorage.setItem('my-todo-app-data-v2', JSON.stringify(todos));
    
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    
    // 检查是否有今天截止的任务
    const today = new Date().toISOString().split('T')[0];
    const dueTasks = todos.filter(t => t.dueDate === today && !t.completed);
    
    if (dueTasks.length > 0 && Notification.permission === "granted") {
      // 防止重复弹窗，实际项目中会有更复杂的逻辑，这里演示 API 能力
    }
  }, [todos]);

  // 核心操作
  const handleAddTodo = () => {
    if (inputTitle.trim() === '') return;
    const newTodo: Todo = {
      id: Date.now(),
      title: inputTitle,
      description: inputDesc,
      completed: false,
      category, priority, dueDate
    };
    setTodos([newTodo, ...todos]);
    // 重置
    setInputTitle(''); setInputDesc(''); setPriority('medium'); setDueDate('');
    
    // 添加成功的高级反馈
    if (Notification.permission === "granted" && priority === 'high') {
      new Notification("⚡️ 高优先级任务已创建", { body: inputTitle });
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // 批量操作：清除所有已完成
  const clearCompleted = () => {
    if (window.confirm('确定要删除所有已完成的任务吗？')) {
      setTodos(todos.filter(t => !t.completed));
    }
  };


  // === AI 操作逻辑 ===
  const handleOpenAIModal = (task: Todo) => {
    setAiTargetTaskId(task.id);
    setAiTargetTaskTitle(task.title);
    setShowAIModal(true); // 打开弹窗
  };

  const handleAISplitExecution = async (mode: 'mock' | 'real') => {
    if (!aiTargetTaskId) return;
    
    // 调用我们封装好的 Hook
    const subtasks = await splitTaskWithAI(aiTargetTaskTitle, apiKey, mode);
    
    if (subtasks && subtasks.length > 0) {
      // 将生成的子任务转换成 Todo 格式
      const newTodos: Todo[] = subtasks.map((st, index) => ({
        id: Date.now() + index,
        title: st.title,
        description: st.description,
        completed: false,
        category: 'work',     // 默认分类
        priority: 'medium',   // 默认优先级
        dueDate: new Date().toISOString().split('T')[0] // 默认今天
      }));

      // 插入到列表最前面
      setTodos(prev => [...newTodos, ...prev]);
      setShowAIModal(false); // 关闭弹窗
      alert(`✨ 成功拆解出 ${subtasks.length} 个子任务！`);
    }
  };

  // 排序与过滤引擎
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  const processedTodos = todos
    .filter(todo => {
      if (filter === 'active' && todo.completed) return false;
      if (filter === 'completed' && !todo.completed) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return todo.title.toLowerCase().includes(term) || todo.description?.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      } else {
        // 日期排序：有日期的排前面，没日期的排后面
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
    });

  // 辅助 UI 函数
  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'text-red-600 bg-red-50 border-red-100';
    if (p === 'medium') return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };
  const getCategoryEmoji = (c: Todo['category']) => {
    const map = { work: '💼 工作', study: '📚 学习', life: '🏖️ 生活' };
    return map[c];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-gray-900">

      {/* === AI 弹窗 (Modal) === */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">✨ AI 任务拆解</h3>
              <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
              正在为任务 <strong>“{aiTargetTaskTitle}”</strong> 生成子步骤...
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">API Key (填入你的 Key)</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..." 
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleAISplitExecution('mock')} disabled={isAILoading} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition disabled:opacity-50">
                  {isAILoading ? '思考中...' : '🔮 模拟演示'}
                </button>
                <button onClick={() => handleAISplitExecution('real')} disabled={isAILoading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50 shadow-lg shadow-blue-200">
                  {isAILoading ? '生成中...' : '🚀 开始生成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Ultimate Todo List
          </h1>
        </header>

        {/* 输入卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <input type="text" value={inputTitle} onChange={e => setInputTitle(e.target.value)} placeholder="准备做什么？(必填)" 
            className="w-full text-lg font-medium placeholder:text-gray-400 border-0 border-b-2 border-gray-100 focus:border-indigo-500 focus:ring-0 px-0 py-2 transition-colors" />
          <textarea value={inputDesc} onChange={e => setInputDesc(e.target.value)} placeholder="添加描述..." rows={2} 
            className="w-full text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-none focus:ring-2 focus:ring-indigo-100 resize-none" />
          
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <select value={category} onChange={e => setCategory(e.target.value as any)} className="text-sm bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:bg-gray-100">
                <option value="study">📚 学习</option><option value="work">💼 工作</option><option value="life">🏖️ 生活</option>
              </select>
              <select value={priority} onChange={e => setPriority(e.target.value as any)} className="text-sm bg-gray-50 border-none rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:bg-gray-100">
                <option value="low">🟢 低优</option><option value="medium">🟡 中优</option><option value="high">🔴 高优</option>
              </select>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-sm bg-gray-50 border-none rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:bg-gray-100 text-gray-600" />
            </div>
            <button onClick={handleAddTodo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all active:scale-95">
              创建
            </button>
          </div>
        </div>

        {/* 过滤与工具栏 */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          
          {/* 搜索 */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜索..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-indigo-100 text-sm" />
          </div>

          {/* 筛选 Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg mx-auto sm:mx-4">
            {(['all', 'active', 'completed'] as FilterType[]).map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'all' ? '全部' : t === 'active' ? '待办' : '已完成'}
              </button>
            ))}
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-gray-400">排序</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setSortBy('date')} className={`p-1.5 rounded ${sortBy === 'date' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`} title="按日期">📅</button>
              <button onClick={() => setSortBy('priority')} className={`p-1.5 rounded ${sortBy === 'priority' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`} title="按优先级">🔥</button>
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="space-y-3">
          {processedTodos.map(todo => (
            <div key={todo.id} className={`group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-start gap-4 ${todo.completed ? 'opacity-50 grayscale-[50%]' : ''}`}>
              <div className="pt-1"><input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="w-6 h-6 text-indigo-600 rounded-full border-gray-300 focus:ring-indigo-500 cursor-pointer transition-all" /></div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-gray-800 truncate ${todo.completed ? 'line-through decoration-2 decoration-gray-300' : ''}`}>{todo.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(todo.priority)} uppercase tracking-wide`}>{todo.priority}</span>
                  <span className="text-sm">{getCategoryEmoji(todo.category)}</span>
                </div>
                {todo.description && <p className="text-sm text-gray-500 line-clamp-2">{todo.description}</p>}
                {todo.dueDate && (<div className={`flex items-center gap-1 text-xs font-medium mt-1 ${todo.dueDate < new Date().toISOString().split('T')[0] && !todo.completed ? 'text-red-500' : 'text-gray-400'}`}>🗓 {todo.dueDate} {todo.dueDate < new Date().toISOString().split('T')[0] && !todo.completed ? '(已过期)' : ''}</div>)}
              </div>
              
              {/* === AI魔法棒按钮 === */}
              {!todo.completed && (
                <button 
                  onClick={() => handleOpenAIModal(todo)}
                  className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="AI 智能拆解"
                >
                  ✨
                </button>
              )}
              
              <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100">🗑</button>
            </div>
          ))}
          
          {/* 批量操作按钮 */}
          {todos.some(t => t.completed) && (
            <div className="flex justify-center pt-4">
              <button onClick={clearCompleted} className="text-sm text-gray-400 hover:text-red-500 hover:underline transition-all">
                清除已完成任务
              </button>
            </div>
          )}

          {processedTodos.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">暂无相关任务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App