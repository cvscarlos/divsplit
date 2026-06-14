import { cn } from '@/lib/utils';

// Offline-first: derive a deterministic initials badge instead of calling a
// remote avatar API (the app must work without internet on trips).
const palette = [
	'oklch(0.62 0.2 35)', // tangerine
	'oklch(0.55 0.09 205)', // teal
	'oklch(0.6 0.13 145)', // green
	'oklch(0.58 0.16 300)', // violet
	'oklch(0.64 0.15 90)', // gold
	'oklch(0.58 0.2 12)', // red
];

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('');
}

export function Avatar({ name, className }: { name: string; className?: string }) {
	const color = palette[hashString(name) % palette.length];
	return (
		<span
			aria-hidden="true"
			style={{ backgroundColor: color }}
			className={cn(
				'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ring-2 ring-white/40',
				className,
			)}
		>
			{initialsOf(name)}
		</span>
	);
}
