import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { GroupContext } from '../../context/GroupContext';

export function GroupListTransactions() {
	const { t } = useTranslation();
	const { groupId } = useParams();
	const { data: group } = useContext(GroupContext);

	function renderTransaction(transaction) {
		const { id, total, createdAt, description } = transaction;
		return (
			<tr key={id} className="hover:bg-gray-50 cursor-pointer">
				<td>
					<Link to={`/group/${groupId}/transactions/${id}`} className="block w-full h-full">
						{new Date(createdAt).toLocaleDateString()}
					</Link>
				</td>
				<td>
					<Link to={`/group/${groupId}/transactions/${id}`} className="block w-full h-full">
						{total}
					</Link>
				</td>
				<td>
					<Link to={`/group/${groupId}/transactions/${id}`} className="block w-full h-full">
						{description}
					</Link>
				</td>
			</tr>
		);
	}

	return (
		<div className="flex justify-center">
			<div className="ds-card flex-auto">
				<h3>{t('Transactions')}</h3>
				{group.transactions?.length ? (
					<table className="table-auto w-full">
						<thead>
							<tr>
								<th>{t('Date')}</th>
								<th>{t('Total')}</th>
								<th>{t('Description')}</th>
							</tr>
						</thead>
						<tbody>{group.transactions.map(renderTransaction)}</tbody>
					</table>
				) : (
					<p>{t('No transactions found')}</p>
				)}
			</div>
		</div>
	);
}
