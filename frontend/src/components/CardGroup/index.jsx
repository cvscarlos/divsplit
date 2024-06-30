import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import './index.css';

CardGroup.propTypes = {
	group: PropTypes.object.isRequired,
};

function CardGroup({ group }) {
	const navigate = useNavigate();
	const handleClick = () => navigate(`/group/${group.id}`);

	return (
		<div className="card-wrap">
			<div className="card-body">
				<h2 className="card-title">{group.name}</h2>
				<p>
					<i>{group.id}</i>
				</p>
				<div className="card-actions justify-end">
					<button className="btn btn-primary" onClick={handleClick}>
						verificar
					</button>
				</div>
			</div>
		</div>
	);
}

export default CardGroup;
