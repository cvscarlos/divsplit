import { useContext, useState } from 'react';
import { GroupContext } from '../context/GroupContext';
import { useTranslation } from 'react-i18next';

export function GroupTransactions() {
	const [group] = useContext(GroupContext);
	const [selectedMember, selectMember] = useState({ name: '' });
	const { t } = useTranslation();
	function handleGroupSubmit(event) {
		event.preventDefault();
	}

	function handleChange(e) {
		selectMember(e.target.value);
	}

	return (
		<form onSubmit={handleGroupSubmit}>
			<div className="md:flex md:justify-center">
				<div className="ds-card md:w-1/2">
					<h4>Description</h4>
					<div className=" pt-5">
						Date: <input className="input input-bordered" type="date" name="date" />
					</div>
					<div className="pt-5 pb-5">
						Total: <input className="input input-bordered" type="number" name="value" />
					</div>
					<div>
						Description: <input className="input input-bordered" type="text" name="description" />
					</div>
					<h4>Paid by</h4>
					<div>
						{group?.members
							? group.members.map((member, index) => (
									<div key={index}>
										<input
											className="radio size-4"
											type="radio"
											name="member1"
											value={member.name}
											onChange={handleChange}
										/>
										{member.name}
									</div>
								))
							: null}
						Amount: <input className="input input-bordered" type="number" />
						<h4>Paid for</h4>
					</div>

					<div>
						{group?.members
							? group.members.map((member, index) => {
									if (member.name !== selectedMember) {
										return (
											<div key={index}>
												<input className="radio size-4" type="radio" name="member2" value={member.name} />
												{member.name}
											</div>
										);
									}
								})
							: null}
						Amount:
						<input className="input input-bordered" type="number" name="member1" />
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
