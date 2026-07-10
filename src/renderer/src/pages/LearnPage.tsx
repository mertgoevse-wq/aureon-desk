/**
 * Aureon Desk — Education Center (Learn Page)
 *
 * Beginner-friendly explanations of Agents, Skills, Tools, MCP, and Prompt Profiles.
 * Includes search, category filters, agent/skill cards, and auto-selection exploration.
 */

import React, { useState, useMemo } from 'react'
import {
  Search, GraduationCap, Bot, Wrench, Plug, FileText,
  BookOpen, Lightbulb, ArrowRight, X, Zap,
  Monitor, Palette, Shield, Bug, GitBranch, Hammer,
  Paintbrush, TestTube, Wand, BarChart, Stethoscope,
  Share2, MessageSquare, MessageCircle, Video, Trash2,
  Package, Download, Image, Play, AlertCircle, CheckSquare,
  FileCode, GitCompare, Server, PlusCircle, Layout, Smartphone
} from 'lucide-react'
import { AGENT_EDUCATION, simulateAutoSelect } from '../../../shared/agent-education'
import type { AgentEducation, AgentCategory } from '../../../shared/agent-education'
import { SKILL_EDUCATION } from '../../../shared/skill-education'
import type { SkillEducation } from '../../../shared/skill-education'

type ViewTab = 'concepts' | 'agents' | 'skills' | 'auto-select'

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare size={16} />,
  Hammer: <Hammer size={16} />,
  Bug: <Bug size={16} />,
  Paintbrush: <Paintbrush size={16} />,
  TestTube: <TestTube size={16} />,
  BookOpen: <BookOpen size={16} />,
  GitBranch: <GitBranch size={16} />,
  Wand: <Wand size={16} />,
  Search: <Search size={16} />,
  BarChart: <BarChart size={16} />,
  Shield: <Shield size={16} />,
  Palette: <Palette size={16} />,
  Monitor: <Monitor size={16} />,
  Stethoscope: <Stethoscope size={16} />,
  Share2: <Share2 size={16} />,
  GraduationCap: <GraduationCap size={16} />,
  Layout: <Layout size={16} />,
  Smartphone: <Smartphone size={16} />,
  PlusCircle: <PlusCircle size={16} />,
  CheckSquare: <CheckSquare size={16} />,
  FileCode: <FileCode size={16} />,
  GitCompare: <GitCompare size={16} />,
  Play: <Play size={16} />,
  MonitorCheck: <Monitor size={16} />,
  Image: <Image size={16} />,
  Download: <Download size={16} />,
  AlertCircle: <AlertCircle size={16} />,
  Zap: <Zap size={16} />,
  Server: <Server size={16} />,
  MessageCircle: <MessageCircle size={16} />,
  Video: <Video size={16} />,
  Trash2: <Trash2 size={16} />,
  Package: <Package size={16} />,
}

const AGENT_CATEGORIES: { id: AgentCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Agents', icon: <Bot size={14} /> },
  { id: 'builder', label: 'Builder', icon: <Hammer size={14} /> },
  { id: 'preview', label: 'Preview', icon: <Monitor size={14} /> },
  { id: 'design', label: 'Design', icon: <Palette size={14} /> },
  { id: 'debugging', label: 'Debug', icon: <Bug size={14} /> },
  { id: 'providers', label: 'Providers', icon: <Zap size={14} /> },
  { id: 'social', label: 'Social', icon: <Share2 size={14} /> },
  { id: 'tutorial', label: 'Tutorial', icon: <GraduationCap size={14} /> },
  { id: 'security', label: 'Security', icon: <Shield size={14} /> },
  { id: 'cleanup', label: 'Cleanup', icon: <Trash2 size={14} /> },
  { id: 'research', label: 'Research', icon: <Search size={14} /> },
  { id: 'docs', label: 'Docs', icon: <BookOpen size={14} /> },
  { id: 'general', label: 'General', icon: <MessageSquare size={14} /> },
]

