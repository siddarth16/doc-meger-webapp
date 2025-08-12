import { DocumentFile, MergeOptions, ProcessingJob } from './document';

export interface DocumentStore {
  // State
  documents: DocumentFile[];
  mergeOptions: MergeOptions;
  currentJob: ProcessingJob | null;
  isProcessing: boolean;
  
  // Actions
  addDocuments: (files: File[]) => Promise<void>;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
  updateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  reorderDocuments: (sourceIndex: number, destinationIndex: number) => void;
  
  // Merge Options
  setMergeOptions: (options: Partial<MergeOptions>) => void;
  resetMergeOptions: () => void;
  
  // Processing
  startProcessing: () => Promise<void>;
  cancelProcessing: () => void;
  updateProgress: (progress: number) => void;
  
  // Utilities
  getSupportedFormats: () => string[];
  validateFiles: (files: File[]) => { valid: File[]; invalid: File[]; errors: string[] };
}

export interface UIStore {
  // UI State
  activeTab: 'upload' | 'merge' | 'preview' | 'export';
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  
  // Modals
  showPreview: boolean;
  previewDocument: DocumentFile | null;
  showSettings: boolean;
  showHelp: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Actions
  setActiveTab: (tab: 'upload' | 'merge' | 'preview' | 'export') => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  
  // Modals
  openPreview: (document: DocumentFile) => void;
  closePreview: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  duration?: number;
}