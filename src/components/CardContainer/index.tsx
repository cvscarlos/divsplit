import type { ReactNode } from 'react';

function CardContainer({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export default CardContainer;
