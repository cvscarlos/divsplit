import { useGroupContext } from '../context/GroupContext';

export function Debug() {
	const { data: group } = useGroupContext();

	if (import.meta.env.VITE_SHOW_DEBUG !== 'true') return null;

	return (
		<div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
			<h6 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Debug</h6>
			<pre className="bg-muted text-muted-foreground overflow-x-auto rounded-lg border p-4 text-xs">
				<code>{JSON.stringify(group, null, 2)}</code>
			</pre>
		</div>
	);
}
