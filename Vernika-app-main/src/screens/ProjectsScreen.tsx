import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Trash2,
  Layers,
  ArrowUpRight,
  MessageSquare,
  Edit,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectComment } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ProjectsScreen: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, clients, employees, calculateProjectRollup } = useApp();
  const { role, user } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(75000);
  const [deadline, setDeadline] = useState('2026-06-30');
  const [priority, setPriority] = useState<Project['priority']>('Medium');
  const [team, setTeam] = useState<string[]>([]);
  
  // Detail View State
  const [newComment, setNewComment] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editStatus, setEditStatus] = useState<Project['status']>('Active');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    // Assign default client name if specific client not selected
    let clientName = 'Internal';
    if (clientId) {
      const c = clients.find(cl => cl.id === clientId);
      if (c) clientName = c.company;
    } else if (role === 'client') {
      const c = clients.find(cl => cl.id === user?.id);
      if (c) {
        clientName = c.company;
        setClientId(c.id);
      }
    }

    addProject({
      name,
      client: clientName,
      clientId: clientId || (role === 'client' ? user?.id : undefined),
      description: description || `${name} details.`,
      budget: Number(budget),
      deadline,
      status: 'Planning',
      team: team.length > 0 ? team : (user?.name ? [user.name] : []),
      priority,
      comments: []
    });
    setIsAddOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setName('');
    setClientId('');
    setDescription('');
    setTeam([]);
    setBudget(75000);
  };

  const handleUpdateStatus = (id: string, status: Project['status']) => {
    updateProject(id, { status });
    if (selectedProject?.id === id) {
      setSelectedProject(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedProject) return;

    const comment: ProjectComment = {
      id: `cmt-${Date.now()}`,
      authorId: user?.id || 'unknown',
      authorName: user?.name || 'User',
      authorAvatar: user?.avatar,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedComments = [...(selectedProject.comments || []), comment];
    updateProject(selectedProject.id, { comments: updatedComments });
    setSelectedProject({ ...selectedProject, comments: updatedComments });
    setNewComment('');
  };

  const handleSaveDetails = () => {
    if (!selectedProject) return;
    updateProject(selectedProject.id, {
      description: selectedProject.description,
      status: editStatus,
      team: selectedProject.team
    });
    setIsEditingDetails(false);
  };

  const filteredProjects = projects.filter((p) => {
    if (!p) return false;
    
    // If Client, only show their projects
    if (role === 'client' && p.clientId !== user?.id && p.client !== user?.name) {
      return false;
    }

    const s = (search || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const pClient = (p.client || '').toLowerCase();
    const matchesSearch = !s || pName.includes(s) || pClient.includes(s);
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalBudget = filteredProjects.reduce((acc, curr) => acc + Number(curr.budget ?? 0), 0);
  const totalSpent = filteredProjects.reduce((acc, curr) => acc + Number(curr.spent ?? 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Project Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track deliverables, client milestones, budget burn-rates, and sprint completion
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Portfolio Value</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">${totalBudget.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">{filteredProjects.length} contracted projects</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expenditure Burn</p>
            <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">${totalSpent.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{((totalSpent / (totalBudget || 1)) * 100).toFixed(0)}% budget utilized</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Sprints</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{filteredProjects.filter((p) => p.status === 'Active').length}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">In execution</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-emerald-300 dark:hover:border-emerald-500/50 shadow-xs transition-all space-y-4 flex flex-col justify-between cursor-pointer"
            onClick={() => { setSelectedProject(p); setEditStatus(p.status); setIsEditingDetails(false); }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{p.client}</p>
                </div>
                <Badge variant={p.status === 'Active' ? 'success' : p.status === 'Planning' ? 'info' : p.status === 'Completed' ? 'default' : 'warning'}>
                  {p.status}
                </Badge>
              </div>

              {/* Progress Slider / Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Sprint Progress</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 font-mono">{Number(p.progress ?? 0)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Number(p.progress ?? 0)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Budget Total</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${Number(p.budget ?? 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Budget Spent</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">${(p.spent || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Team: {p.team?.slice(0, 2).join(', ') || 'Core'} {p.team && p.team.length > 2 && `+${p.team.length - 2}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                   <MessageSquare className="w-3.5 h-3.5" />
                   <span>{p.comments?.length || 0}</span>
                </div>
                {(role === 'admin' || p.clientId === user?.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Strategic Project">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Banking Migration 2.0"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Project Description & Goals</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project objectives and key deliverables..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Assign Client</label>
              {role === 'client' ? (
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">{user?.name} (Self)</div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="">Internal / No Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Total Budget ($)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Deadline</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1">
             <label className="text-slate-700 dark:text-slate-300 font-bold">Assign Team Members</label>
             <select
               multiple
               value={team}
               onChange={(e) => setTeam(Array.from(e.target.selectedOptions, option => option.value))}
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white h-24"
             >
               {employees.map(emp => (
                 <option key={emp.id} value={emp.name}>{emp.name} ({emp.position})</option>
               ))}
             </select>
             <p className="text-[10px] text-slate-500">Hold Cmd/Ctrl to select multiple</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Initiate Project
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedProject.name}</h2>
                  <Badge variant={selectedProject.status === 'Active' ? 'success' : selectedProject.status === 'Planning' ? 'info' : selectedProject.status === 'Completed' ? 'default' : 'warning'}>
                    {selectedProject.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Client: {selectedProject.client}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 shadow-xs">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* Project Details Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Project Overview</h3>
                  {!isEditingDetails && (role === 'admin' || role === 'client') && (
                    <button onClick={() => setIsEditingDetails(true)} className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-700">
                      <Edit className="w-3.5 h-3.5" /> Edit Details
                    </button>
                  )}
                </div>
                
                {isEditingDetails ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                      <textarea 
                        value={selectedProject.description}
                        onChange={(e) => setSelectedProject({...selectedProject, description: e.target.value})}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 min-h-[80px]"
                      />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assign Team Members</label>
                       <select
                         multiple
                         value={selectedProject.team}
                         onChange={(e) => setSelectedProject({...selectedProject, team: Array.from(e.target.selectedOptions, option => option.value)})}
                         className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 h-24"
                       >
                         {employees.map(emp => (
                           <option key={emp.id} value={emp.name}>{emp.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="flex justify-end pt-2">
                       <button onClick={handleSaveDetails} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                         <Save className="w-3.5 h-3.5" /> Save Changes
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedProject.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Assigned Team</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedProject.team?.map((member, i) => (
                            <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-medium text-slate-700 dark:text-slate-300">
                              {member}
                            </span>
                          )) || <span className="text-xs text-slate-500">Unassigned</span>}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Deadline</p>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{selectedProject.deadline}</p>
                        </div>
                        
                        {(() => {
                          const rollup = calculateProjectRollup(selectedProject.id);
                          return (
                            <div className="space-y-3">
                              <div className="bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-2">
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Financial Rollup</p>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Budget:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">${selectedProject.budget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Actual (Labor + Exp):</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">${rollup.actualTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                                  <span className="text-slate-500">Variance:</span>
                                  <span className={`font-bold ${rollup.budgetVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ${rollup.budgetVariance.toLocaleString()} ({rollup.marginPercent.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              {rollup.capacityWarning?.isOverAllocated && (
                                <div className="bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/50 flex flex-col gap-1.5 animate-fade-in">
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Capacity Warning
                                  </p>
                                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                                    Risk: {rollup.capacityWarning.riskLevel} | Forecasted Delay: {rollup.capacityWarning.forecastedDelayDays} days
                                  </p>
                                  <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                                    Bottlenecks: {rollup.capacityWarning.bottleneckMembers.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Discussion & Comments */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" /> Discussion & Updates
                </h3>
                
                <div className="space-y-3">
                  {(selectedProject.comments || []).map((comment) => (
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
                  
                  {(!selectedProject.comments || selectedProject.comments.length === 0) && (
                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                      <MessageSquare className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No updates yet.</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Add a comment to keep the team and client synced.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            {/* Comment Input Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post an update or comment..."
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </form>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
