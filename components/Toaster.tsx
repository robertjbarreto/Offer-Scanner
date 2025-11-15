
import React from 'react';
import { useToastInternals } from '../hooks/useToast';
import { CheckCircleIcon, XCircleIconSolid, InformationCircleIcon } from './Icons';

const TOAST_ICONS = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  error: <XCircleIconSolid className="h-5 w-5 text-red-500" />,
  info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
};

const Toaster: React.FC = () => {
  const { toasts } = useToastInternals();

  return (
    <>
      <div
        aria-live="polite"
        className="fixed top-0 inset-x-0 pt-4 flex flex-col items-center pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <div className="w-full flex flex-col items-center space-y-4">
          {toasts.slice(0, 3).map((toast, index) => (
            <div
              key={toast.id}
              role="alert"
              className="w-full max-w-xs sm:max-w-sm flex items-center bg-white text-gray-800 rounded-lg shadow-2xl p-4 transition-all duration-500 ease-in-out transform pointer-events-auto animate-toast-in"
              style={{
                '--toast-index': index,
                zIndex: 100 - index,
              } as React.CSSProperties}
            >
              <div className="flex-shrink-0">{TOAST_ICONS[toast.type]}</div>
              <p className="ml-3 text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes toast-in {
            from {
                opacity: 0;
                transform: translateY(-100%) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(calc(var(--toast-index) * 1rem)) scale(calc(1 - (var(--toast-index) * 0.05)));
            }
        }
        .animate-toast-in {
            animation: toast-in 0.4s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
            transform: translateY(calc(var(--toast-index) * 1rem)) scale(calc(1 - (var(--toast-index) * 0.05)));
        }
        .animate-toast-in:nth-child(n+4) {
             display: none; /* Only show top 3 */
        }
      `}</style>
    </>
  );
};

export default Toaster;