export function LearnPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<ViewTab>('concepts')
  const [searchQuery, setSearchQuery] = useState('')
  const [agentCategory, setAgentCategory] = useState<AgentCategory | 'all'>('all')
  const [selectedAgent, setSelectedAgent] = useState<AgentEducation | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillEducation | null>(null)

  const filteredAgents = useMemo(() => {
    let result = AGENT_EDUCATION
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.beginnerExplanation.toLowerCase().includes(q) ||
        a.skillsUsed.some(s => s.includes(q)) ||
        a.examplePrompt.toLowerCase().includes(q)
      )
    }
    if (agentCategory !== 'all') {
      result = result.filter(a => a.category.includes(agentCategory))
    }
    return result
  }, [searchQuery, agentCategory])

  const filteredSkills = useMemo(() => {
    if (!searchQuery) return SKILL_EDUCATION
    const q = searchQuery.toLowerCase()
    return SKILL_EDUCATION.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.simpleDescription.toLowerCase().includes(q) ||
      s.examples.some(e => e.toLowerCase().includes(q))
    )
  }, [searchQuery])

  return (
    <div className="flex flex-col h-full bg-[var(--ivory-bg)]" data-testid="learn-page">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--ivory-border)] shrink-0 bg-[var(--ivory-elevated)]/80">
        <h2 className="text-[17px] font-semibold text-[var(--ivory-text)] flex items-center gap-2 select-none">
          <GraduationCap size={18} className="text-[var(--ivory-accent)]" />
          Agent & Skill Education Center
        </h2>
        <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">
          Learn how Aureon uses Agents, Skills, Tools, MCP, and Prompt Profiles to help you build.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-3 border-b border-[var(--ivory-border)] flex items-center gap-1 shrink-0 bg-[var(--ivory-surface)]/30">
        {[
          { id: 'concepts' as const, label: 'Concepts', icon: <Lightbulb size={13} /> },
          { id: 'agents' as const, label: 'Agents', icon: <Bot size={13} /> },
          { id: 'skills' as const, label: 'Skills', icon: <Wrench size={13} /> },
          { id: 'auto-select' as const, label: 'Auto-Selection', icon: <Zap size={13} /> },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12px] font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'text-[var(--ivory-accent)] border-[var(--ivory-accent)] bg-[var(--ivory-bg)]/50'
                : 'text-[var(--ivory-text-3)] border-transparent hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)]/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* === CONCEPTS TAB === */}
        {activeTab === 'concepts' && <ConceptsTab />}

        {/* === AGENTS TAB === */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            {/* Search + filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setAgentCategory('all') }}
                  placeholder="Search agents..."
                  className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AGENT_CATEGORIES.slice(0, 8).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setAgentCategory(cat.id); setSearchQuery('') }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                      agentCategory === cat.id && !searchQuery
                        ? 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] border border-[var(--ivory-accent)]/20'
                        : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] border border-transparent hover:bg-[var(--ivory-surface)]'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">
              {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
              {agentCategory !== 'all' && ` in "${AGENT_CATEGORIES.find(c => c.id === agentCategory)?.label}"`}
            </p>

            {/* Agent cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                />
              ))}
            </div>

            {/* Agent detail */}
            {selectedAgent && (
              <AgentDetail agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
            )}
          </div>
        )}

        {/* === SKILLS TAB === */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[360px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40"
              />
            </div>

            {/* Results count */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">
              {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
            </p>

            {/* Skill cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSkills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
                  className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
                  data-testid="skill-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--ivory-accent)]">{ICON_MAP[skill.icon] || <Wrench size={16} />}</span>
                    <span className="text-[13px] font-semibold text-[var(--ivory-text)]">{skill.name}</span>
                    <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      skill.testStatus === 'tested' ? 'bg-emerald-50 text-emerald-700' :
                      skill.testStatus === 'partial' ? 'bg-amber-50 text-amber-700' :
                      'bg-[var(--ivory-surface)] text-[var(--ivory-text-3)]'
                    }`}>{skill.testStatus}</span>
                  </div>
                  <p className="text-[11px] text-[var(--ivory-text-2)] leading-relaxed line-clamp-2 mb-2">{skill.simpleDescription}</p>
                  <div className="flex flex-wrap gap-1">
                    {skill.examples.slice(0, 1).map((ex, i) => (
                      <span key={i} className="text-[9px] italic text-[var(--ivory-text-3)] px-1.5 py-0.5 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/50">
                        "{ex}"
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Skill detail */}
            {selectedSkill && (
              <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
            )}
          </div>
        )}

        {/* === AUTO-SELECT TAB === */}
        {activeTab === 'auto-select' && <AutoSelectTab />}
      </div>
    </div>
  )
}

