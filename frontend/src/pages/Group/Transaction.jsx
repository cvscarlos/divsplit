import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import ObjectId from 'bson-objectid';

import { useGroupContext } from '../../context/GroupContext';
import { Hr } from '../../components/Hr';

const PAID_BY = 'paid-by';
const PAID_FOR = 'paid-for';

function round(value) {
	return Math.round(value * 100) / 100;
}

GroupTransaction.propTypes = {
	transactionId: PropTypes.node.isRequired,
};

export function GroupTransaction({ transactionId }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { groupId } = useParams();
	const { data: group, updateGroup, loadDemo } = useGroupContext();

	// Find existing transaction or use defaults
	const existingTransaction =
		transactionId !== 'new' ? group.transactions?.find(({ id }) => id === transactionId) : null;

	// Helper function to format date for input field
	const formatDateForInput = (dateValue) => {
		if (!dateValue) return '';
		const date = new Date(dateValue);
		return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
	};

	// Initialize state with existing data or defaults
	const [paidBy, setPaidBy] = useState(existingTransaction?.paidBy || {});
	const [paidFor, setPaiFor] = useState(existingTransaction?.paidFor || {});
	const [total, setTotal] = useState(existingTransaction?.total || 0);
	const [description, setDescription] = useState(existingTransaction?.description || '');
	const [date, setDate] = useState(formatDateForInput(existingTransaction?.date));
	const manuallyChanged = useRef(existingTransaction?.manuallyChanged || {});

	// Update state when transaction changes (e.g., navigating between transactions)
	useEffect(() => {
		setPaidBy(existingTransaction?.paidBy || {});
		setPaiFor(existingTransaction?.paidFor || {});
		setTotal(existingTransaction?.total || 0);
		setDescription(existingTransaction?.description || '');
		setDate(formatDateForInput(existingTransaction?.date));
		manuallyChanged.current = existingTransaction?.manuallyChanged || {};
	}, [existingTransaction]);

	function handleMemberChange(listType, id, inputValue, isChecked) {
		const data = PAID_BY === listType ? paidBy : paidFor;
		const handler = PAID_BY === listType ? setPaidBy : setPaiFor;
		const numericValue = Number.parseFloat(inputValue);

		if (!isChecked) {
			delete data[id];
		}
		if (isChecked && !data[id]) {
			data[id] = 0; // força o item a existir
		}

		const tempData = { ...data };

		let manualChangedSum = 0;
		const manuallyChangedKeys = Object.keys(manuallyChanged.current);
		manuallyChangedKeys.forEach((key) => {
			manualChangedSum += key === id ? numericValue : data[key];
			delete tempData[key]; // Ignoro os que o usuário mudou manualmente
		});

		const tempDataKeys = Object.keys(tempData);
		const divideBy = Math.max(1, tempDataKeys.length || 1);
		const subtotal = Math.max(0, round((total - manualChangedSum) / divideBy));
		tempDataKeys.forEach((k) => {
			data[k] = subtotal;
		});

		// Caso a divisão não seja exata, ajusta a diferença na pessoa atual
		const currentTotal = Object.values(data).reduce((acc, val) => acc + val, 0);
		const currentTotalDiff = total - currentTotal;
		if (currentTotalDiff !== 0) {
			const personId = isChecked ? id : tempDataKeys[0];
			const personTotal = round(data[personId] + currentTotalDiff);
			data[personId] = personTotal;
		}

		if (isChecked) {
			if (numericValue) data[id] = numericValue;
		}

		handler({ ...data });
	}

	function getRemainingValue(fieldset) {
		const data = PAID_BY === fieldset ? paidBy : paidFor;
		const values = Object.values(data);
		const sum = values.reduce((acc, value) => acc + value, 0);
		return total - sum;
	}

	function handleGroupSubmit(event) {
		event.preventDefault();
		try {
			if (!date || !total || !description) {
				throw new Error('Please fill in all required fields');
			}
			const newGroup = { ...group };
			const transactionDate = new Date(date);
			if (isNaN(transactionDate.getTime())) {
				throw new Error('Invalid date');
			}
			const isNew = transactionId === 'new';
			const id = isNew ? String(new ObjectId()) : transactionId;

			newGroup.transactions ||= [];

			const transactionData = {
				id,
				date: transactionDate,
				description,
				total,
				paidBy,
				paidFor,
				manuallyChanged: manuallyChanged.current,
				...(isNew ? { createdAt: new Date() } : { updatedAt: new Date() }),
			};

			if (isNew) {
				newGroup.transactions.push(transactionData);
			} else {
				const transactionIndex = newGroup.transactions.findIndex(({ id: txId }) => txId === transactionId);
				if (transactionIndex !== -1) {
					newGroup.transactions[transactionIndex] = {
						...newGroup.transactions[transactionIndex],
						...transactionData,
					};
				} else {
					throw new Error('Transaction not found');
				}
			}
			updateGroup(newGroup);
			if (isNew) {
				navigate(`/group/${groupId}/transactions/${id}`);
			}
		} catch (error) {
			console.error('Error submitting group:', error);
			// TODO: Implement error handling UI feedback
		}
	}

	function membersList(listType) {
		return group?.members?.map(({ id, name }) => {
			const data = PAID_BY === listType ? paidBy : paidFor;
			return (
				<div key={listType + id}>
					<input
						className="checkbox"
						type="checkbox"
						value={id}
						checked={Boolean(data[id])}
						onChange={(e) => handleMemberChange(listType, id, 0, e.target.checked)}
					/>
					<span className="label-text">{name}</span>
					<input
						className="input input-bordered"
						type="number"
						name={`${id}-value`}
						value={data[id] || ''}
						onChange={(e) => handleMemberChange(listType, id, e.target.value, Boolean(e.target.value))}
						onKeyDown={() => {
							manuallyChanged.current[id] = true;
						}}
					/>
				</div>
			);
		});
	}

	// Show demo data link if no members exist
	if (!group?.members || group.members.length === 0) {
		return (
			<div className="flex justify-center">
				<div className="ds-card flex-auto">
					<h3>{t('Transaction')}</h3>
					<p className="mb-4">
						No members found in this group.{' '}
						<button type="button" className="link link-primary" onClick={loadDemo}>
							Load demo data
						</button>{' '}
						to get started.
					</p>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleGroupSubmit}>
			<div className="flex justify-center">
				<div className="ds-card flex-auto">
					<h3>{t('Transaction')}</h3>

					<div className="pt-5">
						{t('Date')}:{' '}
						<input
							className="input input-bordered"
							type="date"
							name="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
					<div className="pt-5 pb-5">
						{t('Total')}:
						<input
							className="input input-bordered"
							type="number"
							name="total"
							value={total || ''}
							onChange={(e) => setTotal(Number(e.target.value) || total)}
						/>
					</div>
					<div>
						{t('Description')}:{' '}
						<input
							className="input input-bordered"
							type="text"
							name="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<Hr />

					<h4>{t('Paid by')}:</h4>
					<div>{membersList(PAID_BY)}</div>
					<div>
						{t('Remaining')}: {getRemainingValue(PAID_BY)}
					</div>

					<Hr />

					<h4>{t('Paid for')}:</h4>
					<div>{membersList(PAID_FOR)}</div>
					<div>
						{t('Remaining')}: {getRemainingValue(PAID_FOR)}
					</div>

					<div className="mb-4 mt-6">
						<button type="submit" className="btn btn-active btn-primary text-base">
							{t('Save')}
						</button>
					</div>
				</div>
			</div>
		</form>
	);
}
