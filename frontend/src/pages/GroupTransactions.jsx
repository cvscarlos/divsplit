import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroupContext } from '../context/GroupContext';
import { Hr } from '../components/Hr';

const PAID_BY = 'paid-by';
const PAID_FOR = 'paid-for';

export function GroupTransactions() {
	const { t } = useTranslation();
	const [group] = useContext(GroupContext);
	const [paidBy, setPaidBy] = useState(new Map());
	const [paidFor, setPaiFor] = useState(new Map());
	const [transaction, setTransaction] = useState({
		date: null,
		value: null,
		description: '',
	});

	function handleMemberChange(fieldset, id, value) {
		const newMap = new Map(PAID_BY === fieldset ? paidBy : paidFor);
		const hook = PAID_BY === fieldset ? setPaidBy : setPaiFor;

		const numericValue = Number(value);
		const isChecked = Boolean(numericValue);
		if (isChecked) {
			newMap.set(id, numericValue);
		} else {
			newMap.delete(id);
		}

		hook(newMap);
	}

	function handleGroupSubmit(event) {
		event.preventDefault();
		console.log('handleGroupSubmit', event.target);
	}

	function membersList(fieldset) {
		return group?.members?.map(({ id, name }) => (
			<div key={id}>
				<input
					className="checkbox"
					type="checkbox"
					value={id}
					checked={Boolean((PAID_BY === fieldset ? paidBy : paidFor).get(id))}
					onChange={(e) => handleMemberChange(fieldset, id, e.target.checked)}
				/>
				<span className="label-text">{name}</span>
				<input
					className="input input-bordered"
					type="number"
					name={`${id}-value`}
					onChange={(e) => handleMemberChange(fieldset, id, e.target.value)}
				/>
			</div>
		));
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
						{t('Total')}: <input className="input input-bordered" type="number" name="value" />
					</div>
					<div>
						{t('Description')}: <input className="input input-bordered" type="text" name="description" />
					</div>

					<Hr />

					<h4>{t('Paid by')}:</h4>
					<div>{membersList(PAID_BY)}</div>

					<Hr />

					<h4>{t('Paid for')}:</h4>
					<div>{membersList(PAID_FOR)}</div>

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
