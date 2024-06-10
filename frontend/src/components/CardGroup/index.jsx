import PropTypes from 'prop-types';

CardGroup.propTypes = {
	id: PropTypes.string.isRequired,
};

function CardGroup({ id }) {
	return (
		<div className="card w-96 text-neutral bg-neutral-content shadow-xl">
			<div className="card-body">
				<h2 className="card-title">Grupo Teste</h2>
				<p>
					<i>{id}</i>
				</p>
				<div className="card-actions justify-end">
					<button className="btn btn-primary">verificar</button>
				</div>
			</div>
		</div>
	);
}

export default CardGroup;
