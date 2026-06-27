import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatch } from 'react-router-dom';
import { Cloud, CloudCheck, CloudOff, RefreshCw } from 'lucide-react';

import { subscribeSync, getSyncStatus, syncNow } from '../utils/sync';

/**
 * Google-Docs-style sync status in the header: a cloud that's "saved" when everything is
 * pushed, a spinner while syncing, a plain cloud when changes are waiting, and a struck
 * cloud when offline (everything still saved locally). Clicking it forces a manual sync
 * (push the outbox, then pull the open event).
 */
export function SyncIndicator() {
	const { t } = useTranslation();
	const status = useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);
	const groupId = useMatch('/group/:groupId/*')?.params.groupId;

	const map = {
		synced: { Icon: CloudCheck, label: t('ALL_CHANGES_SAVED'), spin: false },
		syncing: { Icon: RefreshCw, label: t('SYNCING'), spin: true },
		pending: { Icon: Cloud, label: t('WAITING_TO_SYNC'), spin: false },
		offline: { Icon: CloudOff, label: t('OFFLINE_SAVED_ON_THIS_DEVICE'), spin: false },
	} as const;
	const { Icon, label, spin } = map[status];

	return (
		<button
			type="button"
			onClick={() => void syncNow(groupId)}
			disabled={status === 'syncing'}
			className="text-muted-foreground hover:text-foreground inline-flex items-center transition-colors disabled:opacity-100"
			title={`${label} · ${t('SYNC_NOW')}`}
			aria-label={t('SYNC_NOW')}
		>
			<Icon className={`size-4 ${spin ? 'animate-spin' : ''}`} />
		</button>
	);
}
