import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Loading...',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-b-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-2',
  };

  const content = (
    <div className="text-center">
      <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-emerald-600 mb-4`}></div>
      {message && <p className="text-gray-600">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      {content}
    </div>
  );
};


