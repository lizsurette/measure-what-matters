import React from 'react';

interface HealthIndicatorProps {
  status: 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function HealthIndicator({
  status,
  size = 'md',
  showLabel = false,
  animated = false,
  className = ''
}: HealthIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'green':
        return {
          label: 'Healthy',
          textClasses: 'text-green-800 bg-green-100',
          showBadge: false // Don't show anything for green status
        };
      case 'yellow':
        return {
          label: 'WARNING',
          textClasses: 'text-yellow-800 bg-yellow-100',
          showBadge: true
        };
      case 'red':
        return {
          label: 'CRITICAL',
          textClasses: 'text-red-800 bg-red-100',
          showBadge: true
        };
    }
  };

  const config = getStatusConfig();

  // Don't render anything for green status to reduce clutter
  if (!config.showBadge) {
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium
        ${config.textClasses}
        ${animated && status === 'red' ? 'animate-pulse' : ''}
        ${className}
      `}
      title={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}