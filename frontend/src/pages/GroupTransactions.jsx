import { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupContext } from '../context/GroupContext';
import { Hr } from '../components/Hr';

const PAID_BY = 'paid-by';
const PAID_FOR = 'paid-for';

function round(value) {
	return Math.round(value * 100) / 100;
}

export function GroupTransactions() {
	const { t } = useTranslation();
	const [group] = useContext(GroupContext);
	const [paidBy, setPaidBy] = useState({});
	const [paidFor, setPaiFor] = useState({});
	const [total, setTotal] = useState(0);
	const manuallyChanged = useRef({});

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
		console.log('manuallyChanged: ', manuallyChanged);

		let manualChangedSum = 0;
		const manuallyChangedKeys = Object.keys(manuallyChanged).filter((k) => k !== 'current');
		manuallyChangedKeys.forEach((key) => {
			console.log({ key, id });
			manualChangedSum += key === id ? numericValue : data[key];
			delete tempData[key]; // Ignoro os que o usuário mudou manualmente
		});

		const tempDataKeys = Object.keys(tempData);
		const divideBy = Math.max(1, tempDataKeys.length || 1);
		const subtotal = Math.max(0, round((total - manualChangedSum) / divideBy));
		console.log({ subtotal, total, manualChangedSum, numericValue });
		tempDataKeys.forEach((k) => {
			data[k] = subtotal;
		});

		// Caso a divisão não seja exata, ajusta a diferença na pessoa atual
		const currentTotal = Object.values(data).reduce((acc, val) => acc + val, 0);
		const currentTotalDiff = total - currentTotal;
		if (currentTotalDiff !== 0) {
			const personId = isChecked ? id : tempDataKeys[0];
			console.log({ currentTotalDiff, personId });
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
		console.log('handleGroupSubmit', event.target);
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
							manuallyChanged[id] = true;
						}}
					/>
				</div>
			);
		});
	}

	return (
		<form onSubmit={handleGroupSubmit}>
			<div className="flex justify-center">
				<div className="ds-card flex-auto">
					<h3>{t('Transaction')}</h3>

					<div className="pt-5">
						{t('Date')}: <input className="input input-bordered" type="date" name="date" />
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
						{t('Description')}: <input className="input input-bordered" type="text" name="description" />
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
