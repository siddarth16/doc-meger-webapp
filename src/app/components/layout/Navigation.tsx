'use client';

import { 
  DocumentPlusIcon,
  Cog8ToothIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/app/stores/ui-store';
import { useDocumentStore } from '@/app/stores/document-store';
import { cn } from '@/app/lib/utils/cn';

const navigationItems = [
  {
    id: 'upload' as const,
    name: 'Upload',
    icon: DocumentPlusIcon,
    description: 'Add documents'
  },
  {
    id: 'merge' as const,
    name: 'Merge',
    icon: Cog8ToothIcon,
    description: 'Configure merge options'
  },
  {
    id: 'preview' as const,
    name: 'Preview',
    icon: EyeIcon,
    description: 'Preview documents'
  },
  {
    id: 'export' as const,
    name: 'Export',
    icon: ArrowDownTrayIcon,
    description: 'Download results'
  },
];

export function Navigation() {
  const { activeTab, setActiveTab } = useUIStore();
  const { documents } = useDocumentStore();

  const getTabStatus = (tabId: typeof activeTab) => {
    switch (tabId) {
      case 'upload':
        return documents.length > 0 ? 'completed' : 'current';
      case 'merge':
        return documents.length === 0 ? 'disabled' : documents.length > 0 ? 'available' : 'current';
      case 'preview':
        return documents.length === 0 ? 'disabled' : 'available';
      case 'export':
        return documents.length === 0 ? 'disabled' : 'available';
      default:
        return 'available';
    }
  };

  const getStatusStyles = (tabId: typeof activeTab, status: string) => {
    const isActive = activeTab === tabId;
    
    if (status === 'disabled') {
      return 'text-gray-600 cursor-not-allowed';
    }
    
    if (isActive) {
      return 'text-primary bg-primary/10 border-primary';
    }
    
    if (status === 'completed') {
      return 'text-accent hover:text-accent/80 hover:bg-accent/5';
    }
    
    return 'text-foreground hover:text-primary hover:bg-primary/5';
  };

  return (
    <div className="bg-muted/30 border-r border-border p-4">
      <div className="space-y-2">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">DocMerger</h2>
          <p className="text-sm text-gray-400">Document Processing Pipeline</p>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const status = getTabStatus(item.id);
            const isDisabled = status === 'disabled';
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setActiveTab(item.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-lg border border-transparent transition-all duration-200',
                  getStatusStyles(item.id, status),
                  isActive && 'border-primary/30'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
                
                {status === 'completed' && (
                  <div className="w-2 h-2 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 mt-6 border-t border-border">
          <button
            onClick={() => useUIStore.getState().openHelp()}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
            <span className="font-medium">Help</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 p-4 bg-muted/20 rounded-lg">
        <div className="text-xs text-gray-400 mb-2">Progress</div>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const status = getTabStatus(item.id);
            const isCompleted = status === 'completed';
            const isCurrent = activeTab === item.id;
            
            return (
              <div key={item.id} className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isCompleted ? 'bg-accent' : isCurrent ? 'bg-primary' : 'bg-gray-600'
                )} />
                <span className={cn(
                  'text-xs',
                  isCompleted ? 'text-accent' : isCurrent ? 'text-primary' : 'text-gray-500'
                )}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}