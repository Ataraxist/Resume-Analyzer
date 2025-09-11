import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

// Create context
const ToastContext = createContext();

// Custom toast styles matching the app's design
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#fff',
    color: '#363636',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minWidth: '300px',
    maxWidth: '500px',
  },
};

// Custom toast components with icons
const customToast = {
  success: (message) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
        flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Success</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 
              flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400
              hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </div>
    ));
  },

  error: (message, details = null) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
        flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Error</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
              {details && process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">Debug Info</summary>
                  <pre className="mt-1 text-xs text-gray-400 dark:text-gray-500 overflow-auto max-h-20">
                    {JSON.stringify(details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 
              flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400
              hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  },

  warning: (message) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
        flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Warning</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 
              flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400
              hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </div>
    ));
  },

  info: (message) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
        flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Info</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 
              flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400
              hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Close
          </button>
        </div>
      </div>
    ));
  },

  loading: (message) => {
    return toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
        max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
        flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Processing</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  },

  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Processing...',
        success: messages.success || 'Success!',
        error: (err) => messages.error || err?.message || 'Something went wrong',
      },
      toastOptions
    );
  }
};

// Provider component
export function ToastProvider({ children }) {
  return (
    <ToastContext.Provider value={customToast}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={toastOptions}
        containerStyle={{
          top: 80, // Account for header
        }}
      />
    </ToastContext.Provider>
  );
}

// Custom hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Export for direct use in services
export { customToast };