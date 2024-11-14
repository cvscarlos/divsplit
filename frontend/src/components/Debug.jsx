import { useContext } from 'react';

import { GroupContext } from '../context/GroupContext';

export function Debug() {
	const [group] = useContext(GroupContext);

	if (window.location.hostname !== 'localhost') return null;

	return (
		<div className="prose">
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
