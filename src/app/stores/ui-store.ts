import { create } from 'zustand';
import { DocumentFile, Notification } from '@/app/types';

interface UIStore {
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

function generateNotificationId(): string {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial State
  activeTab: 'upload',
  sidebarOpen: false,
  theme: 'dark',
  
  // Modals
  showPreview: false,
  previewDocument: null,
  showSettings: false,
  showHelp: false,

  // Notifications
  notifications: [],

  // Actions
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setTheme: (theme) => {
    set({ theme });
    // Update CSS custom properties
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  // Modals
  openPreview: (document) => {
    set({ showPreview: true, previewDocument: document });
  },

  closePreview: () => {
    set({ showPreview: false, previewDocument: null });
  },

  openSettings: () => {
    set({ showSettings: true });
  },

  closeSettings: () => {
    set({ showSettings: false });
  },

  openHelp: () => {
    set({ showHelp: true });
  },

  closeHelp: () => {
    set({ showHelp: false });
  },

  // Notifications
  addNotification: (notification) => {
    const id = generateNotificationId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));