import PropTypes from 'prop-types';

import './index.css';

CardContainer.propTypes = {
	children: PropTypes.node.isRequired,
};

function CardContainer({ children }) {
	return <div className="card-container">{children}</div>;
}

export default CardContainer;
