import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupContext } from '../context/GroupContext';
import Header from '../components/Header';

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
		<>
			<Header />
			<div className="p-3 m-3 border bg-base-100 md:flex md:flex-col md:justify-center md:items-center md:border-0">
				<h2>{group.header?.name}</h2>

				<form onSubmit={handleHeaderSubmit} className="md:border md:p-5 md:w-96">
					<div className="">
						<h3>{t('GroupInformation')}</h3>
						<div className="mb-4">
							<label className="form-control ">
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

					<div className="">
						<h3>{t('Members')}</h3>
						<div className="mb-4">
							<label className="form-control ">
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
							<label className="form-control ">
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

					<div className="">
						<div className="mb-4">
							<button type="submit" className="btn btn-active btn-primary">
								{t('Save')}
							</button>
						</div>
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
		</>
	);
}
