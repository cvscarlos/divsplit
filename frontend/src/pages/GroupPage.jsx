import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupContext } from '../context/GroupContext';

export function GroupPage() {
	const memberBase = { id: `0_${Date.now()}`, name: '', prepaid: 0 };

	const [group, updateGroup] = useContext(GroupContext);
	const [formFields, setFormFields] = useState({});
	const [members, setMembers] = useState([{ id: `0_${Date.now()}`, name: '', prepaid: 0 }]);
	const { t } = useTranslation();

	useEffect(() => {
		setFormFields({ name: group.header?.name || '---' });
		if (group.members) setMembers(group.members);
	}, [group]);

	const handleAddMember = () => {
		setMembers([...members, { ...memberBase, id: `${members.length}_${Date.now()}` }]);
	};
	const handleMemberFields = (member, event) => {
		const { name, value } = event.target;
		if (name.startsWith('memberName')) member.name = value;
		else if (name.startsWith('memberPrepaid')) member.prepaid = Number(value);
		setMembers([...members]);
	};

	const handleFieldChange = (event) => {
		setFormFields({ ...formFields, [event.target.name]: event.target.value });
	};

	const handleHeaderSubmit = (event) => {
		event.preventDefault();
		Object.assign(group.header, { name: formFields.name });
		group.members = members;
		updateGroup(group);
	};

	return (
		<div className="prose">
			<h2>{group.header?.name}</h2>

			<form onSubmit={handleHeaderSubmit}>
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
						{members.map((member, index) => (
							<div key={member.id} className="mb-4">
								<div className="grid grid-cols-10 gap-x-3 ">
									<div className="col-span-7">
										<label className="form-control">
											{t('MembersName')}:
											<input
												type="text"
												placeholder={t('TypeHere')}
												className="input input-bordered"
												value={member.name}
												name={`memberName_${index}`}
												onChange={(event) => handleMemberFields(member, event)}
											/>
										</label>
									</div>
									<div className="col-span-3">
										<label className="form-control">
											{t('PrepaidValue')}:
											<input
												type="number"
												placeholder="$"
												className="input input-bordered"
												value={member.prepaid}
												name={`memberPrepaid_${index}`}
												onChange={(event) => handleMemberFields(member, event)}
											/>
										</label>
									</div>
								</div>
							</div>
						))}
						<button type="button" className="btn btn-primary mt-4 self-start" onClick={handleAddMember}>
							+ {t('AddMember')}
						</button>
					</div>
				</div>

				<div className="mb-4 mt-6">
					<button type="submit" className="btn btn-active btn-primary">
						{t('Save')}
					</button>
				</div>
			</form>

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
