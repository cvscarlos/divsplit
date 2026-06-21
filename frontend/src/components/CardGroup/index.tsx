import { useNavigate } from 'react-router-dom';
import { Plane, UtensilsCrossed, Car, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { EVENT_ICONS } from '../../utils/event-icons';
import type { GroupListItem } from '../../types';

// Vibrant solid-card palette; color + icon are paired and chosen deterministically
// from the group id so each group keeps a stable look across sessions.
const VARIANTS: { bg: string; icon: LucideIcon }[] = [
	{ bg: '#1DE9B6', icon: Plane }, // mint
	{ bg: '#FFEA00', icon: UtensilsCrossed }, // yellow
	{ bg: '#FF2D78', icon: Car }, // pink
	{ bg: '#00E5FF', icon: Home }, // cyan
];

function variantFor(id: string) {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	return VARIANTS[hash % VARIANTS.length];
}

function CardGroup({ group }: { group: GroupListItem }) {
	const navigate = useNavigate();
	const open = () => navigate(`/group/${group.id}/transactions`);
	const variant = variantFor(group.id);
	const bg = variant.bg;
	// User-chosen icon if set, else the deterministic one from the id.
	const Icon = (group.icon && EVENT_ICONS[group.icon]) || variant.icon;

	return (
		<button
			type="button"
			onClick={open}
			style={{ backgroundColor: bg }}
			className="group focus-visible:ring-ring/50 relative flex min-h-44 w-full flex-col justify-between gap-6 rounded-2xl p-5 text-left text-black shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:ring-[3px] focus-visible:outline-none"
		>
			<span className="flex size-9 items-center justify-center rounded-full bg-black/10">
				<Icon className="size-5 text-black/80" />
			</span>
			<div>
				<h3 className="font-sans text-2xl font-bold tracking-tight">{group.name}</h3>
				<p className="tnum mt-1 truncate text-xs text-black/55 italic">{group.id}</p>
			</div>
		</button>
	);
}

export default CardGroup;
