import PropTypes from 'prop-types';

CardContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

function CardContainer({ children }) {
    return <div className="my-custom-cardContainer">{children}</div>;
}

export default CardContainer;
