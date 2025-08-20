'use client';

import { Fragment, useState, useRef } from 'react';
import { Transition } from '@headlessui/react';
import { cn } from '@/app/lib/utils/cn';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  delay?: number;
  className?: string;
  ariaDescribedBy?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  disabled = false,
  delay = 500,
  className,
  ariaDescribedBy
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2', 
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-muted',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-muted',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-muted',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-muted'
  };

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={isVisible ? ariaDescribedBy || tooltipId.current : undefined}
    >
      {children}
      
      <Transition
        show={isVisible}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          id={ariaDescribedBy || tooltipId.current}
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-lg shadow-lg pointer-events-none whitespace-nowrap',
            positionClasses[position],
            className
          )}
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[position]
            )}
          />
        </div>
      </Transition>
    </div>
  );
}

// Keyboard accessible tooltip component
export function KeyboardTooltip({ 
  content, 
  children, 
  ...props 
}: TooltipProps) {
  return (
    <Tooltip {...props} content={content} delay={0}>
      <div 
        tabIndex={0}
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
      >
        {children}
      </div>
    </Tooltip>
  );
}