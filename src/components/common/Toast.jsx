import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const types = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      styles: 'bg-green-50 border-green-200 text-green-800',
    },
    error: {
      icon: <XCircle className="w-5 h-5" />,
      styles: 'bg-red-50 border-red-200 text-red-800',
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5" />,
      styles: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      styles: 'bg-blue-50 border-blue-200 text-blue-800',
    },
  };

  const { icon, styles } = types[type];

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${styles}
        animate-slide-in-right
      `}
    >
      {icon}
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/10 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;