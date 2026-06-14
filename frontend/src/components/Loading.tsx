import { Loader2 } from 'lucide-react';

export default function Loading() {
	return (
		<div className="bg-background/70 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
			<Loader2 className="text-primary size-10 animate-spin" />
			<span className="sr-only">Loading…</span>
		</div>
	);
}
