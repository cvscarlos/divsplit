import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiTrash } from 'react-icons/bi';

import { useGroupContext } from '../../context/GroupContext';
import { Avatar } from '../../components/Avatar';

export function GroupConfig() {
	const memberBase = { id: `0_${Date.now()}`, name: '', prepaid: 0 };

	const { data: group, updateGroup, loadDemo } = useGroupContext();
	const [formFields, setFormFields] = useState({ name: '' });
	const [members, setMembers] = useState([{ ...memberBase }]);
	const { t } = useTranslation();

	useEffect(() => {
		setFormFields({ name: group.config?.name || '---' });
		if (group.members) setMembers(group.members);
	}, [group]);

	const memberName = 'memberName';
	const memberPrepaid = 'memberPrepaid';
	function addMember() {
		setMembers([...members, { ...memberBase, id: `${members.length}_${Date.now()}` }]);
	}
	function removeMember(member) {
		setMembers(members.filter((m) => m.id !== member.id));
	}
	function handleMemberFields(member, event) {
		const { name, value } = event.target;
		if (name == memberName) member.name = value;
		else if (name == memberPrepaid) member.prepaid = Number(value);
		setMembers([...members]);
	}

	function handleFieldChange(event) {
		setFormFields({ ...formFields, [event.target.name]: event.target.value });
	}

	function handleGroupSubmit(event) {
		event.preventDefault();
		Object.assign(group.config, { name: formFields.name });
		group.members = members;
		updateGroup(group);
	}

	return (
		<form onSubmit={handleGroupSubmit}>
			<div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4">
				<div className="ds-card flex-auto">
					<h3>{t('GroupInformation')}</h3>
					<div>
						<label className="form-control">
							{t('GroupName')}:
							<input
								type="text"
								placeholder={t('TypeHere')}
								className="input input-bordered"
								value={formFields.name}
								name="name"
								onChange={handleFieldChange}
							/>
						</label>
					</div>
				</div>

				<div className="ds-card flex-auto">
					<h3>{t('Members')}</h3>
					{members.map((member) => (
						<div key={member.id} className="mb-4">
							<div className="grid gap-3 grid-cols-12">
								<div className="col-span-2 sm:col-span-1 mt-5 flex justify-center items-center">
									<Avatar name={member.name} />
								</div>
								<div className="col-span-5 sm:col-span-6">
									<label className="form-control">
										{t('Name')}:
										<input
											type="text"
											placeholder={t('TypeHere')}
											className="input input-bordered"
											value={member.name}
											name={memberName}
											onChange={(event) => handleMemberFields(member, event)}
										/>
									</label>
								</div>
								<div className="col-span-4">
									<label className="form-control">
										{t('PrepaidAmount')}:
										<input
											type="number"
											placeholder="$"
											className="input input-bordered"
											value={member.prepaid}
											name={memberPrepaid}
											onChange={(event) => handleMemberFields(member, event)}
										/>
									</label>
								</div>
								<div className="col-span-1 flex items-center text-xl text-red-600 mt-6">
									<button type="button" onClick={() => removeMember(member)}>
										<BiTrash />
									</button>
								</div>
							</div>
						</div>
					))}
					<button type="button" className="btn btn-neutral btn-sm mt-4 self-start" onClick={addMember}>
						+ {t('addMember')}
					</button>
				</div>
			</div>

			<div className="mb-4 mt-6">
				<button type="submit" className="btn btn-active btn-primary text-base">
					{t('Save')}
				</button>
			</div>

			{/* Show load demo data link if group is empty */}
			{(!group?.members || group.members.length === 0 || !group?.config?.name || group.config.name === '---') && (
				<div className="text-center mt-4">
					<p className="text-sm text-gray-600">
						{t('Need some data to get started?')}{' '}
						<button type="button" className="link link-primary text-sm" onClick={loadDemo}>
							{t('Load sample data')}
						</button>
					</p>
				</div>
			)}
		</form>
	);
}
