import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudCheck, CloudOff, RefreshCw } from 'lucide-react';

import { subscribeSync, getSyncStatus } from '../utils/sync';

/**
 * Google-Docs-style sync status in the header: a cloud that's "saved" when everything is
 * pushed, a spinner while syncing, a plain cloud when changes are waiting, and a struck
 * cloud when offline (everything still saved locally).
 */
export function SyncIndicator() {
	const { t } = useTranslation();
	const status = useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);

	const map = {
		synced: { Icon: CloudCheck, label: t('All changes saved'), spin: false },
		syncing: { Icon: RefreshCw, label: t('Syncing…'), spin: true },
		pending: { Icon: Cloud, label: t('Waiting to sync'), spin: false },
		offline: { Icon: CloudOff, label: t('Offline — saved on this device'), spin: false },
	} as const;
	const { Icon, label, spin } = map[status];

	return (
		<span className="text-muted-foreground inline-flex items-center" title={label} aria-label={label} role="status">
			<Icon className={`size-4 ${spin ? 'animate-spin' : ''}`} />
		</span>
	);
}
