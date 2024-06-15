import { useContext } from 'react';
import { GroupContext } from '../context/GroupContext';

export function GroupPage() {
	const { group, updateGroup } = useContext(GroupContext);
	const { header } = group;

	function handleHeaderSubmit(event) {
		event.preventDefault();
		console.log(event);
		Object.assign(header, { name: event.target[0].value });
		updateGroup(group);
	}

	return (
		<div>
			<h2>{header.name}</h2>

			<form onSubmit={handleHeaderSubmit}>
				<label>
					Name: <input type="text" value={header.name} />
				</label>
				<button type="submit">Save</button>
			</form>

			<div>
				<h6>Debug:</h6>
				<code>{JSON.stringify(group, null, 2)}</code>
			</div>
		</div>
	);
}
