
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden scale-in-95 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-lg font-bold">
                        {isDanger && <AlertTriangle className="text-red-500" size={24} />}
                        <h3 className="text-white">{title}</h3>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2 rounded-xl font-bold text-white transition shadow-lg ${isDanger
                                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
