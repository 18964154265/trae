import { create } from 'zustand';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../services/api';
import { projectAPI } from '../services/api';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>((set) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Actions
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await projectAPI.getProjects();
      
      if (response.success && response.data) {
        // 确保 response.data 是数组类型
        const projects = Array.isArray(response.data) ? response.data : [];
        set({
          projects: projects,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          projects: [], // 确保失败时也设置为空数组
          isLoading: false,
          error: response.error || '获取项目列表失败',
        });
      }
    } catch (error) {
      set({
        projects: [], // 确保异常时也设置为空数组
        isLoading: false,
        error: error instanceof Error ? error.message : '获取项目列表失败',
      });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await projectAPI.getProject(id);
      
      if (response.success && response.data) {
        set({
          currentProject: response.data,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || '获取项目详情失败',
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '获取项目详情失败',
      });
    }
  },

  createProject: async (data: CreateProjectRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await projectAPI.createProject(data);
      
      if (response.success && response.data) {
        set((state) => ({
          projects: [response.data, ...state.projects],
          currentProject: response.data,
          isLoading: false,
          error: null,
        }));
        
        return response.data;
      } else {
        set({
          isLoading: false,
          error: response.error || '创建项目失败',
        });
        return null;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '创建项目失败',
      });
      return null;
    }
  },

  updateProject: async (id: string, data: UpdateProjectRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await projectAPI.updateProject(id, data);
      
      if (response.success && response.data) {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? response.data : p
          ),
          currentProject: state.currentProject?.id === id ? response.data : state.currentProject,
          isLoading: false,
          error: null,
        }));
        
        return response.data;
      } else {
        set({
          isLoading: false,
          error: response.error || '更新项目失败',
        });
        return null;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '更新项目失败',
      });
      return null;
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await projectAPI.deleteProject(id);
      
      if (response.success) {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          isLoading: false,
          error: null,
        }));
        
        return true;
      } else {
        set({
          isLoading: false,
          error: response.error || '删除项目失败',
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '删除项目失败',
      });
      return false;
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  },
}));