import { useContext, useEffect, useState } from 'react';

import { GroupContext } from '../context/GroupContext';
import Header from '../components/Header';
import { ThemeContext } from '../context/ThemeContext';

export function GroupPage() {
	const { theme } = useContext(ThemeContext);
	const [group, updateGroup] = useContext(GroupContext);
	const [formFields, setFormFields] = useState({ name: 'loading...' });

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
		<div data-theme={theme} className="my-custom-container">
			<Header />
			<h2>{group.header?.name}</h2>

			<form onSubmit={handleHeaderSubmit}>
				<div className="col-span-full">
					<div className="mb-4">
						<label className="form-control ">
							Group name:
							<input
								type="text"
								placeholder="Type here"
								className="input input-bordered"
								value={formFields.name}
								name="name"
								onChange={handleFieldChange}
							/>
						</label>
					</div>
					<div className="mb-4">
						<button type="submit" className="btn btn-active btn-primary">
							Save
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
	);
}
