import { Link } from 'react-router-dom';
import { Moon, Sun, Plane } from 'lucide-react';

import { useThemeContext } from '../../context/ThemeContext';
import { Button } from '@/components/ui/button';

function Header() {
	const { theme, toggleTheme } = useThemeContext();
	const isDark = theme === 'dark';

	return (
		<header className="border-border/70 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
				<Link to="/" className="group flex items-center gap-2.5">
					<span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:-rotate-6">
						<Plane className="size-5" />
					</span>
					<span className="font-serif text-2xl font-semibold tracking-tight">
						Div<span className="text-primary">Split</span>
					</span>
				</Link>

				<Button
					variant="ghost"
					size="icon"
					onClick={toggleTheme}
					aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
					title={isDark ? 'Light' : 'Dark'}
				>
					{isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
				</Button>
			</div>
		</header>
	);
}

export default Header;
