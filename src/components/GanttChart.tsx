/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task } from '../types';
import { Search, Plus, CalendarRange, Trash2, Sliders, Check, Clock, AlertTriangle } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTaskProgress: (id: string, progress: number, status: Task['status'], notes?: string) => void;
  onDeleteTask: (id: string) => void;
  userRole: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onAddTask,
  onUpdateTaskProgress,
  onDeleteTask,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Add Task Modal Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTasksName, setNewTaskName] = useState('');
  const [newTaskPhase, setNewTaskPhase] = useState<Task['phase']>('Framing');
  const [newTaskStart, setNewTaskStart] = useState('2026-08-05');
  const [newTaskEnd, setNewTaskEnd] = useState('2026-08-25');
  const [newTaskCrew, setNewTaskCrew] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('Medium');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Editing Task ID state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempProgress, setTempProgress] = useState<number>(0);
  const [tempStatus, setTempStatus] = useState<Task['status']>('Not Started');
  const [tempNotes, setTempNotes] = useState<string>('');

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.assignedCrew.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = selectedPhase === 'All' || task.phase === selectedPhase;
    const matchesStatus = selectedStatus === 'All' || task.status === selectedStatus;
    return matchesSearch && matchesPhase && matchesStatus;
  });

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTasksName || !newTaskCrew) return;
    onAddTask({
      name: newTasksName,
      phase: newTaskPhase,
      startDate: newTaskStart,
      endDate: newTaskEnd,
      progress: 0,
      assignedCrew: newTaskCrew,
      dependencies: [],
      priority: newTaskPriority,
      status: 'Not Started',
      notes: newTaskNotes
    });
    // Reset Form
    setNewTaskName('');
    setNewTaskCrew('');
    setNewTaskNotes('');
    setShowAddForm(false);
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setTempProgress(task.progress);
    setTempStatus(task.status);
    setTempNotes(task.notes || '');
  };

  const saveTaskProgress = (id: string) => {
    onUpdateTaskProgress(id, tempProgress, tempStatus, tempNotes);
    setEditingTaskId(null);
  };

  // Timeline rendering utility (Months from June to November 2026)
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const timelineStart = new Date('2026-06-01').getTime();

  const getTimelinePosition = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    
    // Calculate percentages relative to timeline
    const offsetTime = start - timelineStart;
    const duration = end - start;
    const timelineTotalDuration = new Date('2026-11-30').getTime() - timelineStart;

    const leftPercent = Math.max(0, Math.min(100, (offsetTime / timelineTotalDuration) * 100));
    const widthPercent = Math.max(3, Math.min(100 - leftPercent, (duration / timelineTotalDuration) * 100));

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'Critical':
        return <span className="bg-[#B71C1C]/10 text-[#B71C1C] border border-[#B71C1C]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold">Critical</span>;
      case 'High':
        return <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold">High</span>;
      case 'Medium':
        return <span className="bg-[#1A1A1A]/10 text-[#1A1A1A] border border-[#1A1A1A]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold">Medium</span>;
      case 'Low':
        return <span className="bg-[#7A756C]/10 text-[#7A756C] border border-[#7A756C]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold">Low</span>;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'Complete':
        return <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />;
      case 'In Progress':
        return <Clock className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />;
      case 'Delayed':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />;
      case 'Not Started':
        return <div className="w-3 h-3 border border-[#7A756C] shrink-0" />;
    }
  };

  const getStatusColorClass = (status: Task['status']) => {
    switch (status) {
      case 'Complete': return 'text-[#2E7D32] bg-[#2E7D32]/10 border-[#2E7D32]/20';
      case 'In Progress': return 'text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20';
      case 'Delayed': return 'text-[#B71C1C] bg-[#B71C1C]/10 border-[#B71C1C]/20';
      case 'Not Started': return 'text-[#7A756C] bg-[#F4F1EA] border-[#D1CEC6]';
    }
  };

  return (
    <div className="flex flex-col gap-6" id="gantt-chart-container">
      {/* Search and Filters */}
      <div className="bg-white border border-[#D1CEC6] p-5 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm" id="gantt-controls">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-[#7A756C]" />
            <input
              type="text"
              placeholder="Search tasks, crews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#F4F1EA] border border-[#D1CEC6] pl-10 pr-4 py-2 text-[#1A1A1A] text-xs w-full focus:outline-none focus:border-[#C5A059] font-sans"
              id="gantt-search-input"
            />
          </div>

          {/* Phase Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] text-[#7A756C] uppercase font-sans tracking-widest font-bold hidden sm:inline">Phase:</span>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="bg-[#F4F1EA] border border-[#D1CEC6] px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer w-full sm:w-auto"
              id="gantt-filter-phase"
            >
              <option value="All">All Phases</option>
              <option value="Excavation">Excavation</option>
              <option value="Foundation">Foundation</option>
              <option value="Framing">Framing</option>
              <option value="HVAC/Electrical">HVAC & Elec</option>
              <option value="Finishing">Finishing</option>
              <option value="Exterior">Exterior</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] text-[#7A756C] uppercase font-sans tracking-widest font-bold hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#F4F1EA] border border-[#D1CEC6] px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer w-full sm:w-auto"
              id="gantt-filter-status"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>

        {/* Action Button: PM and Site Supervisor can add tasks */}
        {(userRole === 'ProjectManager' || userRole === 'SiteSupervisor') && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] uppercase tracking-widest font-bold px-5 py-2.5 transition-colors cursor-pointer w-full lg:w-auto justify-center"
            id="btn-show-add-task-form"
          >
            <Plus className="w-4 h-4" />
            <span>Add Schedule Task</span>
          </button>
        )}
      </div>

      {/* Add Task Form Expansion */}
      {showAddForm && (
        <form onSubmit={handleAddNewTask} className="bg-white border border-[#D1CEC6] p-6 shadow-md animate-fade-in" id="add-task-form">
          <h3 className="text-[#1A1A1A] text-xs font-sans uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[#C5A059]" />
            <span>Schedule New Construction Task</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Task Name *</label>
              <input
                type="text"
                required
                value={newTasksName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="e.g. Masonry Structural Lift"
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Construction Phase</label>
              <select
                value={newTaskPhase}
                onChange={(e) => setNewTaskPhase(e.target.value as Task['phase'])}
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer"
              >
                <option value="Excavation">Excavation</option>
                <option value="Foundation">Foundation</option>
                <option value="Framing">Framing</option>
                <option value="HVAC/Electrical">HVAC & Electrical</option>
                <option value="Finishing">Finishing</option>
                <option value="Exterior">Exterior</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Assigned Subcontractor/Crew *</label>
              <input
                type="text"
                required
                value={newTaskCrew}
                onChange={(e) => setNewTaskCrew(e.target.value)}
                placeholder="e.g. Stoneworks Alliance"
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Start Date</label>
              <input
                type="date"
                required
                value={newTaskStart}
                onChange={(e) => setNewTaskStart(e.target.value)}
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">End Date</label>
              <input
                type="date"
                required
                value={newTaskEnd}
                onChange={(e) => setNewTaskEnd(e.target.value)}
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Priority Level</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Path</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-3 flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Scope Notes & Site Pre-requisites</label>
              <input
                type="text"
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                placeholder="Optional pre-requisite, staging plans or crew details..."
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-transparent hover:bg-[#F4F1EA] border border-[#D1CEC6] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] uppercase tracking-widest font-bold px-5 py-2 cursor-pointer"
            >
              Publish Schedule Task
            </button>
          </div>
        </form>
      )}

      {/* Visual Gantt Chart */}
      <div className="bg-white border border-[#D1CEC6] shadow-sm flex flex-col" id="gantt-visual-diagram">
        <div className="p-4 border-b border-[#D1CEC6] bg-[#F4F1EA] flex items-center justify-between">
          <h3 className="text-[#1A1A1A] font-sans font-bold text-sm">Project Timeline Visualization</h3>
          <span className="text-[10px] text-[#C5A059] font-bold uppercase tracking-widest">Today: August 2, 2026</span>
        </div>

        {/* Timeline Header Row */}
        <div className="grid grid-cols-[180px_1fr] md:grid-cols-[260px_1fr] bg-[#E5E2D9] border-b border-[#D1CEC6] h-10 items-center font-sans text-[10px] uppercase tracking-wider text-[#1A1A1A]">
          <div className="pl-4 font-bold border-r border-[#D1CEC6] h-full flex items-center">Construction Task</div>
          <div className="relative w-full h-full flex items-center font-bold">
            {months.map((m, idx) => (
              <div
                key={m}
                className="absolute text-center select-none"
                style={{ left: `${(idx / 6) * 100}%`, width: `${100 / 6}%` }}
              >
                {m}
              </div>
            ))}
            {/* Today marker vertical line */}
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#B71C1C] z-10 w-0"
              style={{ left: '34%' }}
              title="Today Indicator (Aug 2)"
            />
          </div>
        </div>

        {/* Timeline Tasks Rows */}
        <div className="flex flex-col divide-y divide-[#D1CEC6]" id="gantt-chart-bars">
          {filteredTasks.map(task => {
            const barPos = getTimelinePosition(task.startDate, task.endDate);
            const isCompleted = task.status === 'Complete';
            const isInProgress = task.status === 'In Progress';
            const isDelayed = task.status === 'Delayed';

            let barColor = 'bg-[#E5E2D9] border-[#D1CEC6]';
            if (isCompleted) barColor = 'bg-[#2E7D32] border-[#1B5E20] text-white';
            else if (isInProgress) barColor = 'bg-[#C5A059] border-[#A8813E] text-white';
            else if (isDelayed) barColor = 'bg-[#B71C1C] border-[#7F0000] text-white';

            return (
              <div
                key={task.id}
                className="grid grid-cols-[180px_1fr] md:grid-cols-[260px_1fr] min-h-12 items-center hover:bg-[#F4F1EA]/40 transition-colors"
                id={`gantt-row-${task.id}`}
              >
                {/* Left Task Metadata label */}
                <div className="pl-4 pr-2 border-r border-[#D1CEC6] py-2 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(task.status)}
                    <span className="text-[#1A1A1A] text-xs font-sans font-bold truncate max-w-[130px] md:max-w-[200px]" title={task.name}>
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-[#1A1A1A] bg-[#E5E2D9] border border-[#D1CEC6] px-1 uppercase tracking-wider font-bold">{task.phase}</span>
                    <span className="text-[9px] text-[#7A756C] font-sans uppercase font-bold">{task.progress}% Complete</span>
                  </div>
                </div>

                {/* Right timeline bar arena */}
                <div className="relative w-full h-full min-h-12 flex items-center">
                  {/* Grid background dividers */}
                  {[1, 2, 3, 4, 5].map(idx => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-l border-[#D1CEC6]/40"
                      style={{ left: `${(idx / 6) * 100}%` }}
                    />
                  ))}

                  {/* Red today marker line continuation */}
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-dashed border-[#B71C1C]/20 z-10 w-0 pointer-events-none"
                    style={{ left: '34%' }}
                  />

                  {/* Gantt Schedule Bar */}
                  <div
                    className={`absolute h-6 flex items-center pl-2 border shadow-sm transition-all overflow-hidden cursor-pointer ${barColor}`}
                    style={{
                      left: barPos.left,
                      width: barPos.width,
                    }}
                    title={`${task.name} (${task.startDate} to ${task.endDate}) • ${task.progress}% Complete`}
                  >
                    {/* Fill indicating task progress */}
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-white opacity-20 transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                    <span className="text-[9px] font-sans font-bold z-10 truncate pr-1">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task List Grid Details / Ledger Table */}
      <div className="bg-white border border-[#D1CEC6] shadow-sm overflow-hidden" id="gantt-spreadsheet-table">
        <div className="p-4 border-b border-[#D1CEC6] bg-[#F4F1EA] flex items-center justify-between">
          <h3 className="text-[#1A1A1A] font-sans font-bold text-sm">Scheduled Tasks Ledger</h3>
          <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Total: {filteredTasks.length} Entries</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D1CEC6] bg-[#E5E2D9] text-[#1A1A1A] font-sans uppercase tracking-wider text-[10px] font-bold select-none">
                <th className="p-3 pl-4">Task / Assigned Crew</th>
                <th className="p-3">Phase</th>
                <th className="p-3">Timeline Dates</th>
                <th className="p-3 text-center">Priority</th>
                <th className="p-3">Completion & Status</th>
                <th className="p-3">Notes & Staging Scope</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1CEC6]">
              {filteredTasks.map(task => {
                const isEditing = editingTaskId === task.id;
                return (
                  <tr key={task.id} className="hover:bg-[#F4F1EA]/30 transition-all" id={`row-item-${task.id}`}>
                    <td className="p-3 pl-4">
                      <div className="font-sans font-bold text-[#1A1A1A] text-sm">{task.name}</div>
                      <div className="text-[10px] text-[#7A756C] font-sans uppercase tracking-wider mt-0.5">{task.assignedCrew}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-[#F4F1EA] border border-[#D1CEC6] text-[#1A1A1A] font-sans uppercase tracking-widest font-bold text-[9px] px-2.5 py-0.5">
                        {task.phase}
                      </span>
                    </td>
                    <td className="p-3 text-[#7A756C] font-sans text-[10px] whitespace-nowrap">
                      <div>Start: {task.startDate}</div>
                      <div className="mt-0.5">End: {task.endDate}</div>
                    </td>
                    <td className="p-3 text-center">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="p-3 min-w-[150px]">
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 p-2 bg-[#F4F1EA] border border-[#D1CEC6]">
                          <div className="flex items-center justify-between text-[9px] text-[#1A1A1A] font-sans uppercase tracking-wider font-bold px-1">
                            <span>Adjust Progress:</span>
                            <span className="text-[#C5A059]">{tempProgress}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={tempProgress}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setTempProgress(val);
                              if (val === 100) setTempStatus('Complete');
                              else if (val > 0 && tempStatus === 'Not Started') setTempStatus('In Progress');
                            }}
                            className="w-full accent-[#C5A059] cursor-pointer h-1.5 bg-[#E5E2D9]"
                          />
                          <select
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value as Task['status'])}
                            className="bg-white border border-[#D1CEC6] px-1.5 py-1 text-[10px] text-[#1A1A1A] font-sans cursor-pointer focus:outline-none"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Complete">Complete</option>
                            <option value="Delayed">Delayed</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-sans uppercase tracking-widest font-bold px-2 py-0.5 border ${getStatusColorClass(task.status)}`}>
                              {task.status}
                            </span>
                            <span className="text-[#1A1A1A] font-sans font-bold text-[11px]">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-[#E5E2D9] h-1.5 overflow-hidden">
                            <div
                              className="bg-[#C5A059] h-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-[200px]">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Provide updates or reasons..."
                          className="bg-white border border-[#D1CEC6] p-1.5 text-[10px] text-[#1A1A1A] w-full font-sans focus:outline-none focus:border-[#C5A059]"
                        />
                      ) : (
                        <p className="text-[#7A756C] text-[11px] font-sans italic leading-relaxed line-clamp-2 text-justify" title={task.notes || 'No notes specified.'}>
                          {task.notes || <span className="text-[#A89F91] font-sans uppercase tracking-widest text-[9px] font-bold">No notes logged.</span>}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="text-[#7A756C] hover:text-[#1A1A1A] bg-[#E5E2D9] px-2 py-1 text-[10px] uppercase font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveTaskProgress(task.id)}
                            className="text-white bg-[#1A1A1A] hover:bg-[#C5A059] px-2.5 py-1 text-[10px] uppercase font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          {/* PM or Site Supervisor can edit tasks or delete tasks */}
                          {(userRole === 'ProjectManager' || userRole === 'SiteSupervisor') && (
                            <button
                              onClick={() => startEditing(task)}
                              className="text-[#7A756C] hover:text-[#1A1A1A] bg-white hover:bg-[#F4F1EA] border border-[#D1CEC6] p-1.5 transition-all cursor-pointer"
                              title="Edit schedule and notes"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {userRole === 'ProjectManager' && (
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="text-[#B71C1C] hover:text-white bg-white hover:bg-[#B71C1C] border border-[#D1CEC6] p-1.5 transition-all cursor-pointer"
                              title="Delete task from ledger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
