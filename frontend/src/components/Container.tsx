import type { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
	return <div className="bg-background text-foreground min-h-svh transition-colors duration-300">{children}</div>;
}
