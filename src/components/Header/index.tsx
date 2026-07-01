import { Link } from 'react-router-dom';
import { Moon, Sun, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useThemeContext } from '../../context/ThemeContext';
import { SyncIndicator } from '../SyncIndicator';
import { Button } from '@/components/ui/button';

function Header() {
	const { t, i18n } = useTranslation();
	const { theme, toggleTheme } = useThemeContext();
	const isDark = theme === 'dark';

	const lang = i18n.resolvedLanguage === 'pt' ? 'pt' : 'en';
	const toggleLang = () => void i18n.changeLanguage(lang === 'pt' ? 'en' : 'pt');

	return (
		<header className="border-border/70 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
				<Link to="/" className="group flex items-center gap-2.5">
					<span className="flex size-9 items-center justify-center rounded-lg bg-[#0f0f1a] transition-transform group-hover:-rotate-6">
						<img src="/logo.png" alt="DivSplit" className="w-7" />
					</span>
					<span className="font-sans text-2xl font-semibold tracking-tight">
						Div<span className="text-primary">Split</span>
					</span>
				</Link>

				<nav className="hidden items-center gap-9 md:flex">
					<Link
						to="/events"
						className="text-muted-foreground hover:text-foreground text-sm tracking-[0.2em] uppercase transition-colors"
					>
						{t('EVENTS')}
					</Link>
				</nav>

				<div className="flex items-center gap-1">
					<span className="text-muted-foreground/40 tnum mr-1 text-[10px]" title="Build version">
						{__BUILD_ID__}
					</span>
					<SyncIndicator />
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleLang}
						aria-label="Change language"
						title={lang === 'pt' ? 'Mudar idioma' : 'Change language'}
						className="gap-1.5 font-medium uppercase"
					>
						<Languages className="size-4" /> {lang}
					</Button>
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
			</div>
		</header>
	);
}

export default Header;
