import { useTranslation } from 'react-i18next';
import { Copy, Share2 } from 'lucide-react';

import { useToast } from './Toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Share the event's (private) link. There are no accounts — anyone with the link can
 * view and edit — so the dialog makes that explicit: only share with the people who are
 * actually splitting these expenses.
 */
export function ShareDialog({ url, onClose }: { url: string; onClose: () => void }) {
	const { t } = useTranslation();
	const toast = useToast();

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			toast(t('COPIED'));
		} catch {
			/* clipboard blocked — the field is selectable as a fallback */
		}
	}

	async function nativeShare() {
		try {
			await navigator.share({ url });
		} catch {
			/* user cancelled the share sheet */
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
		>
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>{t('SHARE_TITLE')}</CardTitle>
					<CardDescription>{t('SHARE_WARNING')}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-2">
						<Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="text-xs" />
						<Button type="button" onClick={copy} aria-label={t('COPY')} title={t('COPY')}>
							<Copy />
						</Button>
					</div>
					<div className="flex justify-end gap-2">
						{typeof navigator !== 'undefined' && 'share' in navigator && (
							<Button type="button" variant="outline" onClick={nativeShare}>
								<Share2 /> {t('SHARE')}
							</Button>
						)}
						<Button type="button" variant="outline" onClick={onClose}>
							{t('CANCEL')}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
