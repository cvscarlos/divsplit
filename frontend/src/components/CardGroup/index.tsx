import { useNavigate } from 'react-router-dom';

import type { GroupListItem } from '../../types';
import './index.css';

function CardGroup({ group }: { group: GroupListItem }) {
	const navigate = useNavigate();
	const handleClick = () => navigate(`/group/${group.id}/config`);

	return (
		<div className="card-wrap">
			<div className="card-body">
				<h2 className="card-title">{group.name}</h2>
				<p>
					<i>{group.id}</i>
				</p>
				<div className="card-actions justify-end">
					<button className="btn btn-secondary" onClick={handleClick}>
						verificar
					</button>
				</div>
			</div>
		</div>
	);
}

export default CardGroup;
