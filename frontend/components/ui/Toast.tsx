'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary';
  href?: string;
  onClick?: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  showProgress?: boolean;
  actions?: ToastAction[];
  timestamp?: string;
  activityId?: string;
  metadata?: Record<string, any>;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction_Internal = 
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: { id: string } }
  | { type: 'UPDATE_TOAST'; payload: { id: string; updates: Partial<Toast> } }
  | { type: 'CLEAR_ALL' };

const toastReducer = (state: ToastState, action: ToastAction_Internal): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload.id)
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, ...action.payload.updates }
            : toast
        )
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        toasts: []
      };
    default:
      return state;
  }
};

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
  showToast: (config: {
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
    showProgress?: boolean;
    actions?: ToastAction[];
    activityId?: string;
    metadata?: Record<string, any>;
  }) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  defaultDuration = 5000
}) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = (toast: Omit<Toast, 'id' | 'timestamp'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: new Date().toISOString(),
      duration: toast.duration ?? defaultDuration
    };

    dispatch({ type: 'ADD_TOAST', payload: newToast });

    // Auto remove after duration (if specified)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: { id } });
      }, newToast.duration);
    }

    // Limit max toasts
    if (state.toasts.length >= maxToasts) {
      const oldestToast = state.toasts[0];
      if (oldestToast) {
        dispatch({ type: 'REMOVE_TOAST', payload: { id: oldestToast.id } });
      }
    }

    return id;
  };

  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: { id } });
  };

  const updateToast = (id: string, updates: Partial<Toast>) => {
    dispatch({ type: 'UPDATE_TOAST', payload: { id, updates } });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const showToast = (config: {
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
    showProgress?: boolean;
    actions?: ToastAction[];
    activityId?: string;
    metadata?: Record<string, any>;
  }): string => {
    return addToast(config);
  };

  const value: ToastContextType = {
    toasts: state.toasts,
    addToast,
    removeToast,
    updateToast,
    clearAll,
    showToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { removeToast, updateToast } = useToast();
  const [progress, setProgress] = React.useState(100);

  useEffect(() => {
    if (toast.showProgress && toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.showProgress, toast.duration]);

  const handleActionClick = (action: ToastAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      window.open(action.href, '_blank');
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`
      relative overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 
      transform hover:scale-105 hover:shadow-xl
      ${getColorClasses()}
    `}>
      {/* Progress bar */}
      {toast.showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {toast.title}
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {toast.message}
          </p>
          
          {/* Timestamp */}
          {toast.timestamp && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {new Date(toast.timestamp).toLocaleTimeString()}
            </p>
          )}

          {/* Actions */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md
                    transition-colors duration-200
                    ${action.variant === 'primary'
                      ? 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {action.label}
                  {action.href && <ExternalLink className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Helper functions for common toast types
export const createToast = {
  success: (title: string, message: string, options?: Partial<Toast>) => ({
    type: 'success' as const,
    title,
    message,
    ...options
  }),

  error: (title: string, message: string, options?: Partial<Toast>) => ({
    type: 'error' as const,
    title,
    message,
    duration: 7000, // Longer duration for errors
    ...options
  }),

  warning: (title: string, message: string, options?: Partial<Toast>) => ({
    type: 'warning' as const,
    title,
    message,
    ...options
  }),

  info: (title: string, message: string, options?: Partial<Toast>) => ({
    type: 'info' as const,
    title,
    message,
    ...options
  }),

  // For backend activity integration
  fromActivity: (activityData: {
    toastConfig: {
      title: string;
      message: string;
      type: ToastType;
      duration?: number;
      showProgress?: boolean;
      actions?: ToastAction[];
    };
    activityId?: string;
    metadata?: Record<string, any>;
  }) => ({
    ...activityData.toastConfig,
    activityId: activityData.activityId,
    metadata: activityData.metadata
  })
}; 