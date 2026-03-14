import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

const ICONS: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: '#F0FFF4', border: '#2D6A4F', text: '#2D6A4F' },
    error:   { bg: '#FFF5F5', border: '#E53E3E', text: '#C53030' },
    warning: { bg: '#FFFBEB', border: '#D69E2E', text: '#B7791F' },
    info:    { bg: '#EBF8FF', border: '#3182CE', text: '#2B6CB0' },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let counter = 0;

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++counter + Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div
                style={{
                    position: 'fixed',
                    top: 24,
                    right: 24,
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    maxWidth: 360,
                    width: '100%',
                }}
            >
                {toasts.map(toast => {
                    const c = COLORS[toast.type];
                    return (
                        <div
                            key={toast.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                backgroundColor: c.bg,
                                border: `1.5px solid ${c.border}`,
                                borderRadius: 10,
                                padding: '12px 16px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                animation: 'slideIn 0.25s ease',
                            }}
                        >
                            <span style={{ fontSize: 18, lineHeight: 1.4 }}>{ICONS[toast.type]}</span>
                            <span style={{ flex: 1, fontSize: 14, color: '#1a1a1a', lineHeight: 1.5 }}>
                                {toast.message}
                            </span>
                            <button
                                onClick={() => remove(toast.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#999',
                                    fontSize: 16,
                                    lineHeight: 1,
                                    padding: 0,
                                    marginTop: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
