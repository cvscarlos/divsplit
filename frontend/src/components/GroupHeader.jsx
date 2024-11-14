import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupContext } from '../context/GroupContext';
import { Link, useParams } from 'react-router-dom';

export function GroupHeader() {
	const [group] = useContext(GroupContext);
	const { t } = useTranslation();
	const { groupId } = useParams();

	return (
		<div className="prose">
			<h2 className="text-center">{group.config?.name}</h2>

			<ul className="menu menu-horizontal flex justify-center w-full bg-base-200 rounded-box">
				<li>
					<Link to={`/group/${groupId}/config`}>{t('Config')}</Link>
				</li>
				<li>
					<Link to={`/group/${groupId}/transactions`}>{t('Transactions')}</Link>
				</li>
				<li>
					<Link to={`/group/${groupId}/activity`}>{t('Activity')}</Link>
				</li>
			</ul>
		</div>
	);
}