/** Concepts tab — simple explanations */
function ConceptsTab(): React.ReactElement {
  const concepts = [
    {
      title: 'What is an Agent?',
      icon: <Bot size={20} className="text-[var(--ivory-accent)]" />,
      description: 'An Agent is like a role or team member. Each agent specializes in a type of work — building code, debugging errors, designing UIs, or writing docs. When you ask Aureon to do something, it picks the right agent for the job.',
      example: 'Builder Agent = your developer. Debugger Agent = your bug fixer. UI Designer Agent = your visual designer.',
    },
    {
      title: 'What is a Skill?',
      icon: <Wrench size={20} className="text-[var(--ivory-accent)]" />,
      description: 'A Skill is a specific ability or workflow. If an Agent is the "who", a Skill is the "what they can do". Skills include things like creating landing pages, generating diffs, starting live previews, or analyzing code.',
      example: '"Create Counter App" is a skill. "Start Live Preview" is a skill. Agents use skills to complete tasks.',
    },
    {
      title: 'What is a Tool?',
      icon: <Plug size={20} className="text-[var(--ivory-accent)]" />,
      description: 'A Tool is an actual action — reading files, writing code, running terminal commands, or making network requests. Tools are the hands that agents and skills use to do real work.',
      example: 'file_read = read a file. file_write = save code. terminal_write = run a command. network_outbound = call an API.',
    },
    {
      title: 'What is MCP?',
      icon: <Server size={20} className="text-[var(--ivory-accent)]" />,
      description: 'MCP (Model Context Protocol) is a way to connect Aureon to external tools and services. It is like a universal adapter — it lets Aureon talk to databases, file systems, and other apps using a standard protocol.',
      example: 'An MCP server for your file system lets Aureon read and write files. An MCP server for a database lets Aureon run SQL queries.',
    },
    {
      title: 'What is a Prompt Profile?',
      icon: <FileText size={20} className="text-[var(--ivory-accent)]" />,
      description: 'A Prompt Profile is a set of instructions that controls how the AI behaves. It defines the style, tone, expertise level, and rules the AI follows when responding.',
      example: '"Expert developer" profile = detailed code with explanations. "Creative writer" profile = engaging prose. "Security auditor" profile = thorough vulnerability checks.',
    },
    {
      title: 'When does Aureon choose which one?',
      icon: <Lightbulb size={20} className="text-[var(--ivory-accent)]" />,
      description: 'When you type a prompt, Aureon analyzes it to understand what you want (intent), then automatically picks the right Agent, Skills, and Tools. It shows you what was selected and why. You can always change the selection.',
      example: 'Typing "Create a todo app" → intent=coding → Agent=Builder → Skills=create-todo-app, generate-file-operations → Tools=file_read, file_write.',
    },
    {
      title: 'What runs locally?',
      icon: <Monitor size={20} className="text-[var(--ivory-accent)]" />,
      description: 'Everything that touches your files runs 100% locally on your machine. File reading, code generation sandbox, and local previews never leave your computer.',
      example: 'Local: reading project files, writing generated code, running the live preview server.',
    },
    {
      title: 'What sends data to providers?',
      icon: <Shield size={20} className="text-[var(--ivory-accent)]" />,
      description: 'Only your prompt text and conversation history are sent to AI providers (like OpenRouter, Anthropic, or Ollama) to generate responses. Your files and code stay local unless you explicitly send them.',
      example: 'Sent to provider: your question and conversation history. NOT sent: your project files, API keys, or local data.',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="concepts-tab">
      {concepts.map((concept, i) => (
        <div key={i} className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center">
              {concept.icon}
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--ivory-text)]">{concept.title}</h3>
          </div>
          <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed mb-3">{concept.description}</p>
          <div className="rounded-xl bg-[var(--ivory-surface)] p-3 border border-[var(--ivory-border)]/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Example</span>
            <p className="text-[11px] text-[var(--ivory-text-2)] italic">{concept.example}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Agent card */
function AgentCard({ agent, isSelected, onClick }: { agent: AgentEducation; isSelected: boolean; onClick: () => void }): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 shadow-[var(--shadow-sm)] transition-all cursor-pointer ${
        isSelected
          ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)]/30 ring-1 ring-[var(--ivory-accent)]/10'
          : 'border-[var(--ivory-border)] bg-[var(--ivory-elevated)] hover:shadow-[var(--shadow-md)]'
      }`}
      data-testid="agent-card"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[var(--ivory-accent)]">{ICON_MAP[agent.icon] || <Bot size={16} />}</span>
        <span className="text-[13px] font-semibold text-[var(--ivory-text)]">{agent.name}</span>
        {agent.isDestructive && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 ml-auto">Elevated</span>
        )}
      </div>
      <p className="text-[11px] text-[var(--ivory-text-2)] leading-relaxed line-clamp-3">{agent.beginnerExplanation}</p>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--ivory-border)]/30">
        <span className="text-[10px] font-semibold text-[var(--ivory-accent)] flex items-center gap-1">
          <ArrowRight size={10} />
          Try: "{agent.examplePrompt.slice(0, 60)}..."
        </span>
      </div>
    </div>
  )
}

/** Agent detail panel */
function AgentDetail({ agent, onClose }: { agent: AgentEducation; onClose: () => void }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-[var(--ivory-accent)]/20 bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]" data-testid="agent-detail">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--ivory-accent)]">{ICON_MAP[agent.icon] || <Bot size={18} />}</span>
          <h3 className="text-[15px] font-semibold text-[var(--ivory-text)]">{agent.name}</h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] cursor-pointer"><X size={14} /></button>
      </div>

      <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed mb-4">{agent.beginnerExplanation}</p>

      <div className="space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">When to Use</span>
          <p className="text-[11px] text-[var(--ivory-text-2)]">{agent.whenToUse}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Skills Used</span>
            <div className="flex flex-wrap gap-1">
              {agent.skillsUsed.map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded-full bg-[var(--ivory-surface)] text-[9px] font-medium text-[var(--ivory-text-3)] border border-[var(--ivory-border)]/60">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Permissions</span>
            <div className="flex flex-wrap gap-1">
              {agent.permissions.map(p => (
                <span key={p} className="px-1.5 py-0.5 rounded-full bg-[var(--ivory-surface)] text-[9px] font-medium text-[var(--ivory-text-3)] border border-[var(--ivory-border)]/60">{p}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Example Prompt</span>
          <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3">
            <p className="text-[11px] font-mono text-[var(--ivory-text-2)] italic">"{agent.examplePrompt}"</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Skill detail panel */
function SkillDetail({ skill, onClose }: { skill: SkillEducation; onClose: () => void }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-[var(--ivory-accent)]/20 bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]" data-testid="skill-detail">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--ivory-accent)]">{ICON_MAP[skill.icon] || <Wrench size={18} />}</span>
          <h3 className="text-[15px] font-semibold text-[var(--ivory-text)]">{skill.name}</h3>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] cursor-pointer"><X size={14} /></button>
      </div>

      <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed mb-4">{skill.simpleDescription}</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Inputs</span>
          <ul className="space-y-0.5">
            {skill.inputFields.map(f => (
              <li key={f} className="text-[10px] text-[var(--ivory-text-2)]">• {f}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Output</span>
          <span className="text-[11px] font-semibold text-[var(--ivory-accent)] px-2 py-0.5 rounded-full bg-[var(--ivory-accent-light)] border border-[var(--ivory-accent)]/20">{skill.outputArtifactType}</span>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Examples</span>
        {skill.examples.map((ex, i) => (
          <p key={i} className="text-[11px] text-[var(--ivory-text-2)] italic">"{ex}"</p>
        ))}
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Permissions</span>
        <div className="flex flex-wrap gap-1">
          {skill.requiredPermissions.map(p => (
            <span key={p} className="px-1.5 py-0.5 rounded-full bg-[var(--ivory-surface)] text-[9px] font-medium text-[var(--ivory-text-3)] border border-[var(--ivory-border)]/60">{p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Auto-select explanation tab */
function AutoSelectTab(): React.ReactElement {
  const [examplePrompt, setExamplePrompt] = useState('Create a todo app with React')
  const [showResult, setShowResult] = useState(false)

  // Simulates what the routing engine would do
  const simulatedRoute = useMemo(() => simulateAutoSelect(examplePrompt, SKILL_EDUCATION), [examplePrompt])

  const examples = [
    'Create a todo app with React',
    'Build a landing page for my SaaS',
    "I'm getting a CORS error in my API",
    'Start the live preview server',
    'Design a dark mode for my app',
    'Write a YouTube description for my tutorial',
    'Clean up dead code in this project',
    'Test my OpenRouter API connection',
  ]

  return (
    <div className="max-w-2xl" data-testid="auto-select-tab">
      <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed mb-4">
        Aureon automatically selects the best Agent and Skill for your prompt. Type an example below or click one of the suggestions to see how auto-selection works.
      </p>

      {/* Example prompt input */}
      <div className="mb-4">
        <textarea
          value={examplePrompt}
          onChange={e => { setExamplePrompt(e.target.value); setShowResult(true) }}
          className="w-full p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[12px] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40 resize-none h-20"
          placeholder="Type anything — Aureon will show which agent and skill it picks..."
        />
      </div>

      {/* Example suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {examples.map(ex => (
          <button
            key={ex}
            type="button"
            onClick={() => { setExamplePrompt(ex); setShowResult(true) }}
            className="px-2.5 py-1 rounded-full border border-[var(--ivory-border)] text-[10px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Auto-selection result */}
      {showResult && (
        <div className="rounded-2xl border border-[var(--ivory-accent)]/20 bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)] space-y-4" data-testid="auto-select-result">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[var(--ivory-accent)]" />
            <span className="text-[14px] font-semibold text-[var(--ivory-text)]">Auto-Selection Result</span>
          </div>

          {/* Selected Agent */}
          <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--ivory-accent)]">{ICON_MAP[simulatedRoute.agent.icon]}</span>
              <span className="text-[13px] font-semibold text-[var(--ivory-text)]">Agent: {simulatedRoute.agent.name}</span>
              <button type="button" className="ml-auto text-[10px] font-semibold text-[var(--ivory-accent)] hover:underline cursor-pointer">Change agent</button>
            </div>
            <p className="text-[11px] text-[var(--ivory-text-2)] mb-2"><strong>Why:</strong> {simulatedRoute.agent.whenToUse}</p>
            <div className="flex flex-wrap gap-1">
              {simulatedRoute.agent.permissions.map(p => (
                <span key={p} className="px-1.5 py-0.5 rounded-full bg-[var(--ivory-bg)] text-[9px] font-medium text-[var(--ivory-text-3)] border border-[var(--ivory-border)]/60">🔒 {p}</span>
              ))}
            </div>
          </div>

          {/* Selected Skill */}
          <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--ivory-accent)]">{ICON_MAP[simulatedRoute.skill.icon]}</span>
              <span className="text-[13px] font-semibold text-[var(--ivory-text)]">Skill: {simulatedRoute.skill.name}</span>
            </div>
            <p className="text-[11px] text-[var(--ivory-text-2)] mb-2">{simulatedRoute.skill.simpleDescription}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Output: <span className="text-[var(--ivory-accent)]">{simulatedRoute.skill.outputArtifactType}</span></span>
          </div>

          {/* Selection summary */}
          <div className="rounded-xl bg-amber-50/40 border border-amber-200/30 p-3">
            <div className="flex gap-2 items-start">
              <Lightbulb size={13} className="text-amber-600/70 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-amber-800/80">
                <span className="font-semibold">Auto-selection logic:</span> Aureon analyzed your prompt for keywords, matched them to the "{simulatedRoute.agent.name}" agent, and selected the "{simulatedRoute.skill.name}" skill. {simulatedRoute.agent.isDestructive ? '⚠️ This agent has destructive capabilities — confirm before proceeding.' : '✅ Safe to run — no destructive operations.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
