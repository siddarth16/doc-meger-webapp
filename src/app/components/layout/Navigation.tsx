'use client';

import { 
  DocumentPlusIcon,
  Cog8ToothIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/app/stores/ui-store';
import { useDocumentStore } from '@/app/stores/document-store';
import { useTheme } from '@/app/contexts/ThemeContext';
import { Tooltip } from '@/app/components/ui/Tooltip';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/lib/utils/cn';
import { useState } from 'react';

const navigationItems = [
  {
    id: 'upload' as const,
    name: 'Upload',
    icon: DocumentPlusIcon,
    description: 'Add documents',
    ariaLabel: 'Upload documents step'
  },
  {
    id: 'merge' as const,
    name: 'Merge',
    icon: Cog8ToothIcon,
    description: 'Configure merge options',
    ariaLabel: 'Merge configuration step'
  },
  {
    id: 'preview' as const,
    name: 'Preview',
    icon: EyeIcon,
    description: 'Preview documents',
    ariaLabel: 'Document preview step'
  },
  {
    id: 'export' as const,
    name: 'Export',
    icon: ArrowDownTrayIcon,
    description: 'Download results',
    ariaLabel: 'Export and download step'
  },
];

export function Navigation() {
  const { activeTab, setActiveTab, openHelp } = useUIStore();
  const { documents } = useDocumentStore();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const getDisabledReason = (tabId: typeof activeTab) => {
    switch (tabId) {
      case 'merge':
        return documents.length === 0 ? 'Upload documents first to configure merge options' : null;
      case 'preview':
        return documents.length === 0 ? 'Upload documents first to preview them' : null;
      case 'export':
        return documents.length === 0 ? 'Upload and merge documents first to export results' : null;
      default:
        return null;
    }
  };

  const getStatusStyles = (tabId: typeof activeTab, status: string) => {
    const isActive = activeTab === tabId;
    
    if (status === 'disabled') {
      return 'text-text-disabled cursor-not-allowed opacity-50';
    }
    
    if (isActive) {
      return 'text-primary bg-primary/10 border-primary/30';
    }
    
    if (status === 'completed') {
      return 'text-accent hover:text-accent/80 hover:bg-accent/10';
    }
    
    return 'text-text-primary hover:text-primary hover:bg-surface-elevated';
  };

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className="lg:hidden bg-surface-secondary border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-text-primary">DocMerger</h1>
          <span className="text-sm text-text-secondary">Step {navigationItems.findIndex(item => item.id === activeTab) + 1} of {navigationItems.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="p-2"
            >
              {theme === 'dark' ? 
                <SunIcon className="h-5 w-5" /> : 
                <MoonIcon className="h-5 w-5" />
              }
            </Button>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle navigation menu"
            className="p-2"
          >
            {isCollapsed ? <Bars3Icon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar & Mobile Collapsible Navigation */}
      <div className={cn(
        "bg-surface-secondary border-r border-border transition-all duration-300",
        "lg:block lg:w-80 lg:flex-shrink-0",
        "fixed lg:static inset-y-0 left-0 z-40",
        isCollapsed ? "hidden lg:block" : "block",
        "lg:transform-none",
        !isCollapsed && "shadow-xl lg:shadow-none"
      )}>
        <div className="p-4 h-full flex flex-col">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">DocMerger</h2>
                <p className="text-sm text-text-secondary">Document Processing Pipeline</p>
              </div>
              <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                  className="p-2"
                >
                  {theme === 'dark' ? 
                    <SunIcon className="h-5 w-5" /> : 
                    <MoonIcon className="h-5 w-5" />
                  }
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Navigation Steps with Progress Integration */}
          <nav className="space-y-3" role="navigation" aria-label="Document processing steps">
            {navigationItems.map((item, index) => {
              const status = getTabStatus(item.id);
              const isDisabled = status === 'disabled';
              const isActive = activeTab === item.id;
              const disabledReason = getDisabledReason(item.id);

              const NavigationButton = (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setActiveTab(item.id)}
                  disabled={isDisabled}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? 'step' : undefined}
                  aria-describedby={isDisabled ? `disabled-reason-${item.id}` : undefined}
                  className={cn(
                    'w-full flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    getStatusStyles(item.id, status),
                    isActive && 'border-primary/30 shadow-sm'
                  )}
                >
                  {/* Step Number */}
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0',
                    status === 'completed' 
                      ? 'bg-accent text-black' 
                      : isActive 
                        ? 'bg-primary text-black'
                        : isDisabled
                          ? 'bg-surface-elevated text-text-disabled'
                          : 'bg-surface-elevated text-text-secondary'
                  )}>
                    {status === 'completed' ? '✓' : index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-base">{item.name}</div>
                    <div className="text-sm opacity-75 mt-0.5">{item.description}</div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                </button>
              );

              // Wrap disabled buttons with tooltip
              if (isDisabled && disabledReason) {
                return (
                  <Tooltip 
                    key={item.id} 
                    content={disabledReason}
                    position="right"
                  >
                    {NavigationButton}
                    <div id={`disabled-reason-${item.id}`} className="sr-only">
                      {disabledReason}
                    </div>
                  </Tooltip>
                );
              }

              return NavigationButton;
            })}
          </nav>

          {/* Progress Bar */}
          <div className="mt-6 p-4 bg-surface-elevated rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-primary">Progress</span>
              <span className="text-xs text-text-secondary">
                {navigationItems.filter(item => getTabStatus(item.id) === 'completed').length} / {navigationItems.length}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(navigationItems.filter(item => getTabStatus(item.id) === 'completed').length / navigationItems.length) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-auto pt-6 space-y-2 border-t border-border">
            <Button
              variant="ghost" 
              onClick={openHelp}
              className="w-full justify-start space-x-3"
              aria-label="Open help and documentation"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Help & FAQ</span>
            </Button>
            
            {/* Privacy Notice */}
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                <p className="text-xs text-text-secondary">
                  100% client-side processing - your documents never leave your device
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {!isCollapsed && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 -z-10"
            onClick={() => setIsCollapsed(true)}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
}