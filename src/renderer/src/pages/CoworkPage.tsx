import React, { useState, useEffect } from 'react'
import {
  CalendarClock,
  SendHorizontal,
  Lightbulb,
  LockKeyhole,
  FileText,
  Play,
  Terminal,
  AlertTriangle,
  ShieldCheck,
  Plus,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
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

  // Collapsible permissions panel
  const [permsOpen, setPermsOpen] = useState(false)

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

        </div>

        {/* Compact status summary */}
        <div className="flex flex-wrap items-center gap-2 mb-5 text-xs text-[var(--ivory-text-3)]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
            <CalendarClock size={12} className="text-[var(--ivory-accent)]" />
            <span className="font-semibold text-[var(--ivory-text-2)]">Scheduled</span>
            <span className="text-[var(--ivory-text-3)]">None</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
            <SendHorizontal size={12} className="text-[var(--ivory-accent)]" />
            <span className="font-semibold text-[var(--ivory-text-2)]">Dispatch</span>
            <span className="text-[var(--ivory-text-3)]">Idle</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
            <Lightbulb size={12} className="text-[var(--ivory-accent)]" />
            <span className="font-semibold text-[var(--ivory-text-2)]">Ideas</span>
            <span className="text-[var(--ivory-text-3)]">Capture</span>
          </span>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Left Column: Task Creator & List */}
          <div className="space-y-5">
            
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                  <Terminal size={16} />
                </div>
                <h2 className="text-sm font-bold text-[var(--ivory-text)]">Task Workspace</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                {/* Task List Selector */}
                <div className="space-y-1.5 border-r border-[var(--ivory-border)] pr-3 max-h-[300px] overflow-y-auto">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block mb-2">Active Tasks</span>
                  {tasks.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setActiveTaskId(t.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs font-semibold
                        ${t.id === activeTaskId
                          ? 'bg-[var(--ivory-surface)] border-[var(--ivory-accent)]/30 text-[var(--ivory-text)] shadow-[var(--shadow-sm)]'
                          : 'bg-[var(--ivory-bg)] border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                    >
                      <span className="block truncate mb-1">{t.title}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase
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
                <div className="space-y-3">
                  {activeTask ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[var(--ivory-border)] pb-2">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--ivory-text)] leading-snug">{activeTask.title}</h3>
                          <span className="text-xs text-[var(--ivory-text-3)]">Created {activeTask.created_at}</span>
                        </div>
                        {activeTask.status === 'Ready' && (
                          <button
                            type="button"
                            onClick={() => handleStartTask(activeTask.id)}
                            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--ivory-accent)] text-white text-xs font-semibold hover:bg-[var(--ivory-accent-dark)] transition-colors shadow-[var(--shadow-sm)]"
                          >
                            <Play size={12} fill="white" />
                            Dispatch Task
                          </button>
                        )}
                      </div>

                      {/* Approval Request Gate */}
                      {activeTask.status === 'Waiting for approval' && activeTask.pending_approval && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 shadow-[var(--shadow-sm)] space-y-2" data-testid="approval-card">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-xs font-bold text-amber-900">Safety Verification Required</h4>
                              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                                The agent wants to execute a file system write operation. Safe permissions are configured to require user approval.
                              </p>
                              <code className="block mt-1.5 p-1.5 rounded bg-amber-100 border border-amber-200 text-xs text-amber-900 font-mono break-all leading-normal">
                                [{activeTask.pending_approval.type.toUpperCase()}] {activeTask.pending_approval.description}
                              </code>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleReject(activeTask.id)}
                              className="h-7 px-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-colors"
                              data-testid="reject-task-btn"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(activeTask.id)}
                              className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-[var(--shadow-xs)]"
                              data-testid="approve-task-btn"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Activity Logs Timeline */}
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block mb-1.5">Activity Logs</span>
                        <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--ivory-text-2)] max-h-48 overflow-y-auto space-y-2">
                          {activeTask.logs.map((log, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <Terminal size={11} className="text-[var(--ivory-accent)] shrink-0 mt-0.5" />
                              <span>{log}</span>
                            </div>
                          ))}
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

          {/* Right Column: Safe Permissions */}
          <div className="space-y-4">
            
            {/* Safe Permission System Controls — Collapsible */}
            <section className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-md)]">
              <button
                type="button"
                onClick={() => setPermsOpen(!permsOpen)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                    <LockKeyhole size={16} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-[var(--ivory-text)]">Safe Permissions</h3>
                    <p className="text-xs text-[var(--ivory-text-3)]">All off by default</p>
                  </div>
                </div>
                {permsOpen ? <ChevronUp size={14} className="text-[var(--ivory-text-3)]" /> : <ChevronDown size={14} className="text-[var(--ivory-text-3)]" />}
              </button>

              {permsOpen && (
                <div className="mt-3 space-y-2 pt-3 border-t border-[var(--ivory-border)]">
                  {/* Browser Use */}
                  <div className="rounded-xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--ivory-text)]">Browser Use</span>
                      <Toggle checked={browserUse} onChange={setBrowserUse} dataTestId="toggle-browser-use" />
                    </div>
                    <span className="text-xs text-[var(--ivory-text-3)]">Allow browsing public URLs. Defaults to Off.</span>
                  </div>

                  {/* Computer Use */}
                  <div className="rounded-xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--ivory-text)]">Computer Use</span>
                      <Toggle checked={computerUse} onChange={setComputerUse} dataTestId="toggle-computer-use" />
                    </div>
                    <span className="text-xs text-[var(--ivory-text-3)]">Mouse, keyboard, display capture. Placeholder / Disabled.</span>
                  </div>

                  {/* File System */}
                  <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-2.5">
                    <span className="text-xs font-bold text-[var(--ivory-text)] block mb-1">File System Access</span>
                    <select
                      value={fileSystemAccess}
                      onChange={(e) => setFileSystemAccess(e.target.value as any)}
                      className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-[var(--ivory-border)] bg-[var(--ivory-surface)] text-[var(--ivory-text)] focus:outline-none"
                      data-testid="select-fs-access"
                    >
                      <option value="readonly">Read-Only</option>
                      <option value="project">Project-Only (Safe Sandbox)</option>
                      <option value="full">Full Disk (Restricted)</option>
                    </select>
                  </div>

                  {/* Shell Commands */}
                  <div className="rounded-xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--ivory-text)]">Shell Commands</span>
                      <Toggle checked={approveShell} onChange={setApproveShell} dataTestId="toggle-shell-commands" />
                    </div>
                    <span className="text-xs text-[var(--ivory-text-3)]">Terminal execution. Requires approval. Defaults to Off.</span>
                  </div>

                  {/* Network Access */}
                  <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-2.5">
                    <span className="text-xs font-bold text-[var(--ivory-text)] block mb-1">Network Access</span>
                    <div className="flex items-center gap-3 text-xs font-semibold text-[var(--ivory-text-2)]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="network" checked={networkAccess === 'provider'} onChange={() => setNetworkAccess('provider')} className="accent-[var(--ivory-accent)]" data-testid="radio-network-provider" />
                        Providers-Only
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="network" checked={networkAccess === 'unrestricted'} onChange={() => setNetworkAccess('unrestricted')} className="accent-[var(--ivory-accent)]" />
                        Unrestricted
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Denied Applications */}
            <section className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-md)]" data-testid="denied-apps-card">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                  <EyeOff size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--ivory-text)]">Denied Apps</h3>
                  <p className="text-xs text-[var(--ivory-text-3)]">Agents cannot inspect these processes.</p>
                </div>
              </div>
              <div className="space-y-1">
                {deniedApps.map((app) => (
                  <div key={app} className="flex items-center justify-between rounded-lg bg-[var(--ivory-bg)] px-2.5 py-1.5 border border-[var(--ivory-border)]">
                    <span className="text-xs font-semibold text-[var(--ivory-text-2)]">{app}</span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wide">Blocked</span>
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
