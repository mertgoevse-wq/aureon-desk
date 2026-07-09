import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FolderOpen, Plus, Search, Trash2, Archive, RotateCcw,
  ChevronRight, ChevronDown, File, Folder,
  Settings, Shield, AlertTriangle, BookOpen, Wrench, Zap, Eye, Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { Badge } from '../components/shared/Badge'
import { Modal } from '../components/shared/Modal'
import { useIpc } from '../hooks/useIpc'
import type { ProjectRow, FileTreeNode, ProjectFileContext, ProjectContext } from '@shared/types/project'

interface ProjectForm {
  name: string
  description: string
  instructions: string
  root_path: string
  default_provider_id: string
  default_model: string
  default_system_prompt_id: string
  enabled_skill_ids: string[]
}

const EMPTY_FORM: ProjectForm = {
  name: '', description: '', instructions: '', root_path: '',
  default_provider_id: '', default_model: '', default_system_prompt_id: '',
  enabled_skill_ids: []
}

export function ProjectsPage(): React.ReactElement {
  const api = useIpc()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // File tree state
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showContext, setShowContext] = useState(false)
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null)
  const [contextLoading, setContextLoading] = useState(false)

  // System prompts for dropdown
  const [prompts, setPrompts] = useState<Array<{ id: string; name: string }>>([])
  // Providers for dropdown
  const [providers, setProviders] = useState<Array<{ id: string; name: string; models: Array<{ id: string; display_name: string }> }>>([])

  useEffect(() => { loadProjects(); loadDropdownOptions() }, [])

  const loadProjects = useCallback(async () => {
    const projs = await api.projectList(false, searchTerm || undefined)
    setProjects(projs)
  }, [api, searchTerm])

  const loadDropdownOptions = useCallback(async () => {
    try {
      const [p, provs] = await Promise.all([
        api.systemPromptList(false),
        api.providerList()
      ])
      setPrompts(p.map((sp: any) => ({ id: sp.id, name: sp.name })))
      setProviders(provs.map((pv: any) => ({
        id: pv.id,
        name: pv.name,
        models: (pv.models || []).map((m: any) => ({ id: m.id, display_name: m.display_name }))
      })))
    } catch { /* dropdowns optional */ }
  }, [api])

  const loadFileTree = useCallback(async (rootPath: string) => {
    if (!rootPath) { setFileTree([]); return }
    const tree = await api.projectGetFileTree(rootPath)
    setFileTree(tree)
    setExpandedDirs(new Set())
    setSelectedFiles(new Set())
  }, [api])

  // Select a project
  const handleSelectProject = useCallback(async (project: ProjectRow) => {
    setSelectedProject(project)
    setEditMode(false)
    setForm({
      name: project.name,
      description: project.description || '',
      instructions: project.instructions || '',
      root_path: project.root_path || '',
      default_provider_id: project.default_provider_id || '',
      default_model: project.default_model || '',
      default_system_prompt_id: project.default_system_prompt_id || '',
      enabled_skill_ids: project.enabled_skill_ids ? JSON.parse(project.enabled_skill_ids) : []
    })
    loadFileTree(project.root_path || '')
  }, [loadFileTree])

  // Create project
  const handleCreate = useCallback(async () => {
    if (!form.name.trim()) { setFormError('Project name is required'); return }
    setSaving(true)
    setFormError(null)
    try {
      const created = await api.projectCreate({
        name: form.name.trim(),
        description: form.description || undefined,
        instructions: form.instructions || undefined,
        root_path: form.root_path || undefined,
        default_provider_id: form.default_provider_id || undefined,
        default_model: form.default_model || undefined,
        default_system_prompt_id: form.default_system_prompt_id || undefined,
        enabled_skill_ids: form.enabled_skill_ids.length > 0 ? form.enabled_skill_ids : undefined
      })
      setShowCreateForm(false)
      setForm(EMPTY_FORM)
      loadProjects()
      handleSelectProject(created)
    } catch (err) { setFormError(String(err)) }
    finally { setSaving(false) }
  }, [form, api, loadProjects, handleSelectProject])

  // Update project
  const handleUpdate = useCallback(async () => {
    if (!selectedProject) return
    setSaving(true)
    setFormError(null)
    try {
      await api.projectUpdate(selectedProject.id, {
        name: form.name.trim(),
        description: form.description || undefined,
        instructions: form.instructions || undefined,
        root_path: form.root_path || undefined,
        default_provider_id: form.default_provider_id || undefined,
        default_model: form.default_model || undefined,
        default_system_prompt_id: form.default_system_prompt_id || undefined,
        enabled_skill_ids: form.enabled_skill_ids.length > 0 ? form.enabled_skill_ids : undefined
      })
      setEditMode(false)
      loadProjects()
      setSelectedProject(prev => prev ? { ...prev, ...form, enabled_skill_ids: JSON.stringify(form.enabled_skill_ids) } : null)
    } catch (err) { setFormError(String(err)) }
    finally { setSaving(false) }
  }, [form, selectedProject, api, loadProjects])

  // Archive / Delete
  const handleArchive = useCallback(async (id: string) => {
    await api.projectArchive(id)
    setSelectedProject(null)
    loadProjects()
  }, [api, loadProjects])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Permanently delete this project? This cannot be undone.')) return
    await api.projectDelete(id)
    setSelectedProject(null)
    loadProjects()
  }, [api, loadProjects])

  const handleRestore = useCallback(async (id: string) => {
    await api.projectRestore(id)
    loadProjects()
  }, [api, loadProjects])

  // Select folder
  const handleSelectFolder = useCallback(async () => {
    const folderPath = await api.projectSelectFolder()
    if (folderPath) {
      setForm(prev => ({ ...prev, root_path: folderPath }))
      if (selectedProject && !editMode) {
        await api.projectUpdate(selectedProject.id, { root_path: folderPath })
        setSelectedProject(prev => prev ? { ...prev, root_path: folderPath } : null)
      }
      loadFileTree(folderPath)
    }
  }, [api, selectedProject, editMode, loadFileTree])

  // File tree interactions
  const toggleDir = useCallback((dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }, [])

  const toggleFileSelect = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(filePath)) next.delete(filePath)
      else next.add(filePath)
      return next
    })
  }, [])

  const handleBuildContext = useCallback(async () => {
    if (!selectedProject || selectedFiles.size === 0) return
    setContextLoading(true)
    try {
      const ctx = await api.projectGetContext(selectedProject.id, [...selectedFiles])
      setProjectContext(ctx)
      setShowContext(true)
    } catch (err) { console.error(err) }
    finally { setContextLoading(false) }
  }, [api, selectedProject, selectedFiles])

  // Compute models for selected provider
  const availableModels = useMemo(() => {
    if (!form.default_provider_id) return []
    const prov = providers.find(p => p.id === form.default_provider_id)
    return prov?.models || []
  }, [form.default_provider_id, providers])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ivory-border)]">
        <div>
          <h1 className="text-xl font-semibold display-text">Projects</h1>
          <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">Organize work with local folders, instructions, and defaults.</p>
        </div>
        <Button size="sm" onClick={() => { setShowCreateForm(true); setEditMode(false); setForm(EMPTY_FORM) }}>
          <Plus size={14} /> New Project
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Project List */}
        <div className="w-64 border-r border-[var(--ivory-border)] flex flex-col">
          <div className="p-3 border-b border-[var(--ivory-border)]">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <FolderOpen size={28} className="text-[var(--ivory-text-3)] mb-3" strokeWidth={1.5} />
                <p className="text-sm text-[var(--ivory-text-2)] font-medium mb-1">No projects yet</p>
                <p className="text-xs text-[var(--ivory-text-3)]">Create a project to organize your work.</p>
              </div>
            ) : (
              projects.map(project => (
                <button
                  type="button"
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--ivory-border)] transition-colors hover:bg-[var(--ivory-surface-2)] ${
                    selectedProject?.id === project.id ? 'bg-[var(--ivory-surface-2)] border-l-2 border-l-[var(--ivory-accent)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen size={14} className="text-[var(--ivory-text-3)]" />
                    <span className="text-sm font-semibold truncate">{project.name}</span>
                    {project.archived === 1 && <Badge variant="warning" size="sm">Archived</Badge>}
                  </div>
                  {project.description && (
                    <p className="text-xs text-[var(--ivory-text-3)] mt-0.5 truncate">{project.description}</p>
                  )}
                  <p className="text-[10px] text-[var(--ivory-text-3)] mt-1">
                    {project.root_path ? '📁 Local folder' : '📝 Instructions only'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center: Project Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedProject ? (
            <>
              {/* Project Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)]">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{selectedProject.name}</h2>
                  {selectedProject.archived === 1 && <Badge variant="warning" size="sm">Archived</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}>
                    <Settings size={14} /> {editMode ? 'Done' : 'Edit'}
                  </Button>
                  {selectedProject.archived === 1 ? (
                    <Button variant="ghost" size="sm" onClick={() => handleRestore(selectedProject.id)}>
                      <RotateCcw size={14} /> Restore
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleArchive(selectedProject.id)}>
                      <Archive size={14} /> Archive
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedProject.id)}>
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </div>

              {editMode ? (
                /* Edit Form */
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <ProjectEditForm
                    form={form} setForm={setForm}
                    prompts={prompts} providers={providers}
                    availableModels={availableModels}
                    formError={formError} saving={saving}
                    onSelectFolder={handleSelectFolder}
                    onSave={handleUpdate}
                    onCancel={() => { setEditMode(false); setFormError(null) }}
                  />
                </div>
              ) : (
                /* View Mode */
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Description */}
                  {selectedProject.description && (
                    <Section title="Description" icon={<BookOpen size={12} />}>
                      <p className="text-sm text-[var(--ivory-text-2)]">{selectedProject.description}</p>
                    </Section>
                  )}

                  {/* Instructions */}
                  <Section title="Project Instructions" icon={<Shield size={12} />}>
                    {selectedProject.instructions ? (
                      <pre className="text-xs text-[var(--ivory-text-2)] whitespace-pre-wrap bg-[var(--ivory-bg)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] max-h-48 overflow-y-auto">
                        {selectedProject.instructions}
                      </pre>
                    ) : (
                      <p className="text-xs text-[var(--ivory-text-3)] italic">No instructions set.</p>
                    )}
                  </Section>

                  {/* Defaults */}
                  <Section title="Defaults" icon={<Settings size={12} />}>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <DefaultsRow label="Provider" value={providers.find(p => p.id === selectedProject.default_provider_id)?.name || 'None'} />
                      <DefaultsRow label="Model" value={availableModels.find(m => m.id === selectedProject.default_model)?.display_name || 'None'} />
                      <DefaultsRow label="System Prompt" value={prompts.find(p => p.id === selectedProject.default_system_prompt_id)?.name || 'None'} />
                    </div>
                  </Section>

                  {/* File Tree */}
                  <Section title={`Local Files${selectedProject.root_path ? ` — ${selectedProject.root_path}` : ''}`} icon={<FolderOpen size={12} />}>
                    {selectedProject.root_path ? (
                      fileTree.length > 0 ? (
                        <div className="space-y-0.5 max-h-64 overflow-y-auto">
                          {fileTree.map(node => (
                            <FileTreeNodeComponent
                              key={node.path}
                              node={node}
                              depth={0}
                              expandedDirs={expandedDirs}
                              selectedFiles={selectedFiles}
                              onToggleDir={toggleDir}
                              onToggleFile={toggleFileSelect}
                            />
                          ))}
                          {selectedFiles.size > 0 && (
                            <div className="pt-2 flex items-center gap-2">
                              <span className="text-xs text-[var(--ivory-text-3)]">{selectedFiles.size} file(s) selected</span>
                              <Button size="sm" onClick={handleBuildContext} disabled={contextLoading}>
                                <Eye size={12} /> {contextLoading ? 'Loading...' : 'Preview Context'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-6 text-center">
                          <p className="text-xs text-[var(--ivory-text-3)]">Loading file tree...</p>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-[var(--ivory-text-3)] italic">No local folder selected. Edit the project to add one.</p>
                    )}
                  </Section>

                  {/* Context Preview */}
                  {showContext && projectContext && (
                    <Section title="Project Context Preview" icon={<Eye size={12} />}>
                      <div className="space-y-3">
                        {projectContext.warnings.length > 0 && (
                          <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning-bg)]">
                            {projectContext.warnings.map((w, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px] text-[var(--ivory-warning)]">
                                <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-[var(--ivory-text-2)]">
                          Total: {projectContext.selectedFiles.length} files, {(projectContext.totalSize / 1024).toFixed(1)}KB
                        </p>
                        <div className="space-y-1.5 max-h-60 overflow-y-auto">
                          {projectContext.selectedFiles.map(f => (
                            <div key={f.path}
                              className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-bg)] border border-[var(--ivory-border)]"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <File size={10} className="text-[var(--ivory-text-3)]" />
                                <span className="text-xs font-mono font-medium text-[var(--ivory-text)] break-all">
                                  {f.path.split(/[/\\]/).pop()}
                                </span>
                                <span className="text-[10px] text-[var(--ivory-text-3)]">({(f.size / 1024).toFixed(1)}KB)</span>
                              </div>
                              {f.warnings.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                                  <AlertTriangle size={10} /> {f.warnings.join(', ')}
                                </div>
                              )}
                              {f.content && (
                                <pre className="text-[10px] text-[var(--ivory-text-3)] mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
                                  {f.content.slice(0, 500)}{f.content.length > 500 ? '...' : ''}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </>
          ) : (
            /* No project selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <FolderOpen size={48} className="text-[var(--ivory-text-3)] mb-4" strokeWidth={1} />
              <h2 className="text-lg font-semibold mb-2">Select or Create a Project</h2>
              <p className="text-sm text-[var(--ivory-text-3)] max-w-xs mb-4">
                Projects let you organize chats with local folders, custom instructions, and default AI settings.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => { setShowCreateForm(true); setForm(EMPTY_FORM) }}>
                  <Plus size={14} /> New Project
                </Button>
                <button type="button" onClick={() => navigate('/vibe')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ivory-accent-light)] hover:bg-[var(--ivory-accent)]/12 border border-[var(--ivory-accent)]/15 hover:border-[var(--ivory-accent)]/25 text-xs font-semibold text-[var(--ivory-text)] transition shadow-[var(--shadow-xs)]">
                  <Sparkles size={13} className="text-[var(--ivory-accent)]" />
                  New to coding? Try Vibe Coding
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => { setShowCreateForm(false); setFormError(null) }}
        title="Create Project"
        size="lg"
      >
        <ProjectEditForm
          form={form} setForm={setForm}
          prompts={prompts} providers={providers}
          availableModels={availableModels}
          formError={formError} saving={saving}
          onSelectFolder={handleSelectFolder}
          onSave={handleCreate}
          onCancel={() => { setShowCreateForm(false); setFormError(null) }}
          isCreate
        />
      </Modal>
    </div>
  )
}

// --- Sub-components ---

function Section({ title, icon, children }: {
  title: string; icon: React.ReactElement; children: React.ReactNode
}): React.ReactElement {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h3 className="text-xs font-semibold text-[var(--ivory-text-2)] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function DefaultsRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--ivory-text-3)]">{label}:</span>
      <span className="text-[var(--ivory-text)] font-medium">{value}</span>
    </div>
  )
}

function ProjectEditForm({
  form, setForm, prompts, providers, availableModels,
  formError, saving, onSelectFolder, onSave, onCancel, isCreate = false
}: {
  form: ProjectForm; setForm: React.Dispatch<React.SetStateAction<ProjectForm>>
  prompts: Array<{ id: string; name: string }>
  providers: Array<{ id: string; name: string; models: Array<{ id: string; display_name: string }> }>
  availableModels: Array<{ id: string; display_name: string }>
  formError: string | null; saving: boolean
  onSelectFolder: () => void; onSave: () => void; onCancel: () => void
  isCreate?: boolean
}): React.ReactElement {
  return (
    <>
      <Input
        label="Project Name"
        placeholder="My Project"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Description"
        placeholder="What is this project about?"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
      />
      <div>
        <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1">Root Folder</label>
        <div className="flex gap-2">
          <Input
            placeholder="No folder selected"
            value={form.root_path}
            onChange={e => setForm(f => ({ ...f, root_path: e.target.value }))}
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={onSelectFolder}>
            <FolderOpen size={14} /> Browse
          </Button>
        </div>
        <p className="text-[10px] text-[var(--ivory-text-3)] mt-1">
          Files are read-only by default. Writes require confirmation.
        </p>
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1">Project Instructions</label>
        <textarea
          className="w-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm
            text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)] resize-y min-h-[80px]
            focus:outline-none focus:border-[var(--ivory-accent)] focus:ring-1 focus:ring-[var(--ivory-accent)]"
          placeholder="Instructions that guide the AI's behavior for this project...\n\nThese are included in the system prompt hierarchy at L1 (after global policy, before profile)."
          value={form.instructions}
          onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
        />
      </div>

      {/* Default Provider */}
      <div>
        <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1">Default Provider</label>
        <select
          className="w-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--ivory-text)]"
          value={form.default_provider_id}
          onChange={e => {
            setForm(f => ({ ...f, default_provider_id: e.target.value, default_model: '' }))
          }}
        >
          <option value="">None</option>
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Default Model */}
      {form.default_provider_id && (
        <div>
          <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1">Default Model</label>
          <select
            className="w-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--ivory-text)]"
            value={form.default_model}
            onChange={e => setForm(f => ({ ...f, default_model: e.target.value }))}
          >
            <option value="">None</option>
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Default System Prompt */}
      <div>
        <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1">Default System Prompt Profile</label>
        <select
          className="w-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--ivory-text)]"
          value={form.default_system_prompt_id}
          onChange={e => setForm(f => ({ ...f, default_system_prompt_id: e.target.value }))}
        >
          <option value="">None</option>
          {prompts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Safety notice */}
      <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-warning-bg)] flex items-start gap-1.5 text-xs text-[var(--ivory-warning)]">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
        <span>Project files sent to remote providers will be transmitted to external servers.</span>
      </div>

      {formError && (
        <p className="text-xs text-red-600">{formError}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : isCreate ? 'Create Project' : 'Save Changes'}
        </Button>
      </div>
    </>
  )
}

// --- File Tree Component ---

function FileTreeNodeComponent({
  node, depth, expandedDirs, selectedFiles, onToggleDir, onToggleFile
}: {
  node: FileTreeNode; depth: number;
  expandedDirs: Set<string>; selectedFiles: Set<string>;
  onToggleDir: (path: string) => void; onToggleFile: (path: string) => void;
}): React.ReactElement {
  if (node.isDirectory) {
    const isExpanded = expandedDirs.has(node.path)
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggleDir(node.path)}
          className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-[var(--ivory-surface-2)] text-xs text-[var(--ivory-text-2)]"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Folder size={12} className="text-amber-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children?.map(child => (
          <FileTreeNodeComponent
            key={child.path}
            node={child}
            depth={depth + 1}
            expandedDirs={expandedDirs}
            selectedFiles={selectedFiles}
            onToggleDir={onToggleDir}
            onToggleFile={onToggleFile}
          />
        ))}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onToggleFile(node.path)}
      className="flex items-center gap-1 w-full text-left py-0.5 px-1 rounded hover:bg-[var(--ivory-surface-2)] text-xs"
      style={{ paddingLeft: `${8 + depth * 16}px` }}
    >
      <input
        type="checkbox"
        checked={selectedFiles.has(node.path)}
        onChange={() => onToggleFile(node.path)}
        className="mr-1"
        onClick={e => e.stopPropagation()}
      />
      <File size={12} className="text-[var(--ivory-text-3)]" />
      <span className="truncate text-[var(--ivory-text-2)]">{node.name}</span>
      {node.size !== undefined && (
        <span className="text-[10px] text-[var(--ivory-text-3)] ml-auto">
          {node.size < 1024 ? `${node.size}B` : `${(node.size / 1024).toFixed(1)}KB`}
        </span>
      )}
    </button>
  )
}
