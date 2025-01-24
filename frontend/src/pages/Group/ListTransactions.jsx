import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupContext } from '../../context/GroupContext';

export function GroupListTransactions() {
	const { t } = useTranslation();
	const [group] = useContext(GroupContext);

	function renderTransaction(transaction) {
		const { id, total, createdAt, description } = transaction;
		return (
			<tr key={id}>
				<td>{new Date(createdAt).toLocaleDateString()}</td>
				<td>{total}</td>
				<td>{description}</td>
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
