import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { BiTrash } from 'react-icons/bi';

import { useGroupContext } from '../../context/GroupContext';
import { trackTransactionDeleted } from '../../utils/activity-tracker';

export function GroupListTransactions() {
	const { t } = useTranslation();
	const { groupId } = useParams();
	const { data: group, updateGroup } = useGroupContext();

	function handleDeleteTransaction(transaction, event) {
		event.preventDefault();
		event.stopPropagation();

		if (window.confirm(`Are you sure you want to delete the transaction "${transaction.description}"?`)) {
			let updatedGroup = { ...group };

			// Track transaction deletion
			updatedGroup = trackTransactionDeleted(updatedGroup, transaction);

			// Remove transaction from the list
			updatedGroup.transactions = updatedGroup.transactions.filter((t) => t.id !== transaction.id);

			updateGroup(updatedGroup);
		}
	}

	function renderTransaction(transaction) {
		const { id, total, createdAt, description } = transaction;
		return (
			<tr key={id} className="hover:bg-gray-50">
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
				<td className="w-12">
					<button
						type="button"
						onClick={(e) => handleDeleteTransaction(transaction, e)}
						className="text-red-600 hover:text-red-800 p-2"
						title="Delete transaction"
					>
						<BiTrash />
					</button>
				</td>
			</tr>
		);
	}

	return (
		<div className="flex justify-center">
			<div className="ds-card flex-auto">
				<h3>{t('Transactions')}</h3>
				{group.transactions?.length ? (
					<>
						<div className="mb-4">
							<Link to={`/group/${groupId}/transactions/new`} className="btn btn-primary">
								{t('Add Transaction')}
							</Link>
						</div>
						<table className="table-auto w-full">
							<thead>
								<tr>
									<th>{t('Date')}</th>
									<th>{t('Total')}</th>
									<th>{t('Description')}</th>
									<th className="w-12">{t('Actions')}</th>
								</tr>
							</thead>
							<tbody>{group.transactions.map(renderTransaction)}</tbody>
						</table>
					</>
				) : (
					<div className="text-center py-8">
						<p className="mb-4">{t('No transactions found')}</p>
						<div className="mb-4">
							<Link to={`/group/${groupId}/transactions/new`} className="btn btn-primary">
								{t('Add Transaction')}
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
