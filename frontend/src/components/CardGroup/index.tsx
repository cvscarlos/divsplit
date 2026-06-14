import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import type { GroupListItem } from '../../types';
import { Avatar } from '../Avatar';

function CardGroup({ group }: { group: GroupListItem }) {
	const navigate = useNavigate();
	const open = () => navigate(`/group/${group.id}/config`);

	return (
		<button
			type="button"
			onClick={open}
			className="group border-border bg-card hover:border-primary/50 focus-visible:ring-ring/50 relative flex w-full flex-col gap-4 rounded-xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:outline-none"
		>
			<div className="flex items-center justify-between">
				<Avatar name={group.name} />
				<span className="text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-8 items-center justify-center rounded-full transition-colors">
					<ArrowUpRight className="size-4" />
				</span>
			</div>
			<div>
				<h3 className="font-serif text-xl font-semibold tracking-tight">{group.name}</h3>
				<p className="text-muted-foreground tnum mt-1 truncate text-xs">{group.id}</p>
			</div>
		</button>
	);
}

export default CardGroup;
