import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  MessageSquare,
  Share2,
  X,
  Edit,
  Save,
  Bell,
  ListTodo,
  FolderKanban
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Task, ProjectComment } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const TasksScreen: React.FC = () => {
  const { tasks, projects, addTask, updateTaskStatus, deleteTask, employees, openChatWithUser, updateTask } = useApp();
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'tasks' | 'todos' | 'reminders'>('tasks');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [createType, setCreateType] = useState<'task' | 'todo' | 'reminder'>('task');
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('none');
  const [team, setTeam] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('2026-03-30');
  const [priority, setPriority] = useState<Task['priority']>('Medium');

  // Detail View State
  const [newComment, setNewComment] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editStatus, setEditStatus] = useState<Task['status']>('Todo');
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    // Assign to first person in team or default
    const assignedName = team.length > 0 ? team[0] : (user?.name || 'Unassigned');
    const assignedEmp = employees.find(emp => emp.name === assignedName);
    const resolvedProjectId = projectId === 'none' ? undefined : projectId;
    const resolvedProjectName = resolvedProjectId ? projects.find((p) => p.id === resolvedProjectId)?.name : undefined;

    addTask({
      title,
      description,
      taskType: createType,
      projectId: resolvedProjectId,
      projectName: resolvedProjectName,
      assignedToId: assignedEmp?.firebaseUid || assignedEmp?.id || user?.id || '',
      assignedToName: assignedName,
      assignedToAvatar: assignedEmp?.avatar || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      team: team.length > 0 ? team : [assignedName],
      dueDate,
      priority,
      status: 'Todo',
      estimatedHours: createType === 'task' ? 10 : 1,
      comments: []
    });
    setIsAddOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTeam([]);
    setProjectId('none');
    setCreateType('task');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const comment: ProjectComment = {
      id: `cmt-${Date.now()}`,
      authorId: user?.id || 'unknown',
      authorName: user?.name || 'User',
      authorAvatar: user?.avatar,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...(selectedTask.comments || []), comment];
    updateTask(selectedTask.id, { comments: updatedComments });
    setSelectedTask({ ...selectedTask, comments: updatedComments });
    setNewComment('');
  };

  const handleSaveDetails = () => {
    if (!selectedTask) return;
    updateTask(selectedTask.id, {
      description: selectedTask.description,
      status: editStatus,
      team: selectedTask.team,
      priority: selectedTask.priority
    });
    setSelectedTask({ ...selectedTask, status: editStatus });
    setIsEditingDetails(false);
  };

  const handleShareTask = (task: Task) => {
    const taskLink = `${window.location.origin}?screen=tasks&taskId=${task.id}`;
    navigator.clipboard.writeText(`${task.taskType?.toUpperCase() || 'TASK'}: ${task.title}\nStatus: ${task.status}\nLink: ${taskLink}`);
    
    if (task.assignedToId && task.assignedToId !== user?.id) {
        if (window.confirm(`Link copied to clipboard. Open direct message with ${task.assignedToName} to share it?`)) {
           openChatWithUser(task.assignedToId);
        }
    } else {
        alert("Link copied to clipboard! Share it via email or messenger.");
    }
  };

  const toggleTeamMember = (empName: string) => {
    if (team.includes(empName)) {
      setTeam(team.filter(t => t !== empName));
    } else {
      setTeam([...team, empName]);
    }
  };

  const myTasks = tasks.filter(t => {
     // fallback if taskType isn't set
     const type = t.taskType || 'task';
     return type === activeTab.slice(0, -1);
  });

  const todoTasks = myTasks.filter((t) => t.status === 'Todo');
  const inProgressTasks = myTasks.filter((t) => t.status === 'In Progress');
  const reviewTasks = myTasks.filter((t) => t.status === 'Review');
  const doneTasks = myTasks.filter((t) => t.status === 'Done');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tasks & Productivity</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage kanban tasks, simple to-dos, and time-based reminders
            </p>
          </div>
        </div>

        <button
          onClick={() => { setCreateType(activeTab.slice(0, -1) as any); setIsAddOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="capitalize">Create {activeTab.slice(0, -1)}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'tasks' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FolderKanban className="w-4 h-4" /> Kanban Tasks
        </button>
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'todos' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ListTodo className="w-4 h-4" /> Simple To-Dos
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === 'reminders' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Bell className="w-4 h-4" /> Reminders
        </button>
      </div>

      {/* Kanban Board View */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {/* TODO Column */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>To Do</span>
              </span>
              <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {todoTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTask(t); setEditStatus(t.status); setIsEditingDetails(false); }}
                  className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{t.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <Badge variant={t.priority === 'Urgent' ? 'danger' : t.priority === 'High' ? 'warning' : 'default'}>
                      {t.priority}
                    </Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateTaskStatus(t.id, 'In Progress'); }}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Start →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>In Progress</span>
              </span>
              <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {inProgressTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTask(t); setEditStatus(t.status); setIsEditingDetails(false); }}
                  className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{t.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{t.team && t.team.length > 0 ? t.team[0] : t.assignedToName}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateTaskStatus(t.id, 'Review'); }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REVIEW Column */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Under Review</span>
              </span>
              <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                {reviewTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {reviewTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTask(t); setEditStatus(t.status); setIsEditingDetails(false); }}
                  className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{t.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">{t.dueDate}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateTaskStatus(t.id, 'Done'); }}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Approve ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DONE Column */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Completed</span>
              </span>
              <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {doneTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedTask(t); setEditStatus(t.status); setIsEditingDetails(false); }}
                  className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs space-y-2 opacity-80 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 line-through leading-snug">{t.title}</h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Done</span>
                    <span className="text-slate-400 font-mono truncate max-w-[80px]">{t.projectName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Simple To-Dos List */}
      {activeTab === 'todos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-300 space-y-4">
          {myTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No To-Dos yet.</div>
          ) : (
            <div className="space-y-3">
              {myTasks.map(t => (
                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${t.status === 'Done' ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500'}`}>
                   <button 
                     onClick={() => updateTaskStatus(t.id, t.status === 'Done' ? 'Todo' : 'Done')}
                     className={`w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer transition-colors ${t.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}
                   >
                     {t.status === 'Done' && <CheckCircle2 className="w-3.5 h-3.5" />}
                   </button>
                   <div className="flex-1 cursor-pointer" onClick={() => { setSelectedTask(t); setEditStatus(t.status); setIsEditingDetails(false); }}>
                     <p className={`text-sm font-bold ${t.status === 'Done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{t.title}</p>
                     {t.description && <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>}
                   </div>
                   {t.projectId && (
                     <Badge variant="info">{t.projectName}</Badge>
                   )}
                   <button onClick={() => deleteTask(t.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer p-2">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reminders List */}
      {activeTab === 'reminders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-in fade-in duration-300 space-y-4">
          {myTasks.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No Reminders set.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTasks.map(t => (
                <div key={t.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${t.status === 'Done' ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700'}`}>
                   <button 
                     onClick={() => updateTaskStatus(t.id, t.status === 'Done' ? 'Todo' : 'Done')}
                     className={`w-6 h-6 rounded-full flex shrink-0 items-center justify-center border cursor-pointer transition-colors mt-0.5 ${t.status === 'Done' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`}
                   >
                     {t.status === 'Done' && <CheckCircle2 className="w-4 h-4" />}
                   </button>
                   <div className="flex-1 cursor-pointer" onClick={() => { setSelectedTask(t); setEditStatus(t.status); setIsEditingDetails(false); }}>
                     <div className="flex items-center gap-2 mb-1">
                       <Clock className={`w-3.5 h-3.5 ${t.status === 'Done' ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'}`} />
                       <span className={`text-xs font-bold ${t.status === 'Done' ? 'text-slate-400' : 'text-amber-700 dark:text-amber-300'}`}>{t.dueDate}</span>
                     </div>
                     <p className={`text-sm font-bold ${t.status === 'Done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{t.title}</p>
                     {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                   </div>
                   <button onClick={() => deleteTask(t.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer p-2">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={`Create ${createType.charAt(0).toUpperCase() + createType.slice(1)}`}>
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          
          {/* Create Type Selector (if opened generally, allows switching) */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
             {(['task', 'todo', 'reminder'] as const).map(type => (
               <button
                 key={type}
                 type="button"
                 onClick={() => setCreateType(type)}
                 className={`flex-1 py-1.5 rounded-lg font-bold text-center capitalize cursor-pointer transition-colors ${createType === type ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
               >
                 {type}
               </button>
             ))}
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${createType === 'reminder' ? 'Review Q3 Budget' : createType === 'todo' ? 'Send follow up email' : 'Implement OAuth 2.0'}`}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          {createType !== 'reminder' && (
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Description (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes, links..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Assignment & Project Context - Now available for all types */}
          <div className="space-y-4">
            <div className="space-y-1 relative">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Assign Team / Collaborators</label>
              <div 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 min-h-[40px] flex flex-wrap gap-2 items-center cursor-pointer"
                onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
              >
                {team.length === 0 ? (
                  <span className="text-slate-400 text-xs">Click to assign members...</span>
                ) : (
                  team.map(member => (
                    <span key={member} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-bold flex items-center gap-1">
                      {member}
                      <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={(e) => { e.stopPropagation(); toggleTeamMember(member); }} />
                    </span>
                  ))
                )}
              </div>
              {isAssignDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 p-2 max-h-40 overflow-y-auto">
                  {employees.map(emp => (
                    <div 
                      key={emp.id} 
                      onClick={() => toggleTeamMember(emp.name)}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                    >
                      <input type="checkbox" checked={team.includes(emp.name)} readOnly className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{emp.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Link to Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="none">Standalone / Private</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
          
          {createType === 'reminder' && (
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Date & Time</label>
              <input
                type="datetime-local"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Create {createType}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">{selectedTask.taskType || 'Task'}</span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight pr-4">{selectedTask.title}</h2>
                </div>
                {selectedTask.taskType === 'task' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedTask.priority === 'Urgent' ? 'danger' : selectedTask.priority === 'High' ? 'warning' : 'default'}>
                      {selectedTask.priority} Priority
                    </Badge>
                    <p className="text-[11px] text-slate-500 font-mono">{selectedTask.projectName || 'Standalone'}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                 {role === 'admin' && (
                   <button
                     type="button"
                     onClick={() => {
                       if (window.confirm('Delete this task permanently?')) {
                         deleteTask(selectedTask.id);
                         setSelectedTask(null);
                       }
                     }}
                     className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 shadow-xs cursor-pointer"
                     title="Delete Task"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 )}
                 <button onClick={() => handleShareTask(selectedTask)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 shadow-xs cursor-pointer" title="Share via Direct Message">
                   <Share2 className="w-4 h-4" />
                 </button>
                 <button onClick={() => setSelectedTask(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 shadow-xs cursor-pointer">
                   <X className="w-4 h-4" />
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* Discussion & Comments */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> Discussion & Updates
                </h3>
                
                <div className="space-y-3">
                  {(selectedTask.comments || []).map((comment) => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex gap-3">
                      <img 
                        src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorName}&background=random`} 
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{comment.authorName}</p>
                          <p className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add an update..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer">
                    Post
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
