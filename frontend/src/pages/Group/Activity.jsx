import { useTranslation } from 'react-i18next';
import { BiGroup, BiReceipt, BiTrash, BiEdit, BiPlus } from 'react-icons/bi';

import { useGroupContext } from '../../context/GroupContext';
import { ACTIVITY_TYPES } from '../../utils/activity-tracker';

export function GroupActivity() {
	const { t } = useTranslation();
	const { data: group } = useGroupContext();

	function getActivityIcon(type) {
		switch (type) {
			case ACTIVITY_TYPES.GROUP_UPDATED:
				return <BiGroup className="text-blue-600" />;
			case ACTIVITY_TYPES.MEMBER_CREATED:
				return <BiPlus className="text-green-600" />;
			case ACTIVITY_TYPES.MEMBER_UPDATED:
				return <BiEdit className="text-blue-600" />;
			case ACTIVITY_TYPES.MEMBER_DELETED:
				return <BiTrash className="text-red-600" />;
			case ACTIVITY_TYPES.TRANSACTION_CREATED:
				return <BiPlus className="text-green-600" />;
			case ACTIVITY_TYPES.TRANSACTION_UPDATED:
				return <BiEdit className="text-blue-600" />;
			case ACTIVITY_TYPES.TRANSACTION_DELETED:
				return <BiTrash className="text-red-600" />;
			default:
				return <BiReceipt className="text-gray-600" />;
		}
	}

	function formatTimestamp(timestamp) {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInHours = (now - date) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			const diffInMinutes = Math.floor((now - date) / (1000 * 60));
			return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
		} else if (diffInHours < 24) {
			const hours = Math.floor(diffInHours);
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else if (diffInHours < 168) {
			// 7 days
			const days = Math.floor(diffInHours / 24);
			return `${days} day${days > 1 ? 's' : ''} ago`;
		} else {
			return date.toLocaleDateString();
		}
	}

	function renderActivity(activity) {
		const { id, type, description, timestamp } = activity;

		return (
			<div key={id} className="flex items-start space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50">
				<div className="flex-shrink-0 mt-1">
					<div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
						{getActivityIcon(type)}
					</div>
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm text-gray-900">{description}</p>
					<p className="text-xs text-gray-500 mt-1">{formatTimestamp(timestamp)}</p>
				</div>
			</div>
		);
	}

	const activities = group.activities || [];

	return (
		<div className="flex justify-center">
			<div className="ds-card flex-auto">
				<h3>{t('Activity Log')}</h3>
				{activities.length > 0 ? (
					<div className="mt-4">
						<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
							{activities.map(renderActivity)}
						</div>
					</div>
				) : (
					<div className="text-center py-8">
						<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
							<BiReceipt className="w-8 h-8 text-gray-400" />
						</div>
						<p className="text-gray-500 mb-2">No activity yet</p>
						<p className="text-sm text-gray-400">
							Activity will appear here when you make changes to the group or transactions.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
