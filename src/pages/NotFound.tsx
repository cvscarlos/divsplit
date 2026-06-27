import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center gap-5 py-20 text-center">
			<span className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
				<Compass className="size-8" />
			</span>
			<p className="font-sans text-7xl font-semibold tracking-tight">404</p>
			<p className="text-muted-foreground max-w-sm">{t('CONTENT_NOT_FOUND')}</p>
			<Button asChild variant="outline">
				<Link to="/">DivSplit</Link>
			</Button>
		</div>
	);
}
