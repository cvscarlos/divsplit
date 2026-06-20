import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

import { cn } from '@/lib/utils';

// Auto-generated avatars, rendered locally (offline-first — no remote API).
// Same palette/style as the original DiceBear "thumbs" avatars.
const backgroundColor = ['ccffb2', 'feff9e', 'aaebf9', 'f5c1ff'];
const shapeColor = ['ffe554', 'f498bf', '6accd9', 'ed4a9b', '6d4399', '73b06f', '0c8f8f', '405059'];

export function Avatar({ name, className }: { name: string; className?: string }) {
	const uri = useMemo(
		() =>
			createAvatar(thumbs, {
				seed: name || '?',
				radius: 50,
				backgroundColor,
				shapeColor,
				shapeOffsetX: [5],
			}).toDataUri(),
		[name],
	);

	return (
		<img
			src={uri}
			alt=""
			aria-hidden="true"
			className={cn('size-10 shrink-0 rounded-full ring-2 ring-white/40', className)}
		/>
	);
}
