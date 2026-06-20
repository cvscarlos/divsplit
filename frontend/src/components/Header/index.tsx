import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useThemeContext } from '../../context/ThemeContext';
import { Button } from '@/components/ui/button';

function Header() {
	const { t } = useTranslation();
	const { theme, toggleTheme } = useThemeContext();
	const isDark = theme === 'dark';

	return (
		<header className="border-border/70 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
				<Link to="/" className="group flex items-center gap-2.5">
					<img
						src="/logo.png"
						alt="DivSplit"
						className="size-9 transition-transform group-hover:-rotate-6"
					/>
					<span className="font-sans text-2xl font-semibold tracking-tight">
						Div<span className="text-primary">Split</span>
					</span>
				</Link>

				<nav className="hidden items-center gap-7 md:flex">
					<a href="#" className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
						{t('How it works')}
					</a>
					<a href="#" className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
						{t('Pricing')}
					</a>
					<a href="#" className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors">
						{t('Support')}
					</a>
				</nav>

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
