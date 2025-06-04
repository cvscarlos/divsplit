import { useGroupContext } from '../context/GroupContext';

export function Debug() {
	const { data: group } = useGroupContext();

	if (import.meta.env.VITE_SHOW_DEBUG !== 'true') return null;

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
