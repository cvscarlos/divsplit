import PropTypes from 'prop-types';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupContext } from '../context/GroupContext';
import { Link, useParams } from 'react-router-dom';

GroupHeader.propTypes = {
	children: PropTypes.node.isRequired,
};

export function GroupHeader({ children }) {
	const [group] = useContext(GroupContext);
	const { t } = useTranslation();
	const { groupId } = useParams();

	return (
		<div className="prose">
			<h2>{group.config?.name}</h2>

			<ul className="menu menu-vertical lg:menu-horizontal bg-base-200 rounded-box">
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

			{children}

			<div>
				<h6>Debug:</h6>
				<div className="mockup-code">
					<pre>
						<code>{JSON.stringify(group, null, 2)}</code>
					</pre>
				</div>
			</div>
		</div>
	);
}
