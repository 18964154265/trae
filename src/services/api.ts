// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Project Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  canvasData?: any;
  status: 'active' | 'archived' | 'deleted';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  canvasData?: any;
  status?: 'active' | 'archived' | 'deleted';
}

// Canvas Types
export interface CanvasData {
  id: string;
  projectId: string;
  data: any; // Fabric.js canvas data
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCanvasRequest {
  projectId: string;
  data: any;
}

// AI Types
export interface AIRequest {
  message: string;
  context?: Array<{ role: string; content: string }>;
  projectId?: string;
}

export interface AIResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Knowledge Base Types
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'reference' | 'note';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeRequest {
  title: string;
  content: string;
  type: 'document' | 'reference' | 'note';
}

// HTTP Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Authentication APIs
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  // Project APIs
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Canvas APIs
  async saveCanvas(canvasData: SaveCanvasRequest): Promise<ApiResponse<CanvasData>> {
    return this.request<CanvasData>('/canvas/save', {
      method: 'POST',
      body: JSON.stringify(canvasData),
    });
  }

  async getCanvas(projectId: string): Promise<ApiResponse<CanvasData>> {
    return this.request<CanvasData>(`/canvas/${projectId}`);
  }

  // AI APIs
  async sendAIMessage(request: AIRequest): Promise<ApiResponse<AIResponse>> {
    return this.request<AIResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAISuggestions(projectId: string): Promise<ApiResponse<string[]>> {
    return this.request<string[]>(`/ai/suggestions/${projectId}`);
  }

  // Knowledge Base APIs
  async getKnowledgeItems(): Promise<ApiResponse<KnowledgeItem[]>> {
    return this.request<KnowledgeItem[]>('/knowledge');
  }

  async createKnowledgeItem(itemData: CreateKnowledgeRequest): Promise<ApiResponse<KnowledgeItem>> {
    return this.request<KnowledgeItem>('/knowledge', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async deleteKnowledgeItem(id: string): Promise<ApiResponse> {
    return this.request(`/knowledge/${id}`, {
      method: 'DELETE',
    });
  }

  // RAG APIs (Algorithm Layer)
  async searchKnowledge(query: string): Promise<ApiResponse<KnowledgeItem[]>> {
    return this.request<KnowledgeItem[]>('/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async generateWithRAG(request: AIRequest): Promise<ApiResponse<AIResponse>> {
    return this.request<AIResponse>('/rag/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual API functions for convenience
export const authAPI = {
  login: (credentials: LoginRequest) => apiClient.login(credentials),
  register: (userData: RegisterRequest) => apiClient.register(userData),
  logout: () => apiClient.logout(),
  refreshToken: () => apiClient.refreshToken(),
  getCurrentUser: () => apiClient.getCurrentUser(),
};

export const projectAPI = {
  getProjects: () => apiClient.getProjects(),
  getProject: (id: string) => apiClient.getProject(id),
  createProject: (data: CreateProjectRequest) => apiClient.createProject(data),
  updateProject: (id: string, data: UpdateProjectRequest) => apiClient.updateProject(id, data),
  deleteProject: (id: string) => apiClient.deleteProject(id),
};

export const canvasAPI = {
  saveCanvas: (data: SaveCanvasRequest) => apiClient.saveCanvas(data),
  getCanvas: (projectId: string) => apiClient.getCanvas(projectId),
};

export const aiAPI = {
  sendMessage: (request: AIRequest) => apiClient.sendAIMessage(request),
  getSuggestions: (projectId: string) => apiClient.getAISuggestions(projectId),
  generateWithRAG: (request: AIRequest) => apiClient.generateWithRAG(request),
};

export const knowledgeAPI = {
  getItems: () => apiClient.getKnowledgeItems(),
  createItem: (data: CreateKnowledgeRequest) => apiClient.createKnowledgeItem(data),
  deleteItem: (id: string) => apiClient.deleteKnowledgeItem(id),
  search: (query: string) => apiClient.searchKnowledge(query),
};

export default apiClient;