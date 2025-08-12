'use client';

import { Transition } from '@headlessui/react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/app/stores/ui-store';
import { cn } from '@/app/lib/utils/cn';

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const colorMap = {
  success: 'bg-primary/10 border-primary/30 text-primary',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  info: 'bg-accent/10 border-accent/30 text-accent',
};

export function NotificationCenter() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        
        return (
          <Transition
            key={notification.id}
            appear
            show={true}
            enter="transition-all duration-300"
            enterFrom="transform translate-x-full opacity-0"
            enterTo="transform translate-x-0 opacity-100"
            leave="transition-all duration-200"
            leaveFrom="transform translate-x-0 opacity-100"
            leaveTo="transform translate-x-full opacity-0"
          >
            <div
              className={cn(
                'relative rounded-lg border p-4 shadow-lg backdrop-blur-sm',
                colorMap[notification.type]
              )}
            >
              <div className="flex items-start space-x-3">
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{notification.title}</h4>
                  {notification.message && (
                    <p className="text-sm opacity-90 mt-1">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs opacity-60 mt-2">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-current/10 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Transition>
        );
      })}
    </div>
  );
}