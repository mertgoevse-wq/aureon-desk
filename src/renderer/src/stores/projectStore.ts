import { create } from 'zustand'
import type { ProjectRow } from '@shared/types/project'

interface ProjectStore {
  projects: ProjectRow[]
  activeProject: ProjectRow | null
  setProjects: (projects: ProjectRow[]) => void
  setActiveProject: (project: ProjectRow | null) => void
  addProject: (project: ProjectRow) => void
  updateProject: (id: string, updates: Partial<ProjectRow>) => void
  removeProject: (id: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProject: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    activeProject: state.activeProject?.id === id
      ? { ...state.activeProject, ...updates }
      : state.activeProject
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    activeProject: state.activeProject?.id === id ? null : state.activeProject
  }))
}))
