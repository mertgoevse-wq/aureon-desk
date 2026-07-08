import React, { useState, useEffect } from 'react'
import {
  CalendarClock,
  SendHorizontal,
  Lightbulb,
  SlidersHorizontal,
  LockKeyhole,
  FileText,
  CheckCircle2,
  MessageSquare,
  Code2,
  Play,
  X,
  Clock,
  Terminal,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Plus,
  EyeOff
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Toggle } from '../components/settings/SettingsComponents'

interface TaskItem {
  id: string
  title: string
  status: 'Draft' | 'Ready' | 'Running' | 'Waiting for approval' | 'Completed' | 'Failed'
  created_at: string
  logs: string[]
  pending_approval?: {
    type: 'file_write' | 'shell_command'
    description: string
  }
}

export function CoworkPage(): React.ReactElement {
  const navigate = useNavigate()

  // Task list state
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      title: 'Audit repository visual styles and tokens',
      status: 'Completed',
      created_at: '10 mins ago',
      logs: [
        'Initialized Cowork session.',
        'Analyzing codebase directory structure...',
        'Checking CSS design tokens in tokens.css...',
        'Visual audit completed: No neon styles found. Warm ivory theme is compliant.'
      ]
    }
  ])

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [activeTaskId, setActiveTaskId] = useState<string>('task-1')

  // Safe Permission Toggles (all safe/off by default)
  const [browserUse, setBrowserUse] = useState(false)
  const [computerUse, setComputerUse] = useState(false)
  const [fileSystemAccess, setFileSystemAccess] = useState<'project' | 'readonly' | 'full'>('project')
  const [approveShell, setApproveShell] = useState(false)
  const [networkAccess, setNetworkAccess] = useState<'provider' | 'unrestricted'>('provider')

  // Denied apps configuration (placeholder)
  const deniedApps = ['Slack', 'Discord', 'Steam', 'Google Chrome Passwords', 'Windows Terminal']

  // Find active task
  const activeTask = tasks.find(t => t.id === activeTaskId)

  // Simulation timer
  useEffect(() => {
    const runningTask = tasks.find(t => t.status === 'Running')
    if (!runningTask) return

    const timer = setTimeout(() => {
      // Transition from Running to Waiting for approval
      setTasks(prev =>
        prev.map(t => {
          if (t.id === runningTask.id) {
            return {
              ...t,
              status: 'Waiting for approval',
              logs: [
                ...t.logs,
                'Analyzing routing strategy... routed to Code Architect.',
                'Code Architect proposed updating docs/IMPLEMENTATION_LOG.md with session logs.',
                'Safety Gate: Requesting approval to write file to workspace.'
              ],
              pending_approval: {
                type: 'file_write',
                description: 'Write updated log entry to C:\\Users\\mertg\\Desktop\\code\\docs\\IMPLEMENTATION_LOG.md'
              }
            }
          }
          return t
        })
      )
    }, 2000)

    return () => clearTimeout(timer)
  }, [tasks])

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const tid = `task-${Date.now()}`
    const fresh: TaskItem = {
      id: tid,
      title: newTaskTitle,
      status: 'Ready',
      created_at: 'Just now',
      logs: ['Task created in Ready state. waiting to dispatch...']
    }

    setTasks(prev => [fresh, ...prev])
    setActiveTaskId(tid)
    setNewTaskTitle('')
  }

  const handleStartTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: 'Running',
            logs: [...t.logs, 'Dispatched task execution.', 'Spawning agent environment...']
          }
        }
        return t
      })
    )
  }

  const handleApprove = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: 'Completed',
            pending_approval: undefined,
            logs: [
              ...t.logs,
              'User approved file write operation.',
              'Writing file content... done.',
              'Verification step passed.',
              'Task execution completed successfully.'
            ]
          }
        }
        return t
      })
    )
  }

  const handleReject = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: 'Failed',
            pending_approval: undefined,
            logs: [
              ...t.logs,
              'User rejected file write operation.',
              'Safely aborted task execution to prevent unauthorized changes.',
              'Task aborted.'
            ]
          }
        }
        return t
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="cowork-page">
      <div className="max-w-7xl mx-auto px-6 py-7">
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3">
              <ShieldCheck size={13} className="text-[var(--ivory-accent)]" />
              Safe Co-Working Agent Workspace
            </div>
            <h1 className="text-[30px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">
              Cowork Mode
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--ivory-text-3)]">
              An interactive safe workspace to compose tasks, control agent execution permissions, approve code edits, and review subagent routing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] px-4 text-[12px] font-semibold text-[var(--ivory-text-2)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--ivory-surface)] hover:text-[var(--ivory-text)] focus:outline-none"
            >
              <MessageSquare size={14} />
              Return to Chat
            </button>
            <button
              type="button"
              onClick={() => navigate('/preview')}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] px-4 text-[12px] font-semibold text-[var(--ivory-text-2)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--ivory-surface)] hover:text-[var(--ivory-text)] focus:outline-none"
            >
              <Code2 size={14} />
              Open Live Preview
            </button>
          </div>
        </div>

        {/* 3 Status Categories Row (Scheduled, Dispatch, Ideas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <section className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center">
                <CalendarClock size={16} />
              </div>
              <span className="rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-2 py-0.5 text-[9px] font-bold text-[var(--ivory-text-3)] uppercase tracking-wider">Scheduled</span>
            </div>
            <h3 className="mt-3 text-[13px] font-bold text-[var(--ivory-text)]">Scheduled Routines</h3>
            <p className="mt-1 text-[11px] text-[var(--ivory-text-3)]">No recurring schedules. Trigger via Chat using the /schedule timer.</p>
          </section>

          <section className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center">
                <SendHorizontal size={16} />
              </div>
              <span className="rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-2 py-0.5 text-[9px] font-bold text-[var(--ivory-text-3)] uppercase tracking-wider">Dispatch</span>
            </div>
            <h3 className="mt-3 text-[13px] font-bold text-[var(--ivory-text)]">Agent Dispatch Queue</h3>
            <p className="mt-1 text-[11px] text-[var(--ivory-text-3)]">All background processes run in strict, isolated sandbox worktrees.</p>
          </section>

          <section className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center">
                <Lightbulb size={16} />
              </div>
              <span className="rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-2 py-0.5 text-[9px] font-bold text-[var(--ivory-text-3)] uppercase tracking-wider">Ideas</span>
            </div>
            <h3 className="mt-3 text-[13px] font-bold text-[var(--ivory-text)]">Workspace Ideas</h3>
            <p className="mt-1 text-[11px] text-[var(--ivory-text-3)]">Capture quick templates, requirements, or prompts to pre-fill tasks.</p>
          </section>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Task Creator & List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* New Task Composer */}
            <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--ivory-text)]">New Cowork Task</h2>
                  <p className="text-[11px] text-[var(--ivory-text-3)]">Describe a task for the subagents to plan and execute safely.</p>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <textarea
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Describe what you want the agent to build, test, or review..."
                    className="w-full h-24 p-3.5 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[13px] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40 resize-none leading-relaxed transition-colors shadow-inner"
                    data-testid="cowork-task-composer"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className={`h-9 px-4 inline-flex items-center gap-1.5 rounded-xl text-[12px] font-semibold transition-all shadow-[var(--shadow-sm)]
                      ${newTaskTitle.trim()
                        ? 'bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-dark)] cursor-pointer'
                        : 'bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] cursor-not-allowed border border-[var(--ivory-border)]'}`}
                    data-testid="create-task-btn"
                  >
                    <Plus size={14} />
                    Create Task
                  </button>
                </div>
              </form>
            </section>

            {/* Task list and timeline */}
            <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]">
              <h2 className="text-[15px] font-bold text-[var(--ivory-text)] mb-3">Task Workspace</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
                {/* Task List Selector */}
                <div className="space-y-2 border-r border-[var(--ivory-border)] pr-4 max-h-[350px] overflow-y-auto">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block mb-1">Active Tasks</span>
                  {tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTaskId(t.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all text-xs font-semibold
                        ${t.id === activeTaskId
                          ? 'bg-[var(--ivory-surface)] border-[var(--ivory-accent)]/30 text-[var(--ivory-text)] shadow-[var(--shadow-sm)]'
                          : 'bg-[var(--ivory-bg)] border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                    >
                      <span className="block truncate mb-1.5">{t.title}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase
                        ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${t.status === 'Failed' ? 'bg-rose-100 text-rose-800' : ''}
                        ${t.status === 'Running' ? 'bg-amber-100 text-amber-800 animate-pulse' : ''}
                        ${t.status === 'Waiting for approval' ? 'bg-amber-200 text-amber-900 border border-amber-300' : ''}
                        ${t.status === 'Ready' ? 'bg-blue-100 text-blue-800' : ''}
                        ${t.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Task execution logs & status detail */}
                <div className="space-y-4">
                  {activeTask ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[var(--ivory-border)] pb-2.5">
                        <div>
                          <h3 className="text-[13px] font-bold text-[var(--ivory-text)] leading-snug">{activeTask.title}</h3>
                          <span className="text-[10px] text-[var(--ivory-text-3)]">Created {activeTask.created_at}</span>
                        </div>
                        {activeTask.status === 'Ready' && (
                          <button
                            type="button"
                            onClick={() => handleStartTask(activeTask.id)}
                            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--ivory-accent)] text-white text-[11px] font-semibold hover:bg-[var(--ivory-accent-dark)] transition-colors shadow-[var(--shadow-sm)]"
                          >
                            <Play size={12} fill="white" />
                            Dispatch Task
                          </button>
                        )}
                      </div>

                      {/* Approval Request Gate */}
                      {activeTask.status === 'Waiting for approval' && activeTask.pending_approval && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-[var(--shadow-sm)] space-y-3" data-testid="approval-card">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-[12px] font-bold text-amber-900">Safety Verification Required</h4>
                              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                                The agent wants to execute a file system write operation. Safe permissions are configured to require user approval.
                              </p>
                              <code className="block mt-2 p-2 rounded bg-amber-100 border border-amber-200 text-[10px] text-amber-900 font-mono break-all leading-normal">
                                [{activeTask.pending_approval.type.toUpperCase()}] {activeTask.pending_approval.description}
                              </code>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleReject(activeTask.id)}
                              className="h-7 px-3 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-700 transition-colors"
                              data-testid="reject-task-btn"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(activeTask.id)}
                              className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold text-white transition-colors shadow-[var(--shadow-xs)]"
                              data-testid="approve-task-btn"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Activity Logs Timeline */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block mb-2">Activity timeline & logs</span>
                        <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3.5 font-mono text-[11px] leading-relaxed text-[var(--ivory-text-2)] max-h-60 overflow-y-auto space-y-2.5">
                          {activeTask.logs.map((log, index) => (
                            <div key={index} className="flex gap-2.5 items-start">
                              <Terminal size={12} className="text-[var(--ivory-accent)] shrink-0 mt-0.5" />
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Agent routing preview schema */}
                      <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block mb-2">Agent Routing Strategy</span>
                        <div className="flex items-center gap-2.5 justify-center py-2.5">
                          <div className="px-2.5 py-1.5 rounded-xl bg-white border border-[var(--ivory-border)] shadow-[var(--shadow-xs)] text-center shrink-0">
                            <span className="block text-[10px] font-bold text-[var(--ivory-text)]">Planner</span>
                            <span className="block text-[8px] text-[var(--ivory-text-3)]">Scope Strategy</span>
                          </div>
                          <span className="text-[var(--ivory-border-2)] text-xs font-semibold">➔</span>
                          <div className="px-2.5 py-1.5 rounded-xl bg-white border border-[var(--ivory-border)] shadow-[var(--shadow-xs)] text-center shrink-0">
                            <span className="block text-[10px] font-bold text-[var(--ivory-text)]">Coder</span>
                            <span className="block text-[8px] text-[var(--ivory-text-3)]">Write Edits</span>
                          </div>
                          <span className="text-[var(--ivory-border-2)] text-xs font-semibold">➔</span>
                          <div className="px-2.5 py-1.5 rounded-xl bg-white border border-[var(--ivory-border)] shadow-[var(--shadow-xs)] text-center shrink-0">
                            <span className="block text-[10px] font-bold text-[var(--ivory-text)]">Tester</span>
                            <span className="block text-[8px] text-[var(--ivory-text-3)]">Verify Build</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-[var(--ivory-text-3)] text-xs">
                      Select a task from the list to inspect routing and logs.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Safe Permissions and Shield Settings */}
          <div className="space-y-6">
            
            {/* Safe Permission System Controls */}
            <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                  <LockKeyhole size={18} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--ivory-text)]">Safe Permissions</h2>
                  <p className="text-[11px] text-[var(--ivory-text-3)]">Control what resources subagents can access.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Browser Use (defaults to off/disabled) */}
                <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-[var(--ivory-text)]">Browser Use</span>
                    <Toggle checked={browserUse} onChange={setBrowserUse} dataTestId="toggle-browser-use" />
                  </div>
                  <span className="text-[10px] text-[var(--ivory-text-3)] leading-normal block">
                    Allow the agent to browse and interact with public URLs. (Defaults to Off)
                  </span>
                </div>

                {/* Computer Use (defaults to off/disabled) */}
                <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-[var(--ivory-text)]">Computer Use</span>
                    <Toggle checked={computerUse} onChange={setComputerUse} dataTestId="toggle-computer-use" />
                  </div>
                  <span className="text-[10px] text-[var(--ivory-text-3)] leading-normal block">
                    Allow mouse, keyboard, and display capture routines. (Disabled / Placeheld)
                  </span>
                </div>

                {/* File System Access */}
                <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[var(--ivory-text)]">File System Access</span>
                  </div>
                  <select
                    value={fileSystemAccess}
                    onChange={(e) => setFileSystemAccess(e.target.value as any)}
                    className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[var(--ivory-border)] bg-[var(--ivory-surface)] text-[var(--ivory-text)] focus:outline-none"
                    data-testid="select-fs-access"
                  >
                    <option value="readonly">Read-Only Access</option>
                    <option value="project">Project-Only (Safe Workspace Sandbox)</option>
                    <option value="full">Full Disk Access (Restricted/Prompt)</option>
                  </select>
                  <span className="text-[10px] text-[var(--ivory-text-3)] leading-normal block">
                    Enforces that file writes occur only inside the target workspace directory.
                  </span>
                </div>

                {/* Shell Commands (defaults to off, requires approval) */}
                <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-[var(--ivory-text)]">Shell Commands</span>
                    <Toggle checked={approveShell} onChange={setApproveShell} dataTestId="toggle-shell-commands" />
                  </div>
                  <span className="text-[10px] text-[var(--ivory-text-3)] leading-normal block">
                    Allow execution of terminal commands (requires prompt approval). (Defaults to Off)
                  </span>
                </div>

                {/* Network Access */}
                <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3 space-y-2">
                  <span className="text-[12px] font-bold text-[var(--ivory-text)] block">Network Access</span>
                  <div className="flex items-center gap-4 text-xs font-semibold text-[var(--ivory-text-2)]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="network"
                        checked={networkAccess === 'provider'}
                        onChange={() => setNetworkAccess('provider')}
                        className="accent-[var(--ivory-accent)]"
                        data-testid="radio-network-provider"
                      />
                      Providers-Only
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="network"
                        checked={networkAccess === 'unrestricted'}
                        onChange={() => setNetworkAccess('unrestricted')}
                        className="accent-[var(--ivory-accent)]"
                      />
                      Unrestricted
                    </label>
                  </div>
                  <span className="text-[10px] text-[var(--ivory-text-3)] leading-normal block">
                    Blocks external connections unless verified by the active provider API endpoints.
                  </span>
                </div>

                {/* System Toggles Status */}
                <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3 flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[var(--ivory-text)]">OS System Permissions</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Not requested</span>
                </div>
              </div>
            </section>

            {/* Blocked / Denied Applications list */}
            <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]" data-testid="denied-apps-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                  <EyeOff size={18} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--ivory-text)]">Denied Applications</h2>
                  <p className="text-[11px] text-[var(--ivory-text-3)]">Processes that agents cannot inspect or touch.</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {deniedApps.map((app) => (
                  <div key={app} className="flex items-center justify-between rounded-xl bg-[var(--ivory-bg)] px-3 py-1.5 border border-[var(--ivory-border)]">
                    <span className="text-[11px] font-semibold text-[var(--ivory-text-2)]">{app}</span>
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wide">Blocked</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
