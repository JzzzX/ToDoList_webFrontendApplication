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
  parentId?: number;
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

  // 控制任务折叠/展开的状态 （使用 Set 存储“已展开”的父任务 ID）
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

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
    const idsToDelete = new Set([id]);
    
    todos.forEach(t => { 
      if (t.parentId === id) idsToDelete.add(t.id); 
    });

    setTodos(todos.filter(t => !idsToDelete.has(t.id)));
  };

  // 控制展开/折叠的函数 
  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(id)) {
      newSet.delete(id); 
    } else {
      newSet.add(id);
    }
    setExpandedTasks(newSet);
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
    const subtasks = await splitTaskWithAI(aiTargetTaskTitle, apiKey, mode); // 调用我们封装好的 Hook
    
    if (subtasks && subtasks.length > 0) {
      // 将生成的子任务转换成 Todo 格式
      const newTodos: Todo[] = subtasks.map((st, index) => ({
        id: Date.now() + index,
        title: st.title,
        description: st.description,
        completed: false,
        category: 'work',     
        priority: 'medium',   
        dueDate: new Date().toISOString().split('T')[0], 
        parentId: aiTargetTaskId
      }));

      setTodos(prev => {
        const parentIndex = prev.findIndex(t => t.id === aiTargetTaskId);
        
        if (parentIndex === -1) return [...newTodos, ...prev]; 

        const newList = [...prev];
        newList.splice(parentIndex + 1, 0, ...newTodos);
        return newList;
      });

      setExpandedTasks(prev => new Set(prev).add(aiTargetTaskId)); // 生成完成后，自动把当前父任务设为展开状态
      setShowAIModal(false); // 关闭弹窗
      // alert(`✨ 成功拆解出 ${subtasks.length} 个子任务！`);
    }
  };

  // 排序与过滤引擎
  const priorityWeight = { high: 3, medium: 2, low: 1 }; // 全局排序：无论父子，先按用户选的规则（日期/优先级）排好序
  const sortedTodos = [...todos].sort((a, b) => {
    if (sortBy === 'priority') return priorityWeight[b.priority] - priorityWeight[a.priority];
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  // 筛选出“根任务”：用于最外层循环渲染
  const rootTodos = sortedTodos.filter(todo => {
    if (todo.parentId) return false;
    
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return todo.title.toLowerCase().includes(term) || todo.description?.toLowerCase().includes(term);
    }
    return true;
  });

  // 辅助工具：给 ID 找儿子
  const getChildTodos = (parentId: number) => {
    return sortedTodos.filter(t => t.parentId === parentId);
  };


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

      {/* === 核心渲染逻辑：树形列表 === */}
        <div className="space-y-3">
          {rootTodos.map(parent => {
            // 获取该任务的子任务
            const children = getChildTodos(parent.id);
            const hasChildren = children.length > 0;
            const isExpanded = expandedTasks.has(parent.id);

            return (
              <div key={parent.id} className="space-y-2">
                {/* 1. 父任务卡片 */}
                <div className={`group relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-start gap-4 ${parent.completed ? 'opacity-60' : ''}`}>
                  
                  {/* 折叠/展开按钮 (只有有子任务时才显示) */}
                  {hasChildren && (
                    <button 
                      onClick={() => toggleExpand(parent.id)}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-sm text-gray-400 hover:text-indigo-600 transition-colors z-10"
                    >
                       <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  )}

                  <div className="pt-1">
                    <input type="checkbox" checked={parent.completed} onChange={() => toggleTodo(parent.id)} className="w-6 h-6 text-indigo-600 rounded-full border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-gray-800 truncate ${parent.completed ? 'line-through decoration-2 decoration-gray-300' : ''}`}>{parent.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(parent.priority)} uppercase tracking-wide`}>{parent.priority}</span>
                      <span className="text-sm">{getCategoryEmoji(parent.category)}</span>
                      {/* 子任务计数徽章 */}
                      {hasChildren && <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{children.filter(c=>c.completed).length}/{children.length}</span>}
                    </div>
                    {parent.description && <p className="text-sm text-gray-500 line-clamp-2">{parent.description}</p>}
                    {parent.dueDate && (<div className={`flex items-center gap-1 text-xs font-medium mt-1 ${parent.dueDate < new Date().toISOString().split('T')[0] && !parent.completed ? 'text-red-500' : 'text-gray-400'}`}>🗓 {parent.dueDate}</div>)}
                  </div>
                  
                  {/* 魔法棒 */}
                  {!parent.completed && (
                    <button onClick={() => handleOpenAIModal(parent)} className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="AI 拆解">✨</button>
                  )}
                  <button onClick={() => deleteTodo(parent.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100">🗑</button>
                </div>

                {/* 2. 子任务列表 (渲染在父任务下面) */}
                {hasChildren && isExpanded && (
                  <div className="ml-8 space-y-2 border-l-2 border-indigo-100 pl-4 relative">
                    {children.map(child => (
                      <div key={child.id} className={`relative group bg-gray-50/80 p-3 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all flex items-start gap-3 ${child.completed ? 'opacity-50' : ''}`}>
                        {/* 连接线 */}
                        <div className="absolute -left-[18px] top-1/2 w-4 h-[2px] bg-indigo-100"></div>

                        <div className="pt-0.5">
                          <input type="checkbox" checked={child.completed} onChange={() => toggleTodo(child.id)} className="w-5 h-5 text-indigo-500 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <span className={`text-sm font-medium text-gray-700 ${child.completed ? 'line-through text-gray-400' : ''}`}>{child.title}</span>
                           </div>
                           {child.description && <p className="text-xs text-gray-500 mt-0.5">{child.description}</p>}
                        </div>
                        <button onClick={() => deleteTodo(child.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {rootTodos.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200"><p className="text-gray-400 text-sm">暂无任务</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App