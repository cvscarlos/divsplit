import { useContext } from 'react';
import { GroupContext } from '../context/GroupContext';
import Header from '../components/Header';
import { ThemeContext } from '../context/ThemeContext';

export function GroupPage() {
	// const { t } = useTranslation();
	const { theme } = useContext(ThemeContext);
	// const { groupList, isLoading } = useApiListGroups();
	const { group, updateGroup } = useContext(GroupContext);
	const { header } = group;

	function handleHeaderSubmit(event) {
		event.preventDefault();
		console.log(event);
		Object.assign(header, { name: event.target[0].value });
		updateGroup(group);
	}

	return (
		<div data-theme={theme} className="my-custom-container">
			<Header />
			<h2>{header.name}</h2>

			<form onSubmit={handleHeaderSubmit}>
				<label>
					Name: <input type="text" value={header.name} />
				</label>
				<button type="submit">Save</button>
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
