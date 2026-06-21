import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

/**
 * One toast for the whole app, so every "done" confirmation looks and behaves
 * the same. Mounted above the router, so a toast survives a route change (e.g.
 * saving a transaction shows the pill after navigating back to the list).
 */
const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
	const show = useCallback((message: string) => setToast({ message, id: Date.now() }), []);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 2400);
		return () => clearTimeout(timer);
	}, [toast]);

	return (
		<ToastContext.Provider value={show}>
			{children}
			{toast && (
				<div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
					<span
						key={toast.id}
						className="save-pill inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
					>
						<Check className="size-4" /> {toast.message}
					</span>
				</div>
			)}
		</ToastContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): (message: string) => void {
	return useContext(ToastContext);
}
