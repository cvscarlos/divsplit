import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupContext } from '../context/GroupContext';

export function GroupPage() {
	const [group, updateGroup] = useContext(GroupContext);
	const [formFields, setFormFields] = useState({ name: 'loading...' });
	const { t } = useTranslation();

	useEffect(() => {
		setFormFields({ name: group.header?.name || '' });
	}, [group]);

	function handleFieldChange(event) {
		setFormFields({ ...formFields, [event.target.name]: event.target.value });
	}

	function handleHeaderSubmit(event) {
		event.preventDefault();
		Object.assign(group.header, { name: formFields.name });
		updateGroup(group);
	}

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
						<div className="grid grid-cols-10 gap-x-3">
							<div className="col-span-7">
								<label className="form-control">
									{t('MembersName')}:
									<input
										type="text"
										placeholder={t('TypeHere')}
										className="input input-bordered"
										value={formFields.memberName}
										name="memberName"
										onChange={handleFieldChange}
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
										value={formFields.memberName}
										name="memberName"
										onChange={handleFieldChange}
									/>
								</label>
							</div>
						</div>
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
