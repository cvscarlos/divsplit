import { useNavigate } from 'react-router-dom';
import { Plane, UtensilsCrossed, Car, Home, PartyPopper, Tent } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { EVENT_ICONS } from '../../utils/event-icons';
import type { GroupListItem } from '../../types';

// Vibrant solid-card palette; colour + fallback icon are paired and assigned by position so
// neighbouring cards always differ, cycling every 6 (the 7th card reuses the 1st colour).
const VARIANTS: { bg: string; icon: LucideIcon }[] = [
	{ bg: '#1DE9B6', icon: Plane }, // mint
	{ bg: '#FFEA00', icon: UtensilsCrossed }, // yellow
	{ bg: '#FF2D78', icon: Car }, // pink
	{ bg: '#00E5FF', icon: Home }, // cyan
	{ bg: '#B388FF', icon: PartyPopper }, // violet
	{ bg: '#FF9E40', icon: Tent }, // orange
];

function CardGroup({ group, index = 0 }: { group: GroupListItem; index?: number }) {
	const navigate = useNavigate();
	const open = () => navigate(`/group/${group.id}/transactions`);
	const variant = VARIANTS[index % VARIANTS.length];
	const bg = variant.bg;
	// User-chosen icon if set, else the paired one for this card's colour slot.
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
