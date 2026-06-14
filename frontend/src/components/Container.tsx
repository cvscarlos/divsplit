import type { ReactNode } from 'react';

import { useThemeContext } from '../context/ThemeContext';

export function Container({ children }: { children: ReactNode }) {
	const { theme } = useThemeContext();

	return (
		<div data-theme={theme} className="transition duration-300 ease-in-out min-h-svh">
			{children}
		</div>
	);
}
