import type { ReactNode } from 'react';

import './index.css';

function CardContainer({ children }: { children: ReactNode }) {
	return <div className="card-container">{children}</div>;
}

export default CardContainer;
