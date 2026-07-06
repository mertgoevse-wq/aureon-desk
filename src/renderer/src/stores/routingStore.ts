import { create } from 'zustand'
import type { AnalyzePromptOutput, AgentDefinition, SkillDefinition, SubagentPlan } from '@shared/types/routing'

interface RoutingState {
  currentAnalysis: AnalyzePromptOutput | null
  analysisHistory: AnalyzePromptOutput[]
  isLoading: boolean
  error: string | null

  // Inspector overrides
  overrideAgent: AgentDefinition | null
  overrideSkills: SkillDefinition[]
  overrideSystemPromptId: string | null

  setCurrentAnalysis: (analysis: AnalyzePromptOutput | null) => void
  addToHistory: (analysis: AnalyzePromptOutput) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOverrideAgent: (agent: AgentDefinition | null) => void
  setOverrideSkills: (skills: SkillDefinition[]) => void
  setOverrideSystemPromptId: (id: string | null) => void
  clearAnalysis: () => void
  clearHistory: () => void
}

export const useRoutingStore = create<RoutingState>((set) => ({
  currentAnalysis: null,
  analysisHistory: [],
  isLoading: false,
  error: null,
  overrideAgent: null,
  overrideSkills: [],
  overrideSystemPromptId: null,

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  addToHistory: (analysis) => set((state) => ({
    analysisHistory: [...state.analysisHistory.slice(-49), analysis] // Keep last 50
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setOverrideAgent: (agent) => set({ overrideAgent: agent }),
  setOverrideSkills: (skills) => set({ overrideSkills: skills }),
  setOverrideSystemPromptId: (id) => set({ overrideSystemPromptId: id }),
  clearAnalysis: () => set({ currentAnalysis: null, error: null }),
  clearHistory: () => set({ analysisHistory: [] }),
}))
