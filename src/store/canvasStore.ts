import { create } from 'zustand';
import { CanvasData, SaveCanvasRequest } from '../services/api';
import { canvasAPI } from '../services/api';

interface CanvasState {
  canvasData: CanvasData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

interface CanvasActions {
  loadCanvas: (projectId: string) => Promise<void>;
  saveCanvas: (data: SaveCanvasRequest) => Promise<boolean>;
  setCanvasData: (data: any) => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
  clearError: () => void;
  clearCanvas: () => void;
}

type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  canvasData: null,
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,

  // Actions
  loadCanvas: async (projectId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await canvasAPI.getCanvas(projectId);
      
      if (response.success && response.data) {
        set({
          canvasData: response.data,
          isLoading: false,
          error: null,
          hasUnsavedChanges: false,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || '加载Canvas数据失败',
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '加载Canvas数据失败',
      });
    }
  },

  saveCanvas: async (data: SaveCanvasRequest) => {
    set({ isSaving: true, error: null });
    
    try {
      const response = await canvasAPI.saveCanvas(data);
      
      if (response.success && response.data) {
        set({
          canvasData: response.data,
          isSaving: false,
          error: null,
          hasUnsavedChanges: false,
        });
        
        return true;
      } else {
        set({
          isSaving: false,
          error: response.error || '保存Canvas数据失败',
        });
        return false;
      }
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : '保存Canvas数据失败',
      });
      return false;
    }
  },

  setCanvasData: (data: any) => {
    set((state) => ({
      canvasData: state.canvasData ? {
        ...state.canvasData,
        data,
      } : null,
      hasUnsavedChanges: true,
    }));
  },

  markAsChanged: () => {
    set({ hasUnsavedChanges: true });
  },

  markAsSaved: () => {
    set({ hasUnsavedChanges: false });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCanvas: () => {
    set({
      canvasData: null,
      hasUnsavedChanges: false,
      error: null,
    });
  },
}));